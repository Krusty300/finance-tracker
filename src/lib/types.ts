export type TransactionSplit = {
  category: string;
  amount: number;
  description?: string;
};

export type TransactionAttachment = {
  id: string;
  name: string;
  type: 'image' | 'document' | 'note';
  url?: string;
  data?: string; // Base64 for images/documents
  content?: string; // Text content for notes
  size?: number;
  createdAt: string;
};

export type RecurringTransactionRule = {
  id: string;
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly';
  interval: number; // e.g., every 2 weeks
  endDate?: string;
  count?: number; // Number of occurrences
  nextDate: string;
  lastGenerated?: string;
};

export type TransactionTemplate = {
  id: string;
  name: string;
  description?: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  account?: string;
  tags?: string[];
  splits?: TransactionSplit[];
  isQuickAdd?: boolean;
  icon?: string;
  color?: string;
  usageCount: number;
  lastUsed?: string;
};

export type Transaction = {
  id: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  date: string; // ISO date
  description: string;
  account?: string;
  tags?: string[];
  splits?: TransactionSplit[]; // For split transactions
  attachments?: TransactionAttachment[];
  notes?: string;
  isRecurring?: boolean;
  recurringRule?: RecurringTransactionRule;
  templateId?: string;
  parentTransactionId?: string; // For split transaction children
  isSplitChild?: boolean;
  deletedAt?: string; // ISO timestamp when item was soft deleted
};

export type FinancialGoal = {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  category: 'savings' | 'debt_reduction' | 'expense_limit' | 'investment';
  priority: 'high' | 'medium' | 'low';
  createdAt: string;
};

export type RecycleBinItem = {
  id: string;
  type: 'transaction' | 'category' | 'budget' | 'account' | 'template';
  originalId: string; // Original ID before deletion
  data: any; // The original data
  deletedAt: string; // ISO timestamp
  deletedBy?: 'user' | 'system'; // Who deleted it
  reason?: string; // Optional reason for deletion
};

export type Category = {
  id: string;
  name: string;
  color: string;
  icon: string;
  type: 'income' | 'expense';
};

export type Budget = {
  id: string;
  category: string;
  amount: number;
  period: 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom';
  startDate?: string;
  endDate?: string;
};

export type Account = {
  id: string;
  name: string;
  type: 'cash' | 'bank' | 'credit' | 'mobile';
  balance: number;
  currency?: string;
};

export type DashboardStats = {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  netWorth: number;
  recentTransactions: Transaction[];
  categoryBreakdown: Array<{
    category: string;
    amount: number;
    percentage: number;
  }>;
  monthlyTrend: Array<{
    month: string;
    income: number;
    expenses: number;
  }>;
  budgetBreakdown: Array<{
    category: string;
    budget: number;
    spent: number;
    remaining: number;
    percentageUsed: number;
    status: 'on-track' | 'near-limit' | 'over-budget';
  }>;
  totalBudget: number;
  totalSpent: number;
  budgetHealth: 'healthy' | 'warning' | 'critical';
};

// Bank Integration Types
export type BankProvider = 'plaid' | 'stripe' | 'manual' | 'csv';

export type BankAccount = {
  id: string;
  provider: BankProvider;
  providerAccountId: string;
  institutionName: string;
  accountName: string;
  accountType: 'checking' | 'savings' | 'credit' | 'investment' | 'loan';
  accountNumberLast4: string;
  balance: number;
  currency: string;
  lastSync: string;
  isActive: boolean;
  syncStatus: 'connected' | 'error' | 'pending' | 'disconnected';
  autoSync: boolean;
  syncFrequency: 'daily' | 'weekly' | 'monthly';
};

export type BankTransaction = {
  id: string;
  bankAccountId: string;
  providerTransactionId: string;
  date: string;
  amount: number;
  description: string;
  category?: string;
  type: 'income' | 'expense';
  status: 'pending' | 'posted' | 'reconciled';
  merchantName?: string;
  location?: {
    city: string;
    state: string;
    country: string;
  };
  tags: string[];
  isDuplicate: boolean;
  importDate: string;
  reconciliationStatus: 'unmatched' | 'matched' | 'discrepancy';
};

export type BankSync = {
  id: string;
  bankAccountId: string;
  syncType: 'full' | 'incremental';
  startDate: string;
  endDate: string;
  transactionCount: number;
  status: 'pending' | 'running' | 'completed' | 'failed';
  errorMessage?: string;
  startedAt: string;
  completedAt?: string;
};

export type ReconciliationReport = {
  id: string;
  bankAccountId: string;
  period: string;
  bankBalance: number;
  systemBalance: number;
  difference: number;
  matchedTransactions: number;
  unmatchedTransactions: number;
  duplicateTransactions: number;
  status: 'balanced' | 'discrepancy' | 'pending';
  createdAt: string;
  resolvedAt?: string;
};

export type ImportRule = {
  id: string;
  name: string;
  description: string;
  conditions: {
    amountRange?: { min: number; max: number };
    descriptionContains?: string[];
    merchantNameContains?: string[];
    category?: string;
  };
  actions: {
    assignCategory?: string;
    assignTags?: string[];
    skipImport?: boolean;
    markAsDuplicate?: boolean;
  };
  isActive: boolean;
  priority: number;
};

export type BankFeed = {
  id: string;
  provider: BankProvider;
  status: 'active' | 'inactive' | 'error';
  lastSync: string;
  nextSync: string;
  totalAccounts: number;
  totalTransactions: number;
  errorCount: number;
  settings: {
    autoCategorization: boolean;
    duplicateDetection: boolean;
    reconciliationEnabled: boolean;
  };
};
