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
import { DashboardErrorBoundary, DashboardErrorFallback } from '@/components/error/DashboardErrorBoundary';

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
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 data-onboarding="dashboard-title" className="text-2xl sm:text-3xl font-bold">Dashboard</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Overview of your financial health
        </p>
      </div>

      {/* KPI Cards */}
      <DashboardErrorBoundary fallback={DashboardErrorFallback}>
        <div data-onboarding="dashboard-cards">
          <DashboardCards
            totalBalance={stats.totalBalance}
            monthlyIncome={stats.monthlyIncome}
            monthlyExpenses={stats.monthlyExpenses}
            netWorth={stats.netWorth}
          />
        </div>
      </DashboardErrorBoundary>

      {/* Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        <DashboardErrorBoundary fallback={DashboardErrorFallback}>
          <SpendingChart data={stats.categoryBreakdown} />
        </DashboardErrorBoundary>
        <DashboardErrorBoundary fallback={DashboardErrorFallback}>
          <MonthlyTrendChart data={stats.monthlyTrend} />
        </DashboardErrorBoundary>
      </div>

      {/* Recent Transactions */}
      <DashboardErrorBoundary fallback={DashboardErrorFallback}>
        <RecentTransactions transactions={stats.recentTransactions} />
      </DashboardErrorBoundary>

      {/* Budget Tracking Section */}
      {stats.budgetBreakdown && stats.budgetBreakdown.length > 0 && (
        <>
          {/* Budget Alerts */}
          <DashboardErrorBoundary fallback={DashboardErrorFallback}>
            <BudgetAlerts stats={stats} />
          </DashboardErrorBoundary>

          {/* Budget Cards */}
          <DashboardErrorBoundary fallback={DashboardErrorFallback}>
            <BudgetCards stats={stats} />
          </DashboardErrorBoundary>
        </>
      )}
    </div>
  );
}
