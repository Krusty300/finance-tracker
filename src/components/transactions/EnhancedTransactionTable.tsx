'use client';

import { useState, useMemo, useEffect } from 'react';
import { Transaction } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  ArrowUpRight, 
  ArrowDownRight,
  ArrowUpDown,
  Copy,
  FileDown
} from 'lucide-react';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useFormatting } from '@/contexts/FormattingContext';
import { useCategories } from '@/hooks/useCategories';
import { useAccounts } from '@/hooks/useAccounts';
import { DuplicateTransactionDialog } from '@/components/dialogs/DuplicateTransactionDialog';

interface EnhancedTransactionTableProps {
  transactions: Transaction[];
  searchTerm?: string;
  onEdit?: (transaction: Transaction) => void;
  onDelete?: (id: string) => void;
  onBulkDelete?: (ids: string[]) => void;
  onBulkExport?: (ids: string[]) => void;
  onDuplicate?: (data: Omit<Transaction, 'id'>) => void;
  onExportDialog?: () => void;
  onSelectionChange?: (ids: string[]) => void;
  onBulkCategoryChange?: () => void;
  onBulkDateEdit?: () => void;
}

type SortField = 'date' | 'description' | 'category' | 'amount' | 'account';
type SortDirection = 'asc' | 'desc';

