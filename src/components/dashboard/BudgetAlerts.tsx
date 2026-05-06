'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  AlertTriangle, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle,
  ArrowRight,
  Target
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { DashboardStats } from '@/lib/types';
import { useRouter } from 'next/navigation';

interface BudgetAlertsProps {
  stats: DashboardStats;
}

export function BudgetAlerts({ stats }: BudgetAlertsProps) {
  const router = useRouter();
  const { budgetBreakdown, budgetHealth } = stats;

  // Get critical and warning budgets
  const overBudgetBudgets = budgetBreakdown.filter(b => b.status === 'over-budget');
  const nearLimitBudgets = budgetBreakdown.filter(b => b.status === 'near-limit');

  const handleReviewBudgets = () => {
    router.push('/budgets');
  };

  const hasAlerts = overBudgetBudgets.length > 0 || nearLimitBudgets.length > 0;

  if (!hasAlerts && budgetHealth === 'healthy') {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-green-700">
            <CheckCircle className="h-5 w-5" />
            Budget Health - Excellent
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-green-600 text-sm">
            Great job! All your budgets are on track. Keep up the good work!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Critical Alerts */}
      {overBudgetBudgets.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="h-5 w-5" />
              Critical Budget Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600 text-sm mb-4">
              You've exceeded your budget in {overBudgetBudgets.length} categor{overBudgetBudgets.length === 1 ? 'y' : 'ies'}. 
              Consider adjusting your spending or budget limits.
            </p>
            <div className="space-y-3">
              {overBudgetBudgets.map((budget) => (
                <div key={budget.category} className="flex items-center justify-between p-3 bg-white rounded-lg border border-red-200">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <div>
                      <div className="font-medium text-sm">{budget.category}</div>
                      <div className="text-xs text-muted-foreground">
                        {formatCurrency(budget.spent)} / {formatCurrency(budget.budget)}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="destructive" className="text-xs">
                      +{formatCurrency(budget.spent - budget.budget)}
                    </Badge>
                    <div className="text-xs text-red-600 mt-1">
                      {budget.percentageUsed.toFixed(1)}% used
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-red-200">
              <Button 
                size="sm" 
                variant="outline" 
                className="text-red-600 border-red-200 hover:bg-red-100"
                onClick={handleReviewBudgets}
              >
                <Target className="h-4 w-4 mr-2" />
                Review Budgets
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Warning Alerts */}
      {nearLimitBudgets.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-yellow-700">
              <AlertCircle className="h-5 w-5" />
              Budget Warnings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-yellow-600 text-sm mb-4">
              {nearLimitBudgets.length} categor{nearLimitBudgets.length === 1 ? 'y is' : 'ies are'} approaching their budget limits. 
              Monitor your spending closely.
            </p>
            <div className="space-y-3">
              {nearLimitBudgets.map((budget) => (
                <div key={budget.category} className="flex items-center justify-between p-3 bg-white rounded-lg border border-yellow-200">
                  <div className="flex items-center gap-3">
                    <TrendingUp className="h-4 w-4 text-yellow-600" />
                    <div>
                      <div className="font-medium text-sm">{budget.category}</div>
                      <div className="text-xs text-muted-foreground">
                        {formatCurrency(budget.spent)} / {formatCurrency(budget.budget)}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="secondary" className="text-xs">
                      {formatCurrency(budget.budget - budget.spent)} left
                    </Badge>
                    <div className="text-xs text-yellow-600 mt-1">
                      {budget.percentageUsed.toFixed(1)}% used
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-yellow-200">
              <Button 
                size="sm" 
                variant="outline" 
                className="text-yellow-600 border-yellow-200 hover:bg-yellow-100"
                onClick={handleReviewBudgets}
              >
                <ArrowRight className="h-4 w-4 mr-2" />
                View Details
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Budget Health Summary */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-blue-700">
            <Target className="h-5 w-5" />
            Budget Health Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-green-600">
                {budgetBreakdown.filter(b => b.status === 'on-track').length}
              </div>
              <div className="text-xs text-muted-foreground">On Track</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-600">
                {budgetBreakdown.filter(b => b.status === 'near-limit').length}
              </div>
              <div className="text-xs text-muted-foreground">Warning</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">
                {budgetBreakdown.filter(b => b.status === 'over-budget').length}
              </div>
              <div className="text-xs text-muted-foreground">Over Budget</div>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-blue-200">
            <div className="flex items-center justify-between">
              <span className="text-sm text-blue-700">Overall Budget Health</span>
              <Badge 
                variant={budgetHealth === 'healthy' ? 'default' : 
                         budgetHealth === 'warning' ? 'secondary' : 'destructive'}
                className="text-xs"
              >
                {budgetHealth === 'healthy' ? 'Healthy' : 
                 budgetHealth === 'warning' ? 'Warning' : 'Critical'}
              </Badge>
            </div>
            <p className="text-xs text-blue-600 mt-2">
              {budgetHealth === 'healthy' 
                ? 'All budgets are performing well within limits.'
                : budgetHealth === 'warning'
                  ? 'Some budgets need attention to avoid overspending.'
                  : 'Immediate action required to control overspending.'}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
