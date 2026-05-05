'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { QuickAddModal } from '@/components/forms/QuickAddModal';
import { Plus, X } from 'lucide-react';

interface FloatingActionButtonProps {
  className?: string;
}

export function FloatingActionButton({ className }: FloatingActionButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      {/* Floating Action Button */}
      <Button
        onClick={() => setIsModalOpen(true)}
        size="lg"
        className={`
          fixed bottom-6 right-6 z-50 
          h-14 w-14 rounded-full 
          shadow-lg hover:shadow-xl 
          transition-all duration-300 
          hover:scale-110 active:scale-95
          bg-primary text-primary-foreground
          md:hidden
          ${className}
        `}
        aria-label="Add transaction"
      >
        <Plus className="h-6 w-6" />
      </Button>

      {/* Quick Add Modal */}
      <QuickAddModal 
        open={isModalOpen} 
        onOpenChange={setIsModalOpen} 
      />
    </>
  );
}
