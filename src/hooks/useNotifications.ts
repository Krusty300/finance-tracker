import { useState, useEffect, useCallback } from 'react';
import { useRealtime } from './useRealtime';

export type NotificationCategory = 'transaction' | 'budget' | 'account' | 'goal' | 'system' | 'reminder' | 'alert';
export type NotificationPriority = 'low' | 'medium' | 'high' | 'critical';

export type Notification = {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  category: NotificationCategory;
  priority: NotificationPriority;
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  archived: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
  actions?: Array<{
    label: string;
    onClick: () => void;
    variant?: 'default' | 'destructive' | 'outline';
  }>;
  autoHide?: boolean;
  duration?: number;
  persistent?: boolean;
  metadata?: Record<string, any>;
};

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { subscribe } = useRealtime();

  // Load notifications from localStorage on mount
  useEffect(() => {
    try {
      const savedNotifications = localStorage.getItem('notifications');
      if (savedNotifications) {
        const parsed = JSON.parse(savedNotifications);
        // Convert timestamp strings back to numbers if needed
        const normalized = parsed.map((n: any) => ({
          ...n,
          timestamp: typeof n.timestamp === 'string' ? parseInt(n.timestamp) : n.timestamp
        }));
        
        // Remove duplicates based on title, message, and type
        const deduplicated = normalized.filter((notification: Notification, index: number, self: Notification[]) => 
          index === self.findIndex((n: Notification) => 
            n.title === notification.title && 
            n.message === notification.message && 
            n.type === notification.type
          )
        );
        
        // Ensure all IDs are unique by regenerating any duplicates
        const uniqueIds = new Set();
        const withUniqueIds = deduplicated.map((notification: Notification) => {
          let newId = notification.id;
          let counter = 1;
          while (uniqueIds.has(newId)) {
            newId = `${notification.id}-${counter}`;
            counter++;
          }
          uniqueIds.add(newId);
          return { ...notification, id: newId };
        });
        
        setNotifications(withUniqueIds);
      } else {
        // Clear any existing sample flags and start fresh
        localStorage.removeItem('finance-tracker-samples-added');
        
        // Add some sample notifications for testing with unique IDs
        const sampleNotifications: Notification[] = [
          {
            id: 'sample-1-welcome',
            type: 'info',
            category: 'system',
            priority: 'low',
            title: 'Welcome to Finance Tracker',
            message: 'Start managing your finances efficiently',
            timestamp: Date.now() - 3600000, // 1 hour ago
            read: false,
            archived: false,
            autoHide: false,
            duration: 5000
          },
          {
            id: 'sample-2-transaction',
            type: 'success',
            category: 'transaction',
            priority: 'medium',
            title: 'Sample Transaction',
            message: 'A sample transaction was added',
            timestamp: Date.now() - 7200000, // 2 hours ago
            read: false,
            archived: false,
            autoHide: false,
            duration: 5000
          },
          {
            id: 'sample-3-budget',
            type: 'warning',
            category: 'budget',
            priority: 'high',
            title: 'Budget Reminder',
            message: 'Check your budget spending',
            timestamp: Date.now() - 86400000, // 1 day ago
            read: true,
            archived: false,
            autoHide: false,
            duration: 6000
          }
        ];
        setNotifications(sampleNotifications);
        // Save sample notifications to localStorage
        localStorage.setItem('notifications', JSON.stringify(sampleNotifications));
        localStorage.setItem('finance-tracker-samples-added', 'true');
      }
    } catch (error) {
      console.error('Failed to load notifications from localStorage:', error);
      // Clear corrupted data and start fresh
      localStorage.removeItem('notifications');
      localStorage.removeItem('finance-tracker-samples-added');
    }
  }, []);

  // Remove a notification
  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => {
      const updated = prev.filter(n => n.id !== id);
      // Update localStorage immediately
      try {
        localStorage.setItem('notifications', JSON.stringify(updated));
      } catch (error) {
        console.error('Failed to update notifications in localStorage:', error);
      }
      return updated;
    });
  }, []);

  // Add a new notification
  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp' | 'read' | 'archived'>) => {
    const newNotification: Notification = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      read: false,
      archived: false,
      autoHide: false, // Disable auto-hide so notifications stay in the system
      duration: notification.type === 'error' ? 8000 : notification.type === 'warning' ? 6000 : 5000,
      ...notification
    };

    setNotifications(prev => {
      // Check if a notification with the same content already exists to prevent duplicates
      const existingDuplicate = prev.find(n => 
        n.title === newNotification.title && 
        n.message === newNotification.message && 
        n.type === newNotification.type
      );
      
      if (existingDuplicate) {
        console.warn('Duplicate notification prevented:', newNotification.title);
        return prev; // Don't add duplicate
      }
      
      const updated = [newNotification, ...prev];
      // Save to localStorage for persistence
      try {
        const savedNotifications = localStorage.getItem('notifications');
        const existing = savedNotifications ? JSON.parse(savedNotifications) : [];
        
        // Check for duplicates in localStorage too
        const hasDuplicate = existing.some((n: any) => 
          n.title === newNotification.title && 
          n.message === newNotification.message && 
          n.type === newNotification.type
        );
        
        if (!hasDuplicate) {
          const finalUpdated = [newNotification, ...existing.slice(0, 99)]; // Keep max 100
          localStorage.setItem('notifications', JSON.stringify(finalUpdated));
        }
      } catch (error) {
        console.error('Failed to save notification to localStorage:', error);
      }
      return updated;
    });

    // Auto-hide if specified
    if (newNotification.autoHide && newNotification.duration && !newNotification.persistent) {
      setTimeout(() => {
        removeNotification(newNotification.id);
      }, newNotification.duration);
    }

    return newNotification.id;
  }, [removeNotification]);

  // Mark as read
  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => {
      const updated = prev.map(n => n.id === id ? { ...n, read: true } : n);
      // Update localStorage immediately
      try {
        localStorage.setItem('notifications', JSON.stringify(updated));
      } catch (error) {
        console.error('Failed to update notifications in localStorage:', error);
      }
      return updated;
    });
  }, []);

  // Mark all as read
  const markAllAsRead = useCallback(() => {
    setNotifications(prev => {
      const updated = prev.map(n => ({ ...n, read: true }));
      // Update localStorage immediately
      try {
        localStorage.setItem('notifications', JSON.stringify(updated));
      } catch (error) {
        console.error('Failed to update notifications in localStorage:', error);
      }
      return updated;
    });
  }, []);

  // Clear all notifications
  const clearAll = useCallback(() => {
    setNotifications(prev => {
      // Clear from localStorage
      try {
        localStorage.setItem('notifications', JSON.stringify([]));
      } catch (error) {
        console.error('Failed to clear notifications from localStorage:', error);
      }
      return [];
    });
  }, []);

  // Get unread count
  const unreadCount = notifications.filter(n => !n.read).length;

  // Listen for real-time events and create notifications
  useEffect(() => {
    const unsubscribers = [
      subscribe('transaction', (event) => {
        const { action, data } = event;
        
        switch (action) {
          case 'create':
            addNotification({
              type: 'success',
              category: 'transaction',
              priority: 'medium',
              title: 'Transaction Added',
              message: `${data?.description || 'New transaction'} of ${data?.type === 'income' ? '+' : '-'}$${data?.amount?.toFixed(2) || '0.00'}`,
              action: {
                label: 'View',
                onClick: () => {
                  // Navigate to transactions page
                  window.location.href = '/transactions';
                }
              }
            });
            break;
            
          case 'update':
            addNotification({
              type: 'info',
              category: 'transaction',
              priority: 'low',
              title: 'Transaction Updated',
              message: `${data?.description || 'Transaction'} has been updated`
            });
            break;
            
          case 'delete':
            addNotification({
              type: 'warning',
              category: 'transaction',
              priority: 'medium',
              title: 'Transaction Deleted',
              message: `${data?.description || 'Transaction'} has been deleted`,
              duration: 3000
            });
            break;
        }
      }),

      subscribe('budget', (event) => {
        const { action, data } = event;
        
        switch (action) {
          case 'create':
            addNotification({
              type: 'success',
              category: 'budget',
              priority: 'medium',
              title: 'Budget Created',
              message: `Budget for ${data?.category || 'category'} has been created`
            });
            break;
            
          case 'update':
            addNotification({
              type: 'info',
              category: 'budget',
              priority: 'low',
              title: 'Budget Updated',
              message: `Budget for ${data?.category || 'category'} has been updated`
            });
            break;
            
          case 'delete':
            addNotification({
              type: 'warning',
              category: 'budget',
              priority: 'medium',
              title: 'Budget Deleted',
              message: `Budget for ${data?.category || 'category'} has been deleted`
            });
            break;
        }
      }),

      subscribe('account', (event) => {
        const { action, data } = event;
        
        switch (action) {
          case 'create':
            addNotification({
              type: 'success',
              category: 'account',
              priority: 'medium',
              title: 'Account Added',
              message: `${data?.name || 'New account'} has been added`
            });
            break;
            
          case 'update':
            addNotification({
              type: 'info',
              category: 'account',
              priority: 'low',
              title: 'Account Updated',
              message: `${data?.name || 'Account'} has been updated`
            });
            break;
            
          case 'delete':
            addNotification({
              type: 'warning',
              category: 'account',
              priority: 'medium',
              title: 'Account Deleted',
              message: `${data?.name || 'Account'} has been deleted`
            });
            break;
        }
      })
    ];

    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe());
    };
  }, [subscribe, addNotification]);

  return {
    notifications,
    unreadCount,
    addNotification,
    removeNotification,
    markAsRead,
    markAllAsRead,
    clearAll
  };
}

