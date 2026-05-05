'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Download, FileDown, FileSpreadsheet, FileText } from 'lucide-react';
import { Transaction } from '@/lib/types';
import { formatDate, formatCurrency } from '@/lib/utils';

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transactions: Transaction[];
  selectedIds?: string[];
  onExportComplete?: () => void;
}

interface ExportOptions {
  format: 'json' | 'csv' | 'xlsx' | 'pdf';
  includeHeaders: boolean;
  includeMetadata: boolean;
  dateRange: 'all' | 'custom';
  startDate?: string;
  endDate?: string;
  customFileName?: string;
}

export function ExportDialog({ open, onOpenChange, transactions, selectedIds = [], onExportComplete }: ExportDialogProps) {
  const [options, setOptions] = useState<ExportOptions>({
    format: 'json',
    includeHeaders: true,
    includeMetadata: true,
    dateRange: 'all',
  });

  const transactionsToExport = selectedIds.length > 0 
    ? transactions.filter(t => selectedIds.includes(t.id))
    : transactions;

  const handleExport = () => {
    try {
      let data: string;
      let mimeType: string;
      let fileName: string;

      const baseFileName = options.customFileName 
        ? options.customFileName 
        : selectedIds.length > 0 
          ? `selected-transactions-${formatDate(new Date(), 'yyyy-MM-dd')}`
          : `transactions-${formatDate(new Date(), 'yyyy-MM-dd')}`;

      switch (options.format) {
        case 'json':
          data = exportToJSON();
          mimeType = 'application/json';
          fileName = `${baseFileName}.json`;
          break;
        case 'csv':
          data = exportToCSV();
          mimeType = 'text/csv';
          fileName = `${baseFileName}.csv`;
          break;
        case 'xlsx':
          // Excel format - using CSV with .xlsx extension for Excel compatibility
          data = exportToCSV();
          mimeType = 'text/csv';
          fileName = `${baseFileName}.xlsx`;
          break;
        case 'pdf':
          // For PDF, we'll create a simple text format for now (in a real app, you'd use a library like jsPDF)
          data = exportToPDF();
          mimeType = 'application/pdf';
          fileName = `${baseFileName}.pdf`;
          break;
        default:
          data = exportToJSON();
          mimeType = 'application/json';
          fileName = `${baseFileName}.json`;
      }

      // Create download link
      const blob = new Blob([data], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // Call export complete callback
      if (onExportComplete) {
        onExportComplete();
      }

      onOpenChange(false);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const exportToJSON = (): string => {
    const exportData = {
      metadata: options.includeMetadata ? {
        exportedAt: new Date().toISOString(),
        count: transactionsToExport.length,
        dateRange: options.dateRange === 'custom' 
          ? { start: options.startDate, end: options.endDate }
          : 'all',
        totalAmount: transactionsToExport.reduce((sum, t) => sum + t.amount, 0),
      } : undefined,
      transactions: transactionsToExport
    };

    return JSON.stringify(exportData, null, 2);
  };

  const exportToCSV = (): string => {
    const headers = options.includeHeaders ? 
      'Date,Description,Category,Type,Amount,Account,Tags\n' : '';
    
    const rows = transactionsToExport.map(t => {
      const date = formatDate(t.date);
      const description = `"${t.description.replace(/"/g, '""')}"`;
      const category = t.category;
      const type = t.type;
      const amount = t.amount.toString();
      const account = t.account || '';
      const tags = (t.tags || []).join(';');
      
      return `${date},${description},${category},${type},${amount},${account},${tags}`;
    }).join('\n');

    // Add BOM for better Excel compatibility with UTF-8
    const BOM = '\uFEFF';
    return BOM + headers + rows;
  };

  const exportToPDF = (): string => {
    const title = selectedIds.length > 0 ? 'Selected Transactions' : 'All Transactions';
    const date = formatDate(new Date());
    
    let content = `${title}\n`;
    content += `Exported: ${date}\n`;
    content += `Total: ${transactionsToExport.length} transactions\n\n`;
    
    if (options.includeMetadata) {
      const totalAmount = transactionsToExport.reduce((sum, t) => sum + t.amount, 0);
      content += `Summary:\n`;
      content += `Total Amount: ${formatCurrency(totalAmount)}\n`;
      content += `Income: ${formatCurrency(transactionsToExport.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0))}\n`;
      content += `Expenses: ${formatCurrency(transactionsToExport.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0))}\n\n`;
    }
    
    content += 'Transactions:\n';
    content += '─'.repeat(80) + '\n';
    
    transactionsToExport.forEach((t, index) => {
      content += `${index + 1}. ${formatDate(t.date)} - ${t.description}\n`;
      content += `   Category: ${t.category} | Type: ${t.type} | Amount: ${formatCurrency(t.amount)}\n`;
      if (t.account) content += `   Account: ${t.account}\n`;
      if (t.tags && t.tags.length > 0) content += `   Tags: ${t.tags.join(', ')}\n`;
      content += '\n';
    });

    return content;
  };

  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'json': return <FileDown className="h-4 w-4" />;
      case 'csv': return <FileSpreadsheet className="h-4 w-4" />;
      case 'xlsx': return <FileSpreadsheet className="h-4 w-4" />;
      case 'pdf': return <FileText className="h-4 w-4" />;
      default: return <Download className="h-4 w-4" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
              <Download className="h-5 w-5 text-green-600" />
            </div>
            <DialogTitle>Export Transactions</DialogTitle>
          </div>
          <DialogDescription>
            Export {selectedIds.length > 0 ? selectedIds.length : transactionsToExport.length} transactions in your preferred format.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Format Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Export Format</Label>
            <div className="text-xs text-muted-foreground mb-2">
              Note: Excel export creates a CSV file that can be opened directly in Excel
            </div>
            <RadioGroup 
              value={options.format} 
              onValueChange={(value: any) => setOptions(prev => ({ ...prev, format: value }))}
              className="grid grid-cols-2 gap-3"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="json" id="json" />
                <Label htmlFor="json" className="flex items-center cursor-pointer">
                  <FileDown className="h-4 w-4 mr-2" />
                  JSON
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="csv" id="csv" />
                <Label htmlFor="csv" className="flex items-center cursor-pointer">
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  CSV
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="xlsx" id="xlsx" />
                <Label htmlFor="xlsx" className="flex items-center cursor-pointer">
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Excel (CSV)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="pdf" id="pdf" />
                <Label htmlFor="pdf" className="flex items-center cursor-pointer">
                  <FileText className="h-4 w-4 mr-2" />
                  PDF
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Options */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Export Options</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="headers" 
                  checked={options.includeHeaders}
                  onCheckedChange={(checked) => setOptions(prev => ({ ...prev, includeHeaders: !!checked }))}
                />
                <Label htmlFor="headers" className="text-sm">Include column headers (CSV/Excel)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="metadata" 
                  checked={options.includeMetadata}
                  onCheckedChange={(checked) => setOptions(prev => ({ ...prev, includeMetadata: !!checked }))}
                />
                <Label htmlFor="metadata" className="text-sm">Include metadata and summary</Label>
              </div>
            </div>
          </div>

          {/* File Name */}
          <div className="space-y-2">
            <Label htmlFor="filename" className="text-sm font-medium">Custom File Name (optional)</Label>
            <Input
              id="filename"
              placeholder="transactions-export"
              value={options.customFileName || ''}
              onChange={(e) => setOptions(prev => ({ ...prev, customFileName: e.target.value }))}
            />
          </div>

          {/* Summary */}
          <div className="bg-muted p-3 rounded-lg">
            <div className="text-sm space-y-1">
              <div className="flex justify-between">
                <span>Transactions to export:</span>
                <span className="font-medium">{transactionsToExport.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Format:</span>
                <span className="font-medium flex items-center">
                  {getFormatIcon(options.format)}
                  <span className="ml-1">{options.format.toUpperCase()}</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleExport} className="flex items-center">
            <Download className="mr-2 h-4 w-4" />
            Export {transactionsToExport.length} Transactions
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
