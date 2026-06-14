# Archive & History Features Integration Guide

## Components Created

### 1. ArchivedBudgetsView Component
**Location:** `src/components/budgets/ArchivedBudgetsView.tsx`

**Purpose:** Displays archived budgets with restore and delete functionality.

**Props:**
- `budgets: Budget[]` - All budgets (will filter for archived internally)
- `transactions: any[]` - Transaction data for spending calculations
- `onRestore: (budget: Budget) => Promise<void>` - Handler for restoring budgets
- `onDelete: (budget: Budget) => Promise<void>` - Handler for deleting archived budgets

**Features:**
- Shows archived budgets with spending calculations
- Restore button to unarchive budgets
- Delete button to permanently remove archived budgets
- Delete All button for bulk deletion
- Empty state when no archived budgets
- Mobile responsive design

### 2. useBudgetHistory Hook
**Location:** `src/hooks/useBudgetHistory.ts`

**Purpose:** Track budget changes over time.

**API:**
```typescript
const {
  history,
  addHistoryEntry,
  getBudgetHistory,
  cleanupOldHistory,
  clearHistory
} = useBudgetHistory();
```

**Methods:**
- `addHistoryEntry(entry)` - Add a history entry for a budget change
- `getBudgetHistory(budgetId)` - Get history for a specific budget
- `cleanupOldHistory(monthsToKeep)` - Remove history older than X months
- `clearHistory()` - Clear all history

### 3. BudgetHistoryTimeline Component
**Location:** `src/components/budgets/BudgetHistoryTimeline.tsx`

**Purpose:** Display a timeline of budget changes.

**Props:**
- `history: BudgetHistoryEntry[]` - History entries to display
- `onClose?: () => void` - Optional close handler

**Features:**
- Visual timeline with icons for each change type
- Color-coded badges (created, updated, archived, restored, deleted)
- Detailed change descriptions
- Timestamps for each entry
- Empty state when no history

### 4. Archive Cleanup Utilities
**Location:** `src/utils/archive-cleanup.ts`

**Functions:**
- `getArchiveCleanupConfig()` - Get cleanup settings from localStorage
- `setArchiveCleanupConfig(config)` - Save cleanup settings
- `shouldCleanupArchivedBudget(budget, config)` - Check if budget should be cleaned up
- `getBudgetsToCleanup(budgets)` - Get budgets that need cleanup
- `cleanupArchivedBudgets(budgets, deleteBudget)` - Perform cleanup

### 5. ArchiveCleanupSettings Component
**Location:** `src/components/budgets/ArchiveCleanupSettings.tsx`

**Purpose:** UI for configuring archive cleanup settings.

**Props:**
- `onCleanup?: () => Promise<void>` - Optional handler to run cleanup immediately

**Features:**
- Toggle auto-cleanup on/off
- Select retention period (1-24 months)
- Save settings button
- Run cleanup now button

## Integration Steps for BudgetsPage

### Step 1: Import Components
Add these imports to `src/app/(main)/budgets/page.tsx`:

```typescript
import { ArchivedBudgetsView } from '@/components/budgets/ArchivedBudgetsView';
import { BudgetHistoryTimeline } from '@/components/budgets/BudgetHistoryTimeline';
import { ArchiveCleanupSettings } from '@/components/budgets/ArchiveCleanupSettings';
import { useBudgetHistory } from '@/hooks/useBudgetHistory';
import { cleanupArchivedBudgets } from '@/utils/archive-cleanup';
```

### Step 2: Add History Hook
Add inside BudgetsPage component:

```typescript
const { history, addHistoryEntry, getBudgetHistory, cleanupOldHistory } = useBudgetHistory();
```

### Step 3: Add Restore and Delete Handlers
Add these handlers (already added in previous edits):

```typescript
const handleRestoreBudget = async (budget: Budget) => {
  try {
    await updateBudget(budget.id, { isArchived: false, archivedAt: undefined });
    await addHistoryEntry({
      budgetId: budget.id,
      changeType: 'restored',
      changes: {},
      newState: { isArchived: false }
    });
    toast.success('Budget restored successfully');
  } catch (error) {
    toast.error('Failed to restore budget');
  }
};

const handleDeleteArchivedBudget = async (budget: Budget) => {
  try {
    await deleteBudget(budget.id);
    await addHistoryEntry({
      budgetId: budget.id,
      changeType: 'deleted',
      changes: {},
      previousState: { ...budget }
    });
    toast.success('Archived budget deleted permanently');
  } catch (error) {
    toast.error('Failed to delete archived budget');
  }
};
```

### Step 4: Add Archived Tab Content
Add this after the analytics tab content:

