'use client';

import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { GlobalSearch } from '@/components/search/GlobalSearch';
import { BreadcrumbNavigation } from '@/components/navigation/BreadcrumbNavigation';
import { FloatingActionButton } from '@/components/navigation/FloatingActionButton';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { NotificationSystem, ToastNotifications } from '@/components/notifications/NotificationSystem';
import { OnboardingTour, OnboardingTrigger, OnboardingNotifications, OnboardingHints, FeatureDiscoveryNotifications, TourNavigation } from '@/components/onboarding/index';
import { Button } from '@/components/ui/button';
import { Menu, Eye, EyeOff } from 'lucide-react';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showSidebarIcons, setShowSidebarIcons] = useState(true);

  // Load sidebar state from localStorage on mount
  useEffect(() => {
    const savedState = localStorage.getItem('sidebar-collapsed');
    if (savedState !== null) {
      setIsSidebarCollapsed(JSON.parse(savedState));
    }
    
    const savedIconsState = localStorage.getItem('sidebar-show-icons');
    if (savedIconsState !== null) {
      setShowSidebarIcons(JSON.parse(savedIconsState));
    }
  }, []);

  // Save sidebar state to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', JSON.stringify(isSidebarCollapsed));
  }, [isSidebarCollapsed]);

  // Save icons state to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('sidebar-show-icons', JSON.stringify(showSidebarIcons));
  }, [showSidebarIcons]);

  // Add keyboard shortcut for toggling sidebar (Ctrl/Cmd + B)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        toggleSidebar();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSidebarCollapsed]);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const toggleIcons = () => {
    setShowSidebarIcons(!showSidebarIcons);
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar 
        isCollapsed={isSidebarCollapsed} 
        onToggle={toggleSidebar} 
        showIcons={showSidebarIcons}
      />
      <main className="flex-1 overflow-auto transition-all duration-300 relative">
        {/* Global Search */}
        <GlobalSearch />
        
        {/* Floating toggle button for collapsed sidebar */}
        {isSidebarCollapsed && (
          <Button
            variant="outline"
            size="sm"
            onClick={toggleSidebar}
            className="fixed top-4 left-4 z-50 h-8 w-8 p-0 shadow-md bg-background border-border"
            title="Toggle Sidebar (Ctrl/Cmd + B)"
          >
            <Menu className="h-4 w-4" />
          </Button>
        )}
        
        {/* Breadcrumb Navigation */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b p-3 sm:p-4">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <BreadcrumbNavigation />
            </div>
            <div className="flex items-center gap-1 sm:gap-2 ml-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleIcons}
                className="h-8 w-8 p-0"
                title={showSidebarIcons ? "Hide Sidebar Icons" : "Show Sidebar Icons"}
              >
                {showSidebarIcons ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              </Button>
              <NotificationSystem />
              <ThemeToggle />
            </div>
          </div>
        </div>
        
        {/* Main Content */}
        <div className="container mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6">
          {children}
        </div>
        
        {/* Floating Action Button for mobile */}
        <FloatingActionButton />
        
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
    </div>
  );
}
