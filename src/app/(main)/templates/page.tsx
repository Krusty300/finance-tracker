'use client';

import { TemplateManager } from '@/components/templates/TemplateManager';
import { TransactionTemplate } from '@/lib/types';
import { useTransactionTemplates } from '@/hooks/useTransactionTemplates';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function TemplatesPage() {
  const { useTemplate } = useTransactionTemplates();
  const router = useRouter();

  const handleUseTemplate = (template: TransactionTemplate) => {
    try {
      const transaction = useTemplate(template);
      
      // Navigate to transactions page with pre-filled data
      const params = new URLSearchParams({
        amount: transaction.amount.toString(),
        type: transaction.type,
        category: transaction.category,
        description: transaction.description,
        ...(transaction.account && { account: transaction.account }),
        ...(transaction.tags && transaction.tags.length > 0 && { tags: transaction.tags.join(',') }),
      });
      
      router.push(`/transactions?${params.toString()}`);
      toast.success('Template applied! Complete the transaction details.');
    } catch (error) {
      toast.error('Failed to use template');
    }
  };

  return (
    <div className="container mx-auto py-6">
      <TemplateManager onUseTemplate={handleUseTemplate} />
    </div>
  );
}
