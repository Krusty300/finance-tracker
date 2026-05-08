'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { createTransactionSchema } from '@/lib/schema';
import { useCategories } from '@/hooks/useCategories';
import { useAccounts } from '@/hooks/useAccounts';
import { useCurrency } from '@/contexts/CurrencyContext';
import { Plus, Loader2 } from 'lucide-react';

const formSchema = createTransactionSchema.extend({
  date: z.string().min(1, 'Date is required'),
});

type FormData = z.infer<typeof formSchema>;

interface TransactionFormProps {
  onSubmit: (data: Omit<FormData, 'tags'>) => void;
  trigger?: React.ReactNode;
  initialData?: Partial<FormData>;
  onDialogClose?: () => void;
}

export function TransactionForm({ onSubmit, trigger, initialData, onDialogClose }: TransactionFormProps) {
  const { formatCurrency, currency, getCurrencySymbol } = useCurrency();
  const { categories, loading } = useCategories();
  const { accounts } = useAccounts();

  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: initialData?.amount || 0,
      type: initialData?.type || 'expense',
      category: initialData?.category || '',
      date: initialData?.date || new Date().toISOString().split('T')[0],
      description: initialData?.description || '',
      account: initialData?.account || '',
      tags: initialData?.tags || [],
    },
  });

  const transactionType = form.watch('type');
  const filteredCategories = categories.filter(cat => cat.type === transactionType);

  // Auto-open dialog when initialData is provided and set form values
  useEffect(() => {
    if (initialData) {
      console.log('TransactionForm: Setting initialData', initialData);
      setOpen(true);
      
      // Small delay to ensure form is fully initialized
      const timer = setTimeout(() => {
        // Use setValue instead of reset for better control
        if (initialData.amount !== undefined) {
          console.log('Setting amount to:', initialData.amount);
          form.setValue('amount', initialData.amount);
        }
        if (initialData.type !== undefined) {
          console.log('Setting type to:', initialData.type);
          form.setValue('type', initialData.type);
        }
        if (initialData.category !== undefined) {
          console.log('Setting category to:', initialData.category);
          form.setValue('category', initialData.category);
        }
        if (initialData.date !== undefined) {
          console.log('Setting date to:', initialData.date);
          form.setValue('date', initialData.date);
        }
        if (initialData.description !== undefined) {
          console.log('Setting description to:', initialData.description);
          form.setValue('description', initialData.description);
        }
        if (initialData.account !== undefined) {
          console.log('Setting account to:', initialData.account);
          form.setValue('account', initialData.account);
        }
        if (initialData.tags !== undefined) {
          console.log('Setting tags to:', initialData.tags);
          form.setValue('tags', initialData.tags);
        }
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [initialData, form]);

  const handleSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
      // Delay form reset to allow parent to clear template data first
      setTimeout(() => {
        form.reset();
        setOpen(false);
      }, 100);
    } catch (error) {
      console.error('Error submitting transaction:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const defaultTrigger = (
    <Button>
      <Plus className="mr-2 h-4 w-4" />
      Add Transaction
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      setOpen(newOpen);
      if (!newOpen && onDialogClose) {
        onDialogClose();
      }
    }}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Transaction</DialogTitle>
          <DialogDescription>
            Add a new transaction to your records
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="type"
              render={({ field }: { field: any }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="income">Income</SelectItem>
                      <SelectItem value="expense">Expense</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="amount"
              render={({ field }: { field: any }) => (
                <FormItem>
                  <FormLabel>Amount ({getCurrencySymbol(currency)})</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder={`0.00 ${getCurrencySymbol(currency)}`}
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                  {field.value && field.value > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Preview: {formatCurrency(field.value)}
                    </p>
                  )}
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }: { field: any }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {filteredCategories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="date"
              render={({ field }: { field: any }) => (
                <FormItem>
                  <FormLabel>Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }: { field: any }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter description" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="account"
              render={({ field }: { field: any }) => (
                <FormItem>
                  <FormLabel>Account (Optional)</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select account" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {accounts.map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Transaction
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
