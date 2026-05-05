export type Transaction = {
  id: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  date: string; // ISO date
  description: string;
  account?: string;
  tags?: string[];
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
  period: 'monthly';
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
};
