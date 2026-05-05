'use client';

import { useEffect } from 'react';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { DashboardCards } from '@/components/dashboard/DashboardCards';
import { SpendingChart } from '@/components/dashboard/SpendingChart';
import { MonthlyTrendChart } from '@/components/dashboard/MonthlyTrendChart';
import { RecentTransactions } from '@/components/dashboard/RecentTransactions';
import { BudgetCards } from '@/components/dashboard/BudgetCards';
import { BudgetAlerts } from '@/components/dashboard/BudgetAlerts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { seedSampleData } from '@/lib/seedData';
import { verifyDataPersistence, verifyLocalStorage } from '@/lib/dataVerification';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

export default function DashboardPage() {
  const { stats, loading } = useDashboardStats();

  useEffect(() => {
    const initializeData = async () => {
      try {
        // Initialize sample data if needed
        seedSampleData();
        
        // Verify data persistence (development only)
        if (process.env.NODE_ENV === 'development') {
          setTimeout(() => {
            try {
              verifyLocalStorage();
              verifyDataPersistence();
            } catch (error) {
              console.error('Data verification failed:', error);
            }
          }, 1000);
        }
      } catch (error) {
        console.error('Failed to initialize dashboard data:', error);
      }
    };

    initializeData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of your financial health
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="space-y-0">
                <Skeleton className="h-4 w-20" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-3 w-16 mt-2" />
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-80 w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-80 w-full" />
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div>
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24 mt-1" />
                    </div>
                  </div>
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of your financial health
          </p>
        </div>
        
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Unable to load dashboard data</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your financial health
        </p>
      </div>

      {/* KPI Cards */}
      <ErrorBoundary>
        <DashboardCards
          totalBalance={stats.totalBalance}
          monthlyIncome={stats.monthlyIncome}
          monthlyExpenses={stats.monthlyExpenses}
          netWorth={stats.netWorth}
        />
      </ErrorBoundary>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ErrorBoundary>
          <SpendingChart data={stats.categoryBreakdown} />
        </ErrorBoundary>
        <ErrorBoundary>
          <MonthlyTrendChart data={stats.monthlyTrend} />
        </ErrorBoundary>
      </div>

      {/* Recent Transactions */}
      <ErrorBoundary>
        <RecentTransactions transactions={stats.recentTransactions} />
      </ErrorBoundary>

      {/* Budget Tracking Section */}
      {stats.budgetBreakdown && stats.budgetBreakdown.length > 0 && (
        <>
          {/* Budget Alerts */}
          <ErrorBoundary>
            <BudgetAlerts stats={stats} />
          </ErrorBoundary>

          {/* Budget Cards */}
          <ErrorBoundary>
            <BudgetCards stats={stats} />
          </ErrorBoundary>
        </>
      )}
    </div>
  );
}
