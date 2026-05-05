'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  AlertCircle, 
  CheckCircle, 
  TrendingUp, 
  TrendingDown,
  Target,
  DollarSign,
  PieChart,
  Calendar
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { DashboardStats } from '@/lib/types';

interface BudgetCardsProps {
  stats: DashboardStats;
}

export function BudgetCards({ stats }: BudgetCardsProps) {
  // Validate stats data
  if (!stats || typeof stats !== 'object') {
    console.warn('Invalid stats data provided to BudgetCards:', stats);
    return (
      <Card>
        <CardHeader>
          <CardTitle>Budget Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32 text-muted-foreground">
            No budget data available
          </div>
        </CardContent>
      </Card>
    );
  }

  const { budgetBreakdown, totalBudget, totalSpent, budgetHealth } = stats;

  // Validate numeric values
  const safeTotalBudget = typeof totalBudget === 'number' && !isNaN(totalBudget) ? totalBudget : 0;
  const safeTotalSpent = typeof totalSpent === 'number' && !isNaN(totalSpent) ? totalSpent : 0;

  const getHealthIcon = () => {
    switch (budgetHealth) {
      case 'healthy': return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'warning': return <AlertCircle className="h-5 w-5 text-yellow-600" />;
      case 'critical': return <TrendingDown className="h-5 w-5 text-red-600" />;
      default: return <Target className="h-5 w-5 text-gray-600" />;
    }
  };

  const getHealthColor = () => {
    switch (budgetHealth) {
      case 'healthy': return 'text-green-600 bg-green-50 border-green-200';
      case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'on-track': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'near-limit': return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      case 'over-budget': return <TrendingDown className="h-4 w-4 text-red-600" />;
      default: return <Target className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'on-track': return 'text-green-600';
      case 'near-limit': return 'text-yellow-600';
      case 'over-budget': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const overallPercentage = safeTotalBudget > 0 ? (safeTotalSpent / safeTotalBudget) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Budget Overview Card */}
      <Card className={`border-2 ${getHealthColor()}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              {getHealthIcon()}
              Budget Overview
            </CardTitle>
            <Badge 
              variant={budgetHealth === 'healthy' ? 'default' : 
                       budgetHealth === 'warning' ? 'secondary' : 'destructive'}
              className="text-xs"
            >
              {budgetHealth === 'healthy' ? 'On Track' : 
               budgetHealth === 'warning' ? 'Warning' : 'Critical'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(safeTotalBudget)}
              </div>
              <div className="text-sm text-muted-foreground">Total Budget</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${getStatusColor(budgetHealth)}`}>
                {formatCurrency(safeTotalSpent)}
              </div>
              <div className="text-sm text-muted-foreground">Total Spent</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${getStatusColor(budgetHealth)}`}>
                {formatCurrency(safeTotalBudget - safeTotalSpent)}
              </div>
              <div className="text-sm text-muted-foreground">Remaining</div>
            </div>
          </div>
          
          <div className="mt-4">
            <div className="flex justify-between text-sm mb-2">
              <span>Budget Usage</span>
              <span className={`font-medium ${getStatusColor(budgetHealth)}`}>
                {overallPercentage.toFixed(1)}%
              </span>
            </div>
            <Progress 
              value={Math.min(overallPercentage, 100)} 
              className="h-2"
            />
          </div>
        </CardContent>
      </Card>

      {/* Individual Budget Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {budgetBreakdown.slice(0, 6).map((budget) => (
          <Card key={budget.category} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-base">{budget.category}</CardTitle>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>{budget.period}</span>
                  </div>
                </div>
                {getStatusIcon(budget.status)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Budget</span>
                  <span className="font-medium">{formatCurrency(budget.budget)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Spent</span>
                  <span className={`font-medium ${getStatusColor(budget.status)}`}>
                    {formatCurrency(budget.spent)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Remaining</span>
                  <span className="font-medium text-green-600">
                    {formatCurrency(budget.remaining)}
                  </span>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Used</span>
                    <span className={`font-medium ${getStatusColor(budget.status)}`}>
                      {budget.percentageUsed.toFixed(1)}%
                    </span>
                  </div>
                  <Progress 
                    value={Math.min(budget.percentageUsed, 100)} 
                    className="h-1"
                  />
                </div>
                <div className="pt-2 border-t">
                  <Badge 
                    variant={budget.status === 'on-track' ? 'default' : 
                             budget.status === 'near-limit' ? 'secondary' : 'destructive'}
                    className="text-xs w-full justify-center"
                  >
                    {budget.status === 'over-budget' ? 'Over Budget' : 
                     budget.status === 'near-limit' ? 'Near Limit' : 'On Track'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Budget Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="text-center">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">
              {budgetBreakdown.filter(b => b.status === 'on-track').length}
            </div>
            <div className="text-sm text-muted-foreground">On Track</div>
          </CardContent>
        </Card>
        
        <Card className="text-center">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-yellow-600">
              {budgetBreakdown.filter(b => b.status === 'near-limit').length}
            </div>
            <div className="text-sm text-muted-foreground">Near Limit</div>
          </CardContent>
        </Card>
        
        <Card className="text-center">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-600">
              {budgetBreakdown.filter(b => b.status === 'over-budget').length}
            </div>
            <div className="text-sm text-muted-foreground">Over Budget</div>
          </CardContent>
        </Card>
        
        <Card className="text-center">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">
              {budgetBreakdown.length}
            </div>
            <div className="text-sm text-muted-foreground">Total Budgets</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
