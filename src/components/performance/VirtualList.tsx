'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface VirtualListProps<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  overscan?: number;
  className?: string;
  getItemKey?: (item: T, index: number) => string | number;
}

export function VirtualList<T>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  overscan = 5,
  className,
  getItemKey = (_, index) => index,
}: VirtualListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleScroll = useCallback(() => {
    if (containerRef.current) {
      setScrollTop(containerRef.current.scrollTop);
    }
  }, []);

  const visibleRange = useMemo(() => {
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
      items.length - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    );
    return { startIndex, endIndex };
  }, [scrollTop, itemHeight, containerHeight, items.length, overscan]);

  const totalHeight = items.length * itemHeight;
  const offsetY = visibleRange.startIndex * itemHeight;

  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.startIndex, visibleRange.endIndex + 1);
  }, [items, visibleRange.startIndex, visibleRange.endIndex]);

  return (
    <div
      ref={containerRef}
      className={cn('overflow-auto', className)}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleItems.map((item, index) => {
            const actualIndex = visibleRange.startIndex + index;
            return (
              <div
                key={getItemKey(item, actualIndex)}
                style={{ height: itemHeight }}
                className="flex-shrink-0"
              >
                {renderItem(item, actualIndex)}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

interface VirtualNavigationItem {
  id: string;
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | null;
  description?: string;
  color?: string;
  draggable?: boolean;
}

interface VirtualNavigationProps {
  items: VirtualNavigationItem[];
  pathname: string;
  isCollapsed?: boolean;
  containerHeight?: number;
  showIcons?: boolean;
  onItemClick?: (item: VirtualNavigationItem) => void;
}

export function VirtualNavigation({
  items,
  pathname,
  isCollapsed = false,
  containerHeight = 400,
  showIcons = true,
  onItemClick,
}: VirtualNavigationProps) {
  const renderItem = useCallback(
    (item: VirtualNavigationItem, index: number) => {
      const isActive = pathname === item.href;
      
      return (
        <div className="px-2 py-1">
          <button
            className={cn(
              'w-full justify-start relative transition-all duration-300 hover:scale-[1.02] hover:shadow-sm active:scale-[0.98]',
              'flex items-center px-3 py-2 rounded-md text-sm font-medium',
              isActive
                ? 'bg-secondary text-secondary-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent'
            )}
            onClick={() => onItemClick?.(item)}
            title={isCollapsed ? `${item.name}: ${item.description}` : item.description}
          >
            {showIcons && item.icon && (
              <item.icon
                className={cn(
                  'h-4 w-4 transition-all duration-300 group-hover:scale-110 group-hover:rotate-12 flex-shrink-0',
                  !isCollapsed && 'mr-3',
                  item.color
                )}
              />
            )}
            {!isCollapsed && (
              <div className="flex items-center flex-1">
                <span className="truncate">{item.name}</span>
                {item.badge && (
                  <span
                    className={cn(
                      'ml-2 text-xs px-2 py-1 rounded-full',
                      item.badge === '!'
                        ? 'bg-red-500 text-white'
                        : 'bg-blue-500 text-white'
                    )}
                  >
                    {item.badge}
                  </span>
                )}
              </div>
            )}
          </button>
        </div>
      );
    },
    [pathname, isCollapsed, onItemClick]
  );

  return (
    <VirtualList
      items={items}
      itemHeight={44}
      containerHeight={containerHeight}
      renderItem={renderItem}
      getItemKey={(item) => item.id}
      overscan={3}
    />
  );
}
