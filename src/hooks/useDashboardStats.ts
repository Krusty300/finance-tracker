import { useState, useEffect, useCallback } from 'react';
import { DashboardStats } from '@/lib/types';
import { useTransactions } from './useTransactions';
import { useCategories } from './useCategories';
import { useBudgets } from './useBudgets';
import { useAccounts } from './useAccounts';
import { getMonthStart, getMonthEnd } from '@/lib/utils';

export function useDashboardStats() {
  const { transactions } = useTransactions();
  const { categories } = useCategories();
  const { budgets } = useBudgets();
  const { getTotalBalance } = useAccounts();
  
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const calculateStats = useCallback(() => {
    setLoading(true);
    
    try {
      if (!transactions || !Array.isArray(transactions)) {
        throw new Error('Invalid transactions data');
      }

      const now = new Date();
      const monthStart = getMonthStart(now);
      const monthEnd = getMonthEnd(now);
      
      // Filter transactions for current month
      const currentMonthTransactions = transactions.filter(t => {
        if (!t || !t.date) return false;
        const transactionDate = new Date(t.date);
        return transactionDate >= monthStart && transactionDate <= monthEnd;
      });

      // Calculate monthly income and expenses
      const monthlyIncome = currentMonthTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

      const monthlyExpenses = currentMonthTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

      // Calculate total balance from accounts
      const totalBalance = getTotalBalance() || 0;

      // Calculate net worth (total balance)
      const netWorth = totalBalance;

      // Get recent transactions (last 10)
      const recentTransactions = transactions
        .filter(t => t && t.date)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 10);

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

      // Calculate percentages for category breakdown
      const totalExpenses = expensesByCategory.reduce((sum, item) => sum + item.amount, 0);
      const categoryBreakdown = expensesByCategory.map(item => ({
        ...item,
        percentage: totalExpenses > 0 ? Math.round((item.amount / totalExpenses) * 100) : 0,
      }));

      // Sort category breakdown by amount (descending)
      categoryBreakdown.sort((a, b) => b.amount - a.amount);

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
      };

      setStats(dashboardStats);
    } catch (error) {
      console.error('Error calculating dashboard stats:', error);
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, [transactions, getTotalBalance]);

  useEffect(() => {
    calculateStats();
  }, [calculateStats]);

  return {
    stats,
    loading,
    refreshStats: calculateStats,
  };
}
