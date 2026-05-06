'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Account } from '@/lib/types';
import { useCurrency } from '@/contexts/CurrencyContext';
import { Edit, Trash2, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface AccountCardProps {
  account: Account;
  recentTransactions?: number;
  onEdit: () => void;
  onDelete: () => void;
  onViewTransactions: () => void;
  onViewDetails: () => void;
}


const accountTypeLabels = {
  cash: 'Cash',
  bank: 'Bank Account',
  credit: 'Credit Card',
  mobile: 'Mobile Wallet',
};

export function AccountCard({ 
  account, 
  recentTransactions = 0,
  onEdit, 
  onDelete,
  onViewTransactions,
  onViewDetails,
}: AccountCardProps) {
  const { formatCurrency } = useCurrency();
  
  // Validate account data
  if (!account) {
    console.warn('Invalid account data provided to AccountCard');
    return null;
  }

  const isCredit = account.type === 'credit';
  const isPositive = typeof account.balance === 'number' && account.balance > 0;
  const isZero = typeof account.balance === 'number' && account.balance === 0;

  const getBalanceColor = () => {
    if (isCredit) {
      return isPositive ? 'text-red-600' : 'text-green-600';
    }
    return isPositive ? 'text-green-600' : isZero ? 'text-muted-foreground' : 'text-red-600';
  };

  const getBalanceIcon = () => {
    if (isCredit) {
      return isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />;
    }
    return isPositive ? <TrendingUp className="h-3 w-3" /> : isZero ? <Minus className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />;
  };

  const getBalanceText = () => {
    if (isCredit) {
      return isPositive ? 'Debt' : 'Credit';
    }
    return isPositive ? 'Balance' : isZero ? 'Empty' : 'Overdrawn';
  };

  return (
    <Card className="relative">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div>
              <CardTitle className="text-lg">{account.name}</CardTitle>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>{accountTypeLabels[account.type]}</span>
                <Badge variant="outline" className="text-xs">
                  {account.currency}
                </Badge>
              </div>
            </div>
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={onViewTransactions}
              className="h-8 w-8 p-0"
              title="View transactions"
            >
              <TrendingUp className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onEdit}
              className="h-8 w-8 p-0"
            >
              <Edit className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onDelete}
              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              {getBalanceIcon()}
              {getBalanceText()}
            </span>
            <span className={`text-2xl font-bold ${getBalanceColor()}`}>
              {isCredit && isPositive ? '-' : ''}
              {formatCurrency(Math.abs(typeof account.balance === 'number' ? account.balance : 0))}
            </span>
          </div>
          
          {recentTransactions > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Recent Activity</span>
              <span className="font-medium">{recentTransactions} transactions</span>
            </div>
          )}
        </div>

        {isCredit && isPositive && (
          <div className="flex items-center gap-2 text-sm text-orange-600 bg-orange-50 dark:bg-orange-950/20 p-2 rounded">
            <TrendingUp className="h-4 w-4" />
            <span>Credit card debt of {formatCurrency(typeof account.balance === 'number' ? account.balance : 0)}</span>
          </div>
        )}

        {!isCredit && typeof account.balance === 'number' && account.balance < 0 && (
          <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 dark:bg-red-950/20 p-2 rounded">
            <TrendingDown className="h-4 w-4" />
            <span>Account overdrawn by {formatCurrency(Math.abs(account.balance))}</span>
          </div>
        )}

        {!isCredit && typeof account.balance === 'number' && account.balance > 0 && account.balance < 100 && (
          <div className="flex items-center gap-2 text-sm text-yellow-600 bg-yellow-50 dark:bg-yellow-950/20 p-2 rounded">
            <Minus className="h-4 w-4" />
            <span>Low balance warning</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
