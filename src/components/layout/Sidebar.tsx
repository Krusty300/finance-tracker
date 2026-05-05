'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTransactions } from '@/hooks/useTransactions';
import { useCategories } from '@/hooks/useCategories';
import { useAccounts } from '@/hooks/useAccounts';
import {
  LayoutDashboard,
  Receipt,
  Target,
  TrendingUp,
  Wallet,
  Settings,
  Plus,
  Menu,
  X,
  Bell,
  CreditCard,
  PiggyBank,
  AlertCircle,
  Moon,
  Sun,
  FileDown,
  Calculator,
  Calendar,
  Filter,
  RefreshCw,
} from 'lucide-react';

interface SidebarProps {
  className?: string;
  isCollapsed?: boolean;
  onToggle?: () => void;
}

export function Sidebar({ className, isCollapsed = false, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const { transactions, loading: transactionsLoading } = useTransactions();
  const { categories, loading: categoriesLoading } = useCategories();
  const { accounts, loading: accountsLoading } = useAccounts();

  // Calculate real stats from actual data
  const calculateStats = () => {
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
  };

  const stats = calculateStats();

  // Dynamic navigation with real data
  const navigation = [
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
      name: 'Settings',
      href: '/settings',
      icon: Settings,
      badge: null,
    },
  ];

  return (
    <div className={cn('pb-12 transition-all duration-300', isCollapsed ? 'w-16' : 'w-64', className)}>
      <div className="space-y-4 py-4">
        {/* Header with toggle button */}
        <div className="px-3 py-2 flex items-center justify-between">
          {!isCollapsed && (
            <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
              Finance Tracker
            </h2>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className="h-8 w-8 p-0"
          >
            {isCollapsed ? (
              <Menu className="h-4 w-4" />
            ) : (
              <X className="h-4 w-4" />
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
                  'w-full justify-start group relative',
                  isCollapsed && 'justify-center',
                  pathname === item.href && 'bg-accent text-accent-foreground'
                )}
                asChild
                title={isCollapsed ? item.name : undefined}
              >
                <Link href={item.href} className="flex items-center">
                  <item.icon className={cn('h-4 w-4', !isCollapsed && 'mr-2')} />
                  {!isCollapsed && item.name}
                  {item.badge && !isCollapsed && (
                    <Badge 
                      variant={item.badge === '!' ? 'destructive' : 'secondary'} 
                      className="ml-auto text-xs"
                    >
                      {item.badge}
                    </Badge>
                  )}
                  {item.badge && isCollapsed && (
                    <div className="absolute -top-1 -right-1">
                      <Badge 
                        variant={item.badge === '!' ? 'destructive' : 'secondary'} 
                        className="h-5 w-5 p-0 flex items-center justify-center text-xs"
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
        
        {/* Quick Stats */}
        {!isCollapsed && (
          <div className="px-3 py-2">
            <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
              Quick Stats
            </h2>
            {transactionsLoading || categoriesLoading || accountsLoading ? (
              <div className="space-y-2 px-4">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center">
                    <div className="h-2 w-2 rounded-full bg-gray-300 mr-2 animate-pulse"></div>
                    <span className="text-muted-foreground">Loading...</span>
                  </div>
                  <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center">
                    <div className="h-2 w-2 rounded-full bg-gray-300 mr-2 animate-pulse"></div>
                    <span className="text-muted-foreground">Loading...</span>
                  </div>
                  <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center">
                    <div className="h-2 w-2 rounded-full bg-gray-300 mr-2 animate-pulse"></div>
                    <span className="text-muted-foreground">Loading...</span>
                  </div>
                  <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
            ) : (
              <div className="space-y-2 px-4">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center">
                    <div className="h-2 w-2 rounded-full bg-green-500 mr-2"></div>
                    <span className="text-muted-foreground">Balance</span>
                  </div>
                  <span className="font-medium">{stats.balance >= 0 ? '+' : ''}{formatCurrency(stats.balance)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center">
                    <div className="h-2 w-2 rounded-full bg-blue-500 mr-2"></div>
                    <span className="text-muted-foreground">Income</span>
                  </div>
                  <span className="font-medium text-green-600">+{formatCurrency(stats.income)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center">
                    <div className="h-2 w-2 rounded-full bg-red-500 mr-2"></div>
                    <span className="text-muted-foreground">Expenses</span>
                  </div>
                  <span className="font-medium text-red-600">-{formatCurrency(stats.expenses)}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Quick Actions */}
        {!isCollapsed && (
          <div className="px-3 py-2">
            <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
              Quick Actions
            </h2>
            <div className="space-y-1">
              <Button className="w-full justify-start" asChild>
                <Link href="/transactions">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Transaction
                </Link>
              </Button>
              <Button className="w-full justify-start" variant="outline" asChild>
                <Link href="/transactions?filter=recent">
                  <Calendar className="mr-2 h-4 w-4" />
                  Recent Transactions
                </Link>
              </Button>
              <Button className="w-full justify-start" variant="outline" asChild>
                <Link href="/budgets">
                  <PiggyBank className="mr-2 h-4 w-4" />
                  Create Budget
                </Link>
              </Button>
              <Button className="w-full justify-start" variant="outline" asChild>
                <Link href="/reports">
                  <Calculator className="mr-2 h-4 w-4" />
                  Generate Report
                </Link>
              </Button>
              <Button className="w-full justify-start" variant="outline" asChild>
                <Link href="/accounts">
                  <Wallet className="mr-2 h-4 w-4" />
                  Manage Accounts
                </Link>
              </Button>
              <Button className="w-full justify-start" variant="outline" asChild>
                <Link href="/transactions?export=true">
                  <FileDown className="mr-2 h-4 w-4" />
                  Export Data
                </Link>
              </Button>
            </div>
          </div>
        )}

        {/* Context-Aware Quick Actions */}
        {!isCollapsed && (
          <div className="px-3 py-2">
            <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
              Page Actions
            </h2>
            <div className="space-y-1">
              {pathname === '/transactions' && (
                <>
                  <Button className="w-full justify-start" variant="outline" asChild>
                    <Link href="/transactions?view=enhanced">
                      <Filter className="mr-2 h-4 w-4" />
                      Enhanced View
                    </Link>
                  </Button>
                  <Button className="w-full justify-start" variant="outline" asChild>
                    <Link href="/transactions?export=true">
                      <FileDown className="mr-2 h-4 w-4" />
                      Quick Export
                    </Link>
                  </Button>
                </>
              )}
              {pathname === '/dashboard' && (
                <Button className="w-full justify-start" variant="outline" asChild>
                  <Link href="/reports">
                    <Calculator className="mr-2 h-4 w-4" />
                    View Reports
                  </Link>
                </Button>
              )}
              {pathname === '/budgets' && (
                <Button className="w-full justify-start" variant="outline" asChild>
                  <Link href="/transactions?filter=budget">
                    <Calendar className="mr-2 h-4 w-4" />
                    Budget Transactions
                  </Link>
                </Button>
              )}
              {(pathname === '/accounts' || pathname === '/settings') && (
                <Button className="w-full justify-start" variant="outline" asChild>
                  <Link href="/dashboard">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Back to Dashboard
                  </Link>
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
