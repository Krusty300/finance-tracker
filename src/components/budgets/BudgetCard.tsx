'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Budget } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';
import { Edit, Trash2, AlertCircle, TrendingUp, TrendingDown } from 'lucide-react';
import { useCategories } from '@/hooks/useCategories';

interface BudgetCardProps {
  budget: Budget;
  spent: number;
  remaining: number;
  percentageUsed: number;
  onEdit: () => void;
  onDelete: () => void;
}

export function BudgetCard({ 
  budget, 
  spent, 
  remaining, 
  percentageUsed, 
  onEdit, 
  onDelete 
}: BudgetCardProps) {
  const { categories } = useCategories();
  const isOverBudget = percentageUsed > 100;
  const isNearLimit = percentageUsed >= 80 && percentageUsed <= 100;

  // Map category ID to name
  const category = categories.find(c => c.id === budget.category);
  const categoryName = category?.name || budget.category;
  
  const getStatusColor = () => {
    if (isOverBudget) return 'destructive';
    if (isNearLimit) return 'secondary';
    return 'default';
  };

  const getStatusText = () => {
    if (isOverBudget) return 'Over Budget';
    if (isNearLimit) return 'Near Limit';
    return 'On Track';
  };

  const getStatusIcon = () => {
    if (isOverBudget) return <TrendingDown className="h-3 w-3" />;
    if (isNearLimit) return <AlertCircle className="h-3 w-3" />;
    return <TrendingUp className="h-3 w-3" />;
  };

  return (
    <Card className="relative">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{categoryName}</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant={getStatusColor()} className="flex items-center gap-1">
              {getStatusIcon()}
              {getStatusText()}
            </Badge>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={onEdit}
                className="h-8 w-8 p-0"
              >
                <Edit className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onDelete}
                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Budget</span>
            <span className="font-medium">{formatCurrency(budget.amount)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Spent</span>
            <span className={`font-medium ${isOverBudget ? 'text-destructive' : ''}`}>
              {formatCurrency(spent)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Remaining</span>
            <span className={`font-medium ${remaining < 0 ? 'text-destructive' : 'text-green-600'}`}>
              {formatCurrency(remaining)}
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className={`font-medium ${isOverBudget ? 'text-destructive' : ''}`}>
              {Math.min(percentageUsed, 100).toFixed(1)}%
            </span>
          </div>
          <Progress 
            value={Math.min(percentageUsed, 100)} 
            className={`h-2 ${isOverBudget ? 'bg-destructive/20' : ''}`}
          />
        </div>

        {isOverBudget && (
          <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-2 rounded">
            <AlertCircle className="h-4 w-4" />
            <span>You've exceeded your budget by {formatCurrency(Math.abs(remaining))}</span>
          </div>
        )}

        {isNearLimit && !isOverBudget && (
          <div className="flex items-center gap-2 text-sm text-orange-600 bg-orange-50 dark:bg-orange-950/20 p-2 rounded">
            <AlertCircle className="h-4 w-4" />
            <span>You have {formatCurrency(remaining)} remaining</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
