'use client';

import { useState } from 'react';
import { Transaction } from '@/lib/types';
import { TransactionForm } from '@/components/forms/TransactionForm';
import { EditTransactionForm } from '@/components/forms/EditTransactionForm';
import { TransactionTable } from '@/components/transactions/TransactionTable';
import { EnhancedTransactionTable } from '@/components/transactions/EnhancedTransactionTable';
import { useTransactions } from '@/hooks/useTransactions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, Download, Calendar, X, RotateCcw } from 'lucide-react';
import { formatDate, formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { DeleteConfirmDialog } from '@/components/dialogs/DeleteConfirmDialog';
import { ExportDialog } from '@/components/dialogs/ExportDialog';
import { useCategories } from '@/hooks/useCategories';

export default function TransactionsPage() {
  const { transactions, addTransaction, deleteTransaction, updateTransaction } = useTransactions();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: '',
    end: '',
  });
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [useEnhancedTable, setUseEnhancedTable] = useState(true);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const { categories } = useCategories();

  const handleAddTransaction = (data: Omit<Transaction, 'id'>) => {
    try {
      addTransaction(data);
      toast.success('Transaction added successfully!');
    } catch (error) {
      console.error('Failed to add transaction:', error);
      toast.error('Failed to add transaction. Please try again.');
    }
  };

  const handleEditTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction);
  };

  const handleUpdateTransaction = (data: Omit<Transaction, 'id'>) => {
    if (editingTransaction) {
      try {
        updateTransaction(editingTransaction.id, data);
        setEditingTransaction(null);
        toast.success('Transaction updated successfully!');
      } catch (error) {
        console.error('Failed to update transaction:', error);
        toast.error('Failed to update transaction. Please try again.');
      }
    }
  };

  const handleDeleteTransaction = (id: string) => {
    setTransactionToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (transactionToDelete) {
      try {
        deleteTransaction(transactionToDelete);
        toast.success('Transaction deleted successfully!');
      } catch (error) {
        console.error('Failed to delete transaction:', error);
        toast.error('Failed to delete transaction. Please try again.');
      } finally {
        setTransactionToDelete(null);
      }
    }
  };

  const getTransactionDescription = (id: string) => {
    const transaction = transactions.find(t => t.id === id);
    return transaction?.description || 'Unknown transaction';
  };

  const getTransactionDetails = (id: string) => {
    const transaction = transactions.find(t => t.id === id);
    if (!transaction) return '';
    
    const amount = transaction.type === 'income' ? `+$${transaction.amount.toFixed(2)}` : `-$${transaction.amount.toFixed(2)}`;
    const date = new Date(transaction.date).toLocaleDateString();
    return `${amount} • ${date}`;
  };

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = !searchTerm || 
      transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.category.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === 'all' || transaction.type === filterType;
    
    const matchesCategory = filterCategory === 'all' || transaction.category === filterCategory;

    // Date range filtering
    let matchesDateRange = true;
    if (dateRange.start || dateRange.end) {
      const transactionDate = new Date(transaction.date);
      if (dateRange.start) {
        matchesDateRange = transactionDate >= new Date(dateRange.start);
      }
      if (dateRange.end) {
        matchesDateRange = matchesDateRange && transactionDate <= new Date(dateRange.end + 'T23:59:59');
      }
    }

    return matchesSearch && matchesType && matchesCategory && matchesDateRange;
  });

  const clearAllFilters = () => {
    setSearchTerm('');
    setFilterType('all');
    setFilterCategory('all');
    setDateRange({ start: '', end: '' });
    toast.success('All filters cleared');
  };

  const hasActiveFilters = searchTerm || filterType !== 'all' || filterCategory !== 'all' || dateRange.start || dateRange.end;

  const exportTransactions = () => {
    setExportDialogOpen(true);
  };

  const handleBulkDelete = (ids: string[]) => {
    try {
      ids.forEach(id => {
        deleteTransaction(id);
      });
      toast.success(`${ids.length} transactions deleted successfully!`);
    } catch (error) {
      console.error('Failed to delete transactions:', error);
      toast.error('Failed to delete some transactions. Please try again.');
    }
  };

  const handleBulkExport = (ids: string[]) => {
    // Store the selected IDs for the export dialog
    if (ids && ids.length > 0) {
      setSelectedIds(ids);
    }
    setExportDialogOpen(true);
  };

  const handleDuplicateTransaction = (data: Omit<Transaction, 'id'>) => {
    try {
      addTransaction(data);
      toast.success('Transaction duplicated successfully!');
    } catch (error) {
      console.error('Failed to duplicate transaction:', error);
      toast.error('Failed to duplicate transaction. Please try again.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Transactions</h1>
          <p className="text-muted-foreground">
            Manage your income and expenses
          </p>
        </div>
        <TransactionForm onSubmit={handleAddTransaction} />
      </div>

      {/*  Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <Filter className="mr-2 h-5 w-5" />
              Filters
              {hasActiveFilters && (
                <Badge variant="secondary" className="ml-2">
                  Active
                </Badge>
              )}
            </CardTitle>
            <div className="flex gap-2">
              {hasActiveFilters && (
                <Button variant="outline" size="sm" onClick={clearAllFilters}>
                  <X className="mr-1 h-4 w-4" />
                  Clear
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAdvanced(!showAdvanced)}
              >
                <Calendar className="mr-1 h-4 w-4" />
                {showAdvanced ? 'Simple' : 'Advanced'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Basic Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={filterType} onValueChange={(value: any) => setFilterType(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="income">Income</SelectItem>
                <SelectItem value="expense">Expense</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories
                  .filter(cat => cat.type === 'expense')
                  .map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>

            <Button onClick={exportTransactions} variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>

          {/* Advanced Filters */}
          {showAdvanced && (
            <div className="border-t pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2">Date Range</label>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="date"
                      placeholder="Start date"
                      value={dateRange.start}
                      onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                    />
                    <Input
                      type="date"
                      placeholder="End date"
                      value={dateRange.end}
                      onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                    />
                  </div>
                </div>
                
                <div className="flex items-end">
                  <Button
                    variant="outline"
                    onClick={() => {
                      const today = new Date();
                      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
                      setDateRange({
                        start: firstDay.toISOString().split('T')[0],
                        end: today.toISOString().split('T')[0],
                      });
                      toast.success('Set to current month');
                    }}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    This Month
                  </Button>
                </div>
              </div>

              {/* Filter Summary */}
              <div className="mt-4 p-3 bg-muted rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Filter Results</span>
                  <span className="text-sm text-muted-foreground">
                    {filteredTransactions.length} of {transactions.length} transactions
                  </span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-green-600">
                  +${filteredTransactions
                    .filter(t => t.type === 'income')
                    .reduce((sum, t) => sum + t.amount, 0)
                    .toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground">Total Income</p>
              </div>
              {hasActiveFilters && (
                <Badge variant="outline" className="text-xs">
                  {filteredTransactions.filter(t => t.type === 'income').length} items
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-red-600">
                  -${filteredTransactions
                    .filter(t => t.type === 'expense')
                    .reduce((sum, t) => sum + t.amount, 0)
                    .toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground">Total Expenses</p>
              </div>
              {hasActiveFilters && (
                <Badge variant="outline" className="text-xs">
                  {filteredTransactions.filter(t => t.type === 'expense').length} items
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">
                  ${(filteredTransactions
                    .filter(t => t.type === 'income')
                    .reduce((sum, t) => sum + t.amount, 0) -
                    filteredTransactions
                    .filter(t => t.type === 'expense')
                    .reduce((sum, t) => sum + t.amount, 0))
                    .toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground">Net</p>
              </div>
              {hasActiveFilters && (
                <Badge variant="outline" className="text-xs">
                  {filteredTransactions.length} total
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table Toggle */}
      <div className="flex justify-end mb-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setUseEnhancedTable(!useEnhancedTable)}
        >
          {useEnhancedTable ? 'Simple View' : 'Enhanced View'}
        </Button>
      </div>

      {/* Transactions Table */}
      <ErrorBoundary>
        {useEnhancedTable ? (
          <EnhancedTransactionTable
            transactions={filteredTransactions}
            searchTerm={searchTerm}
            onEdit={handleEditTransaction}
            onDelete={handleDeleteTransaction}
            onBulkDelete={handleBulkDelete}
            onBulkExport={handleBulkExport}
            onDuplicate={handleDuplicateTransaction}
            onExportDialog={exportTransactions}
            onSelectionChange={setSelectedIds}
          />
        ) : (
          <TransactionTable
            transactions={filteredTransactions}
            onEdit={handleEditTransaction}
            onDelete={handleDeleteTransaction}
            onDuplicate={handleDuplicateTransaction}
          />
        )}
      </ErrorBoundary>

      {/* Edit Transaction Dialog */}
      <ErrorBoundary>
        <EditTransactionForm
          transaction={editingTransaction}
          open={!!editingTransaction}
          onClose={() => setEditingTransaction(null)}
          onSubmit={handleUpdateTransaction}
        />
      </ErrorBoundary>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleConfirmDelete}
        title="Delete Transaction"
        description="Are you sure you want to delete this transaction? This action cannot be undone."
        itemName={transactionToDelete ? getTransactionDescription(transactionToDelete) : undefined}
        itemDetails={transactionToDelete ? getTransactionDetails(transactionToDelete) : undefined}
      />

      {/* Export Dialog */}
      <ExportDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
        transactions={filteredTransactions}
        selectedIds={selectedIds}
        onExportComplete={() => setSelectedIds([])}
      />
    </div>
  );
}
