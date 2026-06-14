/**
 * Advanced memoization utilities for expensive calculations
 */

import { useCallback, useMemo, useRef, useEffect } from 'react';

// LRU Cache implementation
class LRUCache<K, V> {
  private cache = new Map<K, { value: V; timestamp: number }>();
  private maxSize: number;
  private ttl: number; // Time to live in milliseconds

  constructor(maxSize: number = 100, ttl: number = 5 * 60 * 1000) { // 5 minutes default
    this.maxSize = maxSize;
    this.ttl = ttl;
  }

  get(key: K): V | undefined {
    const item = this.cache.get(key);
    if (!item) return undefined;

    // Check if item has expired
    if (Date.now() - item.timestamp > this.ttl) {
      this.cache.delete(key);
      return undefined;
    }

    // Move to end (most recently used)
    this.cache.delete(key);
    this.cache.set(key, item);
    return item.value;
  }

  set(key: K, value: V): void {
    // Remove oldest if at capacity
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(key, { value, timestamp: Date.now() });
  }

  has(key: K): boolean {
    const item = this.cache.get(key);
    if (!item) return false;
    
    // Check expiration
    if (Date.now() - item.timestamp > this.ttl) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

// Global memoization cache
const globalCache = new LRUCache<string, any>(1000, 10 * 60 * 1000); // 10 minutes

// Memoize expensive functions
export function memoize<T extends (...args: any[]) => any>(
  fn: T,
  getKey?: (...args: Parameters<T>) => string
): T {
  return ((...args: Parameters<T>) => {
    const key = getKey ? getKey(...args) : JSON.stringify(args);
    
    const cached = globalCache.get(key);
    if (cached !== undefined) {
      return cached;
    }
    
    const result = fn(...args);
    globalCache.set(key, result);
    return result;
  }) as T;
}

// React hook for memoized calculations
export function useMemoized<T extends (...args: any[]) => any>(
  fn: T,
  deps: any[],
  getKey?: (...args: Parameters<T>) => string
): T {
  const memoizedFn = useMemo(() => memoize(fn, getKey), [fn, getKey]);
  
  return useCallback(memoizedFn, deps) as T;
}

// Memoize async functions
export function memoizeAsync<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  getKey?: (...args: Parameters<T>) => string
): T {
  const pendingPromises = new Map<string, Promise<any>>();

  return (async (...args: Parameters<T>) => {
    const key = getKey ? getKey(...args) : JSON.stringify(args);
    
    // Check cache first
    const cached = globalCache.get(key);
    if (cached !== undefined) {
      return cached;
    }
    
    // Check if already pending
    const pending = pendingPromises.get(key);
    if (pending) {
      return pending;
    }
    
    // Execute and cache
    const promise = fn(...args);
    pendingPromises.set(key, promise);
    
    try {
      const result = await promise;
      globalCache.set(key, result);
      return result;
    } finally {
      pendingPromises.delete(key);
    }
  }) as T;
}

// Specialized memoization for financial calculations
export class FinancialCalculator {
  private static cache = new LRUCache<string, number>(500, 15 * 60 * 1000); // 15 minutes

  // Memoized currency conversion
  static convertCurrency(amount: number, fromCurrency: string, toCurrency: string, rate: number): number {
    const key = `convert_${amount}_${fromCurrency}_${toCurrency}_${rate}`;
    
    const cached = this.cache.get(key);
    if (cached !== undefined) {
      return cached;
    }
    
    const result = amount * rate;
    this.cache.set(key, result);
    return result;
  }

  // Memoized transaction filtering
  static filterTransactions(transactions: any[], filters: any): any[] {
    const key = `filter_${JSON.stringify(filters)}_${transactions.length}`;
    
    const cached = this.cache.get(key);
    if (cached !== undefined) {
      return cached;
    }
    
    const result = transactions.filter(transaction => {
      // Apply filters...
      if (filters.category && transaction.category !== filters.category) return false;
      if (filters.dateRange) {
        const transactionDate = new Date(transaction.date);
        if (transactionDate < filters.dateRange.start || transactionDate > filters.dateRange.end) {
          return false;
        }
      }
      if (filters.minAmount !== undefined && Math.abs(transaction.amount) < filters.minAmount) return false;
      if (filters.maxAmount !== undefined && Math.abs(transaction.amount) > filters.maxAmount) return false;
      
      return true;
    });
    
    this.cache.set(key, result);
    return result;
  }

  // Memoized budget calculations
  static calculateBudgetSpent(transactions: any[], budgetCategory: string, startDate: Date, endDate: Date): number {
    const key = `budget_${budgetCategory}_${startDate.getTime()}_${endDate.getTime()}`;
    
    const cached = this.cache.get(key);
    if (cached !== undefined) {
      return cached;
    }
    
    const result = transactions
      .filter(t => 
        t.category === budgetCategory && 
        new Date(t.date) >= startDate && 
        new Date(t.date) <= endDate &&
        t.amount < 0 // Expenses only
      )
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    
    this.cache.set(key, result);
    return result;
  }

