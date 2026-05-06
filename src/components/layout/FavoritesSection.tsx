'use client';

import { memo } from 'react';
import { Button } from '@/components/ui/button';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { NavigationItem } from '@/components/performance/OptimizedComponents';
import { getIcon } from '@/lib/iconMapping';

interface FavoritesSectionProps {
  items: Array<{
    id: string;
    name: string;
    href: string;
    icon: string | React.ComponentType<{ className?: string }>;
    description?: string;
    color?: string;
  }>;
  pathname: string;
  onToggleFavorite: (id: string) => void;
  showIcons?: boolean;
}

export const FavoritesSection = memo(function FavoritesSection({
  items,
  pathname,
  onToggleFavorite,
  showIcons = true,
}: FavoritesSectionProps) {
  if (items.length === 0) return null;

  return (
    <div className="px-3 py-2">
      <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight flex items-center">
        {showIcons && <Star className="h-4 w-4 mr-2 text-yellow-500" />}
        Favorites
      </h2>
      <div className="space-y-1">
        {items.map((item) => (
          <NavigationItem
            key={item.id}
            name={item.name}
            href={item.href}
            icon={typeof item.icon === 'string' ? getIcon(item.icon) : item.icon}
            description={item.description}
            color={item.color}
            isActive={pathname === item.href}
            isCollapsed={false}
            showIcons={showIcons}
          />
        ))}
      </div>
    </div>
  );
});
