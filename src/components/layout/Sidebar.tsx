'use client';

import { useState, useEffect, useMemo, useCallback, memo, lazy, Suspense } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { useNavigationCache } from '@/hooks/useNavigationCache';
import { useNotifications } from '@/hooks/useNotifications';
import { usePerformanceState } from '@/hooks/usePerformanceState';
import { useRecycleBinCount } from '@/hooks/useRecycleBinCount';
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
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

// Icons for sidebar navigation

interface SidebarProps {
  className?: string;
  isCollapsed?: boolean;
  onToggle?: () => void;
  showIcons?: boolean;
  isMobile?: boolean;
  isMobileSidebarOpen?: boolean;
  onCloseMobileSidebar?: () => void;
}

export function Sidebar({ 
  className, 
  isCollapsed = false, 
  onToggle, 
  showIcons = true, 
  isMobile = false,
  isMobileSidebarOpen = false,
  onCloseMobileSidebar
}: SidebarProps) {
  const pathname = usePathname();
  const { formatCurrency } = useCurrency();
  const { resolvedTheme } = useTheme();
  const { stats, loading: statsLoading } = useDashboardStats();
  const { sortedItems, favoriteItems, recentlyViewedItems, toggleFavorite } = useNavigationCache();
  const { unreadCount } = useNotifications();
  const recycleBinCount = useRecycleBinCount();
  
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

  // Responsive breakpoints - simplified for mobile
  const getResponsiveWidth = useCallback(() => {
    // Mobile always uses full width as overlay
    if (isMobile) {
      return 'w-72 max-w-[80vw]'; // Fixed width with max viewport width
    }
    
    // If collapsed, use responsive width based on screen size
    if (isCollapsed) {
      if (typeof window !== 'undefined') {
        const width = window.innerWidth;
        if (width < 640) return 'w-36'; // Mobile - wider for text readability
        if (width < 768) return 'w-40'; // Tablet - slightly wider
        return 'w-32'; // Desktop - compact collapsed
      }
      return 'w-32'; // Default collapsed width
    }
    
    if (typeof window !== 'undefined') {
      const width = window.innerWidth;
      if (width < 640) return 'w-40'; // Mobile - always collapsed with text
      if (width < 768) return 'w-48'; // Tablet - medium width
      if (width < 1024) return 'w-64'; // Small desktop
      if (width < 1280) return 'w-72'; // Large desktop
      return 'w-80'; // Extra large desktop
    }
    return 'w-64';
  }, [isCollapsed, isMobile]);

  // Set mounted state and update sidebar width after mount
  useEffect(() => {
    setSidebarState(prev => ({ ...prev, isMounted: true, sidebarWidth: getResponsiveWidth() }));

    // Only add resize listener if onToggle is provided and not mobile
    if (!onToggle || isMobile) return;

    // Auto-collapse on mobile on initial mount (handled by layout now)
    if (typeof window !== 'undefined' && window.innerWidth < 640 && !isCollapsed) {
      onToggle();
    }

    // Add resize listener to update sidebar width on window resize
    const handleResize = () => {
      const newWidth = getResponsiveWidth();
      setSidebarState(prev => ({ ...prev, sidebarWidth: newWidth }));
      
      // Auto-collapse on mobile (handled by layout now)
      if (window.innerWidth < 640 && !isCollapsed) {
        onToggle();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [getResponsiveWidth, isCollapsed, onToggle, setSidebarState, isMobile]);

  // Memoized navigation with performance optimizations and enhanced metadata
  const navigation = useMemo(() => {
    return sortedItems.map(item => ({
      ...item,
      icon: typeof item.icon === 'string' ? getIcon(item.icon) : item.icon, // Ensure icon is a component
      badge: item.id === 'notifications' && unreadCount > 0 ? unreadCount.toString() :
             item.id === 'transactions' && stats?.transactionCount && stats.transactionCount > 0 ? stats.transactionCount.toString() :
             item.id === 'budgets' && stats?.budgetCount && stats.budgetCount > 0 ? (() => {
               console.log('Sidebar: Budget badge updated', { budgetCount: stats.budgetCount });
               return stats.budgetCount.toString();
             })() :
             item.id === 'accounts' && stats?.accountCount && stats.accountCount > 0 ? stats.accountCount.toString() :
             item.id === 'reports' && stats?.hasReports ? '!' :
             item.id === 'recycle-bin' && recycleBinCount > 0 ? recycleBinCount.toString() :
             null,
      badgeVariant: item.id === 'recycle-bin' && recycleBinCount > 0 ? 'destructive' as const : 'secondary' as const,
    }));
  }, [sortedItems, stats, unreadCount, recycleBinCount]);

  // Touch gesture support for mobile
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // Minimum swipe distance (in px)
  const minSwipeDistance = 50;

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (!isMobile) return;
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  }, [isMobile]);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isMobile) return;
    setTouchEnd(e.targetTouches[0].clientX);
  }, [isMobile]);

  const onTouchEnd = useCallback(() => {
    if (!isMobile || !touchStart || !touchEnd || !onCloseMobileSidebar) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    
    if (isLeftSwipe && isMobileSidebarOpen) {
      onCloseMobileSidebar();
    }
  }, [isMobile, touchStart, touchEnd, minSwipeDistance, isMobileSidebarOpen, onCloseMobileSidebar]);

  return (
    <div 
      data-onboarding="sidebar" 
      className={cn(
        'pb-12 z-40',
        // Optimized transitions for mobile
        isMobile 
          ? 'transition-transform duration-300 ease-out' // Faster on mobile
          : 'transition-all duration-500 ease-in-out',
        'will-change-transform',
        isMounted ? sidebarWidth : 'w-64',
        // Mobile overlay behavior
        isMobile && cn(
          'fixed inset-y-0 left-0 transform',
          'md:relative', // Relative on desktop and up
          isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full',
          'shadow-2xl', // Add shadow for mobile overlay
          // Mobile performance optimizations
          'backdrop-blur-sm',
          'will-change-transform'
        ),
        !isMobile && isCollapsed && 'opacity-95',
        className
      )}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <div className="space-y-4 py-4">
        {/* Header with toggle button */}
        <div className={cn(
          'py-2 flex items-center justify-between',
          // Optimized transitions for mobile
          isMobile 
            ? 'transition-colors duration-200 ease-out'
            : 'transition-all duration-300 ease-out',
          isCollapsed ? 'px-2 sm:px-3' : 'px-3'
        )}>
          {!isCollapsed && (
            <div className={cn(
              'mb-2 px-4 flex items-center gap-3',
              'transition-all duration-500 ease-in-out',
              'transform',
              isMounted ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'
            )}>
              <h2 className={cn(
                'text-lg font-semibold tracking-tight',
                // Enhanced white theme-supportive text styling
                resolvedTheme === 'dark'
                  ? 'text-gray-50'
                  : 'text-gray-900'
              )}>
                Sprint Financial
              </h2>
              <img 
                src="/favicon.png" 
                alt="Sprint Financial" 
                className="h-6 w-6 rounded-sm"
              />
            </div>
          )}
          {/* Mobile close button */}
          {isMobile && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onCloseMobileSidebar}
              className={cn(
                "h-10 w-10 p-0", // Larger touch target for mobile
                "transition-all duration-200 ease-out", // Faster on mobile
                "hover:scale-105 active:scale-95 hover:bg-primary/10",
                "group",
                "touch-manipulation-none" // Prevent zoom on touch
              )}
              title="Close sidebar"
            >
              <X className={cn(
                "h-5 w-5 transition-transform duration-200", // Larger icon for mobile
                "group-hover:scale-110"
              )} />
            </Button>
          )}
          {/* Desktop collapse button */}
          {!isMobile && !isCollapsed && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggle}
              className={cn(
                "h-8 w-8 p-0 transition-all duration-300 ease-out",
                "hover:scale-110 active:scale-95 hover:bg-primary/10",
                "group"
              )}
              title="Collapse sidebar"
            >
              <ChevronLeft className={cn(
                "h-4 w-4 transition-transform duration-300",
                "group-hover:-translate-x-1 group-hover:scale-110"
              )} />
            </Button>
          )}
        </div>
        
        {/* Navigation - Virtual Scrolling for performance */}
        <div className={cn(
          'py-2',
          // Optimized transitions for mobile
          isMobile 
            ? 'transition-colors duration-200 ease-out'
            : 'transition-all duration-300 ease-out',
          isCollapsed ? 'px-2 sm:px-3' : 'px-3'
        )}>
          {navigation.length > 10 ? (
            <VirtualNavigation
              items={navigation}
              pathname={pathname}
              isCollapsed={isCollapsed}
              showIcons={showIcons}
              containerHeight={400}
              onItemClick={(item) => {
                // Handle navigation click
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
                    badgeVariant={item.badgeVariant}
                    description={item.description}
                    color={item.color}
                    isActive={pathname === item.href}
                    isCollapsed={isCollapsed}
                    showIcons={showIcons}
                    onClick={() => {
                      // Optional: Add custom click handling if needed
                    }}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section Divider */}
        {!isCollapsed && (
          <div className="px-3 py-2">
            <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />
          </div>
        )}
        
        {/* Quick Actions - Lazy loaded when sidebar is expanded */}
        {!isCollapsed && (
          <LazySection delay={100} threshold={0.1}>
            <div className={cn(
              'transition-all duration-300 ease-out',
              isMounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
            )}>
              <QuickActions pathname={pathname} showIcons={showIcons} />
            </div>
          </LazySection>
        )}

        {/* Favorites Section - Lazy loaded */}
        {!isCollapsed && favoriteItems.length > 0 && (
          <LazySection delay={200} threshold={0.1}>
            <div className={cn(
              'transition-all duration-300 ease-out delay-100',
              isMounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
            )}>
              <FavoritesSection items={favoriteItems} pathname={pathname} onToggleFavorite={toggleFavorite} showIcons={showIcons} />
            </div>
          </LazySection>
        )}

        {/* Recently Viewed - Lazy loaded */}
        {!isCollapsed && recentlyViewedItems.length > 0 && (
          <LazySection delay={300} threshold={0.1}>
            <div className={cn(
              'transition-all duration-300 ease-out delay-200',
              isMounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
            )}>
              <RecentlyViewedSection items={recentlyViewedItems} pathname={pathname} showIcons={showIcons} />
            </div>
          </LazySection>
        )}
        
        {/* Section Divider */}
        <div className={cn(
          'py-2',
          'transition-all duration-300 ease-out',
          isCollapsed ? 'px-2 sm:px-3' : 'px-3'
        )}>
          <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />
        </div>
        
        {/* Theme Toggle - Always visible at bottom */}
        <div className={cn(
          'py-3 mt-auto',
          'transition-all duration-300 ease-out',
          isCollapsed ? 'px-2 sm:px-3' : 'px-3'
        )}>
          <div className="flex items-center justify-center">
            <ThemeToggle variant="sidebar" />
          </div>
        </div>
      </div>
    </div>
  );
}

// Lazy-loaded Quick Actions component
const QuickActions = memo(function QuickActions({ pathname, showIcons = true }: { pathname: string; showIcons?: boolean }) {
  const { resolvedTheme } = useTheme();
  
  return (
    <div className="px-3 py-2">
      <h2 className={cn(
        "mb-2 px-4 text-lg font-semibold tracking-tight",
        // Enhanced white theme-supportive text styling
        resolvedTheme === 'dark'
          ? 'text-gray-50'
          : 'text-gray-900'
      )}>
        Quick Actions
      </h2>
      <div className="space-y-1">
        <Button className="w-full justify-start transition-all duration-200 hover:scale-[1.02] hover:shadow-sm hover:bg-primary/10 active:scale-[0.98]" asChild>
          <Link href="/transactions">
            {showIcons && <Plus className="mr-2 h-4 w-4 transition-transform duration-200 group-hover:rotate-90" />}
            Add Transaction
          </Link>
        </Button>
        <Button className="w-full justify-start transition-all duration-200 hover:scale-[1.02] hover:shadow-sm hover:bg-primary/10 active:scale-[0.98]" variant="outline" asChild>
          <Link href="/transactions?filter=recent">
            {showIcons && <Calendar className="mr-2 h-4 w-4 transition-transform duration-200 group-hover:scale-110" />}
            Recent Transactions
          </Link>
        </Button>
        <Button className="w-full justify-start transition-all duration-200 hover:scale-[1.02] hover:shadow-sm hover:bg-primary/10 active:scale-[0.98]" variant="outline" asChild>
          <Link href="/budgets">
            {showIcons && <PiggyBank className="mr-2 h-4 w-4 transition-transform duration-200 group-hover:scale-110" />}
            Create Budget
          </Link>
        </Button>
        <Button className="w-full justify-start transition-all duration-200 hover:scale-[1.02] hover:shadow-sm hover:bg-primary/10 active:scale-[0.98]" variant="outline" asChild>
          <Link href="/reports">
            {showIcons && <Calculator className="mr-2 h-4 w-4 transition-transform duration-200 group-hover:scale-110" />}
            Generate Report
          </Link>
        </Button>
        <Button className="w-full justify-start transition-all duration-200 hover:scale-[1.02] hover:shadow-sm hover:bg-primary/10 active:scale-[0.98]" variant="outline" asChild>
          <Link href="/accounts">
            {showIcons && <Wallet className="mr-2 h-4 w-4 transition-transform duration-200 group-hover:scale-110" />}
            Manage Accounts
          </Link>
        </Button>
        <Button className="w-full justify-start transition-all duration-200 hover:scale-[1.02] hover:shadow-sm hover:bg-primary/10 active:scale-[0.98]" variant="outline" asChild>
          <Link href="/transactions?export=true">
            {showIcons && <FileDown className="mr-2 h-4 w-4 transition-transform duration-200 group-hover:scale-110" />}
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
            <Button className="w-full justify-start transition-all duration-200 hover:scale-[1.02] hover:shadow-sm hover:bg-primary/10 active:scale-[0.98]" variant="outline" asChild>
              <Link href="/transactions?view=enhanced">
                <Filter className="mr-2 h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
                Enhanced View
              </Link>
            </Button>
            <Button className="w-full justify-start transition-all duration-200 hover:scale-[1.02] hover:shadow-sm hover:bg-primary/10 active:scale-[0.98]" variant="outline" asChild>
              <Link href="/transactions?export=true">
                <FileDown className="mr-2 h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
                Quick Export
              </Link>
            </Button>
          </>
        )}
        {pathname === '/dashboard' && (
          <Button className="w-full justify-start transition-all duration-200 hover:scale-[1.02] hover:shadow-sm hover:bg-primary/10 active:scale-[0.98]" variant="outline" asChild>
            <Link href="/reports">
              <Calculator className="mr-2 h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
              View Reports
            </Link>
          </Button>
        )}
        {pathname === '/budgets' && (
          <Button className="w-full justify-start transition-all duration-200 hover:scale-[1.02] hover:shadow-sm hover:bg-primary/10 active:scale-[0.98]" variant="outline" asChild>
            <Link href="/transactions?filter=budget">
              <Calendar className="mr-2 h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
              Budget Transactions
            </Link>
          </Button>
        )}
        {(pathname === '/accounts' || pathname === '/settings') && (
          <Button className="w-full justify-start transition-all duration-200 hover:scale-[1.02] hover:shadow-sm hover:bg-primary/10 active:scale-[0.98]" variant="outline" asChild>
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
