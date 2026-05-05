'use client';

import { useState } from 'react';
import { TransactionTemplate } from '@/lib/types';
import { useTransactionTemplates } from '@/hooks/useTransactionTemplates';
import { useCategories } from '@/hooks/useCategories';
import { useAccounts } from '@/hooks/useAccounts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Copy, 
  Star, 
  Layout,
  TrendingUp,
  Clock
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';

interface TemplateManagerProps {
  onUseTemplate?: (template: TransactionTemplate) => void;
}

export function TemplateManager({ onUseTemplate }: TemplateManagerProps) {
  const { 
    templates, 
    loading, 
    addTemplate, 
    updateTemplate, 
    deleteTemplate,
    getQuickAddTemplates,
    getMostUsedTemplates 
  } = useTransactionTemplates();
  
  const { categories } = useCategories();
  const { accounts } = useAccounts();

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<TransactionTemplate | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    amount: '',
    type: 'expense' as 'income' | 'expense',
    category: '',
    account: '',
    tags: '',
    isQuickAdd: false,
    icon: '📌',
    color: '#64748b'
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      amount: '',
      type: 'expense',
      category: '',
      account: '',
      tags: '',
      isQuickAdd: false,
      icon: '📌',
      color: '#64748b'
    });
  };

  const handleCreateTemplate = async () => {
    try {
      if (!formData.name || !formData.amount || !formData.category) {
        toast.error('Please fill in all required fields');
        return;
      }

      const templateData = {
        name: formData.name,
        description: formData.description || undefined,
        amount: parseFloat(formData.amount),
        type: formData.type,
        category: formData.category,
        account: formData.account || undefined,
        tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()).filter(Boolean) : undefined,
        isQuickAdd: formData.isQuickAdd,
        icon: formData.icon,
        color: formData.color,
      };

      await addTemplate(templateData);
      toast.success('Template created successfully');
      setShowCreateDialog(false);
      resetForm();
    } catch (error) {
      toast.error('Failed to create template');
    }
  };

  const handleEditTemplate = async () => {
    if (!selectedTemplate) return;

    try {
      const updates = {
        name: formData.name,
        description: formData.description || undefined,
        amount: parseFloat(formData.amount),
        type: formData.type,
        category: formData.category,
        account: formData.account || undefined,
        tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()).filter(Boolean) : undefined,
        isQuickAdd: formData.isQuickAdd,
        icon: formData.icon,
        color: formData.color,
      };

      await updateTemplate(selectedTemplate.id, updates);
      toast.success('Template updated successfully');
      setShowEditDialog(false);
      setSelectedTemplate(null);
      resetForm();
    } catch (error) {
      toast.error('Failed to update template');
    }
  };

  const handleDeleteTemplate = async (template: TransactionTemplate) => {
    try {
      await deleteTemplate(template.id);
      toast.success('Template deleted successfully');
    } catch (error) {
      toast.error('Failed to delete template');
    }
  };

  const handleEditTemplateClick = (template: TransactionTemplate) => {
    setSelectedTemplate(template);
    setFormData({
      name: template.name,
      description: template.description || '',
      amount: template.amount.toString(),
      type: template.type,
      category: template.category,
      account: template.account || '',
      tags: template.tags?.join(', ') || '',
      isQuickAdd: template.isQuickAdd || false,
      icon: template.icon || '📌',
      color: template.color || '#64748b'
    });
    setShowEditDialog(true);
  };

  const openCreateDialog = () => {
    resetForm();
    setShowCreateDialog(true);
  };

  const iconOptions = ['📌', '💰', '💼', '📈', '🍔', '🚗', '🛍️', '🎮', '📄', '🏥', '📚', '🏠', '⚡', '🛒', '🎬', '✈️'];
  const colorOptions = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#6366f1', '#14b8a6', '#84cc16', '#64748b'];

  const filteredCategories = categories.filter(cat => cat.type === formData.type);

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Transaction Templates</h2>
          <p className="text-muted-foreground">Quick-add templates for frequent transactions</p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Create Template
        </Button>
      </div>

      {/* Quick Add Templates */}
      {getQuickAddTemplates().length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3 flex items-center">
            <Star className="h-5 w-5 mr-2" />
            Quick Add
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {getQuickAddTemplates().map((template) => (
              <Card key={template.id} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl">{template.icon}</span>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEditTemplateClick(template)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteTemplate(template)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="text-sm font-medium">{template.name}</div>
                  <div className="text-xs text-muted-foreground">{formatCurrency(template.amount)}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Most Used Templates */}
      {getMostUsedTemplates().length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3 flex items-center">
            <TrendingUp className="h-5 w-5 mr-2" />
            Most Used
          </h3>
          <div className="space-y-2">
            {getMostUsedTemplates().map((template) => (
              <Card key={template.id} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{template.icon}</span>
                      <div>
                        <div className="font-medium">{template.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {formatCurrency(template.amount)} • {template.category} • Used {template.usageCount} times
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {onUseTemplate && (
                        <Button
                          size="sm"
                          onClick={() => onUseTemplate(template)}
                        >
                          <Copy className="h-3 w-3 mr-1" />
                          Use
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEditTemplateClick(template)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteTemplate(template)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* All Other Templates */}
      {templates.filter(t => !t.isQuickAdd && getMostUsedTemplates().findIndex(ut => ut.id === t.id) === -1).length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3 flex items-center">
            <Layout className="h-5 w-5 mr-2" />
            All Templates
          </h3>
          <div className="space-y-2">
            {templates
              .filter(t => !t.isQuickAdd && getMostUsedTemplates().findIndex(ut => ut.id === t.id) === -1)
              .map((template) => (
                <Card key={template.id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{template.icon}</span>
                        <div>
                          <div className="font-medium">{template.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {formatCurrency(template.amount)} • {template.category}
                            {template.lastUsed && (
                              <span className="ml-2 flex items-center">
                                <Clock className="h-3 w-3 mr-1" />
                                {new Date(template.lastUsed).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {onUseTemplate && (
                          <Button
                            size="sm"
                            onClick={() => onUseTemplate(template)}
                          >
                            <Copy className="h-3 w-3 mr-1" />
                            Use
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEditTemplateClick(template)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteTemplate(template)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </div>
      )}

      {templates.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <Layout className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No templates yet</h3>
            <p className="text-muted-foreground mb-4">
              Create templates for frequently used transactions to save time
            </p>
            <Button onClick={openCreateDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Template
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={showCreateDialog || showEditDialog} onOpenChange={(open) => {
        if (!open) {
          setShowCreateDialog(false);
          setShowEditDialog(false);
          setSelectedTemplate(null);
          resetForm();
        }
      }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {showEditDialog ? 'Edit Template' : 'Create New Template'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
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

            <div className="space-y-2">
              <Label htmlFor="name">Template Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Grocery Shopping"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                placeholder="Optional description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredCategories.map((category) => (
                      <SelectItem key={category.id} value={category.name}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {accounts.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="account">Default Account</Label>
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
              <Label htmlFor="tags">Default Tags (comma-separated)</Label>
              <Input
                id="tags"
                placeholder="urgent, business, travel"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Icon</Label>
                <div className="grid grid-cols-6 gap-2">
                  {iconOptions.map((icon) => (
                    <Button
                      key={icon}
                      type="button"
                      variant={formData.icon === icon ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFormData({ ...formData, icon })}
                      className="text-lg"
                    >
                      {icon}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Color</Label>
                <div className="grid grid-cols-5 gap-2">
                  {colorOptions.map((color) => (
                    <Button
                      key={color}
                      type="button"
                      variant={formData.color === color ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFormData({ ...formData, color })}
                      className="p-2"
                      style={{ backgroundColor: color, borderColor: color }}
                    >
                      <span className="text-white text-xs">●</span>
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="isQuickAdd"
                checked={formData.isQuickAdd}
                onCheckedChange={(checked) => setFormData({ ...formData, isQuickAdd: !!checked })}
              />
              <Label htmlFor="isQuickAdd">Show in Quick Add (appears as shortcut)</Label>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowCreateDialog(false);
                setShowEditDialog(false);
                setSelectedTemplate(null);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button onClick={showEditDialog ? handleEditTemplate : handleCreateTemplate}>
              {showEditDialog ? 'Update Template' : 'Create Template'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
