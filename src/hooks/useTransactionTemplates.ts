import { useState, useEffect, useCallback } from 'react';
import { TransactionTemplate, Transaction } from '@/lib/types';
import { db } from '@/lib/db';

export function useTransactionTemplates() {
  const [templates, setTemplates] = useState<TransactionTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTemplates = useCallback(() => {
    setLoading(true);
    try {
      const data = db.getTemplates();
      // Sort by usage count and last used
      const sortedTemplates = data.sort((a, b) => {
        if (a.isQuickAdd && !b.isQuickAdd) return -1;
        if (!a.isQuickAdd && b.isQuickAdd) return 1;
        if (a.lastUsed && b.lastUsed) {
          return new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime();
        }
        return b.usageCount - a.usageCount;
      });
      setTemplates(sortedTemplates);
    } catch (error) {
      console.error('Error loading templates:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTemplates();

    const handleStorageChange = () => {
      loadTemplates();
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [loadTemplates]);

  const addTemplate = useCallback((template: Omit<TransactionTemplate, 'id' | 'usageCount'>) => {
    try {
      const newTemplate = db.addTemplate(template);
      setTemplates(prev => [...prev, newTemplate]);
      return newTemplate;
    } catch (error) {
      console.error('Error adding template:', error);
      throw error;
    }
  }, []);

  const updateTemplate = useCallback((id: string, updates: Partial<TransactionTemplate>) => {
    try {
      const updated = db.updateTemplate(id, updates);
      if (updated) {
        setTemplates(prev => 
          prev.map(t => t.id === id ? updated : t)
        );
      }
      return updated;
    } catch (error) {
      console.error('Error updating template:', error);
      throw error;
    }
  }, []);

  const deleteTemplate = useCallback((id: string) => {
    try {
      const success = db.deleteTemplate(id);
      if (success) {
        setTemplates(prev => prev.filter(t => t.id !== id));
      }
      return success;
    } catch (error) {
      console.error('Error deleting template:', error);
      throw error;
    }
  }, []);

  const useTemplate = useCallback((template: TransactionTemplate): Omit<Transaction, 'id'> => {
    // Increment usage count
    console.log(`Using template: ${template.name} (usage count: ${template.usageCount + 1})`);
    updateTemplate(template.id, { 
      usageCount: template.usageCount + 1,
      lastUsed: new Date().toISOString()
    });

    // Return transaction data from template
    return {
      amount: template.amount,
      type: template.type,
      category: template.category,
      date: new Date().toISOString().split('T')[0],
      description: template.name,
      account: template.account,
      tags: template.tags,
      splits: template.splits,
    };
  }, [updateTemplate]);

  const getQuickAddTemplates = useCallback(() => {
    return templates.filter(t => t.isQuickAdd);
  }, [templates]);

  const getMostUsedTemplates = useCallback((limit = 5) => {
    return templates
      .filter(t => !t.isQuickAdd)
      .slice(0, limit);
  }, [templates]);

  const createTemplateFromTransaction = useCallback((transaction: Transaction, name: string) => {
    const template: Omit<TransactionTemplate, 'id' | 'usageCount'> = {
      name,
      description: transaction.description,
      amount: transaction.amount,
      type: transaction.type,
      category: transaction.category,
      account: transaction.account,
      tags: transaction.tags,
      splits: transaction.splits,
      isQuickAdd: false,
      icon: getCategoryIcon(transaction.category),
      color: getCategoryColor(transaction.category),
    };

    return addTemplate(template);
  }, [addTemplate]);

  return {
    templates,
    loading,
    addTemplate,
    updateTemplate,
    deleteTemplate,
    useTemplate,
    getQuickAddTemplates,
    getMostUsedTemplates,
    createTemplateFromTransaction,
    refreshTemplates: loadTemplates,
  };
}

// Helper functions (you may want to move these to a utils file)
function getCategoryIcon(category: string): string {
  const iconMap: Record<string, string> = {
    'Salary': '💰',
    'Freelance': '💼',
    'Investments': '📈',
    'Food': '🍔',
    'Transport': '🚗',
    'Shopping': '🛍️',
    'Entertainment': '🎮',
    'Bills': '📄',
    'Healthcare': '🏥',
    'Education': '📚',
  };
  return iconMap[category] || '📌';
}

function getCategoryColor(category: string): string {
  const colorMap: Record<string, string> = {
    'Salary': '#10b981',
    'Freelance': '#3b82f6',
    'Investments': '#8b5cf6',
    'Food': '#ef4444',
    'Transport': '#f59e0b',
    'Shopping': '#ec4899',
    'Entertainment': '#8b5cf6',
    'Bills': '#6366f1',
    'Healthcare': '#14b8a6',
    'Education': '#84cc16',
  };
  return colorMap[category] || '#64748b';
}
