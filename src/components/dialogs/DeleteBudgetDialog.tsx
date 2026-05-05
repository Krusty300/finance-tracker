'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Budget } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';
import { AlertTriangle } from 'lucide-react';

interface DeleteBudgetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  budget: Budget | null;
  onConfirm: () => void;
}

export function DeleteBudgetDialog({
  open,
  onOpenChange,
  budget,
  onConfirm,
}: DeleteBudgetDialogProps) {
  if (!budget) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <DialogTitle>Delete Budget</DialogTitle>
          </div>
          <DialogDescription>
            Are you sure you want to delete the budget for "{budget.category}"? 
            This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Category</span>
              <span className="font-medium">{budget.category}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Budget Amount</span>
              <span className="font-medium">{formatCurrency(budget.amount)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Period</span>
              <span className="font-medium capitalize">{budget.period}</span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
          >
            Delete Budget
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
