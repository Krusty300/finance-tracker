'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function BudgetsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Budgets</h1>
        <p className="text-muted-foreground">
          Set and track your monthly budgets
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Budget Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Budget management coming soon...</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
