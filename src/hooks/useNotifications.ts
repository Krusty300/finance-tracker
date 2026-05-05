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

  // Add a new notification
  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp' | 'read' | 'archived'>) => {
    const newNotification: Notification = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      read: false,
      archived: false,
      autoHide: true,
      duration: notification.type === 'error' ? 8000 : notification.type === 'warning' ? 6000 : 5000,
      ...notification
    };

    setNotifications(prev => [newNotification, ...prev]);

    // Save to localStorage for persistence
    try {
      const savedNotifications = localStorage.getItem('notifications');
      const existing = savedNotifications ? JSON.parse(savedNotifications) : [];
      const updated = [newNotification, ...existing.slice(0, 99)]; // Keep max 100
      localStorage.setItem('notifications', JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to save notification to localStorage:', error);
    }

    // Auto-hide if specified
    if (newNotification.autoHide && newNotification.duration && !newNotification.persistent) {
      setTimeout(() => {
        removeNotification(newNotification.id);
      }, newNotification.duration);
    }

    return newNotification.id;
  }, []);

  // Remove a notification
  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  // Mark as read
  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  }, []);

  // Mark all as read
  const markAllAsRead = useCallback(() => {
    setNotifications(prev => 
      prev.map(n => ({ ...n, read: true }))
    );
  }, []);

  // Clear all notifications
  const clearAll = useCallback(() => {
    setNotifications([]);
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
