'use client';

import React, { memo, useMemo, useCallback, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useTheme } from 'next-themes';

// Memoized Navigation Item
interface NavigationItemProps {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | null;
  badgeVariant?: 'default' | 'secondary' | 'destructive' | 'outline';
  description?: string;
  color?: string;
  isActive?: boolean;
  isCollapsed?: boolean;
  showIcons?: boolean;
  onClick?: () => void;
}

export const NavigationItem = memo(function NavigationItem({
  name,
  href,
  icon: Icon,
  badge,
  badgeVariant = 'secondary',
  description,
  color,
  isActive = false,
  isCollapsed = false,
  showIcons = true,
  onClick,
}: NavigationItemProps) {
  const { resolvedTheme } = useTheme();
  
  const handleClick = useCallback((e: React.MouseEvent) => {
    // If onClick is provided, call it (for custom handling)
    if (onClick) {
      onClick();
      return;
    }
    // Otherwise, let the Link handle the navigation
  }, [onClick]);

  return (
    <Button
      data-onboarding={
        name === 'Dashboard' ? 'dashboard-nav' :
        name === 'Transactions' ? 'transactions-nav' :
        name === 'Budgets' ? 'budgets-nav' :
        name === 'Reports' ? 'reports-nav' :
        name === 'Notifications' ? 'notifications-nav' :
        name === 'Accounts' ? 'accounts-nav' :
        name === 'Banking' ? 'banking-nav' :
        name === 'Templates' ? 'templates-nav' :
        name === 'Recycle Bin' ? 'recycle-bin-nav' :
        name === 'Settings' ? 'settings-nav' :
        undefined
      }
      variant={isActive ? 'default' : 'ghost'}
      className={cn(
        'w-full justify-start relative transition-all duration-300 ease-out',
        'active:scale-[0.98]',
        isActive && 'bg-primary text-primary-foreground',
        'h-10 sm:h-9 px-2 sm:px-3',
        isCollapsed && 'h-auto py-2 sm:h-10 sm:py-1'
      )}
      onClick={handleClick}
      title={isCollapsed ? `${name}: ${description}` : description}
      asChild
    >
      <Link href={href} className="flex items-center w-full">
      <div className="relative">
        {showIcons && Icon ? (
          <div className="relative">
            <Icon
              className={cn(
                'h-4 w-4 sm:h-4 sm:w-4 transition-all duration-300 ease-out',
                'flex-shrink-0',
                !isCollapsed && 'mr-2 sm:mr-3'
              )}
            />
            {isCollapsed && badge && (
              <Badge
                variant={isActive ? 'default' : badgeVariant}
                className={cn(
                  'absolute -top-1 -right-1 h-3 w-3 text-[10px] font-bold p-0',
                  'transition-all duration-200'
                )}
              >
                {badge === '!'
                  ? '!'
                  : parseInt(badge) > 9
                  ? '9+'
                  : parseInt(badge) > 0
                  ? badge
                  : ''}
              </Badge>
            )}
          </div>
        ) : showIcons ? (
          <div className={cn(
            "h-4 w-4 mr-3 rounded",
            resolvedTheme === 'dark' ? "bg-gray-600" : "bg-gray-300"
          )}>
            <div className="w-2 h-2 bg-current rounded-full" />
          </div>
        ) : null}
      </div>
      <div className="flex items-center flex-1">
        <span className={cn(
          'font-medium transition-all duration-200 ease-out',
          isCollapsed ? 'text-xs opacity-80 sm:text-xs' : 'text-sm',
          'truncate' // Prevent text overflow on mobile
        )}>
          {name}
        </span>
        {!isCollapsed && badge && (
          <Badge
            variant={isActive ? 'default' : badgeVariant}
            className={cn(
              'ml-2 transition-all duration-200',
              'group-hover:scale-105'
            )}
          >
            {badge}
          </Badge>
        )}
      </div>
      </Link>
    </Button>
  );
});

// Memoized Stats Card
interface StatsCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeType?: 'increase' | 'decrease';
  icon?: React.ComponentType<{ className?: string }>;
  loading?: boolean;
}

