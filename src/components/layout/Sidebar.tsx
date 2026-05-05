'use client';

import { useState, useEffect, useMemo, useCallback, memo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
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
}

export function Sidebar({ className, isCollapsed = false, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const { stats, loading: statsLoading } = useDashboardStats();
  
  // Enhanced sidebar state for modern features
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [sidebarWidth, setSidebarWidth] = useState('w-64');
  const [isReordering, setIsReordering] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  // Drag and drop handlers
  const handleDragStart = useCallback((e: React.DragEvent, itemName: string) => {
    setDraggedItem(itemName);
    setIsReordering(true);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggedItem(null);
    setIsReordering(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    // Handle reordering logic here
    setIsReordering(false);
  }, []);

  // Responsive breakpoints
  const getResponsiveWidth = useCallback(() => {
    // If collapsed, always use collapsed width
    if (isCollapsed) {
      return 'w-16';
    }
    
    if (typeof window !== 'undefined') {
      const width = window.innerWidth;
      if (width < 640) return 'w-16';
      if (width < 768) return 'w-48';
      if (width < 1024) return 'w-64';
      if (width < 1280) return 'w-80';
      return 'w-64';
    }
    return 'w-64';
  }, [isCollapsed]);

  // Set mounted state and update sidebar width after mount
  useEffect(() => {
    setIsMounted(true);
    setSidebarWidth(getResponsiveWidth());
  }, [getResponsiveWidth]);

  // Memoized navigation to prevent recreation on every render with enhanced metadata
  const navigation = useMemo(() => [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      badge: null,
      description: 'View your financial overview and key metrics',
      color: 'text-blue-600',
      draggable: true,
    },
    {
      name: 'Transactions',
      href: '/transactions',
      icon: Receipt,
      badge: stats?.transactionCount && stats.transactionCount > 0 ? stats.transactionCount.toString() : null,
      description: 'Manage and categorize your transactions',
      color: 'text-green-600',
      draggable: true,
    },
    {
      name: 'Budgets',
      href: '/budgets',
      icon: Target,
      badge: stats?.budgetCount && stats.budgetCount > 0 ? stats.budgetCount.toString() : null,
      description: 'Set and track your spending budgets',
      color: 'text-orange-600',
      draggable: true,
    },
    {
      name: 'Reports',
      href: '/reports',
      icon: TrendingUp,
      badge: stats?.hasReports ? '!' : null,
      description: 'Generate detailed financial reports',
      color: 'text-purple-600',
      draggable: true,
    },
    {
      name: 'Accounts',
      href: '/accounts',
      icon: Wallet,
      badge: stats?.accountCount && stats.accountCount > 0 ? stats.accountCount.toString() : null,
      description: 'Manage your bank accounts and cards',
      color: 'text-indigo-600',
      draggable: true,
    },
    {
      name: 'Banking',
      href: '/banking',
      icon: CreditCard,
      badge: null,
      description: 'Connect and sync bank accounts',
      color: 'text-cyan-600',
    },
    {
      name: 'Templates',
      href: '/templates',
      icon: Layout,
      badge: null,
      description: 'Create transaction and account templates',
      color: 'text-pink-600',
    },
    {
      name: 'Recycle Bin',
      href: '/recycle-bin',
      icon: Trash2,
      badge: null,
      description: 'View and restore deleted items',
      color: 'text-gray-600',
    },
    {
      name: 'Settings',
      href: '/settings',
      icon: Settings,
      badge: null,
      description: 'Configure app preferences and settings',
      color: 'text-slate-600',
    },
  ], [stats]); // Only recalculate when stats change

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
        
        {/* Navigation */}
        <div className="px-3 py-2">
          <div className={cn(
            'space-y-1',
            isReordering && 'cursor-move'
          )}>
            {navigation.map((item, index) => (
              <div 
                key={item.href} 
                className={cn(
                  'relative group transition-all duration-300',
                  draggedItem === item.name && 'opacity-50 scale-95',
                  hoveredItem === item.name && 'scale-105',
                  isReordering && 'cursor-move'
                )}
                draggable={item.draggable}
                onDragStart={(e) => handleDragStart(e, item.name)}
                onDragEnd={handleDragEnd}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                <Button
                  variant={pathname === item.href ? 'secondary' : 'ghost'}
                  className={cn(
                    'w-full justify-start relative transition-all duration-300 hover:scale-[1.02] hover:shadow-sm active:scale-[0.98]',
                    pathname === item.href && `border-l-${item.color.replace('text-', '')}`,
                    'hover:border-l-2 hover:border-l-gray-300'
                  )}
                  style={{
                    transitionDelay: isCollapsed ? `${index * 50}ms` : '0ms',
                    borderLeftColor: pathname === item.href ? undefined : 'transparent'
                  }}
                  asChild
                  title={isCollapsed ? `${item.name}: ${item.description}` : item.description}
                >
                  <Link href={item.href} className="flex items-center">
                    <div className={cn(
                      'relative',
                      draggedItem === item.name && 'dragging opacity-50'
                    )}>
                      {item.icon ? (
                        <div className="relative">
                          <item.icon 
                            className={cn(
                              'h-4 w-4 transition-all duration-300 group-hover:scale-110 group-hover:rotate-12 flex-shrink-0',
                              !isCollapsed && 'mr-3',
                              item.color
                            )} 
                          />
                          {/* Show badge for collapsed state */}
                          {isCollapsed && item.badge && (
                            <div className={cn(
                              'absolute -top-1 -right-1 h-3 w-3 rounded-full text-[10px] font-bold flex items-center justify-center',
                              item.badge === '!' ? 'bg-red-500 text-white' : 
                              parseInt(item.badge) > 0 ? 'bg-blue-500 text-white' : 'bg-gray-400 text-white'
                            )}>
                              {item.badge === '!' ? '!' : 
                               parseInt(item.badge) > 9 ? '9+' : 
                               parseInt(item.badge) > 0 ? item.badge : ''}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="h-4 w-4 mr-3 bg-gray-300 rounded" title="Missing icon">
                          <div className="w-2 h-2 bg-current rounded-full" />
                        </div>
                      )}
                    </div>
                    {!isCollapsed && (
                      <div className="flex items-center flex-1">
                        <span className={cn(
                          'font-medium transition-colors duration-200 group-hover:text-foreground',
                          hoveredItem === item.name && 'text-primary'
                        )}>
                          {item.name}
                        </span>
                        {item.badge && (
                          <Badge 
                            variant={item.badge === '!' ? 'destructive' : item.badge !== '!' && parseInt(item.badge) > 0 ? 'default' : 'secondary'} 
                            className={cn(
                              'ml-2 text-xs transition-all duration-200 animate-pulse shadow-sm',
                              item.badge === '!' && 'bg-red-500 text-white border-red-500 animate-pulse',
                              parseInt(item.badge) > 0 && 'bg-blue-500 text-white border-blue-500'
                            )}
                          >
                            {item.badge}
                          </Badge>
                        )}
                      </div>
                    )}
                  </Link>
                </Button>
              </div>
            ))}
          </div>
        </div>
        
        
        {/* Quick Actions - Lazy loaded when sidebar is expanded */}
        {!isCollapsed && <QuickActions pathname={pathname} />}

        {/* Context-Aware Quick Actions - Lazy loaded when sidebar is expanded */}
        {!isCollapsed && <PageActions pathname={pathname} />}
        
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
