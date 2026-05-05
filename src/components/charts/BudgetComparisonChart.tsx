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
  AreaChart,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertCircle, 
  CheckCircle, 
  Target,
  Calendar,
  DollarSign,
  PieChart as PieChartIcon,
  BarChart3,
  AreaChart as AreaChartIcon
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface BudgetData {
  category: string;
  budget: number;
  spent: number;
  remaining: number;
  percentageUsed: number;
  status: 'on-track' | 'near-limit' | 'over-budget';
  period?: string;
}

interface BudgetComparisonChartProps {
  data: BudgetData[];
  title?: string;
  chartType?: 'bar' | 'line' | 'area' | 'pie';
  showComparison?: boolean;
  period?: 'current' | 'previous' | 'comparison';
}

export function BudgetComparisonChart({ 
  data, 
  title = "Budget vs Spending Analysis", 
  chartType = 'bar',
  showComparison = true,
  period = 'current'
}: BudgetComparisonChartProps) {
  const [selectedChart, setSelectedChart] = useState(chartType);
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

  // Calculate summary statistics
  const totalBudget = data.reduce((sum, item) => sum + item.budget, 0);
  const totalSpent = data.reduce((sum, item) => sum + item.spent, 0);
  const totalRemaining = totalBudget - totalSpent;
  const overallPercentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  // Status distribution for pie chart
  const statusData = [
    { name: 'On Track', value: data.filter(d => d.status === 'on-track').length, color: '#10b981' },
    { name: 'Near Limit', value: data.filter(d => d.status === 'near-limit').length, color: '#f59e0b' },
    { name: 'Over Budget', value: data.filter(d => d.status === 'over-budget').length, color: '#ef4444' },
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border rounded-lg shadow-lg p-3">
          <p className="font-medium">{label || data.category}</p>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between gap-4">
              <span>Budget:</span>
              <span className="font-medium text-blue-600">
                {formatCurrency(data.budget)}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span>Spent:</span>
              <span className={`font-medium ${
                data.percentageUsed > 100 ? 'text-red-600' : 
                data.percentageUsed >= 80 ? 'text-yellow-600' : 'text-green-600'
              }`}>
                {formatCurrency(data.spent)}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span>Remaining:</span>
              <span className="font-medium text-gray-600">
                {formatCurrency(data.remaining)}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span>Used:</span>
              <span className={`font-medium ${
                data.percentageUsed > 100 ? 'text-red-600' : 
                data.percentageUsed >= 80 ? 'text-yellow-600' : 'text-green-600'
              }`}>
                {data.percentageUsed.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const renderChart = () => {
    const commonProps = {
      data: data,
      margin: { top: 20, right: 30, left: 20, bottom: 5 }
    };

    switch (selectedChart) {
      case 'line':
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="category" />
            <YAxis />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="budget" 
              stroke="#3b82f6" 
              strokeWidth={2}
              name="Budget"
            />
            <Line 
              type="monotone" 
              dataKey="spent" 
              stroke="#ef4444" 
              strokeWidth={2}
              name="Spent"
            />
          </LineChart>
        );
      case 'area':
        return (
          <AreaChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="category" />
            <YAxis />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Area 
              type="monotone" 
              dataKey="budget" 
              stroke="#3b82f6" 
              fill="#3b82f6" 
              fillOpacity={0.3}
              name="Budget"
            />
            <Area 
              type="monotone" 
              dataKey="spent" 
              stroke="#f59e0b" 
              fill="#f59e0b" 
              fillOpacity={0.1}
              strokeDasharray="5 5"
              name="Projected"
            />
          </AreaChart>
        );
      case 'pie':
        return (
          <PieChart>
            <Pie
              data={statusData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, value, percent }) => `${name}: ${value} (${(percent ? percent * 100 : 0).toFixed(0)}%)`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {statusData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        );
      default:
        return (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="category" />
            <YAxis />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar dataKey="budget" fill="#3b82f6" name="Budget" />
            <Bar dataKey="spent" fill="#ef4444" name="Spent" />
          </BarChart>
        );
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'on-track': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'near-limit': return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      case 'over-budget': return <TrendingDown className="h-4 w-4 text-red-600" />;
      default: return <Target className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle>{title}</CardTitle>
            {data.length > 0 && data[0].period && (
              <div className="text-sm text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>{data[0].period}</span>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Select value={selectedChart} onValueChange={(value: any) => setSelectedChart(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bar">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    <span>Bar</span>
                  </div>
                </SelectItem>
                <SelectItem value="line">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    <span>Line</span>
                  </div>
                </SelectItem>
                <SelectItem value="area">
                  <div className="flex items-center gap-2">
                    <AreaChartIcon className="h-4 w-4" />
                    <span>Area</span>
                  </div>
                </SelectItem>
                <SelectItem value="pie">
                  <div className="flex items-center gap-2">
                    <PieChartIcon className="h-4 w-4" />
                    <span>Pie</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
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
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
            <div className="text-sm text-blue-600 dark:text-blue-400 font-medium">
              Total Budget
            </div>
            <div className="text-lg font-bold text-blue-700 dark:text-blue-300">
              {formatCurrency(totalBudget)}
            </div>
            <div className="text-xs text-blue-600 dark:text-blue-400">
              Across {data.length} categories
            </div>
          </div>
          
          <div className="text-center p-3 bg-red-50 dark:bg-red-950/20 rounded-lg">
            <div className="text-sm text-red-600 dark:text-red-400 font-medium">
              Total Spent
            </div>
            <div className="text-lg font-bold text-red-700 dark:text-red-300">
              {formatCurrency(totalSpent)}
            </div>
            <div className="text-xs text-red-600 dark:text-red-400">
              {overallPercentage.toFixed(1)}% used
            </div>
          </div>
          
          <div className="text-center p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
            <div className="text-sm text-green-600 dark:text-green-400 font-medium">
              Remaining
            </div>
            <div className="text-lg font-bold text-green-700 dark:text-green-300">
              {formatCurrency(totalRemaining)}
            </div>
            <div className="text-xs text-green-600 dark:text-green-400">
              {((totalRemaining / totalBudget) * 100).toFixed(1)}% left
            </div>
          </div>
          
          <div className="text-center p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
            <div className="text-sm text-purple-600 dark:text-purple-400 font-medium">
              Budget Health
            </div>
            <div className="text-lg font-bold text-purple-700 dark:text-purple-300">
              {overallPercentage > 100 ? 'Over' : overallPercentage >= 80 ? 'Warning' : 'Good'}
            </div>
            <div className="text-xs text-purple-600 dark:text-purple-400">
              {data.filter(d => d.status === 'over-budget').length} over budget
            </div>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="mt-4 pt-4 border-t">
          <h4 className="text-sm font-medium mb-2">Category Breakdown</h4>
          <div className="space-y-2">
            {data
              .filter(item => item && item.percentageUsed !== undefined && item.percentageUsed !== null)
              .sort((a, b) => b.percentageUsed - a.percentageUsed)
              .slice(0, 5)
              .map((item) => (
                <div 
                  key={item.category}
                  className={`flex items-center justify-between p-2 rounded-lg ${
                    hoveredCategory === item.category ? 'bg-muted' : ''
                  }`}
                  onMouseEnter={() => setHoveredCategory(item.category)}
                  onMouseLeave={() => setHoveredCategory(null)}
                >
                  <div className="flex items-center gap-2">
                    {getStatusIcon(item.status)}
                    <span className="font-medium">{item.category}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {formatCurrency(item.spent)} / {formatCurrency(item.budget)}
                    </span>
                    <Badge 
                      variant={item.status === 'over-budget' ? 'destructive' : 
                               item.status === 'near-limit' ? 'secondary' : 'default'}
                      className="text-xs"
                    >
                      {item.percentageUsed.toFixed(0)}%
                    </Badge>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Status Summary */}
        <div className="mt-4 pt-4 border-t">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span>On Track: {data.filter(d => d.status === 'on-track').length}</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span>Near Limit: {data.filter(d => d.status === 'near-limit').length}</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span>Over Budget: {data.filter(d => d.status === 'over-budget').length}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-muted-foreground">
                Budget Performance
              </div>
              <div className={`text-sm font-medium ${
                overallPercentage > 100 ? 'text-red-600' : 
                overallPercentage >= 80 ? 'text-yellow-600' : 'text-green-600'
              }`}>
                {overallPercentage > 100 ? 'Over Budget' : 
                 overallPercentage >= 80 ? 'Near Limit' : 'On Track'}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
