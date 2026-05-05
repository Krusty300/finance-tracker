'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useBudgetSync } from '@/hooks/useBudgetSync';
import { useTransactions } from '@/hooks/useTransactions';
import { useCategories } from '@/hooks/useCategories';
import { BudgetForm } from '@/components/forms/BudgetForm';
import { BudgetCard } from '@/components/budgets/BudgetCard';
import { BudgetSummary } from '@/components/budgets/BudgetSummary';
import { DeleteBudgetDialog } from '@/components/dialogs/DeleteBudgetDialog';
import { BudgetComparisonChart } from '@/components/charts/BudgetComparisonChart';
import { BudgetTrendChart } from '@/components/charts/BudgetTrendChart';
import { Budget } from '@/lib/types';
import { BudgetErrorBoundary, BudgetErrorFallback } from '@/components/error/BudgetErrorBoundary';
import { Plus, PiggyBank, TrendingUp, AlertCircle, Target } from 'lucide-react';
import { toast } from 'sonner';
import { calculatePeriodSpending, getPeriodDisplayText } from '@/utils/period-aware-calculations';

export default function BudgetsPage() {
  const { budgets, loading, addBudget, updateBudget, deleteBudget, lastUpdate } = useBudgetSync();
  const { transactions } = useTransactions();
  const { categories } = useCategories();

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);

  // Calculate budget analytics
  const budgetAnalytics = useMemo(() => {
    // Validate inputs
    if (!Array.isArray(transactions) || !Array.isArray(budgets)) {
      console.warn('Invalid data for budget analytics:', { transactions, budgets });
      return {
        budgetsWithSpending: [],
        totalBudget: 0,
        totalSpent: 0,
        overBudgetCount: 0,
        nearLimitCount: 0,
      };
    }

    // Debug: Check for duplicate budget IDs
    const budgetIds = budgets.map(b => b.id);
    const uniqueIds = new Set(budgetIds);
    if (budgetIds.length !== uniqueIds.size) {
      console.warn('Duplicate budget IDs detected:', budgetIds);
    }

    // Remove duplicate budgets by ID
    const uniqueBudgets = budgets.filter((budget, index, self) => 
      index === self.findIndex((b) => b.id === budget.id)
    );

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    // Get current month transactions
    const currentMonthTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate.getMonth() === currentMonth && 
             transactionDate.getFullYear() === currentYear;
    });

    const budgetsWithSpending = uniqueBudgets.map(budget => {
      // Validate budget structure
      if (!budget || typeof budget.amount !== 'number' || budget.amount < 0) {
        console.warn('Invalid budget structure:', budget);
        return {
          budget: budget || { id: 'invalid', category: 'Invalid', amount: 0, period: 'monthly' },
          spent: 0,
          remaining: 0,
          percentageUsed: 0,
        };
      }
      
      const spent = calculatePeriodSpending(budget, transactions);
      
      const remaining = budget.amount - spent;
      const percentageUsed = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;

      return {
        budget,
        spent,
        remaining,
        percentageUsed,
      };
    });

    const totalBudget = uniqueBudgets.reduce((sum, b) => sum + b.amount, 0);
    const totalSpent = budgetsWithSpending.reduce((sum, b) => sum + b.spent, 0);
    const overBudgetCount = budgetsWithSpending.filter(b => b.percentageUsed > 100).length;
    const nearLimitCount = budgetsWithSpending.filter(b => b.percentageUsed >= 80 && b.percentageUsed <= 100).length;

    return {
      budgetsWithSpending,
      totalBudget,
      totalSpent,
      overBudgetCount,
      nearLimitCount,
    };
  }, [transactions, budgets]);

  const handleCreateBudget = async (data: Omit<Budget, 'id'>) => {
    try {
      await addBudget(data);
      setShowCreateDialog(false);
      toast.success('Budget created successfully');
    } catch (error) {
      toast.error('Failed to create budget');
      console.error('Error creating budget:', error);
    }
  };

  const handleEditBudget = async (data: Omit<Budget, 'id'>) => {
    if (!selectedBudget) return;
    
    try {
      await updateBudget(selectedBudget.id, data);
      setShowEditDialog(false);
      setSelectedBudget(null);
      toast.success('Budget updated successfully');
    } catch (error) {
      toast.error('Failed to update budget');
      console.error('Error updating budget:', error);
    }
  };

  const handleDeleteBudget = async () => {
    if (!selectedBudget) return;
    
    try {
      await deleteBudget(selectedBudget.id);
      setShowDeleteDialog(false);
      setSelectedBudget(null);
      toast.success('Budget deleted successfully');
    } catch (error) {
      toast.error('Failed to delete budget');
      console.error('Error deleting budget:', error);
    }
  };

  const openEditDialog = (budget: Budget) => {
    setSelectedBudget(budget);
    setShowEditDialog(true);
  };

  const openDeleteDialog = (budget: Budget) => {
    setSelectedBudget(budget);
    setShowDeleteDialog(true);
  };

  // Generate trend data for the last 6 months
  const generateTrendData = () => {
    const trendData = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const trendDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const trendStart = new Date(trendDate.getFullYear(), trendDate.getMonth(), 1);
      const trendEnd = new Date(trendDate.getFullYear(), trendDate.getMonth() + 1, 0);
      
      // Get transactions for this month
      const monthTransactions = transactions.filter(t => {
        const transactionDate = new Date(t.date);
        return transactionDate >= trendStart && transactionDate <= trendEnd;
      });

      // Calculate total budget and spent for this month
      const monthBudget = budgets.reduce((sum, budget) => sum + budget.amount, 0);
      const monthSpent = monthTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

      trendData.push({
        month: trendDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        budget: monthBudget,
        spent: monthSpent,
        variance: monthSpent - monthBudget,
        percentageUsed: monthBudget > 0 ? (monthSpent / monthBudget) * 100 : 0
      });
    }
    
    return trendData;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Budgets</h1>
          <p className="text-muted-foreground">
            Set and track your monthly budgets
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-20" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-24 mb-2" />
                <Skeleton className="h-3 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-32" />
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                </div>
                <Skeleton className="h-2 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Budgets</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Set and track your monthly budgets
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Create Budget
        </Button>
      </div>

      {budgets.length === 0 ? (
        <Card className="text-center py-12">
          <div className="space-y-4">
            <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center">
              <PiggyBank className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold">No budgets yet</h3>
            <p className="text-muted-foreground">Create your first budget to get started</p>
            <Button onClick={() => setShowCreateDialog(true)} className="mt-4">
              <Plus className="mr-2 h-4 w-4" />
              Create Budget
            </Button>
          </div>
        </Card>
      ) : (
        <>
          <BudgetErrorBoundary fallback={BudgetErrorFallback}>
            <BudgetSummary
              budgets={budgets}
              totalSpent={budgetAnalytics.totalSpent}
              totalBudget={budgetAnalytics.totalBudget}
              overBudgetCount={budgetAnalytics.overBudgetCount}
              nearLimitCount={budgetAnalytics.nearLimitCount}
            />
          </BudgetErrorBoundary>

          <Tabs defaultValue="overview" className="space-y-4">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="detailed">Detailed View</TabsTrigger>
                  <TabsTrigger value="analytics">Analytics</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {budgetAnalytics.budgetsWithSpending.map(({ budget, spent, remaining, percentageUsed }, index) => (
                      <BudgetCard
                        key={`overview-${budget.id}-${index}`}
                        budget={budget}
                        spent={spent}
                        remaining={remaining}
                        percentageUsed={percentageUsed}
                        onEdit={() => openEditDialog(budget)}
                        onDelete={() => openDeleteDialog(budget)}
                      />
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="detailed" className="space-y-4">
              <div className="space-y-4">
                {budgetAnalytics.budgetsWithSpending.map(({ budget, spent, remaining, percentageUsed }, index) => (
                  <BudgetCard
                    key={`detailed-${budget.id}-${index}`}
                    budget={budget}
                    spent={spent}
                    remaining={remaining}
                    percentageUsed={percentageUsed}
                    onEdit={() => openEditDialog(budget)}
                    onDelete={() => openDeleteDialog(budget)}
                  />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-6">
              <div className="grid gap-6">
                <BudgetComparisonChart
                  data={budgetAnalytics.budgetsWithSpending.map(({ budget, spent, remaining, percentageUsed }) => {
                    // Map category ID to name for display
                    const category = categories.find(c => c.id === budget.category);
                    const categoryName = category?.name || budget.category;
                    
                    return {
                      category: categoryName,
                      budget: budget.amount,
                      spent,
                      remaining,
                      percentageUsed,
                      status: percentageUsed > 100 ? 'over-budget' : percentageUsed >= 80 ? 'near-limit' : 'on-track',
                      period: getPeriodDisplayText(budget)
                    };
                  })}
                  title="Budget vs Spending Analysis"
                  showComparison={true}
                />

                <BudgetTrendChart
                  data={generateTrendData()}
                  title="Budget Performance Trends"
                  showProjection={true}
                />
              </div>
            </TabsContent>
          </Tabs>
        </>
      )}

      {/* Create Budget Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create New Budget</DialogTitle>
            <DialogDescription>
              Set a spending limit for a specific category to track your expenses.
            </DialogDescription>
          </DialogHeader>
          <BudgetForm
            onSubmit={handleCreateBudget}
            onCancel={() => setShowCreateDialog(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Budget Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Budget</DialogTitle>
            <DialogDescription>
              Modify the budget settings for this category.
            </DialogDescription>
          </DialogHeader>
          <BudgetForm
            budget={selectedBudget || undefined}
            onSubmit={handleEditBudget}
            onCancel={() => {
              setShowEditDialog(false);
              setSelectedBudget(null);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Budget Dialog */}
      <DeleteBudgetDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        budget={selectedBudget}
        onConfirm={handleDeleteBudget}
      />
    </div>
  );
}
