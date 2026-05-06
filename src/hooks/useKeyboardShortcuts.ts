import { useEffect, useCallback } from 'react';

export interface KeyboardShortcuts {
  onNewTransaction?: () => void;
  onSearchFocus?: () => void;
  onDelete?: () => void;
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcuts) {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Ignore if user is typing in an input field
    const target = event.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
      return;
    }

    // Check for modifier keys
    const ctrlKey = event.ctrlKey || event.metaKey;
    const shiftKey = event.shiftKey;
    const altKey = event.altKey;

    // Ctrl+N or Cmd+N - New transaction
    if (ctrlKey && event.key === 'n' && !shiftKey && !altKey) {
      event.preventDefault();
      shortcuts.onNewTransaction?.();
    }

    // Ctrl+F or Cmd+F - Focus search
    if (ctrlKey && event.key === 'f' && !shiftKey && !altKey) {
      event.preventDefault();
      shortcuts.onSearchFocus?.();
    }

    // Delete key - Bulk delete (when items are selected)
    if (event.key === 'Delete' && !ctrlKey && !shiftKey && !altKey) {
      event.preventDefault();
      shortcuts.onDelete?.();
    }

    // Escape - Close dialogs/clear selection
    if (event.key === 'Escape' && !ctrlKey && !shiftKey && !altKey) {
      event.preventDefault();
      // This will be handled by individual components
    }
  }, [shortcuts]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
}
