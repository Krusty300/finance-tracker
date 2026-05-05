'use client';

import { useState, useEffect, useMemo, useCallback, memo, lazy, Suspense } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { useNavigationCache } from '@/hooks/useNavigationCache';
import { usePerformanceState } from '@/hooks/usePerformanceState';
import { LazySection } from '@/components/performance/LazySection';
import { VirtualNavigation } from '@/components/performance/VirtualList';
import { NavigationItem } from '@/components/performance/OptimizedComponents';
import { FavoritesSection } from '@/components/layout/FavoritesSection';
import { RecentlyViewedSection } from '@/components/layout/RecentlyViewedSection';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { getIcon } from '@/lib/iconMapping';
import { 
  Home, 
  TrendingUp, 
  CreditCard, 
  Target, 
  PieChart, 
  Wallet, 
  Layout, 
  Settings,
  Trash2,
  Plus,
  Menu,
  X,
  Moon,
  Sun,
  Calculator,
  Calendar,
  Filter,
  FileDown,
  PiggyBank,
  Receipt,
  LayoutDashboard,
  Smartphone,
  DollarSign,
  ArrowUpDown,
  AlertCircle,
} from 'lucide-react';

// Icons for sidebar navigation

interface SidebarProps {
  className?: string;
  isCollapsed?: boolean;
  onToggle?: () => void;
  showIcons?: boolean;
}

