import { useState, useEffect, useCallback } from 'react';
import { Budget } from '@/lib/types';
import { db } from '@/lib/db';
import { useRealtimeBudgets } from './useRealtime';

export function useBudgets() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const { notifyBudgetChange } = useRealtimeBudgets();

  const loadBudgets = useCallback(() => {
    setLoading(true);
    try {
      const data = db.getBudgets();
      setBudgets(data);
    } catch (error) {
      console.error('Error loading budgets:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBudgets();

    const handleStorageChange = () => {
      loadBudgets();
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [loadBudgets]);

  const addBudget = useCallback((budget: Omit<Budget, 'id'>) => {
    try {
      const newBudget = db.addBudget(budget);
      setBudgets(prev => [...prev, newBudget]);
      
      // Emit real-time event
      notifyBudgetChange('create', newBudget);
      
      return newBudget;
    } catch (error) {
      console.error('Error adding budget:', error);
      throw error;
    }
  }, []);

  const updateBudget = useCallback((id: string, updates: Partial<Budget>) => {
    try {
      const updated = db.updateBudget(id, updates);
      if (updated) {
        setBudgets(prev => 
          prev.map(b => b.id === id ? updated : b)
        );
        
        // Emit real-time event
        notifyBudgetChange('update', updated);
      }
      return updated;
    } catch (error) {
      console.error('Error updating budget:', error);
      throw error;
    }
  }, []);

  const deleteBudget = useCallback((id: string) => {
    try {
      const budgetToDelete = budgets.find(b => b.id === id);
      const success = db.deleteBudget(id);
      if (success) {
        setBudgets(prev => prev.filter(b => b.id !== id));
        
        // Emit real-time event
        if (budgetToDelete) {
          notifyBudgetChange('delete', budgetToDelete);
        }
      }
      return success;
    } catch (error) {
      console.error('Error deleting budget:', error);
      throw error;
    }
  }, []);

  const getBudgetByCategory = useCallback((category: string) => {
    return budgets.find(b => b.category === category);
  }, [budgets]);

  return {
    budgets,
    loading,
    addBudget,
    updateBudget,
    deleteBudget,
    getBudgetByCategory,
    refreshBudgets: loadBudgets,
  };
}
