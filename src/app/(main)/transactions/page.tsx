'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
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
import { AdvancedFilters } from '@/components/filters/AdvancedFilters';
import { useCategories } from '@/hooks/useCategories';

export default function TransactionsPage() {
  const searchParams = useSearchParams();
  const { transactions, addTransaction, deleteTransaction, updateTransaction } = useTransactions();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<string | null>(null);
  const [bulkDeleteIds, setBulkDeleteIds] = useState<string[]>([]);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: '',
    end: '',
  });
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [useEnhancedTable, setUseEnhancedTable] = useState(true);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [templateData, setTemplateData] = useState<Partial<Transaction> | null>(null);
  const { categories } = useCategories();

  // Handle URL parameters from template navigation
  useEffect(() => {
    const amount = searchParams.get('amount');
    const type = searchParams.get('type') as 'income' | 'expense' | null;
    const category = searchParams.get('category');
    const description = searchParams.get('description');
    const account = searchParams.get('account');
    const tags = searchParams.get('tags');

    if (amount || type || category || description || account || tags) {
      const templateDataToSet = {
        amount: amount ? parseFloat(amount) : undefined,
        type: type || undefined,
        category: category || undefined,
        description: description || undefined,
        account: account || undefined,
        tags: tags ? tags.split(',').map(tag => tag.trim()).filter(Boolean) : undefined,
      };
      console.log('TransactionsPage: Setting templateData', templateDataToSet);
      setTemplateData(templateDataToSet);

      // Pre-fill the form fields
      if (type) setFilterType(type);
      if (category) setFilterCategory(category);
      if (description) setSearchTerm(description);

      // Clear URL params after a short delay to ensure form processes them first
      setTimeout(() => {
        const newUrl = window.location.pathname;
        window.history.replaceState({}, '', newUrl);
      }, 500);
    }
  }, [searchParams]);

  // Combined filters object for AdvancedFilters
  const filters = {
    searchTerm,
    type: filterType,
    category: filterCategory,
    dateRange: dateRange,
    amountRange: { min: '', max: '' }
  };

  const handleFiltersChange = (newFilters: any) => {
    setSearchTerm(newFilters.searchTerm || searchTerm);
    setFilterType(newFilters.type || filterType);
    setFilterCategory(newFilters.category || filterCategory);
    setDateRange(newFilters.dateRange || dateRange);
  };

  const handleAddTransaction = (data: Omit<Transaction, 'id'>) => {
    try {
      addTransaction(data);
      toast.success('Transaction added successfully!');
      // Clear template data after successful submission
      setTemplateData(null);
    } catch (error) {
      console.error('Failed to add transaction:', error);
      toast.error('Failed to add transaction. Please try again.');
    }
  };

  // Clear template data when component unmounts or after 5 minutes
  useEffect(() => {
    const timer = setTimeout(() => {
      setTemplateData(null);
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearTimeout(timer);
  }, []);

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

  const getBulkDeleteDetails = (ids: string[]) => {
    const totalIncome = ids.reduce((sum, id) => {
      const transaction = transactions.find(t => t.id === id);
      return transaction?.type === 'income' ? sum + transaction.amount : sum;
    }, 0);
    
    const totalExpense = ids.reduce((sum, id) => {
      const transaction = transactions.find(t => t.id === id);
      return transaction?.type === 'expense' ? sum + transaction.amount : sum;
    }, 0);

    const details = [];
    if (totalIncome > 0) details.push(`Income: +$${totalIncome.toFixed(2)}`);
    if (totalExpense > 0) details.push(`Expenses: -$${totalExpense.toFixed(2)}`);
    
    return details.join(' • ');
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
    setBulkDeleteIds(ids);
    setBulkDeleteDialogOpen(true);
  };

  const handleConfirmBulkDelete = () => {
    try {
      bulkDeleteIds.forEach(id => {
        deleteTransaction(id);
      });
      toast.success(`${bulkDeleteIds.length} transactions deleted successfully!`);
      setBulkDeleteIds([]);
      setBulkDeleteDialogOpen(false);
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
        <TransactionForm 
          onSubmit={handleAddTransaction} 
          initialData={templateData || undefined}
          onDialogClose={() => setTemplateData(null)}
        />
        {/* Debug: Show templateData */}
        {templateData && (
          <div className="fixed top-4 right-4 bg-yellow-100 p-2 rounded text-xs">
            Debug templateData: {JSON.stringify(templateData)}
          </div>
        )}
      </div>

      {/* Advanced Filters */}
      <AdvancedFilters
        filters={filters}
        onFiltersChange={handleFiltersChange}
        categories={categories}
        isOpen={showAdvancedFilters}
        onToggle={() => setShowAdvancedFilters(!showAdvancedFilters)}
      />

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

      {/* Bulk Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        open={bulkDeleteDialogOpen}
        onOpenChange={setBulkDeleteDialogOpen}
        onConfirm={handleConfirmBulkDelete}
        title={`Delete ${bulkDeleteIds.length} Transaction${bulkDeleteIds.length > 1 ? 's' : ''}`}
        description={`Are you sure you want to delete ${bulkDeleteIds.length} transaction${bulkDeleteIds.length > 1 ? 's' : ''}? This action cannot be undone.`}
        itemDetails={bulkDeleteIds.length > 0 ? getBulkDeleteDetails(bulkDeleteIds) : undefined}
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
