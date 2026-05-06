'use client';

import { useState } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Calendar, ArrowRight } from 'lucide-react';
import { useCurrency } from '@/contexts/CurrencyContext';

interface ComparisonChartProps {
  data: Array<{
    month: string;
    income: number;
    expenses: number;
  }>;
  title?: string;
  type?: 'bar' | 'line' | 'area';
  comparisonType?: 'month-over-month' | 'year-over-year';
}

export function ComparisonChart({ 
  data, 
  title = "Monthly Comparison", 
  type = 'bar',
  comparisonType = 'month-over-month'
}: ComparisonChartProps) {
  const { formatCurrency } = useCurrency();
  const [chartType, setChartType] = useState<'bar' | 'line' | 'area'>(type);
  const [showVariance, setShowVariance] = useState(false);

  // Calculate month-over-month variance
  const chartData = data.map((item, index) => {
    const incomeVariance = index > 0 ? 
      ((item.income - data[index - 1].income) / data[index - 1].income * 100) : 0;
    const expensesVariance = index > 0 ? 
      ((item.expenses - data[index - 1].expenses) / data[index - 1].expenses * 100) : 0;
    
    return {
      ...item,
      net: item.income - item.expenses,
      incomeVariance,
      expensesVariance,
      savingsRate: item.income > 0 ? ((item.income - item.expenses) / item.income * 100) : 0
    };
  });

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border rounded-lg shadow-lg p-3">
          <p className="font-medium">{label}</p>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between gap-4">
              <span>Income:</span>
              <span className="text-green-600 font-medium">
                +{formatCurrency(data.income)}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span>Expenses:</span>
              <span className="text-red-600 font-medium">
                -{formatCurrency(data.expenses)}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span>Net:</span>
              <span className={`font-medium ${data.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {data.net >= 0 ? '+' : ''}{formatCurrency(data.net)}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span>Savings Rate:</span>
              <span className="font-medium">
                {data.savingsRate.toFixed(1)}%
              </span>
            </div>
            {showVariance && data.incomeVariance !== 0 && (
              <>
                <div className="flex justify-between gap-4">
                  <span>Income Change:</span>
                  <span className={`font-medium ${data.incomeVariance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {data.incomeVariance >= 0 ? '+' : ''}{data.incomeVariance.toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span>Expenses Change:</span>
                  <span className={`font-medium ${data.expensesVariance >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {data.expensesVariance >= 0 ? '+' : ''}{data.expensesVariance.toFixed(1)}%
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  const renderChart = () => {
    const commonProps = {
      data: chartData,
      margin: { top: 20, right: 30, left: 20, bottom: 5 }
    };

    switch (chartType) {
      case 'line':
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="income" 
              stroke="#10b981" 
              strokeWidth={2}
              name="Income"
            />
            <Line 
              type="monotone" 
              dataKey="expenses" 
              stroke="#ef4444" 
              strokeWidth={2}
              name="Expenses"
            />
            <Line 
              type="monotone" 
              dataKey="net" 
              stroke="#3b82f6" 
              strokeWidth={2}
              name="Net"
            />
          </LineChart>
        );
      case 'area':
        return (
          <AreaChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Area 
              type="monotone" 
              dataKey="income" 
              stackId="1"
              stroke="#10b981" 
              fill="#10b981" 
              fillOpacity={0.6}
              name="Income"
            />
            <Area 
              type="monotone" 
              dataKey="expenses" 
              stackId="2"
              stroke="#ef4444" 
              fill="#ef4444" 
              fillOpacity={0.6}
              name="Expenses"
            />
          </AreaChart>
        );
      default:
        return (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar dataKey="income" fill="#10b981" name="Income" />
            <Bar dataKey="expenses" fill="#ef4444" name="Expenses" />
          </BarChart>
        );
    }
  };

  const averageIncome = chartData.reduce((sum, item) => sum + item.income, 0) / chartData.length;
  const averageExpenses = chartData.reduce((sum, item) => sum + item.expenses, 0) / chartData.length;
  const averageNet = chartData.reduce((sum, item) => sum + item.net, 0) / chartData.length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{title}</CardTitle>
          <div className="flex gap-2">
            <Select value={chartType} onValueChange={(value: any) => setChartType(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bar">Bar Chart</SelectItem>
                <SelectItem value="line">Line Chart</SelectItem>
                <SelectItem value="area">Area Chart</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant={showVariance ? "default" : "outline"}
              size="sm"
              onClick={() => setShowVariance(!showVariance)}
            >
              {showVariance ? "Hide Variance" : "Show Variance"}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[320px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            {renderChart()}
          </ResponsiveContainer>
        </div>

        {/* Summary Statistics */}
        <div className="mt-4 grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
            <div className="text-sm text-green-600 dark:text-green-400 font-medium">
              Avg Income
            </div>
            <div className="text-lg font-bold text-green-700 dark:text-green-300">
              {formatCurrency(averageIncome)}
            </div>
            <div className="text-xs text-green-600 dark:text-green-400">
              Per month
            </div>
          </div>
          
          <div className="text-center p-3 bg-red-50 dark:bg-red-950/20 rounded-lg">
            <div className="text-sm text-red-600 dark:text-red-400 font-medium">
              Avg Expenses
            </div>
            <div className="text-lg font-bold text-red-700 dark:text-red-300">
              {formatCurrency(averageExpenses)}
            </div>
            <div className="text-xs text-red-600 dark:text-red-400">
              Per month
            </div>
          </div>
          
          <div className="text-center p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
            <div className="text-sm text-blue-600 dark:text-blue-400 font-medium">
              Avg Net
            </div>
            <div className={`text-lg font-bold ${averageNet >= 0 ? 'text-blue-700 dark:text-blue-300' : 'text-red-700 dark:text-red-300'}`}>
              {averageNet >= 0 ? '+' : ''}{formatCurrency(averageNet)}
            </div>
            <div className="text-xs text-blue-600 dark:text-blue-400">
              Per month
            </div>
          </div>
        </div>

        {/* Trend Indicators */}
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {comparisonType === 'month-over-month' ? 'MoM' : 'YoY'}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {chartData.length} periods
            </span>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1">
              {chartData[chartData.length - 1]?.net >= chartData[0]?.net ? (
                <TrendingUp className="h-3 w-3 text-green-600" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-600" />
              )}
              <span className="text-muted-foreground">
                Net {chartData[chartData.length - 1]?.net >= chartData[0]?.net ? 'up' : 'down'}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
