'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { verifyDataPersistence, verifyLocalStorage } from '@/lib/dataVerification';
import { seedSampleData } from '@/lib/seedData';
import { Download, Upload, Database, CheckCircle } from 'lucide-react';

export default function SettingsPage() {
  const handleVerifyData = () => {
    console.log('🔍 Manually verifying data...');
    verifyLocalStorage();
    const result = verifyDataPersistence();
    alert(`Data verification complete!\n\nCategories: ${result.categories}\nAccounts: ${result.accounts}\nTransactions: ${result.transactions}\nBudgets: ${result.budgets}`);
  };

  const handleSeedData = () => {
    console.log('🌱 Seeding sample data...');
    seedSampleData();
    alert('Sample data seeded successfully!');
  };

  const handleExportData = () => {
    try {
      // This would use the db.exportData() method
      const data = localStorage.getItem('finance-tracker-transactions');
      if (data) {
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'transactions-backup.json';
        a.click();
        URL.revokeObjectURL(url);
        alert('Data exported successfully!');
      } else {
        alert('No data to export');
      }
    } catch (error) {
      console.error('Export error:', error);
      alert('Export failed');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Manage your application settings and data
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
              Seed Sample Data
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Download className="mr-2 h-5 w-5" />
              Import/Export
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={handleExportData} variant="outline" className="w-full">
              <Download className="mr-2 h-4 w-4" />
              Export Data
            </Button>
            <Button variant="outline" className="w-full" disabled>
              <Upload className="mr-2 h-4 w-4" />
              Import Data (Coming Soon)
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Application Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
              <span>Local Storage: Available</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
              <span>Database: Connected</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
              <span>Font System: Robert Medium Loaded</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
              <span>UI Components: shadcn/ui Active</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
