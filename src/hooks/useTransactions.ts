import { useState, useEffect, useCallback } from 'react';
import { Transaction, TransactionSplit, TransactionAttachment, RecurringTransactionRule } from '@/lib/types';
import { db } from '@/lib/db';
import { useAccounts } from './useAccounts';
import { useRealtimeTransactions } from './useRealtime';

export function useTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const { accounts, updateAccount } = useAccounts();
  const { notifyTransactionChange } = useRealtimeTransactions();

  const loadTransactions = useCallback(() => {
    setLoading(true);
    try {
      const data = db.getTransactions();
      setTransactions(data);
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTransactions();

    const handleStorageChange = () => {
      loadTransactions();
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [loadTransactions]);

  const addTransaction = useCallback((transaction: Omit<Transaction, 'id'>) => {
    try {
      const newTransaction = db.addTransaction(transaction);
      setTransactions(prev => [...prev, newTransaction]);

      // Emit real-time event
      notifyTransactionChange('create', newTransaction);

      // Update account balance if transaction has an account
      if (transaction.account && accounts.length > 0) {
        const account = accounts.find(acc => acc.id === transaction.account);
        if (account) {
          const balanceChange = transaction.type === 'income' 
            ? transaction.amount 
            : -transaction.amount;
          
          const newBalance = account.balance + balanceChange;
          console.log(`Updating account ${account.name} balance: ${account.balance} → ${newBalance} (${balanceChange > 0 ? '+' : ''}${balanceChange})`);
          updateAccount(account.id, {
            balance: newBalance
          });
        }
      }

      return newTransaction;
    } catch (error) {
      console.error('Error adding transaction:', error);
      throw error;
    }
  }, [accounts, updateAccount]);

  const updateTransaction = useCallback((id: string, updates: Partial<Transaction>) => {
    try {
      const oldTransaction = transactions.find(t => t.id === id);
      const updated = db.updateTransaction(id, updates);
      
      if (updated && oldTransaction) {
        setTransactions(prev => 
          prev.map(t => t.id === id ? updated : t)
        );

        // Emit real-time event
        notifyTransactionChange('update', { ...updated, oldTransaction });

        // Update account balance if amount, type, or account changed
        const amountChanged = updates.amount !== undefined && updates.amount !== oldTransaction.amount;
        const typeChanged = updates.type !== undefined && updates.type !== oldTransaction.type;
        const accountChanged = updates.account !== undefined && updates.account !== oldTransaction.account;

        if (amountChanged || typeChanged || accountChanged) {
          // Reverse old transaction effect
          if (oldTransaction.account && accounts.length > 0) {
            const oldAccount = accounts.find(acc => acc.id === oldTransaction.account);
            if (oldAccount) {
              const oldBalanceChange = oldTransaction.type === 'income' 
                ? -oldTransaction.amount 
                : oldTransaction.amount;
              
              updateAccount(oldAccount.id, {
                balance: oldAccount.balance + oldBalanceChange
              });
            }
          }

          // Apply new transaction effect
          const newTransaction = { ...oldTransaction, ...updates };
          if (newTransaction.account && accounts.length > 0) {
            const newAccount = accounts.find(acc => acc.id === newTransaction.account);
            if (newAccount) {
              const newBalanceChange = newTransaction.type === 'income' 
                ? newTransaction.amount 
                : -newTransaction.amount;
              
              updateAccount(newAccount.id, {
                balance: newAccount.balance + newBalanceChange
              });
            }
          }
        }
      }
      return updated;
    } catch (error) {
      console.error('Error updating transaction:', error);
      throw error;
    }
  }, [transactions, accounts, updateAccount]);

  const deleteTransaction = useCallback((id: string) => {
    try {
      const transactionToDelete = transactions.find(t => t.id === id);
      const success = db.softDeleteTransaction(id);
      
      if (success) {
        // Update local state to show transaction as deleted
        setTransactions(prev => 
          prev.map(t => t.id === id 
            ? { ...t, deletedAt: new Date().toISOString() }
            : t
          )
        );

        // Emit real-time event
        if (transactionToDelete) {
          notifyTransactionChange('delete', transactionToDelete);
        }

        // Update account balance when transaction is deleted
        if (transactionToDelete?.account && accounts.length > 0) {
          const account = accounts.find(acc => acc.id === transactionToDelete.account);
          if (account) {
            // Reverse the transaction effect on balance
            const balanceChange = transactionToDelete.type === 'income' 
              ? -transactionToDelete.amount 
              : transactionToDelete.amount;
            
            updateAccount(account.id, {
              balance: account.balance + balanceChange
            });
          }
        }
      }
      return success;
    } catch (error) {
      console.error('Error deleting transaction:', error);
      throw error;
    }
  }, [transactions, accounts, updateAccount]);

  const restoreTransaction = useCallback((id: string) => {
    try {
      const transactionToRestore = transactions.find(t => t.id === id);
      const success = db.restoreTransaction(id);
      
      if (success) {
        // Update local state to remove deletedAt timestamp
        setTransactions(prev => 
          prev.map(t => t.id === id 
            ? { ...t, deletedAt: undefined }
            : t
          )
        );

        // Update account balance when transaction is restored
        if (transactionToRestore?.account && accounts.length > 0) {
          const account = accounts.find(acc => acc.id === transactionToRestore.account);
          if (account) {
            // Apply the transaction effect on balance
            const balanceChange = transactionToRestore.type === 'income' 
              ? transactionToRestore.amount 
              : -transactionToRestore.amount;
            
            updateAccount(account.id, {
              balance: account.balance + balanceChange
            });
          }
        }
      }
      return success;
    } catch (error) {
      console.error('Error restoring transaction:', error);
      throw error;
    }
  }, [transactions, accounts, updateAccount]);

  const getTransactionsByMonth = useCallback((year: number, month: number) => {
    return db.getTransactionsByMonth(year, month);
  }, []);

  const getTransactionsByCategory = useCallback((category: string) => {
    return db.getTransactionsByCategory(category);
  }, []);

  const getTransactionsByDateRange = useCallback((startDate: Date, endDate: Date) => {
    return db.getTransactionsByDateRange(startDate, endDate);
  }, []);

  // Enhanced transaction methods
  const addRecurringTransaction = useCallback((transaction: Omit<Transaction, 'id'>, recurringRule: RecurringTransactionRule) => {
    const recurringTransaction = {
      ...transaction,
      isRecurring: true,
      recurringRule,
    };
    return addTransaction(recurringTransaction);
  }, [addTransaction]);

  const addSplitTransaction = useCallback((mainTransaction: Omit<Transaction, 'id'>, splits: TransactionSplit[]) => {
    const totalSplitAmount = splits.reduce((sum, split) => sum + split.amount, 0);
    
    if (Math.abs(totalSplitAmount - mainTransaction.amount) > 0.01) {
      throw new Error('Split amounts must equal the total transaction amount');
    }

    // Add main transaction (this will update the account balance)
    const transaction = {
      ...mainTransaction,
      splits,
    };

    const addedTransaction = addTransaction(transaction);

    // Create child transactions for each split (don't update account balance for these)
    const childTransactions = splits.map((split, index) => {
      const childTransaction: Omit<Transaction, 'id'> = {
        amount: split.amount,
        type: mainTransaction.type,
        category: split.category,
        date: mainTransaction.date,
        description: split.description || `${mainTransaction.description} - ${split.category}`,
        account: mainTransaction.account,
        tags: mainTransaction.tags,
        parentTransactionId: addedTransaction.id,
        isSplitChild: true,
      };
      // Add child transaction directly to DB without updating account balance
      return db.addTransaction(childTransaction);
    });

    // Update local state with child transactions
    setTransactions(prev => [...prev, ...childTransactions]);

    return { mainTransaction: addedTransaction, childTransactions };
  }, [addTransaction]);

  const addAttachment = useCallback((transactionId: string, attachment: Omit<TransactionAttachment, 'id' | 'createdAt'>) => {
    const transaction = transactions.find(t => t.id === transactionId);
    if (!transaction) throw new Error('Transaction not found');

    const newAttachment: TransactionAttachment = {
      ...attachment,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };

    const attachments = transaction.attachments || [];
    const updatedAttachments = [...attachments, newAttachment];

    return updateTransaction(transactionId, { attachments: updatedAttachments });
  }, [transactions, updateTransaction]);

  const removeAttachment = useCallback((transactionId: string, attachmentId: string) => {
    const transaction = transactions.find(t => t.id === transactionId);
    if (!transaction) throw new Error('Transaction not found');

    const attachments = transaction.attachments || [];
    const updatedAttachments = attachments.filter(a => a.id !== attachmentId);

    return updateTransaction(transactionId, { attachments: updatedAttachments });
  }, [transactions, updateTransaction]);

  const generateRecurringTransactions = useCallback(() => {
    return db.generateRecurringTransactions();
  }, []);

  const getSplitTransactions = useCallback((parentTransactionId?: string) => {
    if (parentTransactionId) {
      return transactions.filter(t => t.parentTransactionId === parentTransactionId);
    }
    return transactions.filter(t => t.splits && t.splits.length > 0);
  }, [transactions]);

  const getParentTransaction = useCallback((childTransactionId: string) => {
    const childTransaction = transactions.find(t => t.id === childTransactionId);
    if (!childTransaction?.parentTransactionId) return null;
    
    return transactions.find(t => t.id === childTransaction.parentTransactionId);
  }, [transactions]);

  const getRecurringTransactions = useCallback(() => {
    return transactions.filter(t => t.isRecurring);
  }, [transactions]);

  const getTransactionsWithAttachments = useCallback(() => {
    return transactions.filter(t => t.attachments && t.attachments.length > 0);
  }, [transactions]);

  // Initialize recurring transaction generation on load
  useEffect(() => {
    const interval = setInterval(() => {
      generateRecurringTransactions();
    }, 60 * 60 * 1000); // Check every hour

    // Also check immediately on load
    generateRecurringTransactions();

    return () => clearInterval(interval);
  }, [generateRecurringTransactions]);

  return {
    transactions,
    loading,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    restoreTransaction,
    getTransactionsByMonth,
    getTransactionsByCategory,
    getTransactionsByDateRange,
    refreshTransactions: loadTransactions,
    // Enhanced methods
    addRecurringTransaction,
    addSplitTransaction,
    addAttachment,
    removeAttachment,
    generateRecurringTransactions,
    getSplitTransactions,
    getParentTransaction,
    getRecurringTransactions,
    getTransactionsWithAttachments,
  };
}
