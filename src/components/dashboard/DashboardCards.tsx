'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, DollarSign, Wallet } from 'lucide-react';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useTheme } from '@/contexts/ThemeContext';

interface DashboardCardsProps {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  netWorth: number;
}

export function DashboardCards({
  totalBalance,
  monthlyIncome,
  monthlyExpenses,
  netWorth,
}: DashboardCardsProps) {
  const { formatCurrency } = useCurrency();
  const { resolvedTheme } = useTheme();
  // Validate numeric values
  const safeTotalBalance = typeof totalBalance === 'number' && !isNaN(totalBalance) ? totalBalance : 0;
  const safeMonthlyIncome = typeof monthlyIncome === 'number' && !isNaN(monthlyIncome) ? monthlyIncome : 0;
  const safeMonthlyExpenses = typeof monthlyExpenses === 'number' && !isNaN(monthlyExpenses) ? monthlyExpenses : 0;
  const safeNetWorth = typeof netWorth === 'number' && !isNaN(netWorth) ? netWorth : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 w-full">
      <Card className="hover:shadow-lg transition-all duration-200 hover:scale-[1.02] hover:border-primary/20 min-h-[120px] rounded-none">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
          <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="text-2xl font-bold truncate">{formatCurrency(safeTotalBalance)}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Across all accounts
          </p>
        </CardContent>
      </Card>

      <Card className="hover:shadow-lg transition-all duration-200 hover:scale-[1.02] hover:border-success/20 min-h-[120px] rounded-none">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
          <CardTitle className="text-sm font-medium">Monthly Income</CardTitle>
          <TrendingUp className="h-4 w-4 text-success" />
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="text-2xl font-bold text-success truncate">+{formatCurrency(safeMonthlyIncome)}</div>
          <p className="text-xs text-muted-foreground mt-1">
            This month
          </p>
        </CardContent>
      </Card>

      <Card className="hover:shadow-lg transition-all duration-200 hover:scale-[1.02] hover:border-destructive/20 min-h-[120px] rounded-none">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
          <CardTitle className="text-sm font-medium">Monthly Expenses</CardTitle>
          <TrendingDown className="h-4 w-4 text-destructive" />
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="text-2xl font-bold text-destructive truncate">-{formatCurrency(safeMonthlyExpenses)}</div>
          <p className="text-xs text-muted-foreground mt-1">
            This month
          </p>
        </CardContent>
      </Card>

      <Card className="hover:shadow-lg transition-all duration-200 hover:scale-[1.02] hover:border-primary/20 min-h-[120px] rounded-none">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
          <CardTitle className="text-sm font-medium">Net Worth</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className={`text-2xl font-bold truncate ${safeNetWorth >= 0 ? 'text-success' : 'text-destructive'}`}>
            {formatCurrency(safeNetWorth)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Total assets minus liabilities
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