export const StatsCard = memo(function StatsCard({
  title,
  value,
  change,
  changeType,
  icon: Icon,
  loading = false,
}: StatsCardProps) {
  const changeColor = useMemo(() => {
    if (!change) return 'text-gray-500';
    return changeType === 'increase' ? 'text-green-600' : 'text-red-600';
  }, [change, changeType]);

  if (loading) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-sm border">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/4"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow duration-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {change && (
            <p className={cn('text-sm mt-1', changeColor)}>
              {changeType === 'increase' ? '+' : '-'}{Math.abs(change)}%
            </p>
          )}
        </div>
        {Icon && (
          <div className="p-3 bg-gray-50 rounded-full">
            <Icon className="h-6 w-6 text-gray-400" />
          </div>
        )}
      </div>
    </div>
  );
});

// Memoized Transaction List Item
interface TransactionItemProps {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
  onClick?: () => void;
}

export const TransactionItem = memo(function TransactionItem({
  id,
  description,
  amount,
  category,
  date,
  onClick,
}: TransactionItemProps) {
  const formattedAmount = useMemo(() => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  }, [amount]);

  const formattedDate = useMemo(() => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  }, [date]);

  const handleClick = useCallback(() => {
    onClick?.();
  }, [onClick]);

  return (
    <div
      className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors duration-150"
      onClick={handleClick}
    >
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
          <span className="text-xs font-medium text-gray-600">
            {category.charAt(0).toUpperCase()}
          </span>
        </div>
        <div>
          <p className="font-medium text-gray-900">{description}</p>
          <p className="text-sm text-gray-500">{category}</p>
        </div>
      </div>
      <div className="text-right">
        <p className={cn('font-medium', amount < 0 ? 'text-red-600' : 'text-green-600')}>
          {formattedAmount}
        </p>
        <p className="text-sm text-gray-500">{formattedDate}</p>
      </div>
    </div>
  );
});

// Memoized Budget Progress Bar
interface BudgetProgressProps {
  name: string;
  spent: number;
  budget: number;
  color?: string;
}

export const BudgetProgress = memo(function BudgetProgress({
  name,
  spent,
  budget,
  color = 'blue',
}: BudgetProgressProps) {
  const percentage = useMemo(() => {
    return Math.min((spent / budget) * 100, 100);
  }, [spent, budget]);

  const formattedSpent = useMemo(() => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(spent);
  }, [spent]);

  const formattedBudget = useMemo(() => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(budget);
  }, [budget]);

  const progressColor = useMemo(() => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 75) return 'bg-yellow-500';
    return `bg-${color}-500`;
  }, [percentage, color]);

  return (
    <div className="p-4 bg-white rounded-lg shadow-sm border">
      <div className="flex justify-between items-center mb-2">
        <h4 className="font-medium text-gray-900">{name}</h4>
        <span className="text-sm text-gray-500">
          {formattedSpent} / {formattedBudget}
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={cn('h-2 rounded-full transition-all duration-300', progressColor)}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <p className="text-xs text-gray-500 mt-1">{percentage.toFixed(1)}% used</p>
    </div>
  );
});

// Optimized List Component with Virtualization
interface OptimizedListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  itemHeight: number;
  containerHeight: number;
  getKey?: (item: T, index: number) => string | number;
}

export const OptimizedList = memo(function OptimizedList<T>({
  items,
  renderItem,
  itemHeight,
  containerHeight,
  getKey = (_, index) => index,
}: OptimizedListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const visibleRange = useMemo(() => {
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - 2);
    const endIndex = Math.min(
      items.length - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + 2
    );
    return { startIndex, endIndex };
  }, [scrollTop, itemHeight, containerHeight, items.length]);

  const handleScroll = useCallback(() => {
    if (containerRef.current) {
      setScrollTop(containerRef.current.scrollTop);
    }
  }, []);

  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.startIndex, visibleRange.endIndex + 1);
  }, [items, visibleRange.startIndex, visibleRange.endIndex]);

  return (
    <div
      ref={containerRef}
      className="overflow-auto"
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: items.length * itemHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${visibleRange.startIndex * itemHeight}px)` }}>
          {visibleItems.map((item, index) => {
            const actualIndex = visibleRange.startIndex + index;
            return (
              <div
                key={getKey(item, actualIndex)}
                style={{ height: itemHeight }}
                className="flex-shrink-0"
              >
                {renderItem(item, actualIndex)}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});
