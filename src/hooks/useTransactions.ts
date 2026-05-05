import { useState, useEffect, useCallback } from 'react';
import { Transaction } from '@/lib/types';
import { db } from '@/lib/db';

export function useTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

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
      return newTransaction;
    } catch (error) {
      console.error('Error adding transaction:', error);
      throw error;
    }
  }, []);

  const updateTransaction = useCallback((id: string, updates: Partial<Transaction>) => {
    try {
      const updated = db.updateTransaction(id, updates);
      if (updated) {
        setTransactions(prev => 
          prev.map(t => t.id === id ? updated : t)
        );
      }
      return updated;
    } catch (error) {
      console.error('Error updating transaction:', error);
      throw error;
    }
  }, []);

  const deleteTransaction = useCallback((id: string) => {
    try {
      const success = db.deleteTransaction(id);
      if (success) {
        setTransactions(prev => prev.filter(t => t.id !== id));
      }
      return success;
    } catch (error) {
      console.error('Error deleting transaction:', error);
      throw error;
    }
  }, []);

  const getTransactionsByMonth = useCallback((year: number, month: number) => {
    return db.getTransactionsByMonth(year, month);
  }, []);

  const getTransactionsByCategory = useCallback((category: string) => {
    return db.getTransactionsByCategory(category);
  }, []);

  const getTransactionsByDateRange = useCallback((startDate: Date, endDate: Date) => {
    return db.getTransactionsByDateRange(startDate, endDate);
  }, []);

  return {
    transactions,
    loading,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    getTransactionsByMonth,
    getTransactionsByCategory,
    getTransactionsByDateRange,
    refreshTransactions: loadTransactions,
  };
}
