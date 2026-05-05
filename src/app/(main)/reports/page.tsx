'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { useTransactions } from '@/hooks/useTransactions';
import { MonthlyTrendsReport } from '@/components/reports/MonthlyTrendsReport';
import { CategoryBreakdownReport } from '@/components/reports/CategoryBreakdownReport';
import { FinancialSummaryReport } from '@/components/reports/FinancialSummaryReport';
import { EnhancedPieChart } from '@/components/charts/EnhancedPieChart';
import { ComparisonChart } from '@/components/charts/ComparisonChart';
import { CashFlowChart } from '@/components/charts/CashFlowChart';
import { SpendingHeatMap } from '@/components/charts/SpendingHeatMap';
import { GoalProgressChart } from '@/components/charts/GoalProgressChart';
import { ReportErrorBoundary, ReportErrorFallback } from '@/components/error/ReportErrorBoundary';
import { GoalDialog } from '@/components/dialogs/GoalDialog';
import { DeleteConfirmDialog } from '@/components/dialogs/DeleteConfirmDialog';
import { ReportExporter, ExportOptions } from '@/lib/exportUtils';
import { useGoals } from '@/hooks/useGoals';
import { FinancialGoal } from '@/lib/types';
import { 
  FileDown, 
  FileText, 
  Table, 
  Database, 
  TrendingUp, 
  PieChart as PieChartIcon, 
  Target, 
  RefreshCw,
  Download,
  Mail,
  Calendar
} from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/utils';

