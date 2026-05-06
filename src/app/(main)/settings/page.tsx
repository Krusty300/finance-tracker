'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Download, 
  Upload, 
  Database, 
  CheckCircle, 
  AlertTriangle,
  Monitor,
  Sun,
  Moon,
  DollarSign,
  Globe,
  Settings as SettingsIcon,
  RefreshCw,
  Trash2
} from 'lucide-react';
import { verifyDataPersistence, verifyLocalStorage } from '@/lib/dataVerification';
import { seedSampleData } from '@/lib/seedData';
import { db } from '@/lib/db';
import { useTheme } from '@/contexts/ThemeContext';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useFormatting } from '@/contexts/FormattingContext';
import { OnboardingProgress } from '@/components/onboarding/OnboardingProgress';
import { CurrencyConverter } from '@/components/settings/CurrencyConverter';
import { FormattingPreview } from '@/components/settings/FormattingPreview';
import { FinancialCalculator } from '@/components/settings/FinancialCalculator';
import { ThemeSettings } from '@/components/settings/ThemeSettings';
import { toast } from 'sonner';

export default function SettingsPage() {
  const { resetOnboarding, progress } = useOnboarding();
  const { currency, setCurrency, formatCurrency, availableCurrencies, getCurrencySymbol } = useCurrency();
  const { 
    dateFormat, 
    setDateFormat, 
    numberFormat, 
    setNumberFormat, 
    formatDate: formatDateString,
    formatNumber,
    availableDateFormats,
    availableNumberFormats
  } = useFormatting();
  
  // Import/Export Settings
  const [exportFormat, setExportFormat] = useState('json');
  const [includeDeleted, setIncludeDeleted] = useState(false);
  const [dateRange, setDateRange] = useState('all');
  
  // Application Status
  const [appStatus, setAppStatus] = useState({
    localStorage: 'checking',
    database: 'checking',
    storage: 'checking',
    fonts: 'checking',
    components: 'checking'
  });

  // Check application status
  useEffect(() => {
    const checkStatus = () => {
      const status = {
        localStorage: localStorage ? 'available' : 'unavailable',
        database: (() => {
          try {
            db.getTransactions();
            return 'connected';
          } catch {
            return 'error';
          }
        })(),
        storage: (() => {
          const storageUsed = JSON.stringify(localStorage).length;
          const storageAvailable = 5 * 1024 * 1024; // 5MB estimate
          return storageUsed < storageAvailable * 0.8 ? 'available' : 'limited';
        })(),
        fonts: 'loaded', // Could check for specific fonts
        components: 'active'
      };
      setAppStatus(status);
    };

    checkStatus();
    const interval = setInterval(checkStatus, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const handleVerifyData = () => {
    console.log('🔍 Manually verifying data...');
    verifyLocalStorage();
    const result = verifyDataPersistence();
    toast.success(`Data verification complete! Categories: ${result.categories}, Accounts: ${result.accounts}, Transactions: ${result.transactions}, Budgets: ${result.budgets}`);
  };

  const handleSeedData = () => {
    console.log('🌱 Seeding sample data...');
    seedSampleData();
    toast.success('Sample data seeded successfully!');
  };

  const handleExportData = () => {
    try {
      const data = db.exportData();
      const exportData = includeDeleted ? data : {
        ...data,
        transactions: data.transactions.filter(t => !t.deletedAt),
        categories: data.categories,
        budgets: data.budgets,
        accounts: data.accounts,
        templates: data.templates
      };

      let filename = `finance-tracker-backup-${new Date().toISOString().split('T')[0]}`;
      
      if (exportFormat === 'json') {
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${filename}.json`;
        a.click();
        URL.revokeObjectURL(url);
      } else if (exportFormat === 'csv') {
        // Simple CSV export for transactions
        const csvHeaders = 'Date,Description,Category,Amount,Type,Account,Tags';
        const csvRows = exportData.transactions.map(t => 
          `"${t.date}","${t.description}","${t.category}","${t.amount}","${t.type}","${t.account || ''}","${t.tags?.join(';') || ''}"`
        ).join('\n');
        const csvContent = csvHeaders + '\n' + csvRows;
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${filename}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      }
      
      toast.success('Data exported successfully!');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Export failed. Please try again.');
    }
  };

  const handleImportData = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,.csv';
    
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File too large. Maximum size is 10MB.');
        return;
      }

      try {
        const text = await file.text();
        
        // Validate file content is not empty
        if (!text.trim()) {
          toast.error('File is empty.');
          return;
        }

        let data;

        if (file.name.endsWith('.csv')) {
          // Validate CSV structure
          const lines = text.split('\n').filter(line => line.trim());
          if (lines.length < 2) {
            toast.error('CSV file must have at least a header and one data row.');
            return;
          }

          const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
          const requiredHeaders = ['date', 'description', 'amount'];
          const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
          
          if (missingHeaders.length > 0) {
            toast.error(`CSV missing required headers: ${missingHeaders.join(', ')}`);
            return;
          }
          
          data = {
            transactions: lines.slice(1).map((line, index) => {
              const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
              
              // Validate required fields
              if (!values[0] || !values[1] || !values[3]) {
                throw new Error(`Row ${index + 2}: Missing required fields`);
              }
              
              const amount = parseFloat(values[3]);
              if (isNaN(amount)) {
                throw new Error(`Row ${index + 2}: Invalid amount format`);
              }
              
              const type = values[4]?.toLowerCase();
              if (type && !['income', 'expense'].includes(type)) {
                throw new Error(`Row ${index + 2}: Type must be 'income' or 'expense'`);
              }
              
              return {
                date: values[0],
                description: values[1],
                category: values[2] || 'Uncategorized',
                amount: amount,
                type: (type as 'income' | 'expense') || 'expense',
                account: values[5] || undefined,
                tags: values[6] ? values[6].split(';').filter(Boolean) : []
              };
            })
          };
        } else {
          // Validate JSON structure
          try {
            data = JSON.parse(text);
          } catch (parseError) {
            toast.error('Invalid JSON format.');
            return;
          }
          
          // Validate data structure
          if (!data || typeof data !== 'object') {
            toast.error('Invalid data structure.');
            return;
          }
        }

        let importCount = 0;
        let errorCount = 0;

        // Import data with validation
        if (data.transactions && Array.isArray(data.transactions)) {
          data.transactions.forEach((transaction: any, index: number) => {
            try {
              // Validate transaction structure
              if (!transaction.date || !transaction.description || typeof transaction.amount !== 'number') {
                throw new Error(`Transaction ${index + 1}: Missing required fields`);
              }
              
              db.addTransaction(transaction);
              importCount++;
            } catch (error) {
              console.error(`Error importing transaction ${index + 1}:`, error);
              errorCount++;
            }
          });
        }

        if (errorCount > 0) {
          toast.warning(`Import completed with ${errorCount} errors. ${importCount} transactions imported successfully.`);
        } else {
          toast.success(`Successfully imported ${importCount} transactions!`);
        }
      } catch (error) {
        console.error('Import error:', error);
        toast.error(`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    };
    input.click();
  };

  
  const handleClearCache = () => {
    try {
      // Clear application cache but preserve data
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.includes('cache') || key.includes('temp')) {
          localStorage.removeItem(key);
        }
      });
      toast.success('Cache cleared successfully!');
    } catch (error) {
      toast.error('Failed to clear cache');
    }
  };

  const handleResetOnboarding = () => {
    resetOnboarding();
    toast.success('Onboarding has been reset. You can start the tour again from the dashboard!');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
      case 'connected':
      case 'loaded':
      case 'active':
        return 'bg-green-500';
      case 'limited':
        return 'bg-yellow-500';
      case 'unavailable':
      case 'error':
        return 'bg-red-500';
      case 'checking':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'available': return 'Available';
      case 'connected': return 'Connected';
      case 'loaded': return 'Loaded';
      case 'active': return 'Active';
      case 'limited': return 'Limited Space';
      case 'unavailable': return 'Unavailable';
      case 'error': return 'Error';
      case 'checking': return 'Checking...';
      default: return 'Unknown';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Manage your application settings and preferences
        </p>
      </div>

      <div className="space-y-6">
        {/* Onboarding Progress */}
        <OnboardingProgress />
        
        {/* Financial Calculator */}
        <FinancialCalculator />
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Enhanced Theme Settings */}
        <ThemeSettings />

        {/* Currency & Formatting */}
        <Card>
          <CardHeader>
            <CardTitle>
              Currency & Formatting
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCurrencies.map((curr) => (
                      <SelectItem key={curr} value={curr}>
                        {curr} - {curr === 'USD' ? 'US Dollar' : 
                               curr === 'EUR' ? 'Euro' :
                               curr === 'GBP' ? 'British Pound' :
                               curr === 'JPY' ? 'Japanese Yen' :
                               curr === 'CAD' ? 'Canadian Dollar' :
                               curr === 'AUD' ? 'Australian Dollar' : curr} ({getCurrencySymbol(curr)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="dateFormat">Date Format</Label>
                <Select value={dateFormat} onValueChange={setDateFormat}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select format" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableDateFormats.map((format) => (
                      <SelectItem key={format} value={format}>
                        {format}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="numberFormat">Number Format</Label>
                <Select value={numberFormat} onValueChange={setNumberFormat}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select format" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableNumberFormats.map((format) => (
                      <SelectItem key={format} value={format}>
                        {format}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Formatting Preview */}
        <FormattingPreview />

        {/* Currency Converter */}
        <CurrencyConverter />

        {/* Import/Export */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Download className="mr-2 h-5 w-5" />
              Import/Export
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="exportFormat">Export Format</Label>
                <Select value={exportFormat} onValueChange={setExportFormat}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="json">JSON (Full Data)</SelectItem>
                    <SelectItem value="csv">CSV (Transactions Only)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="dateRange">Date Range</Label>
                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="current">Current Month</SelectItem>
                    <SelectItem value="year">Current Year</SelectItem>
                    <SelectItem value="custom">Custom Range</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="includeDeleted"
                checked={includeDeleted}
                onCheckedChange={(checked: boolean | 'indeterminate') => setIncludeDeleted(checked === true)}
              />
              <Label htmlFor="includeDeleted">Include deleted items</Label>
            </div>

            <div className="grid grid-cols-1 gap-2">
              <Button onClick={handleExportData} className="w-full">
                <Download className="mr-2 h-4 w-4" />
                Export Data
              </Button>
              <Button onClick={handleImportData} variant="outline" className="w-full">
                <Upload className="mr-2 h-4 w-4" />
                Import Data
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Data Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Database className="mr-2 h-5 w-5" />
              Data Management
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={handleVerifyData} className="w-full">
              <CheckCircle className="mr-2 h-4 w-4" />
              Verify Data Integrity
            </Button>
            <Button onClick={handleSeedData} variant="outline" className="w-full">
              <Database className="mr-2 h-4 w-4" />
              Seed Sample Data
            </Button>
            <Button onClick={handleClearCache} variant="outline" className="w-full">
              <RefreshCw className="mr-2 h-4 w-4" />
              Clear Cache
            </Button>
            <Button onClick={handleResetOnboarding} variant="outline" className="w-full">
              <RefreshCw className="mr-2 h-4 w-4" />
              Reset Onboarding
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Application Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <SettingsIcon className="mr-2 h-5 w-5" />
            Application Status
            <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${getStatusColor(appStatus.localStorage)}`}></div>
              <div>
                <div className="font-medium">Local Storage</div>
                <div className="text-sm text-muted-foreground">{getStatusText(appStatus.localStorage)}</div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${getStatusColor(appStatus.database)}`}></div>
              <div>
                <div className="font-medium">Database</div>
                <div className="text-sm text-muted-foreground">{getStatusText(appStatus.database)}</div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${getStatusColor(appStatus.storage)}`}></div>
              <div>
                <div className="font-medium">Storage Space</div>
                <div className="text-sm text-muted-foreground">{getStatusText(appStatus.storage)}</div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${getStatusColor(appStatus.fonts)}`}></div>
              <div>
                <div className="font-medium">Font System</div>
                <div className="text-sm text-muted-foreground">{getStatusText(appStatus.fonts)}</div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${getStatusColor(appStatus.components)}`}></div>
              <div>
                <div className="font-medium">UI Components</div>
                <div className="text-sm text-muted-foreground">{getStatusText(appStatus.components)}</div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <div>
                <div className="font-medium">Recycle Bin</div>
                <div className="text-sm text-muted-foreground">Active</div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <div>
                <div className="font-medium">Theme System</div>
                <div className="text-sm text-muted-foreground">Active</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
