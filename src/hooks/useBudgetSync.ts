import { useState, useEffect, useCallback } from 'react';
import { Budget } from '@/lib/types';
import { db } from '@/lib/db';

export function useBudgetSync() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<number>(0);

  // Load initial budgets
  const loadBudgets = useCallback(async () => {
    setLoading(true);
    try {
      const data = await db.getBudgets();
      setBudgets(data);
      setLastUpdate(Date.now());
    } catch (error) {
      console.error('Error loading budgets:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Add budget with immediate update
  const addBudget = useCallback(async (budget: Omit<Budget, 'id'>) => {
    try {
      const newBudget = await db.addBudget(budget);
      setBudgets(prev => [...prev, newBudget]);
      setLastUpdate(Date.now());
      
      // Trigger storage event for other tabs
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'budgets-updated',
        newValue: JSON.stringify({ 
          type: 'create', 
          data: newBudget,
          timestamp: Date.now()
        })
      }));
      
      return newBudget;
    } catch (error) {
      console.error('Error adding budget:', error);
      throw error;
    }
  }, []);

  // Update budget with immediate update
  const updateBudget = useCallback(async (id: string, updates: Partial<Budget>) => {
    try {
      const updated = await db.updateBudget(id, updates);
      if (updated) {
        setBudgets(prev => 
          prev.map(b => b.id === id ? { ...b, ...updates } : b)
        );
        setLastUpdate(Date.now());
        
        // Trigger storage event for other tabs
        window.dispatchEvent(new StorageEvent('storage', {
          key: 'budgets-updated',
          newValue: JSON.stringify({ 
            type: 'update', 
            data: updated,
            timestamp: Date.now()
          })
        }));
      }
      return updated;
    } catch (error) {
      console.error('Error updating budget:', error);
      throw error;
    }
  }, []);

  // Delete budget with immediate update
  const deleteBudget = useCallback(async (id: string) => {
    try {
      const budgetToDelete = budgets.find(b => b.id === id);
      const success = await db.deleteBudget(id);
      if (success) {
        setBudgets(prev => prev.filter(b => b.id !== id));
        setLastUpdate(Date.now());
        
        // Trigger storage event for other tabs
        window.dispatchEvent(new StorageEvent('storage', {
          key: 'budgets-updated',
          newValue: JSON.stringify({ 
            type: 'delete', 
            data: budgetToDelete,
            timestamp: Date.now()
          })
        }));
      }
      return success;
    } catch (error) {
      console.error('Error deleting budget:', error);
      throw error;
    }
  }, [budgets]);

  // Listen for storage events from other tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'budgets-updated' && e.newValue) {
        try {
          const event = JSON.parse(e.newValue);
          
          // Only process if from a different tab (check timestamp)
          if (event.timestamp > lastUpdate) {
            switch (event.type) {
              case 'create':
                setBudgets(prev => [...prev, event.data]);
                break;
              case 'update':
                setBudgets(prev => 
                  prev.map(b => b.id === event.data.id ? { ...b, ...event.data } : b)
                );
                break;
              case 'delete':
                setBudgets(prev => prev.filter(b => b.id !== event.data.id));
                break;
            }
            
            setLastUpdate(event.timestamp);
          }
        } catch (error) {
          console.error('Error processing storage event:', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [lastUpdate]);

  // Initial load
  useEffect(() => {
    loadBudgets();
  }, [loadBudgets]);

  return {
    budgets,
    loading,
    addBudget,
    updateBudget,
    deleteBudget,
    lastUpdate
  };
}
