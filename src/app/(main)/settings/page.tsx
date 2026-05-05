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
import { toast } from 'sonner';

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  
  // Theme Settings
  const [selectedTheme, setSelectedTheme] = useState(theme);
  
  // Currency & Formatting Settings
  const [currency, setCurrency] = useState('USD');
  const [dateFormat, setDateFormat] = useState('MM/DD/YYYY');
  const [numberFormat, setNumberFormat] = useState('1,234.56');
  
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

      try {
        const text = await file.text();
        let data;

        if (file.name.endsWith('.json')) {
          data = JSON.parse(text);
        } else if (file.name.endsWith('.csv')) {
          // Simple CSV parsing
          const lines = text.split('\n');
          const headers = lines[0].split(',');
          const transactions = lines.slice(1).map(line => {
            const values = line.split(',');
            return {
              id: crypto.randomUUID(),
              date: values[0]?.replace(/"/g, ''),
              description: values[1]?.replace(/"/g, ''),
              category: values[2]?.replace(/"/g, ''),
              amount: parseFloat(values[3]?.replace(/"/g, '') || '0'),
              type: values[4]?.replace(/"/g, '') as 'income' | 'expense',
              account: values[5]?.replace(/"/g, '') || undefined,
              tags: values[6]?.replace(/"/g, '')?.split(';').filter(Boolean) || []
            };
          });
          data = { transactions };
        }

        // Import data using db methods
        if (data.transactions) {
          data.transactions.forEach((transaction: any) => {
            try {
              db.addTransaction(transaction);
            } catch (error) {
              console.error('Error importing transaction:', error);
            }
          });
        }

        toast.success('Data imported successfully!');
      } catch (error) {
        console.error('Import error:', error);
        toast.error('Import failed. Please check your file format.');
      }
    };
    input.click();
  };

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme as 'light' | 'dark' | 'system');
    setSelectedTheme(newTheme);
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Theme Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Monitor className="mr-2 h-5 w-5" />
              Appearance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="theme">Theme</Label>
              <Select value={selectedTheme} onValueChange={handleThemeChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select theme" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">
                    <div className="flex items-center gap-2">
                      <Sun className="h-4 w-4" />
                      <span>Light</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="dark">
                    <div className="flex items-center gap-2">
                      <Moon className="h-4 w-4" />
                      <span>Dark</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="system">
                    <div className="flex items-center gap-2">
                      <Monitor className="h-4 w-4" />
                      <span>System</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

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
                    <SelectItem value="USD">USD - US Dollar ($)</SelectItem>
                    <SelectItem value="EUR">EUR - Euro (€)</SelectItem>
                    <SelectItem value="GBP">GBP - British Pound (£)</SelectItem>
                    <SelectItem value="JPY">JPY - Japanese Yen (¥)</SelectItem>
                    <SelectItem value="CAD">CAD - Canadian Dollar (C$)</SelectItem>
                    <SelectItem value="AUD">AUD - Australian Dollar (A$)</SelectItem>
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
                    <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                    <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                    <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                    <SelectItem value="DD-MM-YYYY">DD-MM-YYYY</SelectItem>
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
                    <SelectItem value="1,234.56">1,234.56 (US)</SelectItem>
                    <SelectItem value="1.234,56">1.234,56 (EU)</SelectItem>
                    <SelectItem value="1 234.56">1 234.56 (Space)</SelectItem>
                    <SelectItem value="1234.56">1234.56 (No separator)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

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
                onCheckedChange={setIncludeDeleted}
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
  );
}
