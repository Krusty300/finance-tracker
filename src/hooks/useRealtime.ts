import { useState, useEffect, useCallback, useRef } from 'react';

// Extend Window interface for tab ID
declare global {
  interface Window {
    realtimeTabId?: string;
  }
}

export type RealtimeEvent = {
  id: string;
  type: 'transaction' | 'budget' | 'account' | 'category' | 'template' | 'notification';
  action: 'create' | 'update' | 'delete' | 'sync';
  data?: any;
  timestamp: number;
  source?: string;
};

export type RealtimeListener = (event: RealtimeEvent) => void;

class RealtimeEventManager {
  private listeners: Map<string, RealtimeListener[]> = new Map();
  private eventHistory: RealtimeEvent[] = [];
  private maxHistorySize = 100;

  // Subscribe to events
  subscribe(eventType: string, listener: RealtimeListener): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }
    
    const listeners = this.listeners.get(eventType)!;
    listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }

  // Emit an event
  emit(event: Omit<RealtimeEvent, 'id' | 'timestamp'>): void {
    const fullEvent: RealtimeEvent = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      ...event
    };

    // Add to history
    this.eventHistory.unshift(fullEvent);
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory = this.eventHistory.slice(0, this.maxHistorySize);
    }

    // Notify listeners
    const listeners = this.listeners.get(event.type) || [];
    listeners.forEach(listener => {
      try {
        listener(fullEvent);
      } catch (error) {
        console.error('Error in realtime listener:', error);
      }
    });

    // Also notify general listeners
    const generalListeners = this.listeners.get('*') || [];
    generalListeners.forEach(listener => {
      try {
        listener(fullEvent);
      } catch (error) {
        console.error('Error in general realtime listener:', error);
      }
    });

    // Store in localStorage for cross-tab communication
    this.storeEvent(fullEvent);
  }

  // Get event history
  getHistory(type?: string, limit?: number): RealtimeEvent[] {
    let events = this.eventHistory;
    if (type) {
      events = events.filter(e => e.type === type);
    }
    return limit ? events.slice(0, limit) : events;
  }

  // Clear history
  clearHistory(): void {
    this.eventHistory = [];
  }

  // Store event in localStorage for cross-tab communication
  private storeEvent(event: RealtimeEvent): void {
    try {
      const key = `realtime-event-${event.id}`;
      localStorage.setItem(key, JSON.stringify(event));
      
      // Clean up old events
      Object.keys(localStorage)
        .filter(k => k.startsWith('realtime-event-'))
        .slice(50) // Keep only last 50 events
        .forEach(k => localStorage.removeItem(k));
    } catch (error) {
      console.error('Failed to store event in localStorage:', error);
    }
  }

  // Listen for storage events from other tabs
  initCrossTabCommunication(): void {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key?.startsWith('realtime-event-') && e.newValue) {
        try {
          const event = JSON.parse(e.newValue) as RealtimeEvent;
          // Don't echo back events from this tab
          if (event.source !== this.getCurrentTabId()) {
            this.emitLocal(event);
          }
        } catch (error) {
          console.error('Failed to parse stored event:', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
  }

  private emitLocal(event: RealtimeEvent): void {
    const listeners = this.listeners.get(event.type) || [];
    listeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Error in realtime listener:', error);
      }
    });

    const generalListeners = this.listeners.get('*') || [];
    generalListeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Error in general realtime listener:', error);
      }
    });
  }

  public getCurrentTabId(): string {
    // Simple tab identification - could be enhanced
    if (typeof window === 'undefined') return 'server';
    
    if (!window.realtimeTabId) {
      window.realtimeTabId = `tab-${Date.now()}-${Math.random()}`;
    }
    return window.realtimeTabId;
  }
}

// Global instance
const realtimeManager = new RealtimeEventManager();

// Initialize cross-tab communication
if (typeof window !== 'undefined') {
  realtimeManager.initCrossTabCommunication();
}

// Hook for using realtime events
export function useRealtime() {
  const [lastEvent, setLastEvent] = useState<RealtimeEvent | null>(null);
  const listenersRef = useRef<Map<string, () => void>>(new Map());

  // Subscribe to events
  const subscribe = useCallback((eventType: string, listener: RealtimeListener) => {
    const unsubscribe = realtimeManager.subscribe(eventType, (event) => {
      setLastEvent(event);
      listener(event);
    });
    
    // Store unsubscribe function
    listenersRef.current.set(eventType, unsubscribe);
    
    return unsubscribe;
  }, []);

  // Emit events
  const emit = useCallback((event: Omit<RealtimeEvent, 'id' | 'timestamp'>) => {
    const fullEvent = {
      ...event,
      source: realtimeManager.getCurrentTabId()
    };
    realtimeManager.emit(fullEvent);
  }, []);

  // Get event history
  const getHistory = useCallback((type?: string, limit?: number) => {
    return realtimeManager.getHistory(type, limit);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      listenersRef.current.forEach(unsubscribe => unsubscribe());
      listenersRef.current.clear();
    };
  }, []);

  return {
    subscribe,
    emit,
    getHistory,
    lastEvent
  };
}

// Specific hooks for common use cases
export function useRealtimeTransactions() {
  const { subscribe, emit } = useRealtime();
  const [lastTransactionEvent, setLastTransactionEvent] = useState<RealtimeEvent | null>(null);

  useEffect(() => {
    const unsubscribe = subscribe('transaction', (event) => {
      setLastTransactionEvent(event);
    });
    return unsubscribe;
  }, [subscribe]);

  const notifyTransactionChange = useCallback((action: 'create' | 'update' | 'delete', data?: any) => {
    emit({
      type: 'transaction',
      action,
      data
    });
  }, [emit]);

  return {
    lastTransactionEvent,
    notifyTransactionChange
  };
}

export function useRealtimeBudgets() {
  const { subscribe, emit } = useRealtime();
  const [lastBudgetEvent, setLastBudgetEvent] = useState<RealtimeEvent | null>(null);

  useEffect(() => {
    const unsubscribe = subscribe('budget', (event) => {
      setLastBudgetEvent(event);
    });
    return unsubscribe;
  }, [subscribe]);

  const notifyBudgetChange = useCallback((action: 'create' | 'update' | 'delete', data?: any) => {
    emit({
      type: 'budget',
      action,
      data
    });
  }, [emit]);

  return {
    lastBudgetEvent,
    notifyBudgetChange
  };
}

export function useRealtimeAccounts() {
  const { subscribe, emit } = useRealtime();
  const [lastAccountEvent, setLastAccountEvent] = useState<RealtimeEvent | null>(null);

  useEffect(() => {
    const unsubscribe = subscribe('account', (event) => {
      setLastAccountEvent(event);
    });
    return unsubscribe;
  }, [subscribe]);

  const notifyAccountChange = useCallback((action: 'create' | 'update' | 'delete', data?: any) => {
    emit({
      type: 'account',
      action,
      data
    });
  }, [emit]);

  return {
    lastAccountEvent,
    notifyAccountChange
  };
}

export { realtimeManager };
