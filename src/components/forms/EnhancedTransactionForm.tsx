'use client';

import { useState, useEffect } from 'react';
import { Transaction, TransactionSplit, TransactionAttachment, RecurringTransactionRule } from '@/lib/types';
import { useCategories } from '@/hooks/useCategories';
import { useAccounts } from '@/hooks/useAccounts';
import { useTransactionTemplates } from '@/hooks/useTransactionTemplates';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { 
  Plus, 
  X, 
  Upload, 
  FileText, 
  Image, 
  StickyNote, 
  Repeat, 
  Calculator,
  Layout,
  Camera
} from 'lucide-react';
import { useCurrency } from '@/contexts/CurrencyContext';

interface EnhancedTransactionFormProps {
  onSubmit: (transaction: Omit<Transaction, 'id'>) => void;
  onSubmitRecurring?: (transaction: Omit<Transaction, 'id'>, recurringRule: RecurringTransactionRule) => void;
  onSubmitSplit?: (transaction: Omit<Transaction, 'id'>, splits: TransactionSplit[]) => void;
  initialData?: Partial<Transaction>;
  onCancel?: () => void;
  submitText?: string;
  className?: string;
}

export function EnhancedTransactionForm({
  onSubmit,
  onSubmitRecurring,
  onSubmitSplit,
  initialData,
  onCancel,
  submitText = 'Add Transaction',
  className
}: EnhancedTransactionFormProps) {
  const { formatCurrency, currency, getCurrencySymbol } = useCurrency();
  const { categories } = useCategories();
  const { accounts } = useAccounts();
  const { templates, getQuickAddTemplates, getMostUsedTemplates, useTemplate } = useTransactionTemplates();

  const [formData, setFormData] = useState({
    amount: '',
    type: 'expense' as 'income' | 'expense',
    category: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
    account: '',
    tags: '',
    notes: ''
  });

  const [splits, setSplits] = useState<TransactionSplit[]>([]);
  const [attachments, setAttachments] = useState<TransactionAttachment[]>([]);
  const [isRecurring, setIsRecurring] = useState(false);
  const [isSplit, setIsSplit] = useState(false);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  
  const [recurringRule, setRecurringRule] = useState<RecurringTransactionRule>({
    id: crypto.randomUUID(),
    frequency: 'monthly',
    interval: 1,
    nextDate: new Date().toISOString().split('T')[0],
  });

  const [newSplit, setNewSplit] = useState({
    category: '',
    amount: '',
    description: ''
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        amount: initialData.amount?.toString() || '',
        type: initialData.type || 'expense',
        category: initialData.category || '',
        date: initialData.date || new Date().toISOString().split('T')[0],
        description: initialData.description || '',
        account: initialData.account || '',
        tags: initialData.tags?.join(', ') || '',
        notes: initialData.notes || ''
      });
      
      if (initialData.splits) {
        setSplits(initialData.splits);
        setIsSplit(true);
      }
      
      if (initialData.isRecurring && initialData.recurringRule) {
        setRecurringRule(initialData.recurringRule);
        setIsRecurring(true);
      }
      
      if (initialData.attachments) {
        setAttachments(initialData.attachments);
      }
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.amount || !formData.category || !formData.description) {
      return;
    }

    const transaction: Omit<Transaction, 'id'> = {
      amount: parseFloat(formData.amount),
      type: formData.type,
      category: formData.category,
      date: formData.date,
      description: formData.description,
      account: formData.account || undefined,
      tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()).filter(Boolean) : undefined,
      notes: formData.notes || undefined,
      splits: isSplit && splits.length > 0 ? splits : undefined,
      attachments: attachments.length > 0 ? attachments : undefined,
    };

    if (isRecurring && onSubmitRecurring) {
      onSubmitRecurring(transaction, recurringRule);
    } else if (isSplit && onSubmitSplit && splits.length > 0) {
      onSubmitSplit(transaction, splits);
    } else {
      onSubmit(transaction);
    }
  };

  const handleAddSplit = () => {
    if (!newSplit.category || !newSplit.amount) return;
    
    const split: TransactionSplit = {
      category: newSplit.category,
      amount: parseFloat(newSplit.amount),
      description: newSplit.description || undefined,
    };
    
    setSplits([...splits, split]);
    setNewSplit({ category: '', amount: '', description: '' });
  };

  const handleRemoveSplit = (index: number) => {
    setSplits(splits.filter((_, i) => i !== index));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const attachment: TransactionAttachment = {
          id: crypto.randomUUID(),
          name: file.name,
          type: file.type.startsWith('image/') ? 'image' : 'document',
          data: event.target?.result as string,
          size: file.size,
          createdAt: new Date().toISOString(),
        };
        setAttachments([...attachments, attachment]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleAddNote = () => {
    const note: TransactionAttachment = {
      id: crypto.randomUUID(),
      name: `Note ${attachments.length + 1}`,
      type: 'note',
      content: '',
      createdAt: new Date().toISOString(),
    };
    setAttachments([...attachments, note]);
  };

  const handleRemoveAttachment = (id: string) => {
    setAttachments(attachments.filter(a => a.id !== id));
  };

  const handleUseTemplate = async (template: any) => {
    const transaction = await useTemplate(template);
    setFormData({
      amount: transaction.amount.toString(),
      type: transaction.type,
      category: transaction.category,
      date: transaction.date,
      description: transaction.description,
      account: transaction.account || '',
      tags: transaction.tags?.join(', ') || '',
      notes: ''
    });
    
    if (transaction.splits) {
      setSplits(transaction.splits);
      setIsSplit(true);
    }
    
    setShowTemplateDialog(false);
  };

  const totalSplitAmount = splits.reduce((sum, split) => sum + split.amount, 0);
  const isValidSplit = !formData.amount || totalSplitAmount === parseFloat(formData.amount);

  const filteredCategories = categories.filter(cat => cat.type === formData.type);

  return (
    <div className={className}>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Transaction Type Toggle */}
        <div className="flex gap-2">
          <Button
            type="button"
            variant={formData.type === 'income' ? 'default' : 'outline'}
            onClick={() => setFormData({ ...formData, type: 'income', category: '' })}
            className="flex-1"
          >
            Income
          </Button>
          <Button
            type="button"
            variant={formData.type === 'expense' ? 'default' : 'outline'}
            onClick={() => setFormData({ ...formData, type: 'expense', category: '' })}
            className="flex-1"
          >
            Expense
          </Button>
        </div>

        {/* Basic Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Amount ({getCurrencySymbol(currency)}) *</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              placeholder={`0.00 ${getCurrencySymbol(currency)}`}
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              required
            />
            {formData.amount && (
              <p className="text-xs text-muted-foreground">
                Preview: {formatCurrency(parseFloat(formData.amount) || 0)}
              </p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="date">Date *</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description *</Label>
          <Input
            id="description"
            placeholder="What was this transaction for?"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">Category *</Label>
          <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              {filteredCategories.map((category) => (
                <SelectItem key={category.id} value={category.name}>
                  <span>{category.name}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {accounts.length > 0 && (
          <div className="space-y-2">
            <Label htmlFor="account">Account</Label>
            <Select value={formData.account} onValueChange={(value) => setFormData({ ...formData, account: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select account" />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((account) => (
                  <SelectItem key={account.id} value={account.name}>
                    {account.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="tags">Tags (comma-separated)</Label>
          <Input
            id="tags"
            placeholder="urgent, business, travel"
            value={formData.tags}
            onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
          />
        </div>

        {/* Advanced Features Tabs */}
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic">Basic</TabsTrigger>
            <TabsTrigger value="split">Split</TabsTrigger>
            <TabsTrigger value="recurring">Recurring</TabsTrigger>
            <TabsTrigger value="attachments">Attachments</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Input
                id="notes"
                placeholder="Add any additional notes..."
                value={formData.notes}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>
          </TabsContent>

          <TabsContent value="split" className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isSplit"
                checked={isSplit}
                onCheckedChange={(checked) => setIsSplit(checked as boolean)}
              />
              <Label htmlFor="isSplit">Split this transaction across multiple categories</Label>
            </div>

            {isSplit && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Transaction Splits</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Current splits */}
                  {splits.map((split, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded">
                      <span className="flex-1 text-sm">{split.category}</span>
                      <span className="text-sm font-medium">{formatCurrency(split.amount)}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveSplit(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}

                  {/* Add new split */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                    <Select value={newSplit.category} onValueChange={(value) => setNewSplit({ ...newSplit, category: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Category" />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredCategories.map((category) => (
                          <SelectItem key={category.id} value={category.name}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      placeholder={`0.00 ${getCurrencySymbol(currency)}`}
                      type="number"
                      step="0.01"
                      value={newSplit.amount}
                      onChange={(e) => setNewSplit({ ...newSplit, amount: e.target.value })}
                    />
                    <Input
                      placeholder="Description (optional)"
                      value={newSplit.description}
                      onChange={(e) => setNewSplit({ ...newSplit, description: e.target.value })}
                    />
                    <Button type="button" onClick={handleAddSplit} disabled={!newSplit.category || !newSplit.amount}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>

                  {!isValidSplit && (
                    <p className="text-sm text-destructive">
                      Split amounts must equal total: {formatCurrency(totalSplitAmount)} / {formatCurrency(parseFloat(formData.amount) || 0)}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="recurring" className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isRecurring"
                checked={isRecurring}
                onCheckedChange={(checked) => setIsRecurring(checked as boolean)}
              />
              <Label htmlFor="isRecurring">This is a recurring transaction</Label>
            </div>

            {isRecurring && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Recurring Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Frequency</Label>
                      <Select value={recurringRule.frequency} onValueChange={(value: any) => setRecurringRule({ ...recurringRule, frequency: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="biweekly">Bi-weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="quarterly">Quarterly</SelectItem>
                          <SelectItem value="yearly">Yearly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Every</Label>
                      <Input
                        type="number"
                        min="1"
                        value={recurringRule.interval}
                        onChange={(e) => setRecurringRule({ ...recurringRule, interval: parseInt(e.target.value) || 1 })}
                        placeholder="1"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Next Date</Label>
                    <Input
                      type="date"
                      value={recurringRule.nextDate}
                      onChange={(e) => setRecurringRule({ ...recurringRule, nextDate: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>End Date (optional)</Label>
                    <Input
                      type="date"
                      value={recurringRule.endDate || ''}
                      onChange={(e) => setRecurringRule({ ...recurringRule, endDate: e.target.value || undefined })}
                    />
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="attachments" className="space-y-4">
            <div className="space-y-4">
              {/* Upload buttons */}
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => document.getElementById('file-upload')?.click()}>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload File
                </Button>
                <Button type="button" variant="outline" onClick={handleAddNote}>
                  <StickyNote className="h-4 w-4 mr-2" />
                  Add Note
                </Button>
              </div>
              
              <input
                id="file-upload"
                type="file"
                multiple
                accept="image/*,.pdf,.doc,.docx,.txt"
                onChange={handleFileUpload}
                className="hidden"
              />

              {/* Current attachments */}
              {attachments.map((attachment) => (
                <div key={attachment.id} className="flex items-center gap-2 p-2 bg-muted rounded">
                  {attachment.type === 'image' && <Image className="h-4 w-4" />}
                  {attachment.type === 'document' && <FileText className="h-4 w-4" />}
                  {attachment.type === 'note' && <StickyNote className="h-4 w-4" />}
                  <span className="flex-1 text-sm truncate">{attachment.name}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveAttachment(attachment.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Template Selection */}
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => setShowTemplateDialog(true)}>
            <Layout className="h-4 w-4 mr-2" />
            Use Template
          </Button>
        </div>

        {/* Form Actions */}
        <div className="flex gap-2">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={!isValidSplit}>
            {submitText}
          </Button>
        </div>
      </form>

      {/* Template Selection Dialog */}
      <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Select a Template</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Quick Add Templates */}
            {getQuickAddTemplates().length > 0 && (
              <div>
                <h3 className="text-sm font-medium mb-2">Quick Add</h3>
                <div className="grid grid-cols-2 gap-2">
                  {getQuickAddTemplates().map((template) => (
                    <Button
                      key={template.id}
                      variant="outline"
                      onClick={() => handleUseTemplate(template)}
                      className="justify-start"
                    >
                      <span className="mr-2">{template.icon}</span>
                      {template.name}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Most Used Templates */}
            {getMostUsedTemplates().length > 0 && (
              <div>
                <h3 className="text-sm font-medium mb-2">Most Used</h3>
                <div className="space-y-2">
                  {getMostUsedTemplates().map((template) => (
                    <Button
                      key={template.id}
                      variant="outline"
                      onClick={() => handleUseTemplate(template)}
                      className="w-full justify-start"
                    >
                      <span className="mr-2">{template.icon}</span>
                      <div className="text-left">
                        <div>{template.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {formatCurrency(template.amount)} • Used {template.usageCount} times
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* All Templates */}
            {templates.filter(t => !t.isQuickAdd).length > 0 && (
              <div>
                <h3 className="text-sm font-medium mb-2">All Templates</h3>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {templates.filter(t => !t.isQuickAdd).map((template) => (
                    <Button
                      key={template.id}
                      variant="outline"
                      onClick={() => handleUseTemplate(template)}
                      className="w-full justify-start"
                    >
                      <span className="mr-2">{template.icon}</span>
                      <div className="text-left">
                        <div>{template.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {formatCurrency(template.amount)} • {template.category}
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
