import { useState, useEffect, useCallback } from 'react';
import { RecycleBinItem } from '@/lib/types';
import { db } from '@/lib/db';

export function useRecycleBin() {
  const [items, setItems] = useState<RecycleBinItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadItems = useCallback(() => {
    setLoading(true);
    try {
      const data = db.getRecycleBinItems();
      // Sort by deletedAt date (newest first)
      const sortedItems = data.sort((a, b) => 
        new Date(b.deletedAt).getTime() - new Date(a.deletedAt).getTime()
      );
      setItems(sortedItems);
    } catch (error) {
      console.error('Error loading recycle bin items:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadItems();

    const handleStorageChange = () => {
      loadItems();
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [loadItems]);

  const restoreItem = useCallback((id: string) => {
    try {
      const success = db.restoreFromRecycleBin(id);
      if (success) {
        loadItems(); // Refresh items
      }
      return success;
    } catch (error) {
      console.error('Error restoring item:', error);
      throw error;
    }
  }, [loadItems]);

  const permanentDeleteItem = useCallback((id: string) => {
    try {
      const success = db.permanentDeleteFromRecycleBin(id);
      if (success) {
        loadItems(); // Refresh items
      }
      return success;
    } catch (error) {
      console.error('Error permanently deleting item:', error);
      throw error;
    }
  }, [loadItems]);

  const emptyRecycleBin = useCallback(() => {
    try {
      const success = db.emptyRecycleBin();
      if (success) {
        loadItems(); // Refresh items
      }
      return success;
    } catch (error) {
      console.error('Error emptying recycle bin:', error);
      throw error;
    }
  }, [loadItems]);

  const getItemDescription = useCallback((item: RecycleBinItem) => {
    switch (item.type) {
      case 'transaction':
        const transaction = item.data;
        const amount = transaction.type === 'income' 
          ? `+$${transaction.amount.toFixed(2)}` 
          : `-$${transaction.amount.toFixed(2)}`;
        return `${transaction.description} (${amount})`;
      case 'category':
        return `${item.data.name} (${item.data.type})`;
      case 'budget':
        return `${item.data.category} - $${item.data.amount.toFixed(2)}`;
      case 'account':
        return `${item.data.name} - $${item.data.balance.toFixed(2)}`;
      case 'template':
        return `${item.data.name} - $${item.data.amount.toFixed(2)}`;
      default:
        return 'Unknown item';
    }
  }, []);

  const getItemTypeLabel = useCallback((type: string) => {
    switch (type) {
      case 'transaction':
        return 'Transaction';
      case 'category':
        return 'Category';
      case 'budget':
        return 'Budget';
      case 'account':
        return 'Account';
      case 'template':
        return 'Template';
      default:
        return 'Unknown';
    }
  }, []);

  const getItemsByType = useCallback((type: string) => {
    return items.filter(item => item.type === type);
  }, [items]);

  const getItemCountByType = useCallback(() => {
    const counts = items.reduce((acc, item) => {
      acc[item.type] = (acc[item.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return counts;
  }, [items]);

  const getOldItems = useCallback((days: number) => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return items.filter(item => 
      new Date(item.deletedAt) < cutoffDate
    );
  }, [items]);

  return {
    items,
    loading,
    restoreItem,
    permanentDeleteItem,
    emptyRecycleBin,
    getItemDescription,
    getItemTypeLabel,
    getItemsByType,
    getItemCountByType,
    getOldItems,
    refreshItems: loadItems,
  };
}
