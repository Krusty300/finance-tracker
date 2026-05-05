'use client';

import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { GlobalSearch } from '@/components/search/GlobalSearch';
import { BreadcrumbNavigation } from '@/components/navigation/BreadcrumbNavigation';
import { FloatingActionButton } from '@/components/navigation/FloatingActionButton';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { NotificationSystem, ToastNotifications } from '@/components/notifications/NotificationSystem';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Load sidebar state from localStorage on mount
  useEffect(() => {
    const savedState = localStorage.getItem('sidebar-collapsed');
    if (savedState !== null) {
      setIsSidebarCollapsed(JSON.parse(savedState));
    }
  }, []);

  // Save sidebar state to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', JSON.stringify(isSidebarCollapsed));
  }, [isSidebarCollapsed]);

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

  return (
    <div className="flex h-screen bg-background">
      <Sidebar 
        isCollapsed={isSidebarCollapsed} 
        onToggle={toggleSidebar} 
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
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b p-4">
          <div className="flex items-center justify-between">
            <BreadcrumbNavigation />
            <div className="flex items-center gap-2">
              <NotificationSystem />
              <ThemeToggle />
            </div>
          </div>
        </div>
        
        {/* Main Content */}
        <div className="container mx-auto p-6">
          {children}
        </div>
        
        {/* Floating Action Button for mobile */}
        <FloatingActionButton />
      </main>
      
      {/* Toast Notifications */}
      <ToastNotifications />
    </div>
  );
}
