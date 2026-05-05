'use client';

import { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Transaction } from '@/lib/types';
import { useTransactions } from '@/hooks/useTransactions';
import { useCategories } from '@/hooks/useCategories';
import { useAccounts } from '@/hooks/useAccounts';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';
import { 
  Plus, 
  X, 
  TrendingUp, 
  TrendingDown, 
  Zap,
  Calendar,
  DollarSign,
  Wallet
} from 'lucide-react';

interface QuickAddModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const recentAmounts = [10, 25, 50, 100, 250, 500];
const quickDescriptions = [
  'Coffee',
  'Lunch',
  'Groceries',
  'Gas',
  'Utilities',
  'Entertainment',
  'Shopping',
  'Transport'
];

export function QuickAddModal({ open, onOpenChange }: QuickAddModalProps) {
  const { addTransaction } = useTransactions();
  const { categories } = useCategories();
  const { accounts } = useAccounts();

  const [formData, setFormData] = useState({
    type: 'expense' as 'income' | 'expense',
    amount: '',
    description: '',
    category: '',
    account: '',
    date: new Date().toISOString().split('T')[0]
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const expenseCategories = categories.filter(cat => cat.type === 'expense');
  const incomeCategories = categories.filter(cat => cat.type === 'income');

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.amount || !formData.description || !formData.category || !formData.account) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    
    try {
      await addTransaction({
        type: formData.type,
        amount: parseFloat(formData.amount),
        description: formData.description,
        category: formData.category,
        account: formData.account,
        date: formData.date
      });
      
      // Reset form
      setFormData({
        type: 'expense',
        amount: '',
        description: '',
        category: '',
        account: '',
        date: new Date().toISOString().split('T')[0]
      });
      
      onOpenChange(false);
      toast.success('Transaction added successfully!');
    } catch (error) {
      console.error('Failed to add transaction:', error);
      toast.error('Failed to add transaction');
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, addTransaction, onOpenChange]);

  const setQuickAmount = useCallback((amount: number) => {
    setFormData(prev => ({ ...prev, amount: amount.toString() }));
  }, []);

  const setQuickDescription = useCallback((description: string) => {
    setFormData(prev => ({ ...prev, description }));
  }, []);

  const currentCategories = formData.type === 'income' ? incomeCategories : expenseCategories;
  const selectedCategory = categories.find(cat => cat.name === formData.category);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Quick Add Transaction
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Transaction Type Toggle */}
          <div className="flex gap-2">
            <Button
              type="button"
              variant={formData.type === 'expense' ? 'default' : 'outline'}
              onClick={() => setFormData(prev => ({ ...prev, type: 'expense' }))}
              className="flex-1"
            >
              <TrendingDown className="mr-2 h-4 w-4" />
              Expense
            </Button>
            <Button
              type="button"
              variant={formData.type === 'income' ? 'default' : 'outline'}
              onClick={() => setFormData(prev => ({ ...prev, type: 'income' }))}
              className="flex-1"
            >
              <TrendingUp className="mr-2 h-4 w-4" />
              Income
            </Button>
          </div>

          {/* Amount Input with Quick Amounts */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Amount</label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                className="pl-10 text-lg font-semibold"
                required
              />
            </div>
            
            {/* Quick Amount Buttons */}
            <div className="flex flex-wrap gap-2">
              {recentAmounts.map((amount) => (
                <Button
                  key={amount}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setQuickAmount(amount)}
                  className="text-xs"
                >
                  {formatCurrency(amount)}
                </Button>
              ))}
            </div>
          </div>

          {/* Description with Quick Suggestions */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Description</label>
            <Input
              placeholder="What's this transaction for?"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              required
            />
            
            {/* Quick Description Suggestions */}
            <div className="flex flex-wrap gap-2">
              {quickDescriptions.map((description) => (
                <Badge
                  key={description}
                  variant="outline"
                  className="cursor-pointer hover:bg-accent transition-colors"
                  onClick={() => setQuickDescription(description)}
                >
                  {description}
                </Badge>
              ))}
            </div>
          </div>

          {/* Category and Account */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {currentCategories.map((category) => (
                    <SelectItem key={category.id} value={category.name}>
                      <div className="flex items-center gap-2">
                        <span>{category.icon}</span>
                        <span>{category.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Account</label>
              <Select value={formData.account} onValueChange={(value) => setFormData(prev => ({ ...prev, account: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.name}>
                      <div className="flex items-center justify-between w-full">
                        <span>{account.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {formatCurrency(account.balance)}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Date */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Date
            </label>
            <Input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
              required
            />
          </div>

          {/* Preview */}
          {selectedCategory && formData.amount && (
            <Card className="border-2">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">{selectedCategory.icon}</div>
                    <div>
                      <div className="font-medium">{formData.description || 'Untitled Transaction'}</div>
                      <div className="text-sm text-muted-foreground">
                        {selectedCategory.name} • {formData.account || 'No account'}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-xl font-bold ${
                      formData.type === 'income' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formData.type === 'income' ? '+' : '-'}
                      {formatCurrency(parseFloat(formData.amount) || 0)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(formData.date).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? (
                'Adding...'
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Transaction
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