export function Sidebar({ className, isCollapsed = false, onToggle, showIcons = true }: SidebarProps) {
  const pathname = usePathname();
  const { stats, loading: statsLoading } = useDashboardStats();
  const { sortedItems, favoriteItems, recentlyViewedItems, toggleFavorite } = useNavigationCache();
  
  // Performance-optimized sidebar state
  const { state: sidebarState, setState: setSidebarState } = usePerformanceState({
    initialState: {
      draggedItem: null as string | null,
      sidebarWidth: 'w-64',
      isReordering: false,
      hoveredItem: null as string | null,
      isMounted: false,
    },
    persistKey: 'sidebar_state',
    debounceMs: 300,
  });

  const { draggedItem, sidebarWidth, isReordering, hoveredItem, isMounted } = sidebarState;

  // Drag and drop handlers
  const handleDragStart = useCallback((e: React.DragEvent, itemName: string) => {
    setSidebarState(prev => ({ ...prev, draggedItem: itemName, isReordering: true }));
  }, [setSidebarState]);

  const handleDragEnd = useCallback(() => {
    setSidebarState(prev => ({ ...prev, draggedItem: null, isReordering: false }));
  }, [setSidebarState]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    // Handle reordering logic here
    setSidebarState(prev => ({ ...prev, isReordering: false }));
  }, [setSidebarState]);

  // Responsive breakpoints
  const getResponsiveWidth = useCallback(() => {
    // If collapsed, always use collapsed width
    if (isCollapsed) {
      return 'w-14 sm:w-16';
    }
    
    if (typeof window !== 'undefined') {
      const width = window.innerWidth;
      if (width < 640) return 'w-14 sm:w-16'; // Mobile - always collapsed
      if (width < 768) return 'w-48'; // Tablet - medium width
      if (width < 1024) return 'w-64'; // Small desktop
      if (width < 1280) return 'w-72'; // Large desktop
      return 'w-80'; // Extra large desktop
    }
    return 'w-64';
  }, [isCollapsed]);

  // Set mounted state and update sidebar width after mount
  useEffect(() => {
    setSidebarState(prev => ({ ...prev, isMounted: true, sidebarWidth: getResponsiveWidth() }));

    // Only add resize listener if onToggle is provided
    if (!onToggle) return;

    // Auto-collapse on mobile on initial mount
    if (typeof window !== 'undefined' && window.innerWidth < 640 && !isCollapsed) {
      onToggle();
    }

    // Add resize listener to update sidebar width on window resize
    const handleResize = () => {
      const newWidth = getResponsiveWidth();
      setSidebarState(prev => ({ ...prev, sidebarWidth: newWidth }));
      
      // Auto-collapse on mobile
      if (window.innerWidth < 640 && !isCollapsed) {
        onToggle();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [getResponsiveWidth, isCollapsed, onToggle, setSidebarState]);

  // Memoized navigation with performance optimizations and enhanced metadata
  const navigation = useMemo(() => {
    return sortedItems.map(item => ({
      ...item,
      icon: typeof item.icon === 'string' ? getIcon(item.icon) : item.icon, // Ensure icon is a component
      badge: item.id === 'transactions' && stats?.transactionCount && stats.transactionCount > 0 ? stats.transactionCount.toString() :
             item.id === 'budgets' && stats?.budgetCount && stats.budgetCount > 0 ? stats.budgetCount.toString() :
             item.id === 'accounts' && stats?.accountCount && stats.accountCount > 0 ? stats.accountCount.toString() :
             item.id === 'reports' && stats?.hasReports ? '!' :
             null,
    }));
  }, [sortedItems, stats]);

  return (
    <div className={cn('pb-12 transition-all duration-300 z-40', isMounted ? sidebarWidth : 'w-64', className)}>
      <div className="space-y-4 py-4">
        {/* Header with toggle button */}
        <div className="px-3 py-2 flex items-center justify-between">
          {!isCollapsed && (
            <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
              Sprint Financial
            </h2>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className="h-8 w-8 p-0 transition-all duration-200 hover:scale-110 active:scale-95"
          >
            {isCollapsed ? (
              <Menu className="h-4 w-4 transition-transform duration-200 hover:rotate-12" />
            ) : (
              <X className="h-4 w-4 transition-transform duration-200 hover:rotate-90" />
            )}
          </Button>
        </div>
        
        {/* Navigation - Virtual Scrolling for performance */}
        <div className="px-3 py-2">
          {navigation.length > 10 ? (
            <VirtualNavigation
              items={navigation}
              pathname={pathname}
              isCollapsed={isCollapsed}
              showIcons={showIcons}
              containerHeight={400}
              onItemClick={(item) => {
                // Handle navigation click
                console.log('Navigate to:', item.href);
              }}
            />
          ) : (
            <div className={cn(
              'space-y-1',
              isReordering && 'cursor-move'
            )}>
              {navigation.map((item, index) => (
                <div 
                  key={item.id} 
                  className={cn(
                    'relative group transition-all duration-300',
                    draggedItem === item.name && 'opacity-50 scale-95',
                    hoveredItem === item.name && 'scale-105',
                    isReordering && 'cursor-move'
                  )}
                  draggable={true}
                  onDragStart={(e) => handleDragStart(e, item.name)}
                  onDragEnd={handleDragEnd}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                >
                  <NavigationItem
                    name={item.name}
                    href={item.href}
                    icon={item.icon}
                    badge={item.badge}
                    description={item.description}
                    color={item.color}
                    isActive={pathname === item.href}
                    isCollapsed={isCollapsed}
                    showIcons={showIcons}
                    onClick={() => {
                      // Optional: Add custom click handling if needed
                      console.log('Navigating to:', item.href);
                    }}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
        
        
        {/* Quick Actions - Lazy loaded when sidebar is expanded */}
        {!isCollapsed && (
          <LazySection delay={100} threshold={0.1}>
            <QuickActions pathname={pathname} />
          </LazySection>
        )}

        {/* Favorites Section - Lazy loaded */}
        {!isCollapsed && favoriteItems.length > 0 && (
          <LazySection delay={200} threshold={0.1}>
            <FavoritesSection items={favoriteItems} pathname={pathname} onToggleFavorite={toggleFavorite} />
          </LazySection>
        )}

        {/* Recently Viewed - Lazy loaded */}
        {!isCollapsed && recentlyViewedItems.length > 0 && (
          <LazySection delay={300} threshold={0.1}>
            <RecentlyViewedSection items={recentlyViewedItems} pathname={pathname} />
          </LazySection>
        )}
        
        {/* Theme Toggle - Always visible at bottom */}
        <div className="px-3 py-3 border-t mt-auto">
          <div className="flex items-center justify-center">
            <ThemeToggle variant="sidebar" />
          </div>
        </div>
      </div>
    </div>
  );
}

// Lazy-loaded Quick Actions component
const QuickActions = memo(function QuickActions({ pathname }: { pathname: string }) {
  return (
    <div className="px-3 py-2">
      <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
        Quick Actions
      </h2>
      <div className="space-y-1">
        <Button className="w-full justify-start transition-all duration-200 hover:scale-[1.02] hover:shadow-sm active:scale-[0.98]" asChild>
          <Link href="/transactions">
            <Plus className="mr-2 h-4 w-4 transition-transform duration-200 group-hover:rotate-90" />
            Add Transaction
          </Link>
        </Button>
        <Button className="w-full justify-start transition-all duration-200 hover:scale-[1.02] hover:shadow-sm active:scale-[0.98]" variant="outline" asChild>
          <Link href="/transactions?filter=recent">
            <Calendar className="mr-2 h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
            Recent Transactions
          </Link>
        </Button>
        <Button className="w-full justify-start transition-all duration-200 hover:scale-[1.02] hover:shadow-sm active:scale-[0.98]" variant="outline" asChild>
          <Link href="/budgets">
            <PiggyBank className="mr-2 h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
            Create Budget
          </Link>
        </Button>
        <Button className="w-full justify-start transition-all duration-200 hover:scale-[1.02] hover:shadow-sm active:scale-[0.98]" variant="outline" asChild>
          <Link href="/reports">
            <Calculator className="mr-2 h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
            Generate Report
          </Link>
        </Button>
        <Button className="w-full justify-start transition-all duration-200 hover:scale-[1.02] hover:shadow-sm active:scale-[0.98]" variant="outline" asChild>
          <Link href="/accounts">
            <Wallet className="mr-2 h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
            Manage Accounts
          </Link>
        </Button>
        <Button className="w-full justify-start transition-all duration-200 hover:scale-[1.02] hover:shadow-sm active:scale-[0.98]" variant="outline" asChild>
          <Link href="/transactions?export=true">
            <FileDown className="mr-2 h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
            Export Data
          </Link>
        </Button>
      </div>
    </div>
  );
});

// Lazy-loaded Page Actions component
const PageActions = memo(function PageActions({ pathname }: { pathname: string }) {
  return (
    <div className="px-3 py-2">
      <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
        Page Actions
      </h2>
      <div className="space-y-1">
        {pathname === '/transactions' && (
          <>
            <Button className="w-full justify-start transition-all duration-200 hover:scale-[1.02] hover:shadow-sm active:scale-[0.98]" variant="outline" asChild>
              <Link href="/transactions?view=enhanced">
                <Filter className="mr-2 h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
                Enhanced View
              </Link>
            </Button>
            <Button className="w-full justify-start transition-all duration-200 hover:scale-[1.02] hover:shadow-sm active:scale-[0.98]" variant="outline" asChild>
              <Link href="/transactions?export=true">
                <FileDown className="mr-2 h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
                Quick Export
              </Link>
            </Button>
          </>
        )}
        {pathname === '/dashboard' && (
          <Button className="w-full justify-start transition-all duration-200 hover:scale-[1.02] hover:shadow-sm active:scale-[0.98]" variant="outline" asChild>
            <Link href="/reports">
              <Calculator className="mr-2 h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
              View Reports
            </Link>
          </Button>
        )}
        {pathname === '/budgets' && (
          <Button className="w-full justify-start transition-all duration-200 hover:scale-[1.02] hover:shadow-sm active:scale-[0.98]" variant="outline" asChild>
            <Link href="/transactions?filter=budget">
              <Calendar className="mr-2 h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
              Budget Transactions
            </Link>
          </Button>
        )}
        {(pathname === '/accounts' || pathname === '/settings') && (
          <Button className="w-full justify-start transition-all duration-200 hover:scale-[1.02] hover:shadow-sm active:scale-[0.98]" variant="outline" asChild>
            <Link href="/dashboard">
              <LayoutDashboard className="mr-2 h-4 w-4 transition-transform duration-200 group-hover:rotate-180" />
              Back to Dashboard
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
});