```typescript
<TabsContent value="archived" className="space-y-4">
  <ArchivedBudgetsView
    budgets={budgets}
    transactions={transactions}
    onRestore={handleRestoreBudget}
    onDelete={handleDeleteArchivedBudget}
  />
</TabsContent>
```

### Step 5: Add History Dialog State
Add state for history dialog:

```typescript
const [showHistoryDialog, setShowHistoryDialog] = useState(false);
const [selectedBudgetForHistory, setSelectedBudgetForHistory] = useState<Budget | null>(null);
```

### Step 6: Add History Dialog Handler
Add handler to open history:

```typescript
const openHistoryDialog = (budget: Budget) => {
  setSelectedBudgetForHistory(budget);
  setShowHistoryDialog(true);
};
```

### Step 7: Add History Dialog to JSX
Add this dialog at the end of the component (before closing div):

```typescript
<Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
  <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
    <DialogHeader>
      <DialogTitle>Budget History</DialogTitle>
      <DialogDescription>
        View all changes made to this budget over time
      </DialogDescription>
    </DialogHeader>
    <BudgetHistoryTimeline
      history={getBudgetHistory(selectedBudgetForHistory?.id || '')}
      onClose={() => setShowHistoryDialog(false)}
    />
  </DialogContent>
</Dialog>
```

### Step 8: Add History Button to BudgetCard
Modify BudgetCard to accept an optional `onViewHistory` prop and add a history button.

### Step 9: Add Auto-Cleanup on Page Load
Add this useEffect to run cleanup on page load:

```typescript
useEffect(() => {
  const runAutoCleanup = async () => {
    const config = getArchiveCleanupConfig();
    if (config.autoCleanup) {
      const result = await cleanupArchivedBudgets(budgets, deleteBudget);
      if (result.deleted > 0) {
        toast.success(`Auto-cleaned ${result.deleted} old archived budget(s)`);
      }
    }
  };

  runAutoCleanup();
}, [budgets, deleteBudget]);
```

### Step 10: Add Cleanup Settings to Analytics Tab
Add ArchiveCleanupSettings component to the analytics tab:

```typescript
<TabsContent value="analytics" className="space-y-6">
  <div className="grid gap-6">
    {/* Existing charts */}
    <ArchiveCleanupSettings
      onCleanup={async () => {
        const result = await cleanupArchivedBudgets(budgets, deleteBudget);
        toast.success(`Cleaned up ${result.deleted} archived budget(s)`);
      }}
    />
  </div>
</TabsContent>
```

## Additional Enhancements

### Track Budget Changes
Modify the updateBudget handler to track changes:

```typescript
const handleUpdateBudget = async (id: string, updates: Partial<Budget>) => {
  const previousBudget = budgets.find(b => b.id === id);
  
  try {
    await updateBudget(id, updates);
    
    // Track changes
    const changes: any = {};
    if (updates.amount !== undefined && previousBudget?.amount !== updates.amount) {
      changes.amount = { from: previousBudget.amount, to: updates.amount };
    }
    if (updates.period && previousBudget?.period !== updates.period) {
      changes.period = { from: previousBudget.period, to: updates.period };
    }
    // ... other fields
    
    await addHistoryEntry({
      budgetId: id,
      changeType: 'updated',
      changes,
      previousState: previousBudget,
      newState: updates
    });
  } catch (error) {
    toast.error('Failed to update budget');
  }
};
```

### Track Archive Actions
Modify handleArchiveBudget to track history:

```typescript
const handleArchiveBudget = async (budget: Budget) => {
  try {
    await updateBudget(budget.id, { 
      isArchived: true, 
      archivedAt: new Date().toISOString() 
    });
    
    await addHistoryEntry({
      budgetId: budget.id,
      changeType: 'archived',
      changes: {},
      previousState: { ...budget },
      newState: { isArchived: true, archivedAt: new Date().toISOString() }
    });
    
    toast.success('Budget archived');
  } catch (error) {
    toast.error('Failed to archive budget');
  }
};
```

## Testing Checklist

- [ ] Archived tab displays archived budgets correctly
- [ ] Restore button unarchives budgets successfully
- [ ] Delete button permanently removes archived budgets
- [ ] Delete All button works for bulk deletion
- [ ] History timeline displays changes correctly
- [ ] History dialog opens and closes properly
- [ ] Auto-cleanup settings save and load correctly
- [ ] Auto-cleanup runs on page load
- [ ] Manual cleanup works from settings
- [ ] History entries are created for budget changes
- [ ] Empty states display correctly
- [ ] Mobile responsiveness works for all new components
