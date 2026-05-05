'use client';

import { useState, useEffect, useMemo, useCallback, memo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils';
import { debounce } from 'lodash';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTransactions } from '@/hooks/useTransactions';
import { useCategories } from '@/hooks/useCategories';
import { useAccounts } from '@/hooks/useAccounts';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { 
  Home, 
  TrendingUp, 
  CreditCard, 
  Target, 
  PieChart, 
  Wallet, 
  Layout, 
  Settings,
  Trash2,
  Plus,
  Menu,
  X,
  Moon,
  Sun,
  Calculator,
  Calendar,
  Filter,
  RefreshCw,
  FileDown,
  PiggyBank,
  Receipt,
  LayoutDashboard,
} from 'lucide-react';

interface SidebarProps {
  className?: string;
  isCollapsed?: boolean;
  onToggle?: () => void;
}

export function Sidebar({ className, isCollapsed = false, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const { transactions, loading: transactionsLoading, refreshTransactions } = useTransactions();
  const { categories, loading: categoriesLoading, refreshCategories } = useCategories();
  const { accounts, loading: accountsLoading, refreshAccounts } = useAccounts();

  // Debounced refresh function to prevent excessive API calls during rapid changes
  const debouncedRefresh = useCallback(
    debounce(() => {
      refreshTransactions();
      refreshCategories();
      refreshAccounts();
    }, 300), // 300ms debounce delay
    [refreshTransactions, refreshCategories, refreshAccounts]
  );

  // Set up debounced refresh for storage changes
  useEffect(() => {
    const handleStorageChange = () => {
      debouncedRefresh();
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      debouncedRefresh.cancel(); // Clean up pending debounced calls
    };
  }, [debouncedRefresh]);

  // Memoized stats calculation to prevent recalculation on every render
  const stats = useMemo(() => {
    if (!transactions || transactions.length === 0) {
      return {
        balance: 0,
        income: 0,
        expenses: 0,
        transactionCount: 0,
        budgetAlerts: 0,
        accountAlerts: 0
      };
    }

    const income = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const expenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const balance = income - expenses;
    
    // Count transactions from this month
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const thisMonthTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate.getMonth() === currentMonth && 
             transactionDate.getFullYear() === currentYear;
    });

    return {
      balance,
      income,
      expenses,
      transactionCount: thisMonthTransactions.length,
      budgetAlerts: 0, // Could be calculated from budget data
      accountAlerts: accounts.filter(acc => acc.balance < 100).length // Alert for low balance accounts
    };
  }, [transactions, accounts]); // Only recalculate when transactions or accounts change

  // Memoized navigation to prevent recreation on every render
  const navigation = useMemo(() => [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      name: 'Transactions',
      href: '/transactions',
      icon: Receipt,
      badge: stats.transactionCount > 0 ? stats.transactionCount.toString() : null,
    },
    {
      name: 'Budgets',
      href: '/budgets',
      icon: Target,
      badge: stats.budgetAlerts > 0 ? stats.budgetAlerts.toString() : null,
    },
    {
      name: 'Reports',
      href: '/reports',
      icon: TrendingUp,
      badge: null,
    },
    {
      name: 'Accounts',
      href: '/accounts',
      icon: Wallet,
      badge: stats.accountAlerts > 0 ? '!' : null,
    },
    {
      name: 'Banking',
      href: '/banking',
      icon: CreditCard,
      badge: null,
    },
    {
      name: 'Templates',
      href: '/templates',
      icon: Layout,
      badge: null,
    },
    {
      name: 'Recycle Bin',
      href: '/recycle-bin',
      icon: Trash2,
      badge: null,
    },
    {
      name: 'Settings',
      href: '/settings',
      icon: Settings,
      badge: null,
    },
  ], [stats]); // Only recalculate when stats change

  return (
    <div className={cn('pb-12 transition-all duration-300 z-40', isCollapsed ? 'w-16' : 'w-64', className)}>
      <div className="space-y-4 py-4">
        {/* Header with toggle button */}
        <div className="px-3 py-2 flex items-center justify-between">
          {!isCollapsed && (
            <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
              Sprint Financial
            </h2>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className="h-8 w-8 p-0 transition-all duration-200 hover:bg-accent hover:scale-110 active:scale-95 text-foreground"
          >
            {isCollapsed ? (
              <Menu className="h-4 w-4 transition-transform duration-200 hover:rotate-12" />
            ) : (
              <X className="h-4 w-4 transition-transform duration-200 hover:rotate-90" />
            )}
          </Button>
        </div>
        
        {/* Navigation */}
        <div className="px-3 py-2">
          <div className="space-y-1">
            {navigation.map((item) => (
              <Button
                key={item.href}
                variant={pathname === item.href ? 'secondary' : 'ghost'}
                className={cn(
                  'w-full justify-start group relative transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]',
                  isCollapsed && 'justify-center',
                  pathname === item.href && 'bg-accent text-accent-foreground shadow-sm'
                )}
                asChild
                title={isCollapsed ? item.name : undefined}
              >
                <Link href={item.href} className="flex items-center">
                  <item.icon className={cn('h-4 w-4 transition-transform duration-200 group-hover:scale-110', !isCollapsed && 'mr-2')} />
                  {!isCollapsed && item.name}
                  {item.badge && !isCollapsed && (
                    <Badge 
                      variant={item.badge === '!' ? 'destructive' : item.badge !== '!' && parseInt(item.badge) > 0 ? 'default' : 'secondary'} 
                      className={cn(
                        'ml-auto text-xs transition-all duration-200 animate-pulse',
                        item.badge === '!' && 'bg-red-500 text-white border-red-500 animate-pulse',
                        parseInt(item.badge) > 0 && 'bg-blue-500 text-white border-blue-500'
                      )}
                    >
                      {item.badge}
                    </Badge>
                  )}
                  {item.badge && isCollapsed && (
                    <div className="absolute -top-1 -right-1 animate-bounce">
                      <Badge 
                        variant={item.badge === '!' ? 'destructive' : item.badge !== '!' && parseInt(item.badge) > 0 ? 'default' : 'secondary'} 
                        className={cn(
                          'h-5 w-5 p-0 flex items-center justify-center text-xs transition-all duration-200 shadow-sm',
                          item.badge === '!' && 'bg-red-500 text-white border-red-500 animate-pulse',
                          parseInt(item.badge) > 0 && 'bg-blue-500 text-white border-blue-500'
                        )}
                      >
                        {item.badge}
                      </Badge>
                    </div>
                  )}
                </Link>
              </Button>
            ))}
          </div>
        </div>
        
        {/* Quick Stats - Lazy loaded when sidebar is expanded */}
        {!isCollapsed && <QuickStats stats={stats} loading={transactionsLoading || categoriesLoading || accountsLoading} />}

        {/* Quick Actions - Lazy loaded when sidebar is expanded */}
        {!isCollapsed && <QuickActions pathname={pathname} />}

        {/* Context-Aware Quick Actions - Lazy loaded when sidebar is expanded */}
        {!isCollapsed && <PageActions pathname={pathname} />}
        
        {/* Theme Toggle - Always visible at bottom */}
        <div className="px-3 py-3 border-t mt-auto">
          <div className="flex items-center justify-center">
            <ThemeToggle variant="sidebar" />
          </div>
        </div>
      </div>
    </div>
  );
}

// Lazy-loaded Quick Stats component to prevent unnecessary renders when collapsed
const QuickStats = memo(function QuickStats({ stats, loading }: { stats: any; loading: boolean }) {
  if (loading) {
    return (
      <div className="px-3 py-2">
        <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
          Quick Stats
        </h2>
        <div className="space-y-3 px-4">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2">
              <div className="h-2 w-2 rounded-full bg-gradient-to-r from-blue-300 to-blue-400 animate-pulse"></div>
              <div className="h-3 w-20 bg-gradient-to-r from-gray-200 to-gray-300 rounded animate-pulse"></div>
            </div>
            <div className="h-4 w-20 bg-gradient-to-r from-gray-200 to-gray-300 rounded animate-pulse"></div>
          </div>
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2">
              <div className="h-2 w-2 rounded-full bg-gradient-to-r from-green-300 to-green-400 animate-pulse"></div>
              <div className="h-3 w-16 bg-gradient-to-r from-gray-200 to-gray-300 rounded animate-pulse"></div>
            </div>
            <div className="h-4 w-24 bg-gradient-to-r from-gray-200 to-gray-300 rounded animate-pulse"></div>
          </div>
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2">
              <div className="h-2 w-2 rounded-full bg-gradient-to-r from-red-300 to-red-400 animate-pulse"></div>
              <div className="h-3 w-20 bg-gradient-to-r from-gray-200 to-gray-300 rounded animate-pulse"></div>
            </div>
            <div className="h-4 w-20 bg-gradient-to-r from-gray-200 to-gray-300 rounded animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-3 py-2">
      <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
        Quick Stats
      </h2>
      <div className="space-y-3 px-4">
        <div className="flex items-center justify-between text-sm group">
          <div className="flex items-center">
            <div className="h-2 w-2 rounded-full bg-gradient-to-r from-green-400 to-green-600 mr-2 group-hover:scale-125 transition-transform duration-200"></div>
            <span className="text-muted-foreground group-hover:text-foreground transition-colors duration-200">Balance</span>
          </div>
          <span className={cn(
            'font-medium transition-all duration-200 group-hover:scale-105',
            stats.balance >= 0 ? 'text-green-600' : 'text-red-600'
          )}>
            {stats.balance >= 0 ? '+' : ''}{formatCurrency(stats.balance)}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm group">
          <div className="flex items-center">
            <div className="h-2 w-2 rounded-full bg-gradient-to-r from-blue-400 to-blue-600 mr-2 group-hover:scale-125 transition-transform duration-200"></div>
            <span className="text-muted-foreground group-hover:text-foreground transition-colors duration-200">Income</span>
          </div>
          <span className="font-medium text-green-600 transition-all duration-200 group-hover:scale-105">+{formatCurrency(stats.income)}</span>
        </div>
        <div className="flex items-center justify-between text-sm group">
          <div className="flex items-center">
            <div className="h-2 w-2 rounded-full bg-gradient-to-r from-red-400 to-red-600 mr-2 group-hover:scale-125 transition-transform duration-200"></div>
            <span className="text-muted-foreground group-hover:text-foreground transition-colors duration-200">Expenses</span>
          </div>
          <span className="font-medium text-red-600 transition-all duration-200 group-hover:scale-105">-{formatCurrency(stats.expenses)}</span>
        </div>
      </div>
    </div>
  );
});

// Lazy-loaded Quick Actions component
const QuickActions = memo(function QuickActions({ pathname }: { pathname: string }) {
  return (
    <div className="px-3 py-2">
      <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
        Quick Actions
      </h2>
      <div className="space-y-1">
        <Button className="w-full justify-start transition-all duration-200 hover:scale-[1.02] hover:shadow-sm active:scale-[0.98]" asChild>
          <Link href="/transactions">
            <Plus className="mr-2 h-4 w-4 transition-transform duration-200 group-hover:rotate-90" />
            Add Transaction
          </Link>
        </Button>
        <Button className="w-full justify-start transition-all duration-200 hover:scale-[1.02] hover:shadow-sm active:scale-[0.98]" variant="outline" asChild>
          <Link href="/transactions?filter=recent">
            <Calendar className="mr-2 h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
            Recent Transactions
          </Link>
        </Button>
        <Button className="w-full justify-start transition-all duration-200 hover:scale-[1.02] hover:shadow-sm active:scale-[0.98]" variant="outline" asChild>
          <Link href="/budgets">
            <PiggyBank className="mr-2 h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
            Create Budget
          </Link>
        </Button>
        <Button className="w-full justify-start transition-all duration-200 hover:scale-[1.02] hover:shadow-sm active:scale-[0.98]" variant="outline" asChild>
          <Link href="/reports">
            <Calculator className="mr-2 h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
            Generate Report
          </Link>
        </Button>
        <Button className="w-full justify-start transition-all duration-200 hover:scale-[1.02] hover:shadow-sm active:scale-[0.98]" variant="outline" asChild>
          <Link href="/accounts">
            <Wallet className="mr-2 h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
            Manage Accounts
          </Link>
        </Button>
        <Button className="w-full justify-start transition-all duration-200 hover:scale-[1.02] hover:shadow-sm active:scale-[0.98]" variant="outline" asChild>
          <Link href="/transactions?export=true">
            <FileDown className="mr-2 h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
            Export Data
          </Link>
        </Button>
      </div>
    </div>
  );
});

// Lazy-loaded Page Actions component
const PageActions = memo(function PageActions({ pathname }: { pathname: string }) {
  return (
    <div className="px-3 py-2">
      <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
        Page Actions
      </h2>
      <div className="space-y-1">
        {pathname === '/transactions' && (
          <>
            <Button className="w-full justify-start transition-all duration-200 hover:scale-[1.02] hover:shadow-sm active:scale-[0.98]" variant="outline" asChild>
              <Link href="/transactions?view=enhanced">
                <Filter className="mr-2 h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
                Enhanced View
              </Link>
            </Button>
            <Button className="w-full justify-start transition-all duration-200 hover:scale-[1.02] hover:shadow-sm active:scale-[0.98]" variant="outline" asChild>
              <Link href="/transactions?export=true">
                <FileDown className="mr-2 h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
                Quick Export
              </Link>
            </Button>
          </>
        )}
        {pathname === '/dashboard' && (
          <Button className="w-full justify-start transition-all duration-200 hover:scale-[1.02] hover:shadow-sm active:scale-[0.98]" variant="outline" asChild>
            <Link href="/reports">
              <Calculator className="mr-2 h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
              View Reports
            </Link>
          </Button>
        )}
        {pathname === '/budgets' && (
          <Button className="w-full justify-start transition-all duration-200 hover:scale-[1.02] hover:shadow-sm active:scale-[0.98]" variant="outline" asChild>
            <Link href="/transactions?filter=budget">
              <Calendar className="mr-2 h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
              Budget Transactions
            </Link>
          </Button>
        )}
        {(pathname === '/accounts' || pathname === '/settings') && (
          <Button className="w-full justify-start transition-all duration-200 hover:scale-[1.02] hover:shadow-sm active:scale-[0.98]" variant="outline" asChild>
            <Link href="/dashboard">
              <RefreshCw className="mr-2 h-4 w-4 transition-transform duration-200 group-hover:rotate-180" />
              Back to Dashboard
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
});
