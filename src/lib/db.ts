import { Transaction, Category, Budget, Account } from './types';
import { 
  transactionSchema, 
  categorySchema, 
  budgetSchema, 
  accountSchema 
} from './schema';

const STORAGE_KEYS = {
  TRANSACTIONS: 'finance-tracker-transactions',
  CATEGORIES: 'finance-tracker-categories',
  BUDGETS: 'finance-tracker-budgets',
  ACCOUNTS: 'finance-tracker-accounts',
} as const;

class LocalStorageDB {
  private broadcastChannel: BroadcastChannel;

  constructor() {
    this.broadcastChannel = new BroadcastChannel('finance-tracker-db');
    this.broadcastChannel.onmessage = this.handleBroadcastMessage.bind(this);
  }

  private handleBroadcastMessage(event: MessageEvent) {
    // Force re-render in other tabs when data changes
    window.dispatchEvent(new Event('storage'));
  }

  private broadcastChange() {
    this.broadcastChannel.postMessage({ type: 'data-changed' });
  }

  // Transactions
  getTransactions(): Transaction[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
      if (!data) return [];
      
      const transactions = JSON.parse(data);
      return transactions.filter((t: any) => transactionSchema.safeParse(t).success);
    } catch (error) {
      console.error('Error reading transactions:', error);
      return [];
    }
  }

  addTransaction(transaction: Omit<Transaction, 'id'>): Transaction {
    const newTransaction: Transaction = {
      ...transaction,
      id: crypto.randomUUID(),
    };

    const transactions = this.getTransactions();
    transactions.push(newTransaction);
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
    this.broadcastChange();
    
    return newTransaction;
  }

  updateTransaction(id: string, updates: Partial<Transaction>): Transaction | null {
    const transactions = this.getTransactions();
    const index = transactions.findIndex(t => t.id === id);
    
    if (index === -1) return null;

    const updatedTransaction = { ...transactions[index], ...updates };
    const validated = transactionSchema.safeParse(updatedTransaction);
    
    if (!validated.success) return null;

    transactions[index] = validated.data;
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
    this.broadcastChange();
    
    return validated.data;
  }

  deleteTransaction(id: string): boolean {
    const transactions = this.getTransactions();
    const filteredTransactions = transactions.filter(t => t.id !== id);
    
    if (filteredTransactions.length === transactions.length) return false;

    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(filteredTransactions));
    this.broadcastChange();
    
    return true;
  }

  // Query helpers for transactions
  getTransactionsByMonth(year: number, month: number): Transaction[] {
    const transactions = this.getTransactions();
    return transactions.filter(transaction => {
      const transactionDate = new Date(transaction.date);
      return transactionDate.getFullYear() === year && transactionDate.getMonth() === month;
    });
  }

  getTransactionsByCategory(category: string): Transaction[] {
    const transactions = this.getTransactions();
    return transactions.filter(t => t.category === category);
  }

  getTransactionsByDateRange(startDate: Date, endDate: Date): Transaction[] {
    const transactions = this.getTransactions();
    return transactions.filter(transaction => {
      const transactionDate = new Date(transaction.date);
      return transactionDate >= startDate && transactionDate <= endDate;
    });
  }

  // Categories
  getCategories(): Category[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
      if (!data) return this.getDefaultCategories();
      
      const categories = JSON.parse(data);
      return categories.filter((c: any) => categorySchema.safeParse(c).success);
    } catch (error) {
      console.error('Error reading categories:', error);
      return this.getDefaultCategories();
    }
  }

  private getDefaultCategories(): Category[] {
    const defaultCategories: Omit<Category, 'id'>[] = [
      // Income categories
      { name: 'Salary', color: '#10b981', icon: '💰', type: 'income' },
      { name: 'Freelance', color: '#3b82f6', icon: '💼', type: 'income' },
      { name: 'Investments', color: '#8b5cf6', icon: '📈', type: 'income' },
      { name: 'Other Income', color: '#06b6d4', icon: '💵', type: 'income' },
      
      // Expense categories
      { name: 'Food', color: '#ef4444', icon: '🍔', type: 'expense' },
      { name: 'Transport', color: '#f59e0b', icon: '🚗', type: 'expense' },
      { name: 'Shopping', color: '#ec4899', icon: '🛍️', type: 'expense' },
      { name: 'Entertainment', color: '#8b5cf6', icon: '🎮', type: 'expense' },
      { name: 'Bills', color: '#6366f1', icon: '📄', type: 'expense' },
      { name: 'Healthcare', color: '#14b8a6', icon: '🏥', type: 'expense' },
      { name: 'Education', color: '#84cc16', icon: '📚', type: 'expense' },
      { name: 'Other', color: '#64748b', icon: '📌', type: 'expense' },
    ];

    const categoriesWithId = defaultCategories.map(cat => ({
      ...cat,
      id: crypto.randomUUID(),
    }));

    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categoriesWithId));
    return categoriesWithId;
  }

  addCategory(category: Omit<Category, 'id'>): Category {
    const newCategory: Category = {
      ...category,
      id: crypto.randomUUID(),
    };

    const categories = this.getCategories();
    categories.push(newCategory);
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
    this.broadcastChange();
    
    return newCategory;
  }

  updateCategory(id: string, updates: Partial<Category>): Category | null {
    const categories = this.getCategories();
    const index = categories.findIndex(c => c.id === id);
    
    if (index === -1) return null;

    const updatedCategory = { ...categories[index], ...updates };
    const validated = categorySchema.safeParse(updatedCategory);
    
    if (!validated.success) return null;

    categories[index] = validated.data;
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
    this.broadcastChange();
    
    return validated.data;
  }

  deleteCategory(id: string): boolean {
    const categories = this.getCategories();
    const filteredCategories = categories.filter(c => c.id !== id);
    
    if (filteredCategories.length === categories.length) return false;

    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(filteredCategories));
    this.broadcastChange();
    
    return true;
  }

  // Budgets
  getBudgets(): Budget[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.BUDGETS);
      if (!data) return [];
      
      const budgets = JSON.parse(data);
      return budgets.filter((b: any) => budgetSchema.safeParse(b).success);
    } catch (error) {
      console.error('Error reading budgets:', error);
      return [];
    }
  }

  addBudget(budget: Omit<Budget, 'id'>): Budget {
    const newBudget: Budget = {
      ...budget,
      id: crypto.randomUUID(),
    };

    const budgets = this.getBudgets();
    budgets.push(newBudget);
    localStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify(budgets));
    this.broadcastChange();
    
    return newBudget;
  }

  updateBudget(id: string, updates: Partial<Budget>): Budget | null {
    const budgets = this.getBudgets();
    const index = budgets.findIndex(b => b.id === id);
    
    if (index === -1) return null;

    const updatedBudget = { ...budgets[index], ...updates };
    const validated = budgetSchema.safeParse(updatedBudget);
    
    if (!validated.success) return null;

    budgets[index] = validated.data;
    localStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify(budgets));
    this.broadcastChange();
    
    return validated.data;
  }

  deleteBudget(id: string): boolean {
    const budgets = this.getBudgets();
    const filteredBudgets = budgets.filter(b => b.id !== id);
    
    if (filteredBudgets.length === budgets.length) return false;

    localStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify(filteredBudgets));
    this.broadcastChange();
    
    return true;
  }

  // Accounts
  getAccounts(): Account[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ACCOUNTS);
      if (!data) return this.getDefaultAccounts();
      
      const accounts = JSON.parse(data);
      return accounts.filter((a: any) => accountSchema.safeParse(a).success);
    } catch (error) {
      console.error('Error reading accounts:', error);
      return this.getDefaultAccounts();
    }
  }

  private getDefaultAccounts(): Account[] {
    const defaultAccounts: Omit<Account, 'id'>[] = [
      { name: 'Cash', type: 'cash', balance: 0, currency: 'USD' },
      { name: 'Main Bank Account', type: 'bank', balance: 0, currency: 'USD' },
      { name: 'Credit Card', type: 'credit', balance: 0, currency: 'USD' },
    ];

    const accountsWithId = defaultAccounts.map(account => ({
      ...account,
      id: crypto.randomUUID(),
    }));

    localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(accountsWithId));
    return accountsWithId;
  }

  addAccount(account: Omit<Account, 'id'>): Account {
    const newAccount: Account = {
      ...account,
      id: crypto.randomUUID(),
    };

    const accounts = this.getAccounts();
    accounts.push(newAccount);
    localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(accounts));
    this.broadcastChange();
    
    return newAccount;
  }

  updateAccount(id: string, updates: Partial<Account>): Account | null {
    const accounts = this.getAccounts();
    const index = accounts.findIndex(a => a.id === id);
    
    if (index === -1) return null;

    const updatedAccount = { ...accounts[index], ...updates };
    const validated = accountSchema.safeParse(updatedAccount);
    
    if (!validated.success) return null;

    accounts[index] = validated.data;
    localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(accounts));
    this.broadcastChange();
    
    return validated.data;
  }

  deleteAccount(id: string): boolean {
    const accounts = this.getAccounts();
    const filteredAccounts = accounts.filter(a => a.id !== id);
    
    if (filteredAccounts.length === accounts.length) return false;

    localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(filteredAccounts));
    this.broadcastChange();
    
    return true;
  }

  // Export/Import functionality
  exportData() {
    return {
      transactions: this.getTransactions(),
      categories: this.getCategories(),
      budgets: this.getBudgets(),
      accounts: this.getAccounts(),
      exportDate: new Date().toISOString(),
    };
  }

  importData(data: any) {
    try {
      if (data.transactions) {
        const validTransactions = data.transactions.filter((t: any) => 
          transactionSchema.safeParse(t).success
        );
        localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(validTransactions));
      }

      if (data.categories) {
        const validCategories = data.categories.filter((c: any) => 
          categorySchema.safeParse(c).success
        );
        localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(validCategories));
      }

      if (data.budgets) {
        const validBudgets = data.budgets.filter((b: any) => 
          budgetSchema.safeParse(b).success
        );
        localStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify(validBudgets));
      }

      if (data.accounts) {
        const validAccounts = data.accounts.filter((a: any) => 
          accountSchema.safeParse(a).success
        );
        localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(validAccounts));
      }

      this.broadcastChange();
      return true;
    } catch (error) {
      console.error('Error importing data:', error);
      return false;
    }
  }
}

export const db = new LocalStorageDB();