  // Memoized statistics calculations
  static calculateStats(transactions: any[]): {
    totalIncome: number;
    totalExpenses: number;
    netIncome: number;
    transactionCount: number;
    averageTransaction: number;
  } {
    const key = `stats_${transactions.length}_${transactions.map(t => t.amount).join('_')}`;
    
    const cached = this.cache.get(key);
    if (cached !== undefined) {
      return cached;
    }
    
    let totalIncome = 0;
    let totalExpenses = 0;
    let transactionCount = transactions.length;
    
    transactions.forEach(transaction => {
      const amount = parseFloat(transaction.amount) || 0;
      if (amount > 0) {
        totalIncome += amount;
      } else {
        totalExpenses += Math.abs(amount);
      }
    });
    
    const result = {
      totalIncome,
      totalExpenses,
      netIncome: totalIncome - totalExpenses,
      transactionCount,
      averageTransaction: transactionCount > 0 ? (totalIncome + totalExpenses) / transactionCount : 0
    };
    
    this.cache.set(key, result);
    return result;
  }

  static clearCache(): void {
    this.cache.clear();
  }
}

// React hook for financial calculations
export function useFinancialCalculator() {
  const calculateStats = useCallback((transactions: any[]) => {
    return FinancialCalculator.calculateStats(transactions);
  }, []);

  const filterTransactions = useCallback((transactions: any[], filters: any) => {
    return FinancialCalculator.filterTransactions(transactions, filters);
  }, []);

  const calculateBudgetSpent = useCallback((
    transactions: any[], 
    budgetCategory: string, 
    startDate: Date, 
    endDate: Date
  ) => {
    return FinancialCalculator.calculateBudgetSpent(transactions, budgetCategory, startDate, endDate);
  }, []);

  return {
    calculateStats,
    filterTransactions,
    calculateBudgetSpent,
    clearCache: () => FinancialCalculator.clearCache()
  };
}

// Deep comparison utility for memoization
export function deepEqual(a: any, b: any): boolean {
  if (a === b) return true;
  
  if (a == null || b == null) return false;
  
  if (typeof a !== typeof b) return false;
  
  if (typeof a === 'object') {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    
    if (keysA.length !== keysB.length) return false;
    
    for (const key of keysA) {
      if (!keysB.includes(key) || !deepEqual(a[key], b[key])) {
        return false;
      }
    }
    
    return true;
  }
  
  return false;
}

// Memoized selector for complex state
export function createSelector<T, R>(
  dependencies: (() => T)[],
  selector: (state: T) => R
): () => R {
  let cachedState: T | undefined;
  let cachedResult: R | undefined;
  
  return () => {
    const currentState = dependencies[0]();
    
    if (cachedState === undefined || !deepEqual(currentState, cachedState)) {
      cachedState = currentState;
      cachedResult = selector(currentState);
    }
    
    return cachedResult!;
  };
}

// React hook for memoized selectors
export function useMemoSelector<T, R>(
  selector: (state: T) => R,
  dependencies: any[]
): R {
  return useMemo(() => selector(dependencies[0]), dependencies);
}

// Performance monitoring for memoization
export class MemoizationMonitor {
  private static hits = 0;
  private static misses = 0;
  private static operations = new Map<string, { hits: number; misses: number }>();

  static recordHit(key: string): void {
    this.hits++;
    const op = this.operations.get(key) || { hits: 0, misses: 0 };
    op.hits++;
    this.operations.set(key, op);
  }

  static recordMiss(key: string): void {
    this.misses++;
    const op = this.operations.get(key) || { hits: 0, misses: 0 };
    op.misses++;
    this.operations.set(key, op);
  }

  static getStats(): {
    totalHits: number;
    totalMisses: number;
    hitRate: number;
    operations: Record<string, { hits: number; misses: number; hitRate: number }>;
  } {
    const total = this.hits + this.misses;
    const hitRate = total > 0 ? (this.hits / total) * 100 : 0;
    
    const operations: Record<string, { hits: number; misses: number; hitRate: number }> = {};
    this.operations.forEach((stats, key) => {
      const opTotal = stats.hits + stats.misses;
      operations[key] = {
        ...stats,
        hitRate: opTotal > 0 ? (stats.hits / opTotal) * 100 : 0
      };
    });
    
    return {
      totalHits: this.hits,
      totalMisses: this.misses,
      hitRate,
      operations
    };
  }

  static reset(): void {
    this.hits = 0;
    this.misses = 0;
    this.operations.clear();
  }
}

// Enhanced memoization with monitoring
export function memoizeWithTracking<T extends (...args: any[]) => any>(
  fn: T,
  options: {
    getKey?: (...args: Parameters<T>) => string;
    maxSize?: number;
    ttl?: number;
    enableTracking?: boolean;
  } = {}
): T {
  const cache = new LRUCache<string, any>(options.maxSize || 100, options.ttl || 5 * 60 * 1000);
  const keyPrefix = fn.name || 'anonymous';
  
  return ((...args: Parameters<T>) => {
    const key = options.getKey ? options.getKey(...args) : `${keyPrefix}_${JSON.stringify(args)}`;
    
    if (cache.has(key)) {
      if (options.enableTracking) {
        MemoizationMonitor.recordHit(key);
      }
      return cache.get(key);
    }
    
    if (options.enableTracking) {
      MemoizationMonitor.recordMiss(key);
    }
    
    const result = fn(...args);
    cache.set(key, result);
    return result;
  }) as T;
}

// React hook for performance monitoring
export function useMemoizationMonitor() {
  const [stats, setStats] = useState(() => MemoizationMonitor.getStats());
  
  useEffect(() => {
    const interval = setInterval(() => {
      setStats(MemoizationMonitor.getStats());
    }, 5000); // Update every 5 seconds
    
    return () => clearInterval(interval);
  }, []);
  
  return {
    stats,
    reset: () => {
      MemoizationMonitor.reset();
      setStats(MemoizationMonitor.getStats());
    }
  };
}
