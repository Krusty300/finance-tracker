import { useState, useEffect, useCallback } from 'react';
import { DashboardStats } from '@/lib/types';
import { useTransactions } from './useTransactions';
import { useCategories } from './useCategories';
import { useBudgets } from './useBudgets';
import { useAccounts } from './useAccounts';
import { useRealtime } from './useRealtime';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useCurrencyConversion } from './useCurrencyConversion';
import { getMonthStart, getMonthEnd } from '@/lib/utils';
import { calculatePeriodSpending, getPeriodDisplayText } from '@/utils/period-aware-calculations';

export function useDashboardStats() {
  const { transactions } = useTransactions();
  const { categories } = useCategories();
  const { budgets } = useBudgets();
  const { accounts, getTotalBalance } = useAccounts();
  const { subscribe } = useRealtime();
  const { formatCurrency, currency: baseCurrency } = useCurrency();
  const { convertAmount } = useCurrencyConversion();
  
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const calculateStats = useCallback(() => {
    setLoading(true);
    
    try {
      if (!transactions || !Array.isArray(transactions)) {
        console.warn('Invalid transactions data:', transactions);
        setStats(null);
        return;
      }

      const now = new Date();
      const monthStart = getMonthStart(now);
      const monthEnd = getMonthEnd(now);
      
      // Filter transactions for current month with validation
      const currentMonthTransactions = transactions.filter(t => {
        if (!t || !t.date) return false;
        const transactionDate = new Date(t.date);
        if (isNaN(transactionDate.getTime())) return false;
        return transactionDate >= monthStart && transactionDate <= monthEnd;
      });

      // Calculate monthly income and expenses with validation
      const monthlyIncome = currentMonthTransactions
        .filter(t => t.type === 'income' && typeof t.amount === 'number' && !isNaN(t.amount))
        .reduce((sum, t) => sum + t.amount, 0);

      const monthlyExpenses = currentMonthTransactions
        .filter(t => t.type === 'expense' && typeof t.amount === 'number' && !isNaN(t.amount))
        .reduce((sum, t) => sum + t.amount, 0);

      // Calculate total balance from accounts
      const totalBalance = getTotalBalance() || 0;

      // Calculate net worth (total balance)
      const netWorth = totalBalance;

      // Get recent transactions (last 10)
      const recentTransactions = transactions
        .filter(t => t && t.id && t.date) // Ensure transaction has required fields
        .filter(t => !t.deletedAt) // Exclude soft-deleted transactions
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 10);

      // Calculate additional stats for sidebar badges
      const transactionCount = transactions.filter(t => !t.deletedAt).length;
      const accountCount = accounts.length;
      const budgetCount = budgets.length;
      const lowBalanceAccounts = accounts.filter((acc: any) => acc.balance < 100).length;
      const overdueTransactions = transactions.filter(t => 
        !t.deletedAt && 
        t.type === 'expense' && 
        new Date(t.date) < new Date() // Overdue if date is in the past
      ).length;
      const activeGoals = 0; // Could be calculated from goals data
      const hasReports = currentMonthTransactions.length > 0;

      // Calculate category breakdown for expenses
      const expensesByCategory = currentMonthTransactions
        .filter(t => t.type === 'expense')
        .reduce((acc, t) => {
          const existing = acc.find(item => item.category === t.category);
          if (existing) {
            existing.amount += t.amount;
          } else {
            acc.push({
              category: t.category,
              amount: t.amount,
              percentage: 0,
            });
          }
          return acc;
        }, [] as Array<{ category: string; amount: number; percentage: number }>);

      // Map category IDs to names
      const categoryBreakdown = expensesByCategory.map(item => {
        const category = categories.find(c => c.id === item.category);
        return {
          category: category ? category.name : item.category, // Fallback to original if category not found
          amount: item.amount,
          percentage: 0, // Will be calculated below
        };
      });

      // Calculate percentages for category breakdown
      const totalExpenses = categoryBreakdown.reduce((sum, item) => sum + item.amount, 0);
      categoryBreakdown.forEach(item => {
        item.percentage = totalExpenses > 0 ? Math.round((item.amount / totalExpenses) * 100) : 0;
      });

      // Sort category breakdown by amount (descending)
      categoryBreakdown.sort((a, b) => b.amount - a.amount);

      // Calculate budget breakdown with period-aware spending
      const budgetBreakdown = budgets.map(budget => {
        const spent = calculatePeriodSpending(budget, transactions);
        
        const remaining = budget.amount - spent;
        const percentageUsed = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
        
        // Get category name for display
        const category = categories.find(c => c.id === budget.category);
        const categoryName = category?.name || budget.category;
        
        return {
          category: categoryName,
          budget: budget.amount,
          spent,
          remaining,
          percentageUsed,
          status: percentageUsed > 100 ? 'over-budget' : 
                  percentageUsed >= 80 ? 'near-limit' : 'on-track' as 'on-track' | 'near-limit' | 'over-budget',
          period: getPeriodDisplayText(budget)
        };
      });

      const totalBudget = budgets.reduce((sum, budget) => sum + budget.amount, 0);
      const totalSpent = budgetBreakdown.reduce((sum, item) => sum + item.spent, 0);
      const overBudgetCount = budgetBreakdown.filter(item => item.status === 'over-budget').length;
      
      // Determine overall budget health
      let budgetHealth: 'healthy' | 'warning' | 'critical';
      if (overBudgetCount > 0) {
        budgetHealth = 'critical';
      } else if (budgetBreakdown.filter(item => item.status === 'near-limit').length > 0) {
        budgetHealth = 'warning';
      } else {
        budgetHealth = 'healthy';
      }

      // Calculate monthly trend for the last 6 months
      const monthlyTrend = [];
      for (let i = 5; i >= 0; i--) {
        const trendDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const trendStart = getMonthStart(trendDate);
        const trendEnd = getMonthEnd(trendDate);
        
        const trendTransactions = transactions.filter(t => {
          const transactionDate = new Date(t.date);
          return transactionDate >= trendStart && transactionDate <= trendEnd;
        });

        const trendIncome = trendTransactions
          .filter(t => t.type === 'income')
          .reduce((sum, t) => sum + t.amount, 0);

        const trendExpenses = trendTransactions
          .filter(t => t.type === 'expense')
          .reduce((sum, t) => sum + t.amount, 0);

        monthlyTrend.push({
          month: trendDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          income: trendIncome,
          expenses: trendExpenses,
        });
      }

      const dashboardStats: DashboardStats = {
        totalBalance,
        monthlyIncome,
        monthlyExpenses,
        netWorth,
        recentTransactions,
        categoryBreakdown,
        monthlyTrend,
        budgetBreakdown,
        totalBudget,
        totalSpent,
        budgetHealth,
        transactionCount,
        accountCount,
        budgetCount,
        lowBalanceAccounts,
        overdueTransactions,
        activeGoals,
        hasReports,
      };

      setStats(dashboardStats);
    } catch (error) {
      console.error('Error calculating dashboard stats:', error);
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, [transactions, getTotalBalance, budgets]);

  useEffect(() => {
    calculateStats();

    // Listen for storage changes to refresh stats in real-time
    const handleStorageChange = () => {
      // Small delay to ensure data is written
      setTimeout(calculateStats, 100);
    };

    window.addEventListener('storage', handleStorageChange);

    // Listen for real-time events
    const unsubscribers = [
      subscribe('transaction', () => {
        setTimeout(calculateStats, 50);
      }),
      subscribe('budget', () => {
        setTimeout(calculateStats, 50);
      }),
      subscribe('account', () => {
        setTimeout(calculateStats, 50);
      }),
      subscribe('category', () => {
        setTimeout(calculateStats, 50);
      })
    ];

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      unsubscribers.forEach(unsubscribe => unsubscribe());
    };
  }, [calculateStats, subscribe]);

  return {
    stats,
    loading,
    refreshStats: calculateStats,
  };
}
