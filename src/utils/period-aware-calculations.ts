import { Budget, Transaction } from '@/lib/types';

export function getPeriodStartEnd(budget: Budget, referenceDate: Date = new Date()) {
  const { period, startDate, endDate } = budget;
  
  // Validate budget structure
  if (!budget || !period) {
    console.warn('Invalid budget structure:', budget);
    // Default to current month
    const now = new Date(referenceDate);
    return {
      start: new Date(now.getFullYear(), now.getMonth(), 1),
      end: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
    };
  }
  
  if (period === 'custom' && startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Validate custom dates
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      console.warn('Invalid custom dates:', { startDate, endDate });
      // Fallback to current month
      const now = new Date(referenceDate);
      return {
        start: new Date(now.getFullYear(), now.getMonth(), 1),
        end: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
      };
    }
    
    return { start, end };
  }

  const now = new Date(referenceDate);
  let start: Date;
  let end: Date;

  switch (period) {
    case 'weekly':
      // Get start of current week (Sunday)
      start = new Date(now);
      start.setDate(now.getDate() - now.getDay());
      start.setHours(0, 0, 0, 0);
      
      // Get end of current week (Saturday)
      end = new Date(start);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
      break;

    case 'biweekly':
      // For simplicity, use 1st and 15th of the month as biweekly periods
      if (now.getDate() <= 15) {
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date(now.getFullYear(), now.getMonth(), 15, 23, 59, 59, 999);
      } else {
        start = new Date(now.getFullYear(), now.getMonth(), 16);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      }
      break;

    case 'monthly':
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      break;

    case 'quarterly':
      const quarterStart = Math.floor(now.getMonth() / 3) * 3;
      start = new Date(now.getFullYear(), quarterStart, 1);
      end = new Date(now.getFullYear(), quarterStart + 3, 0, 23, 59, 59, 999);
      break;

    case 'yearly':
      start = new Date(now.getFullYear(), 0, 1);
      end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
      break;

    default:
      // Default to monthly if period is unrecognized
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      break;
  }

  return { start, end };
}

export function calculatePeriodSpending(budget: Budget, transactions: Transaction[]): number {
  // Validate inputs
  if (!budget || !Array.isArray(transactions)) {
    console.warn('Invalid inputs for calculatePeriodSpending:', { budget, transactions });
    return 0;
  }
  
  const { start, end } = getPeriodStartEnd(budget);
  
  return transactions
    .filter(t => 
      t && 
      t.type === 'expense' && 
      t.category === budget.category &&
      !t.deletedAt &&
      t.date &&
      typeof t.amount === 'number' && t.amount >= 0
    )
    .filter(t => {
      const transactionDate = new Date(t.date);
      // Validate transaction date
      if (isNaN(transactionDate.getTime())) {
        console.warn('Invalid transaction date:', t.date);
        return false;
      }
      return transactionDate >= start && transactionDate <= end;
    })
    .reduce((sum, t) => sum + t.amount, 0);
}

export function getPeriodDisplayText(budget: Budget): string {
  const periodLabels = {
    weekly: 'Weekly',
    biweekly: 'Bi-weekly',
    monthly: 'Monthly',
    quarterly: 'Quarterly',
    yearly: 'Yearly',
    custom: 'Custom'
  };
  
  const baseLabel = periodLabels[budget.period] || budget.period;
  
  if (budget.period === 'custom' && budget.startDate && budget.endDate) {
    const start = new Date(budget.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const end = new Date(budget.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return `${baseLabel}: ${start} - ${end}`;
  }
  
  return baseLabel;
}

export function getPeriodProgress(budget: Budget): number {
  const { start, end } = getPeriodStartEnd(budget);
  const now = new Date();
  
  if (now < start) return 0;
  if (now > end) return 100;
  
  const totalDuration = end.getTime() - start.getTime();
  const elapsedDuration = now.getTime() - start.getTime();
  
  return Math.min(100, Math.max(0, (elapsedDuration / totalDuration) * 100));
}
