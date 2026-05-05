'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useBudgets } from '@/hooks/useBudgets';
import { useTransactions } from '@/hooks/useTransactions';
import { useCategories } from '@/hooks/useCategories';
import { BudgetForm } from '@/components/forms/BudgetForm';
import { BudgetCard } from '@/components/budgets/BudgetCard';
import { BudgetSummary } from '@/components/budgets/BudgetSummary';
import { DeleteBudgetDialog } from '@/components/dialogs/DeleteBudgetDialog';
import { Budget } from '@/lib/types';
import { Plus, PiggyBank, TrendingUp, AlertCircle, Target } from 'lucide-react';
import { toast } from 'sonner';

export default function BudgetsPage() {
  const { budgets, loading: budgetsLoading, addBudget, updateBudget, deleteBudget } = useBudgets();
  const { transactions } = useTransactions();
  const { categories } = useCategories();

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);

  // Calculate budget analytics
  const budgetAnalytics = useMemo(() => {
    if (!transactions || !budgets) {
      return {
        budgetsWithSpending: [],
        totalBudget: 0,
        totalSpent: 0,
        overBudgetCount: 0,
        nearLimitCount: 0,
      };
    }

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    // Get current month transactions
    const currentMonthTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate.getMonth() === currentMonth && 
             transactionDate.getFullYear() === currentYear;
    });

    const budgetsWithSpending = budgets.map(budget => {
      const spent = currentMonthTransactions
        .filter(t => t.category === budget.category && t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
      
      const remaining = budget.amount - spent;
      const percentageUsed = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;

      return {
        budget,
        spent,
        remaining,
        percentageUsed,
      };
    });

    const totalBudget = budgets.reduce((sum, b) => sum + b.amount, 0);
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

  if (budgetsLoading) {
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Budgets</h1>
          <p className="text-muted-foreground">
            Set and track your monthly budgets
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
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
            <div>
              <h3 className="text-lg font-semibold">No budgets yet</h3>
              <p className="text-muted-foreground">
                Create your first budget to start tracking your spending
              </p>
            </div>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Budget
            </Button>
          </div>
        </Card>
      ) : (
        <>
          <BudgetSummary
            budgets={budgets}
            totalSpent={budgetAnalytics.totalSpent}
            totalBudget={budgetAnalytics.totalBudget}
            overBudgetCount={budgetAnalytics.overBudgetCount}
            nearLimitCount={budgetAnalytics.nearLimitCount}
          />

          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="detailed">Detailed View</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {budgetAnalytics.budgetsWithSpending.map(({ budget, spent, remaining, percentageUsed }) => (
                  <BudgetCard
                    key={budget.id}
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
                {budgetAnalytics.budgetsWithSpending.map(({ budget, spent, remaining, percentageUsed }) => (
                  <BudgetCard
                    key={budget.id}
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
          </Tabs>
        </>
      )}

      {/* Create Budget Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create New Budget</DialogTitle>
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
