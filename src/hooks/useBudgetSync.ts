import { useState, useEffect, useCallback } from 'react';
import { Budget } from '@/lib/types';
import { db } from '@/lib/db';

// Retry configuration
const MAX_RETRIES = 3;
const BASE_DELAY = 1000; // 1 second
const MAX_DELAY = 10000; // 10 seconds

// Exponential backoff helper
const getDelay = (retryCount: number) => {
  const delay = BASE_DELAY * Math.pow(2, retryCount - 1);
  return Math.min(delay, MAX_DELAY);
};

// Retry wrapper with exponential backoff
async function retryOperation<T>(
  operation: () => Promise<T>,
  operationName: string,
  maxRetries: number = MAX_RETRIES
): Promise<T> {
  let lastError: Error | undefined;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await operation();
      if (attempt > 1) {
        console.log(`${operationName} succeeded on attempt ${attempt}`);
      }
      return result;
    } catch (error) {
      lastError = error as Error;
      console.warn(`${operationName} failed on attempt ${attempt}:`, error);
      
      if (attempt < maxRetries) {
        const delay = getDelay(attempt);
        console.log(`Retrying ${operationName} in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  const errorMessage = lastError?.message || 'Unknown error';
  throw new Error(`${operationName} failed after ${maxRetries} attempts: ${errorMessage}`);
}

export function useBudgetSync() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<number>(0);

  // Load initial budgets
  const loadBudgets = useCallback(async () => {
    setLoading(true);
    try {
      const data = await retryOperation(async () => {
        const result = await db.getBudgets();
        return result;
      }, 'Load budgets');
      // Validate the data is an array of budgets
      if (Array.isArray(data)) {
        setBudgets(data);
      } else {
        console.warn('Invalid data format from getBudgets:', data);
        setBudgets([]);
      }
      setLastUpdate(Date.now());
    } catch (error) {
      console.error('Error loading budgets:', error);
      // Set empty budgets as fallback
      setBudgets([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Add budget with immediate update
  const addBudget = useCallback(async (budget: Omit<Budget, 'id'>) => {
    try {
      const newBudget = await retryOperation(async () => {
        const result = await db.addBudget(budget);
        return result;
      }, 'Add budget');
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
    console.log('useBudgetSync: Updating budget:', { id, updates });
    try {
      const updated = await retryOperation(async () => {
        const result = await db.updateBudget(id, updates);
        return result;
      }, 'Update budget');
      if (updated) {
        console.log('useBudgetSync: Budget updated successfully:', updated);
        setBudgets(prev => {
          const newBudgets = prev.map(b => b.id === id ? { ...b, ...updates } : b);
          console.log('useBudgetSync: Budgets state updated:', {
            previousCount: prev.length,
            newCount: newBudgets.length,
            updatedBudget: newBudgets.find(b => b.id === id)
          });
          return newBudgets;
        });
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
      const success = await retryOperation(async () => {
        const result = await db.deleteBudget(id);
        return result;
      }, 'Delete budget');
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
