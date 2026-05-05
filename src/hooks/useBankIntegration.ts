import { useState, useEffect, useCallback } from 'react';
import { 
  BankAccount, 
  BankTransaction, 
  BankSync, 
  ImportRule, 
  ReconciliationReport,
  BankFeed 
} from '@/lib/types';
import { bankIntegrationService } from '@/services/bankIntegration';

export function useBankIntegration() {
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [bankTransactions, setBankTransactions] = useState<BankTransaction[]>([]);
  const [syncs, setSyncs] = useState<BankSync[]>([]);
  const [importRules, setImportRules] = useState<ImportRule[]>([]);
  const [reconciliationReports, setReconciliationReports] = useState<ReconciliationReport[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(() => {
    setLoading(true);
    try {
      setBankAccounts(bankIntegrationService.getBankAccounts());
      setBankTransactions(bankIntegrationService.getBankTransactions());
      setSyncs(bankIntegrationService.getBankSyncs());
      setImportRules(bankIntegrationService.getImportRules());
      setReconciliationReports(bankIntegrationService.getReconciliationReports());
    } catch (error) {
      console.error('Error loading bank integration data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();

    const handleStorageChange = () => {
      loadData();
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [loadData]);

  // Bank Account Management
  const linkBankAccount = useCallback(async (bankAccount: Omit<BankAccount, 'id'>) => {
    try {
      const newAccount = await bankIntegrationService.linkBankAccount(bankAccount);
      setBankAccounts(prev => [...prev, newAccount]);
      return newAccount;
    } catch (error) {
      console.error('Error linking bank account:', error);
      throw error;
    }
  }, []);

  const unlinkBankAccount = useCallback(async (bankAccountId: string) => {
    try {
      const success = await bankIntegrationService.unlinkBankAccount(bankAccountId);
      if (success) {
        setBankAccounts(prev => prev.filter(account => account.id !== bankAccountId));
      }
      return success;
    } catch (error) {
      console.error('Error unlinking bank account:', error);
      throw error;
    }
  }, []);

  const updateBankAccount = useCallback(async (id: string, updates: Partial<BankAccount>) => {
    try {
      const updatedAccount = await bankIntegrationService.updateBankAccount(id, updates);
      if (updatedAccount) {
        setBankAccounts(prev => prev.map(account => 
          account.id === id ? updatedAccount : account
        ));
      }
      return updatedAccount;
    } catch (error) {
      console.error('Error updating bank account:', error);
      throw error;
    }
  }, []);

  // Transaction Sync
  const syncBankTransactions = useCallback(async (bankAccountId: string) => {
    try {
      const sync = await bankIntegrationService.syncBankTransactions(bankAccountId);
      setSyncs(prev => [...prev, sync]);
      
      // Reload data after sync
      setTimeout(() => {
        loadData();
      }, 1000);
      
      return sync;
    } catch (error) {
      console.error('Error syncing bank transactions:', error);
      throw error;
    }
  }, [loadData]);

  // Import Rules Management
  const createImportRule = useCallback(async (rule: Omit<ImportRule, 'id'>) => {
    try {
      const newRule = await bankIntegrationService.createImportRule(rule);
      setImportRules(prev => [...prev, newRule]);
      return newRule;
    } catch (error) {
      console.error('Error creating import rule:', error);
      throw error;
    }
  }, []);

  // Reconciliation
  const generateReconciliationReport = useCallback(async (bankAccountId: string, period: string) => {
    try {
      const report = await bankIntegrationService.generateReconciliationReport(bankAccountId, period);
      setReconciliationReports(prev => [...prev, report]);
      return report;
    } catch (error) {
      console.error('Error generating reconciliation report:', error);
      throw error;
    }
  }, []);

  // CSV Import
  const importFromCSV = useCallback(async (file: File, bankAccountId: string) => {
    try {
      const sync = await bankIntegrationService.importFromCSV(file, bankAccountId);
      setSyncs(prev => [...prev, sync]);
      
      // Reload data after import
      setTimeout(() => {
        loadData();
      }, 1000);
      
      return sync;
    } catch (error) {
      console.error('Error importing from CSV:', error);
      throw error;
    }
  }, [loadData]);

  // Get bank transactions for specific account
  const getBankTransactions = useCallback((bankAccountId?: string) => {
    if (bankAccountId) {
      return bankTransactions.filter(t => t.bankAccountId === bankAccountId);
    }
    return bankTransactions;
  }, [bankTransactions]);

  // Get syncs for specific account
  const getSyncs = useCallback((bankAccountId?: string) => {
    if (bankAccountId) {
      return syncs.filter(s => s.bankAccountId === bankAccountId);
    }
    return syncs;
  }, [syncs]);

  // Get reconciliation reports for specific account
  const getReconciliationReports = useCallback((bankAccountId?: string) => {
    if (bankAccountId) {
      return reconciliationReports.filter(r => r.bankAccountId === bankAccountId);
    }
    return reconciliationReports;
  }, [reconciliationReports]);

  // Bank Feed Status
  const getBankFeedStatus = useCallback((): BankFeed => {
    const activeAccounts = bankAccounts.filter(account => account.isActive);
    const totalAccounts = bankAccounts.length;
    const totalTransactions = bankTransactions.length;
    const errorCount = bankAccounts.filter(account => account.syncStatus === 'error').length;
    const lastSync = bankAccounts
      .filter(account => account.lastSync)
      .map(account => account.lastSync)
      .sort()
      .pop() || '';

    const nextSync = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    return {
      id: 'main-feed',
      provider: 'plaid',
      status: errorCount > 0 ? 'error' : activeAccounts.length > 0 ? 'active' : 'inactive',
      lastSync,
      nextSync,
      totalAccounts,
      totalTransactions,
      errorCount,
      settings: {
        autoCategorization: true,
        duplicateDetection: true,
        reconciliationEnabled: true
      }
    };
  }, [bankAccounts, bankTransactions]);

  return {
    // Data
    bankAccounts,
    bankTransactions,
    syncs,
    importRules,
    reconciliationReports,
    loading,
    bankFeedStatus: getBankFeedStatus(),

    // Bank Account Management
    linkBankAccount,
    unlinkBankAccount,
    updateBankAccount,

    // Transaction Sync
    syncBankTransactions,

    // Import Rules
    createImportRule,

    // Reconciliation
    generateReconciliationReport,

    // CSV Import
    importFromCSV,

    // Getters
    getBankTransactions,
    getSyncs,
    getReconciliationReports,

    // Refresh
    refresh: loadData
  };
}