export default function ReportsPage() {
  const { stats, loading, refreshStats } = useDashboardStats();
  const { transactions } = useTransactions();
  const { goals, addGoal, updateGoal, deleteGoal } = useGoals();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [exportFormat, setExportFormat] = useState<'pdf' | 'excel' | 'csv' | 'json'>('pdf');
  const [includeCharts, setIncludeCharts] = useState(true);
  const [selectedSections, setSelectedSections] = useState<string[]>(['summary', 'categories', 'trends']);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showGoalDialog, setShowGoalDialog] = useState(false);
  const [editingGoal, setEditingGoal] = useState<FinancialGoal | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [goalToDelete, setGoalToDelete] = useState<FinancialGoal | null>(null);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshStats();
      toast.success('Reports refreshed successfully');
    } catch (error) {
      toast.error('Failed to refresh reports');
      console.error('Error refreshing reports:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleExportReport = async () => {
    if (!stats) {
      toast.error('No data available to export');
      return;
    }
    
    // Validate stats structure
    if (!stats.monthlyIncome || !stats.monthlyExpenses || typeof stats.monthlyIncome !== 'number' || typeof stats.monthlyExpenses !== 'number') {
      toast.error('Invalid data format for export');
      return;
    }
    
    try {
      const exportOptions: ExportOptions = {
        format: exportFormat,
        includeCharts: includeCharts,
        sections: selectedSections
      };
      
      await ReportExporter.exportReport(stats, exportOptions);
      toast.success(`Report exported successfully as ${exportFormat.toUpperCase()}`);
      setShowExportDialog(false);
    } catch (error) {
      console.error('Export error:', error);
      toast.error(`Failed to export report as ${exportFormat.toUpperCase()}`);
    }
  };

  const handleQuickExport = async (format: 'pdf' | 'excel' | 'csv' | 'json') => {
    if (!stats) {
      toast.error('No data available to export');
      return;
    }
    
    // Validate stats structure
    if (!stats.monthlyIncome || !stats.monthlyExpenses || typeof stats.monthlyIncome !== 'number' || typeof stats.monthlyExpenses !== 'number') {
      toast.error('Invalid data format for export');
      return;
    }
    
    try {
      const exportOptions: ExportOptions = {
        format,
        includeCharts: true,
        sections: ['summary', 'categories', 'trends']
      };
      
      await ReportExporter.exportReport(stats, exportOptions);
      toast.success(`Report exported successfully as ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error(`Failed to export report as ${format.toUpperCase()}`);
    }
  };

  const handleGoalAction = (action: 'add' | 'edit' | 'delete', goal?: FinancialGoal) => {
    switch (action) {
      case 'add':
        setEditingGoal(null);
        setShowGoalDialog(true);
        break;
      case 'edit':
        if (goal) {
          setEditingGoal(goal);
          setShowGoalDialog(true);
        }
        break;
      case 'delete':
        if (goal) {
          setGoalToDelete(goal);
          setShowDeleteDialog(true);
        }
        break;
    }
  };

  const handleSaveGoal = (goalData: Omit<FinancialGoal, 'id' | 'createdAt'>) => {
    if (editingGoal) {
      updateGoal(editingGoal.id, goalData);
    } else {
      addGoal(goalData);
    }
  };

  const handleDeleteGoal = () => {
    if (goalToDelete) {
      deleteGoal(goalToDelete.id);
      toast.success('Goal deleted successfully!');
      setGoalToDelete(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Reports & Analytics</h1>
            <p className="text-muted-foreground">
              Detailed insights into your financial patterns
            </p>
          </div>
          <Button disabled>
            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            Refreshing...
          </Button>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-8 w-24" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Reports & Analytics</h1>
          <p className="text-muted-foreground">
            Detailed insights into your financial patterns
          </p>
        </div>

        <Card className="text-center py-12">
          <div className="space-y-4">
            <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center">
              <Target className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">No data available</h3>
              <p className="text-muted-foreground">
                Add some transactions to see your financial reports
              </p>
            </div>
            <Button onClick={handleRefresh}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh Data
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Reports & Analytics</h1>
          <p className="text-muted-foreground">
            Detailed insights into your financial patterns
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          {/* Quick Export Buttons */}
          <div className="flex gap-1">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleQuickExport('pdf')}
              title="Export as PDF"
            >
              <FileText className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleQuickExport('excel')}
              title="Export as Excel"
            >
              <Table className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleQuickExport('csv')}
              title="Export as CSV"
            >
              <Database className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleQuickExport('json')}
              title="Export as JSON"
            >
              <FileDown className="h-4 w-4" />
            </Button>
          </div>
          
          <Button onClick={() => setShowExportDialog(true)}>
            <Download className="mr-2 h-4 w-4" />
            Advanced Export
          </Button>
        </div>
      </div>

      <Tabs defaultValue="summary" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="summary" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Summary
          </TabsTrigger>
          <TabsTrigger value="visualizations" className="flex items-center gap-2">
            <PieChartIcon className="h-4 w-4" />
            Visualizations
          </TabsTrigger>
          <TabsTrigger value="trends" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Trends
          </TabsTrigger>
          <TabsTrigger value="categories" className="flex items-center gap-2">
            <PieChartIcon className="h-4 w-4" />
            Categories
          </TabsTrigger>
          <TabsTrigger value="patterns" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Patterns
          </TabsTrigger>
          <TabsTrigger value="insights" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Insights
          </TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="space-y-6">
          <FinancialSummaryReport stats={stats} />
        </TabsContent>

        <TabsContent value="visualizations" className="space-y-6">
          <div className="grid gap-6">
            <CategoryBreakdownReport categoryBreakdown={stats.categoryBreakdown} />
            <MonthlyTrendsReport monthlyTrend={stats.monthlyTrend} />
          </div>
        </TabsContent>

        <TabsContent value="categories" className="space-y-6">
          <div className="grid gap-6">
            <CategoryBreakdownReport categoryBreakdown={stats.categoryBreakdown} />
            <Card>
              <CardHeader>
                <CardTitle>Category Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats.categoryBreakdown && stats.categoryBreakdown.length > 0 ? (
                    stats.categoryBreakdown.map((category, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <h4 className="font-medium">{category.category}</h4>
                          <p className="text-sm text-muted-foreground">
                            {category.percentage}% of total expenses
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{formatCurrency(category.amount)}</div>
                          <div className="text-sm text-muted-foreground">{category.percentage}%</div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground">No category data available</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="patterns" className="space-y-6">
          <div className="grid gap-6">
            <SpendingHeatMap 
              data={transactions.map((t: any) => ({
                amount: Math.abs(t.amount),
                date: t.date,
                category: t.category,
                dayOfWeek: new Date(t.date).toLocaleDateString('en-US', { weekday: 'short' }),
                week: Math.ceil(new Date(t.date).getDate() / 7),
                month: new Date(t.date).toLocaleDateString('en-US', { month: 'short' })
              }))}
              title="Spending Patterns Heat Map"
              period="month"
            />
            <Card>
              <CardHeader>
                <CardTitle>Spending Patterns</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <h4 className="font-medium mb-2">Average Daily Spending</h4>
                      <p className="text-2xl font-bold">
                        {stats.monthlyExpenses > 0 ? formatCurrency(stats.monthlyExpenses / 30) : formatCurrency(0)}
                      </p>
                      <p className="text-sm text-muted-foreground">Per day this month</p>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <h4 className="font-medium mb-2">Highest Spending Day</h4>
                      <p className="text-2xl font-bold">
                        {transactions.length > 0 ? formatCurrency(Math.max(...transactions.map((t: any) => Math.abs(t.amount)))) : formatCurrency(0)}
                      </p>
                      <p className="text-sm text-muted-foreground">Single transaction</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <div className="grid gap-6">
            <ComparisonChart 
              data={stats.monthlyTrend}
              title="Monthly Trends Analysis"
            />
            <SpendingHeatMap 
              data={transactions.map((t: any) => ({
                amount: Math.abs(t.amount),
                date: t.date,
                category: t.category,
                dayOfWeek: new Date(t.date).toLocaleDateString('en-US', { weekday: 'short' }),
                week: Math.ceil(new Date(t.date).getDate() / 7),
                month: new Date(t.date).toLocaleDateString('en-US', { month: 'short' })
              }))}
              title="Spending Patterns Heat Map"
              period="month"
            />
            <GoalProgressChart 
              goals={goals}
              title="Financial Goals Progress"
              showAddGoal={true}
              onGoalAction={handleGoalAction}
            />
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <div className="grid gap-6">
            {/* Financial Health Insights */}
            <Card>
              <CardHeader>
                <CardTitle>Key Insights</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <h4 className="font-medium mb-2">Spending Pattern</h4>
                    <p className="text-sm text-muted-foreground">
                      {stats.monthlyExpenses > stats.monthlyIncome ? 
                        'Your expenses exceed your income. Consider reducing spending or increasing income.' :
                        stats.monthlyExpenses > stats.monthlyIncome * 0.8 ?
                          'Your expenses are close to your income. Build an emergency fund.' :
                          'You have a healthy expense ratio. Keep up the good work!'
                      }
                    </p>
                  </div>

                  <div className="p-4 bg-muted/50 rounded-lg">
                    <h4 className="font-medium mb-2">Savings Rate</h4>
                    <p className="text-sm text-muted-foreground">
                      {((stats.monthlyIncome - stats.monthlyExpenses) / stats.monthlyIncome * 100).toFixed(1)}% of your income is saved. 
                      {(() => {
                        const savingsRate = stats.monthlyIncome > 0 ? 
                          ((stats.monthlyIncome - stats.monthlyExpenses) / stats.monthlyIncome * 100) : 0;
                        
                        return savingsRate >= 20 ?
                          ' Excellent! You\'re saving more than the recommended 20%.' :
                          savingsRate >= 10 ?
                            ' Good! Try to aim for 20% savings rate.' :
                            ' Consider increasing your savings rate for better financial health.';
                      })()}
                    </p>
                  </div>

                  <div className="p-4 bg-muted/50 rounded-lg">
                    <h4 className="font-medium mb-2">Top Expense Category</h4>
                    <p className="text-sm text-muted-foreground">
                      {stats.categoryBreakdown[0] ? 
                        `${stats.categoryBreakdown[0].category} accounts for ${stats.categoryBreakdown[0].percentage}% of your expenses. ` +
                        (stats.categoryBreakdown[0].percentage > 30 ? 
                          'This is a significant portion. Review if there are opportunities to optimize.' :
                          'This seems reasonable for your budget.')
                        : 'No expense data available.'
                      }
                    </p>
                  </div>

                  <div className="p-4 bg-muted/50 rounded-lg">
                    <h4 className="font-medium mb-2">Net Worth Trend</h4>
                    <p className="text-sm text-muted-foreground">
                      {stats.netWorth >= 0 ?
                        `Your net worth is ${formatCurrency(stats.netWorth)}. ` +
                        (stats.netWorth > 10000 ? 
                          'Great! You have a solid financial foundation.' :
                          'Keep building your net worth through consistent saving.')
                        : `Your net worth is ${formatCurrency(stats.netWorth)}. ` +
                          'Focus on reducing debt and building assets.'
                      }
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recommendations */}
            <Card>
              <CardHeader>
                <CardTitle>Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats.monthlyExpenses > stats.monthlyIncome && (
                    <div className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-950/20 rounded-lg">
                      <Target className="h-5 w-5 text-red-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-red-600">Reduce Expenses</h4>
                        <p className="text-sm text-muted-foreground">
                          Your expenses exceed income by {formatCurrency(stats.monthlyExpenses - stats.monthlyIncome)}. 
                          Create a budget to track and reduce unnecessary spending.
                        </p>
                      </div>
                    </div>
                  )}

                  {((stats.monthlyIncome - stats.monthlyExpenses) / stats.monthlyIncome * 100) < 10 && stats.monthlyIncome > 0 && (
                    <div className="flex items-start gap-3 p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg">
                      <Target className="h-5 w-5 text-yellow-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-yellow-600">Increase Savings</h4>
                        <p className="text-sm text-muted-foreground">
                          Your savings rate is below the recommended 20%. 
                          Try to save at least {formatCurrency(Math.max(0, stats.monthlyIncome * 0.2 - (stats.monthlyIncome - stats.monthlyExpenses)))} more per month.
                        </p>
                      </div>
                    </div>
                  )}

                  {stats.categoryBreakdown.length > 0 && stats.categoryBreakdown[0].percentage > 40 && (
                    <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                      <Target className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-blue-600">Diversify Spending</h4>
                        <p className="text-sm text-muted-foreground">
                          {stats.categoryBreakdown[0].category} represents {stats.categoryBreakdown[0].percentage}% of expenses. 
                          Consider diversifying your spending categories.
                        </p>
                      </div>
                    </div>
                  )}

                  {stats.netWorth < 0 && (
                    <div className="flex items-start gap-3 p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
                      <Target className="h-5 w-5 text-orange-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-orange-600">Build Emergency Fund</h4>
                        <p className="text-sm text-muted-foreground">
                          Focus on building an emergency fund of 3-6 months of expenses. 
                          Start with small, consistent savings.
                        </p>
                      </div>
                    </div>
                  )}

                  {stats.monthlyIncome > 0 && stats.monthlyExpenses < stats.monthlyIncome && 
                   ((stats.monthlyIncome - stats.monthlyExpenses) / stats.monthlyIncome * 100) >= 20 && (
                    <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                      <Target className="h-5 w-5 text-green-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-green-600">Invest for Growth</h4>
                        <p className="text-sm text-muted-foreground">
                          With a healthy savings rate, consider investing for long-term growth. 
                          Explore investment options that match your risk tolerance.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Advanced Export Dialog */}
      {showExportDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Advanced Export Options
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Export Format</label>
                <Select value={exportFormat} onValueChange={(value: any) => setExportFormat(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pdf">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        <span>PDF Report</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="excel">
                      <div className="flex items-center gap-2">
                        <Table className="h-4 w-4" />
                        <span>Excel Spreadsheet</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="csv">
                      <div className="flex items-center gap-2">
                        <Database className="h-4 w-4" />
                        <span>CSV Data</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="json">
                      <div className="flex items-center gap-2">
                        <FileDown className="h-4 w-4" />
                        <span>JSON Data</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Include Sections</label>
                <div className="space-y-2">
                  {['summary', 'categories', 'trends'].map((section) => (
                    <div key={section} className="flex items-center space-x-2">
                      <Checkbox 
                        id={section}
                        checked={selectedSections.includes(section)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedSections([...selectedSections, section]);
                          } else {
                            setSelectedSections(selectedSections.filter(s => s !== section));
                          }
                        }}
                      />
                      <label htmlFor={section} className="text-sm capitalize">
                        {section} {section === 'summary' ? '(Overview)' : section === 'categories' ? '(Spending by Category)' : '(Monthly Analysis)'}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="includeCharts"
                  checked={includeCharts}
                  onCheckedChange={(checked) => setIncludeCharts(checked === true)}
                />
                <label htmlFor="includeCharts" className="text-sm">
                  Include charts and visualizations (PDF only)
                </label>
              </div>

              <div className="flex gap-2 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setShowExportDialog(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleExportReport}
                  className="flex-1"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export Report
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Goal Dialog */}
      <GoalDialog
        open={showGoalDialog}
        onOpenChange={setShowGoalDialog}
        goal={editingGoal}
        onSave={handleSaveGoal}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={handleDeleteGoal}
        title="Delete Financial Goal"
        description="Are you sure you want to delete this financial goal? This action cannot be undone."
        itemName={goalToDelete?.name}
        itemDetails={goalToDelete ? 
          `Target: ${formatCurrency(goalToDelete.targetAmount)} | Progress: ${formatCurrency(goalToDelete.currentAmount)}` 
          : undefined
        }
      />
    </div>
  );
}