// Hook for budget warnings and alerts
export function useBudgetAlerts() {
  const { addNotification } = useNotifications();
  const { subscribe } = useRealtime();

  useEffect(() => {
    const unsubscribe = subscribe('budget', (event) => {
      const { action, data } = event;
      
      if (action === 'update' && data) {
        // Check if budget is over limit
        if (data.percentageUsed > 100) {
          addNotification({
            type: 'error',
            category: 'alert',
            priority: 'critical',
            title: 'Budget Exceeded!',
            message: `${data.category} budget is ${data.percentageUsed.toFixed(0)}% used (${data.spent > data.budget ? '$' + (data.spent - data.budget).toFixed(2) + ' over' : 'at limit'})`,
            autoHide: false,
            persistent: true,
            action: {
              label: 'View Budget',
              onClick: () => {
                window.location.href = '/budgets';
              }
            }
          });
        } else if (data.percentageUsed >= 80) {
          addNotification({
            type: 'warning',
            category: 'alert',
            priority: 'high',
            title: 'Budget Warning',
            message: `${data.category} budget is ${data.percentageUsed.toFixed(0)}% used`,
            duration: 8000
          });
        }
      }
    });

    return unsubscribe;
  }, [subscribe, addNotification]);
}

// Hook for account balance alerts
export function useAccountAlerts() {
  const { addNotification } = useNotifications();
  const { subscribe } = useRealtime();

  useEffect(() => {
    const unsubscribe = subscribe('account', (event) => {
      const { action, data } = event;
      
      if (action === 'update' && data) {
        // Low balance warning
        if (data.balance < 100 && data.balance >= 0) {
          addNotification({
            type: 'warning',
            category: 'alert',
            priority: 'high',
            title: 'Low Balance',
            message: `${data.name} has a low balance of $${data.balance.toFixed(2)}`,
            autoHide: false,
            persistent: true,
            action: {
              label: 'View Account',
              onClick: () => {
                window.location.href = '/accounts';
              }
            }
          });
        }
        
        // Negative balance alert
        if (data.balance < 0) {
          addNotification({
            type: 'error',
            category: 'alert',
            priority: 'critical',
            title: 'Negative Balance',
            message: `${data.name} has a negative balance of $${Math.abs(data.balance).toFixed(2)}`,
            autoHide: false,
            persistent: true,
            action: {
              label: 'View Account',
              onClick: () => {
                window.location.href = '/accounts';
              }
            }
          });
        }
      }
    });

    return unsubscribe;
  }, [subscribe, addNotification]);
}