export function EnhancedTransactionTable({ 
  transactions,
  searchTerm = '',
  onEdit, 
  onDelete, 
  onBulkDelete, 
  onBulkExport, 
  onDuplicate, 
  onExportDialog, 
  onSelectionChange,
  onBulkCategoryChange,
  onBulkDateEdit
}: EnhancedTransactionTableProps) {
  const { formatCurrency } = useCurrency();
  const { formatDate } = useFormatting();
  const { categories } = useCategories();
  const { accounts } = useAccounts();

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);
  const [transactionToDuplicate, setTransactionToDuplicate] = useState<Transaction | null>(null);

  const getCategoryInfo = (categoryId: string) => {
    return categories.find(cat => cat.id === categoryId);
  };

  const getAccountInfo = (accountId?: string) => {
    if (!accountId) return null;
    return accounts.find(acc => acc.id === accountId);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const handleSelectAll = (checked: boolean | string) => {
    const isChecked = typeof checked === 'boolean' ? checked : checked === 'on';
    if (isChecked) {
      setSelectedIds(filteredTransactions.map(t => t.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string, checked: boolean | string) => {
    const isChecked = typeof checked === 'boolean' ? checked : checked === 'on';
    if (isChecked) {
      setSelectedIds(prev => [...prev, id]);
    } else {
      setSelectedIds(prev => prev.filter(selectedId => selectedId !== id));
    }
  };

  const handleBulkDelete = () => {
    if (onBulkDelete && selectedIds.length > 0) {
      onBulkDelete(selectedIds);
      setSelectedIds([]);
    }
  };

  const handleBulkExport = () => {
    if (onBulkExport) {
      onBulkExport(selectedIds);
    }
  };

  const handleDuplicateTransaction = (transaction: Transaction) => {
    setTransactionToDuplicate(transaction);
    setDuplicateDialogOpen(true);
  };

  const handleDuplicateSubmit = (data: Omit<Transaction, 'id'>) => {
    if (onDuplicate) {
      onDuplicate(data);
    }
  };

  // Sync selection state with parent component
  useEffect(() => {
    if (onSelectionChange) {
      onSelectionChange(selectedIds);
    }
  }, [selectedIds, onSelectionChange]);

  // Enhanced filtering and sorting
  const filteredTransactions = useMemo(() => {
    let filtered = transactions;

    // Search filtering
    if (searchTerm) {
      filtered = filtered.filter(transaction => 
        transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        getCategoryInfo(transaction.category)?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        getAccountInfo(transaction.account)?.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sorting
    filtered = [...filtered].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'date':
          aValue = new Date(a.date).getTime();
          bValue = new Date(b.date).getTime();
          break;
        case 'amount':
          aValue = a.amount;
          bValue = b.amount;
          break;
        case 'description':
          aValue = a.description.toLowerCase();
          bValue = b.description.toLowerCase();
          break;
        case 'category':
          aValue = getCategoryInfo(a.category)?.name || '';
          bValue = getCategoryInfo(b.category)?.name || '';
          break;
        case 'account':
          aValue = getAccountInfo(a.account)?.name || '';
          bValue = getAccountInfo(b.account)?.name || '';
          break;
        default:
          aValue = new Date(a.date).getTime();
          bValue = new Date(b.date).getTime();
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [transactions, searchTerm, sortField, sortDirection, categories, accounts]);

  if (transactions.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-muted-foreground">No transactions found</p>
            <p className="text-sm text-muted-foreground mt-2">
              Add your first transaction to get started
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ArrowUpDown className="ml-2 h-4 w-4" />;
    }
    return sortDirection === 'asc' ? 
      <ArrowUpDown className="ml-2 h-4 w-4 rotate-180" /> : 
      <ArrowUpDown className="ml-2 h-4 w-4" />;
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Transactions</CardTitle>
            <div className="flex items-center gap-2">
              {selectedIds.length > 0 && (
                <>
                  <Badge variant="secondary">
                    {selectedIds.length} selected
                  </Badge>
                  <Button variant="outline" size="sm" onClick={handleBulkExport}>
                    <FileDown className="mr-2 h-4 w-4" />
                    Export Selected
                  </Button>
                  <Button variant="outline" size="sm" onClick={onBulkCategoryChange}>
                    Change Category
                  </Button>
                  <Button variant="outline" size="sm" onClick={onBulkDateEdit}>
                    Edit Dates
                  </Button>
                  <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Selected
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedIds.length === filteredTransactions.length && filteredTransactions.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 font-semibold"
                      onClick={() => handleSort('date')}
                    >
                      Date
                      <SortIcon field="date" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 font-semibold"
                      onClick={() => handleSort('description')}
                    >
                      Description
                      <SortIcon field="description" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 font-semibold"
                      onClick={() => handleSort('category')}
                    >
                      Category
                      <SortIcon field="category" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 font-semibold"
                      onClick={() => handleSort('account')}
                    >
                      Account
                      <SortIcon field="account" />
                    </Button>
                  </TableHead>
                  <TableHead className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 font-semibold"
                      onClick={() => handleSort('amount')}
                    >
                      Amount
                      <SortIcon field="amount" />
                    </Button>
                  </TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.map((transaction) => {
                  const category = getCategoryInfo(transaction.category);
                  const account = getAccountInfo(transaction.account);
                  const isIncome = transaction.type === 'income';
                  const isSelected = selectedIds.includes(transaction.id);

                  return (
                    <TableRow key={transaction.id} className={isSelected ? 'bg-muted/50' : ''}>
                      <TableCell>
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={(checked) => handleSelectOne(transaction.id, !!checked)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatDate(transaction.date)}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {transaction.description}
                      </TableCell>
                      <TableCell>
                        {category && (
                          <Badge variant="secondary" style={{ backgroundColor: category.color + '20', color: category.color }}>
                            {category.name}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {account?.name || '-'}
                      </TableCell>
                      <TableCell className={`text-right font-medium ${isIncome ? 'text-green-600' : 'text-red-600'}`}>
                        <div className="flex items-center justify-end">
                          {isIncome ? (
                            <ArrowUpRight className="mr-1 h-4 w-4" />
                          ) : (
                            <ArrowDownRight className="mr-1 h-4 w-4" />
                          )}
                          {formatCurrency(transaction.amount)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {onEdit && (
                              <DropdownMenuItem onClick={() => onEdit(transaction)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => handleDuplicateTransaction(transaction)}>
                              <Copy className="mr-2 h-4 w-4" />
                              Duplicate
                            </DropdownMenuItem>
                            {onDelete && (
                              <DropdownMenuItem 
                                onClick={() => onDelete(transaction.id)}
                                className="text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          
          {filteredTransactions.length === 0 && searchTerm && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No transactions found matching "{searchTerm}"</p>
            </div>
          )}
        </CardContent>
      </Card>
      
      <DuplicateTransactionDialog
        open={duplicateDialogOpen}
        onOpenChange={setDuplicateDialogOpen}
        transaction={transactionToDuplicate}
        onSubmit={handleDuplicateSubmit}
      />
    </>
  );
}
