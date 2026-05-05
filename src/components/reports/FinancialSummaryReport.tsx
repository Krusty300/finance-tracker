'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { DashboardStats } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';
import { TrendingUp, TrendingDown, Target, Wallet, AlertTriangle, CheckCircle } from 'lucide-react';

interface FinancialSummaryReportProps {
  stats: DashboardStats;
}

export function FinancialSummaryReport({ stats }: FinancialSummaryReportProps) {
  const monthlySavings = stats.monthlyIncome - stats.monthlyExpenses;
  const savingsRate = stats.monthlyIncome > 0 ? (monthlySavings / stats.monthlyIncome) * 100 : 0;
  
  // Financial health indicators
  const getFinancialHealthScore = () => {
    let score = 0;
    let factors = [];

    // Savings rate (40% weight)
    if (savingsRate >= 20) {
      score += 40;
      factors.push({ label: 'Excellent savings rate', color: 'text-green-600' });
    } else if (savingsRate >= 10) {
      score += 30;
      factors.push({ label: 'Good savings rate', color: 'text-blue-600' });
    } else if (savingsRate >= 0) {
      score += 20;
      factors.push({ label: 'Low savings rate', color: 'text-yellow-600' });
    } else {
      score += 0;
      factors.push({ label: 'Negative savings', color: 'text-red-600' });
    }

    // Income vs expenses (30% weight)
    if (stats.monthlyIncome > stats.monthlyExpenses * 1.5) {
      score += 30;
      factors.push({ label: 'Strong income position', color: 'text-green-600' });
    } else if (stats.monthlyIncome > stats.monthlyExpenses) {
      score += 20;
      factors.push({ label: 'Positive cash flow', color: 'text-blue-600' });
    } else {
      score += 0;
      factors.push({ label: 'Negative cash flow', color: 'text-red-600' });
    }

    // Net worth (30% weight)
    if (stats.netWorth > 10000) {
      score += 30;
      factors.push({ label: 'Strong net worth', color: 'text-green-600' });
    } else if (stats.netWorth > 0) {
      score += 20;
      factors.push({ label: 'Positive net worth', color: 'text-blue-600' });
    } else {
      score += 0;
      factors.push({ label: 'Negative net worth', color: 'text-red-600' });
    }

    return { score, factors };
  };

  const financialHealth = getFinancialHealthScore();
  const healthGrade = financialHealth.score >= 80 ? 'A' : 
                      financialHealth.score >= 60 ? 'B' : 
                      financialHealth.score >= 40 ? 'C' : 
                      financialHealth.score >= 20 ? 'D' : 'F';

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100 dark:bg-green-900/20';
    if (score >= 60) return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20';
    if (score >= 40) return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20';
    return 'text-red-600 bg-red-100 dark:bg-red-900/20';
  };

  const getHealthText = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Poor';
  };

  return (
    <div className="space-y-6">
      {/* Financial Health Score */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Financial Health Score
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center space-y-4">
            <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full ${getHealthColor(financialHealth.score)}`}>
              <div>
                <div className="text-3xl font-bold">{healthGrade}</div>
                <div className="text-xs">{financialHealth.score}/100</div>
              </div>
            </div>
            <div>
              <h3 className="text-xl font-semibold">{getHealthText(financialHealth.score)}</h3>
              <p className="text-muted-foreground">Overall financial health assessment</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span>Financial Health</span>
              <span className="font-medium">{financialHealth.score}%</span>
            </div>
            <Progress value={financialHealth.score} className="h-2" />
          </div>

          <div className="space-y-2">
            <h4 className="font-medium">Health Factors:</h4>
            {financialHealth.factors.map((factor, index) => (
              <div key={index} className={`flex items-center gap-2 text-sm ${factor.color}`}>
                {factor.label.includes('Excellent') || factor.label.includes('Strong') ? (
                  <CheckCircle className="h-4 w-4" />
                ) : factor.label.includes('Negative') || factor.label.includes('Poor') ? (
                  <AlertTriangle className="h-4 w-4" />
                ) : (
                  <Target className="h-4 w-4" />
                )}
                {factor.label}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Income</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(stats.monthlyIncome)}
            </div>
            <p className="text-xs text-muted-foreground">
              This month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Expenses</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(stats.monthlyExpenses)}
            </div>
            <p className="text-xs text-muted-foreground">
              This month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Savings</CardTitle>
            <Wallet className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${monthlySavings >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(monthlySavings)}
            </div>
            <p className="text-xs text-muted-foreground">
              {savingsRate.toFixed(1)}% savings rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Worth</CardTitle>
            <Target className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stats.netWorth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(stats.netWorth)}
            </div>
            <p className="text-xs text-muted-foreground">
              Total assets
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Financial Ratios */}
      <Card>
        <CardHeader>
          <CardTitle>Financial Ratios</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Savings Rate</span>
                <span className="font-medium">{savingsRate.toFixed(1)}%</span>
              </div>
              <Progress value={Math.min(savingsRate, 50)} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {savingsRate >= 20 ? 'Excellent' : savingsRate >= 10 ? 'Good' : savingsRate >= 0 ? 'Fair' : 'Needs improvement'}
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Expense Ratio</span>
                <span className="font-medium">{stats.monthlyIncome > 0 ? ((stats.monthlyExpenses / stats.monthlyIncome) * 100).toFixed(1) : '0'}%</span>
              </div>
              <Progress 
                value={stats.monthlyIncome > 0 ? Math.min((stats.monthlyExpenses / stats.monthlyIncome) * 100, 100) : 0} 
                className="h-2" 
              />
              <p className="text-xs text-muted-foreground">
                {stats.monthlyIncome > 0 && stats.monthlyExpenses / stats.monthlyIncome <= 0.5 ? 'Excellent' : 
                 stats.monthlyIncome > 0 && stats.monthlyExpenses / stats.monthlyIncome <= 0.7 ? 'Good' : 
                 stats.monthlyIncome > 0 && stats.monthlyExpenses / stats.monthlyIncome <= 0.9 ? 'Fair' : 'Needs improvement'}
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Top Category</span>
                <span className="font-medium">
                  {stats.categoryBreakdown[0]?.category || 'N/A'}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.categoryBreakdown[0] ? 
                  `${formatCurrency(stats.categoryBreakdown[0].amount)} (${stats.categoryBreakdown[0].percentage}%)` : 
                  'No data available'
                }
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Diversity Score</span>
                <span className="font-medium">
                  {stats.categoryBreakdown.length > 0 ? Math.min(stats.categoryBreakdown.length * 10, 100) : 0}%
                </span>
              </div>
              <Progress 
                value={stats.categoryBreakdown.length > 0 ? Math.min(stats.categoryBreakdown.length * 10, 100) : 0} 
                className="h-2" 
              />
              <p className="text-xs text-muted-foreground">
                {stats.categoryBreakdown.length >= 5 ? 'Well diversified' : 
                 stats.categoryBreakdown.length >= 3 ? 'Moderately diversified' : 'Limited diversity'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
