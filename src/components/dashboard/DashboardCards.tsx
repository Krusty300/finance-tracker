'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, DollarSign, Wallet } from 'lucide-react';
import { useCurrency } from '@/contexts/CurrencyContext';

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
  // Validate numeric values
  const safeTotalBalance = typeof totalBalance === 'number' && !isNaN(totalBalance) ? totalBalance : 0;
  const safeMonthlyIncome = typeof monthlyIncome === 'number' && !isNaN(monthlyIncome) ? monthlyIncome : 0;
  const safeMonthlyExpenses = typeof monthlyExpenses === 'number' && !isNaN(monthlyExpenses) ? monthlyExpenses : 0;
  const safeNetWorth = typeof netWorth === 'number' && !isNaN(netWorth) ? netWorth : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(safeTotalBalance)}</div>
          <p className="text-xs text-muted-foreground">
            Across all accounts
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Monthly Income</CardTitle>
          <TrendingUp className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            +{formatCurrency(safeMonthlyIncome)}
          </div>
          <p className="text-xs text-muted-foreground">
            This month
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Monthly Expenses</CardTitle>
          <TrendingDown className="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">
            -{formatCurrency(safeMonthlyExpenses)}
          </div>
          <p className="text-xs text-muted-foreground">
            This month
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Net Worth</CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${safeNetWorth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(safeNetWorth)}
          </div>
          <p className="text-xs text-muted-foreground">
            Total assets minus liabilities
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
