'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Budget } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';
import { Wallet, TrendingUp, AlertCircle, Target } from 'lucide-react';

interface BudgetSummaryProps {
  budgets: Budget[];
  totalSpent: number;
  totalBudget: number;
  overBudgetCount: number;
  nearLimitCount: number;
}

export function BudgetSummary({
  budgets,
  totalSpent,
  totalBudget,
  overBudgetCount,
  nearLimitCount,
}: BudgetSummaryProps) {
  const totalRemaining = totalBudget - totalSpent;
  const overallPercentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
  const isOverallOverBudget = totalSpent > totalBudget;

  const getOverallStatus = () => {
    if (isOverallOverBudget) {
      return {
        text: 'Over Budget',
        color: 'destructive' as const,
        icon: <AlertCircle className="h-4 w-4" />,
      };
    }
    if (overallPercentage >= 80) {
      return {
        text: 'Near Limit',
        color: 'secondary' as const,
        icon: <AlertCircle className="h-4 w-4" />,
      };
    }
    return {
      text: 'On Track',
      color: 'default' as const,
      icon: <TrendingUp className="h-4 w-4" />,
    };
  };

  const status = getOverallStatus();

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
          <Wallet className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(totalBudget)}</div>
          <p className="text-xs text-muted-foreground">
            {budgets.length} budget{budgets.length !== 1 ? 's' : ''}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${isOverallOverBudget ? 'text-destructive' : ''}`}>
            {formatCurrency(totalSpent)}
          </div>
          <p className="text-xs text-muted-foreground">
            {overallPercentage.toFixed(1)}% of budget
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Remaining</CardTitle>
          <Target className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${totalRemaining < 0 ? 'text-destructive' : 'text-green-600'}`}>
            {formatCurrency(totalRemaining)}
          </div>
          <p className="text-xs text-muted-foreground">
            {totalRemaining >= 0 ? 'Available' : 'Over budget'}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Status</CardTitle>
          {status.icon}
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Badge variant={status.color} className="text-xs">
              {status.text}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {overBudgetCount > 0 && `${overBudgetCount} over budget`}
            {overBudgetCount > 0 && nearLimitCount > 0 && ' • '}
            {nearLimitCount > 0 && `${nearLimitCount} near limit`}
            {overBudgetCount === 0 && nearLimitCount === 0 && 'All budgets on track'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
