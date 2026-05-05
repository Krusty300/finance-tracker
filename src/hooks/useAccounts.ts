import { useState, useEffect, useCallback } from 'react';
import { Account } from '@/lib/types';
import { db } from '@/lib/db';

export function useAccounts() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAccounts = useCallback(() => {
    setLoading(true);
    try {
      const data = db.getAccounts();
      setAccounts(data);
    } catch (error) {
      console.error('Error loading accounts:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAccounts();

    const handleStorageChange = () => {
      loadAccounts();
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [loadAccounts]);

  const addAccount = useCallback((account: Omit<Account, 'id'>) => {
    try {
      const newAccount = db.addAccount(account);
      setAccounts(prev => [...prev, newAccount]);
      return newAccount;
    } catch (error) {
      console.error('Error adding account:', error);
      throw error;
    }
  }, []);

  const updateAccount = useCallback((id: string, updates: Partial<Account>) => {
    try {
      const updated = db.updateAccount(id, updates);
      if (updated) {
        setAccounts(prev => 
          prev.map(a => a.id === id ? updated : a)
        );
      }
      return updated;
    } catch (error) {
      console.error('Error updating account:', error);
      throw error;
    }
  }, []);

  const deleteAccount = useCallback((id: string) => {
    try {
      const success = db.deleteAccount(id);
      if (success) {
        setAccounts(prev => prev.filter(a => a.id !== id));
      }
      return success;
    } catch (error) {
      console.error('Error deleting account:', error);
      throw error;
    }
  }, []);

  const getAccountById = useCallback((id: string) => {
    return accounts.find(a => a.id === id);
  }, [accounts]);

  const getTotalBalance = useCallback(() => {
    return accounts.reduce((total, account) => {
      if (account.type === 'credit') {
        return total - Math.abs(account.balance);
      }
      return total + account.balance;
    }, 0);
  }, [accounts]);

  return {
    accounts,
    loading,
    addAccount,
    updateAccount,
    deleteAccount,
    getAccountById,
    getTotalBalance,
    refreshAccounts: loadAccounts,
  };
}
