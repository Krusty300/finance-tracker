'use client';

import { useState, useEffect, Suspense } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { GlobalSearchSimple } from '@/components/search/GlobalSearchSimple';
import { BreadcrumbNavigation } from '@/components/navigation/BreadcrumbNavigation';
import { FloatingActionButton } from '@/components/navigation/FloatingActionButton';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';
import { ToastNotifications } from '@/components/notifications/NotificationSystem';
import { ConnectionStatus } from '@/components/ui/ConnectionStatus';
import { OnboardingTour, OnboardingTrigger, OnboardingNotifications, OnboardingHints, FeatureDiscoveryNotifications, TourNavigation } from '@/components/onboarding/index';
import { Button } from '@/components/ui/button';
import { Menu, Eye, EyeOff, ChevronRight, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';
import { Skeleton } from '@/components/ui/skeleton';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showSidebarIcons, setShowSidebarIcons] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const { resolvedTheme } = useTheme();
  const [isPageLoading, setIsPageLoading] = useState(false);

  // Load sidebar state from localStorage on mount and detect mobile
  useEffect(() => {
    const loadState = () => {
      const savedState = localStorage.getItem('sidebar-collapsed');
      if (savedState !== null) {
        setIsSidebarCollapsed(JSON.parse(savedState));
      }
      
      const savedIconsState = localStorage.getItem('sidebar-show-icons');
      if (savedIconsState !== null) {
        setShowSidebarIcons(JSON.parse(savedIconsState));
      } else {
        // Default to false and save to localStorage
        setShowSidebarIcons(false);
        localStorage.setItem('sidebar-show-icons', 'false');
      }
      
      // Detect mobile
      const mobile = typeof window !== 'undefined' && window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setIsSidebarCollapsed(true);
        setIsMobileSidebarOpen(false);
      }
      
      setIsLoaded(true);
    };

    loadState();
  }, []);

  // Save sidebar state to localStorage when it changes
  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem('sidebar-collapsed', JSON.stringify(isSidebarCollapsed));
  }, [isSidebarCollapsed, isLoaded]);

  // Save icons state to localStorage when it changes
  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem('sidebar-show-icons', JSON.stringify(showSidebarIcons));
  }, [showSidebarIcons, isLoaded]);

  // Add keyboard shortcut and resize listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        if (isMobile) {
          setIsMobileSidebarOpen(!isMobileSidebarOpen);
        } else {
          toggleSidebar();
        }
      }
    };

    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile && !isSidebarCollapsed) {
        setIsSidebarCollapsed(true);
        setIsMobileSidebarOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleResize);
    };
  }, [isSidebarCollapsed, isMobile, isMobileSidebarOpen]);

  const toggleSidebar = () => {
    if (isMobile) {
      setIsMobileSidebarOpen(!isMobileSidebarOpen);
    } else {
      setIsSidebarCollapsed(!isSidebarCollapsed);
    }
  };

  const closeMobileSidebar = () => {
    if (isMobile) {
      setIsMobileSidebarOpen(false);
    }
  };

  const toggleIcons = () => {
    setShowSidebarIcons(!showSidebarIcons);
  };

  // Simulate page loading for demo purposes
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsPageLoading(false);
    }, 1000); // Show loading for 1 second
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex h-screen bg-background relative">
      {/* Mobile Sidebar Overlay */}
      {isMobile && isMobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity duration-300"
          onClick={closeMobileSidebar}
          aria-hidden="true"
        />
      )}
      
      {/* Sidebar */}
      <Sidebar 
        isCollapsed={isMobile ? false : isSidebarCollapsed} 
        onToggle={toggleSidebar} 
        showIcons={showSidebarIcons}
        isMobile={isMobile}
        isMobileSidebarOpen={isMobileSidebarOpen}
        onCloseMobileSidebar={closeMobileSidebar}
      />
      <main className={cn(
        "flex-1 overflow-auto relative",
        "transition-all duration-500 ease-in-out",
        "will-change-transform",
        "z-30", // Ensure main content is above sidebar but below other overlays
        "min-h-screen", // Ensure main content takes full height
        // Mobile adjustments
        isMobile && "md:hidden", // Hide on mobile when sidebar is open as overlay
        !isMobile && isSidebarCollapsed && "ml-0" // No margin when collapsed on desktop
      )}>
        {/* Global Search */}
        <GlobalSearchSimple />
        
        {/* Mobile Menu Button - Always visible on mobile */}
        {isMobile && (
          <Button
            variant="outline"
            size="sm"
            onClick={toggleSidebar}
            className={cn(
              "fixed top-4 left-4 z-50 h-10 w-10 p-0",
              "shadow-lg bg-background border-2 border-border/50",
              "hover:bg-primary hover:text-primary-foreground hover:border-primary",
              "hover:shadow-xl hover:scale-105",
              "transition-all duration-300 ease-out",
              "group",
              "touch-manipulation-none" // Prevent zoom on touch
            )}
            title="Toggle Sidebar Menu"
          >
            <Menu className={cn(
              "h-5 w-5 transition-transform duration-300",
              "group-hover:scale-110"
            )} />
          </Button>
        )}
        
        {/* Desktop floating toggle button */}
        {!isMobile && isSidebarCollapsed && (
          <Button
            variant="outline"
            size="sm"
            onClick={toggleSidebar}
            className={cn(
              "fixed top-6 left-6 z-50 h-12 w-12 p-0", // Larger for mobile touch
              "shadow-lg bg-background border-2 border-border/50",
              "hover:bg-primary hover:text-primary-foreground hover:border-primary",
              "hover:shadow-xl hover:scale-105",
              "transition-all duration-300 ease-out",
              "group",
              // Responsive sizing
              "sm:top-4 sm:left-4 sm:h-10 sm:w-10", // Smaller on small screens
              "md:top-4 md:left-4 md:h-8 md:w-8", // Even smaller on medium screens
              "active:scale-95 touch-manipulation-none" // Touch feedback & prevent zoom
            )}
            title="Toggle Sidebar (Ctrl/Cmd + B)"
          >
            <ChevronRight className={cn(
              "h-6 w-6 transition-transform duration-300", // Larger icon for mobile
              "sm:h-5 sm:w-5 md:h-4 md:w-4", // Responsive icon sizing
              "group-hover:translate-x-1 group-hover:scale-110 group-hover:rotate-12"
            )} />
          </Button>
        )}
        
        {/* Breadcrumb Navigation */}
        <div className={cn(
          "sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b",
          "p-3 sm:p-4",
          // Add left padding when sidebar is collapsed to avoid overlap with floating toggle
          !isMobile && isSidebarCollapsed && "pl-20 sm:pl-16", // Only on desktop
          // Add padding for mobile menu button
          isMobile && "pl-16" // Space for mobile menu button
        )}>
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <BreadcrumbNavigation />
            </div>
            <div className="flex items-center gap-1 sm:gap-2 ml-2">
              {/* Desktop Search Button */}
              <div className="hidden md:block">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if ((window as any).openGlobalSearch) {
                      (window as any).openGlobalSearch();
                    }
                  }}
                  className="relative"
                  aria-label="Search (Ctrl+K)"
                >
                  <Search className="h-4 w-4" />
                  <span className="hidden lg:inline ml-2">Search</span>
                  <kbd className={cn(
                    "ml-auto px-1.5 py-0.5 text-xs rounded border transition-colors duration-200",
                    resolvedTheme === 'dark'
                      ? "bg-background/80 border-border/50 text-muted-foreground hover:bg-background hover:text-foreground"
                      : "bg-background border-border/40 text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}>
                    Ctrl+K
                  </kbd>
                </Button>
              </div>
              
              <ConnectionStatus />
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleIcons}
                className="h-8 w-8 p-0 hover:bg-primary/10 transition-all duration-200 hover:scale-110"
                title={showSidebarIcons ? "Hide Sidebar Icons" : "Show Sidebar Icons"}
              >
                {showSidebarIcons ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              </Button>
              <NotificationCenter />
              <ThemeToggle />
            </div>
          </div>
        </div>
        
        {/* Main Content */}
        <Suspense 
          fallback={
            <div className="flex-1 overflow-auto relative">
              {/* Loading Skeleton */}
              <div className="container mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6">
                <div className="space-y-4">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                </div>
              </div>
            </div>
          }
        >
          {isPageLoading && (
            <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary mb-4"></div>
                <p className="text-lg font-medium">Loading page...</p>
              </div>
            </div>
          )}
          <div className="container mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6">
            {children}
          </div>
        </Suspense>
        
        {/* Toast Notifications */}
        <ToastNotifications />
        
        {/* Onboarding Components */}
        <OnboardingTour />
        <OnboardingTrigger />
        <TourNavigation />
        <OnboardingNotifications />
        <OnboardingHints />
        <FeatureDiscoveryNotifications />
      </main>
      
      {/* Floating Action Button - Outside main to fix positioning */}
      <FloatingActionButton />
    </div>
  );
}
