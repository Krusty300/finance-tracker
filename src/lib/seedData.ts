import { Transaction, Category, Account } from './types';
import { db } from './db';

export function seedSampleData() {
  try {
    // Only seed if there's no existing data
    const existingTransactions = db.getTransactions();
    const existingCategories = db.getCategories();
    const existingAccounts = db.getAccounts();

    if (!existingCategories || existingCategories.length === 0) {
      console.warn('No categories found for seeding data');
      return;
    }

    if (!existingAccounts || existingAccounts.length === 0) {
      console.warn('No accounts found for seeding data');
      return;
    }

    if (existingTransactions.length > 0) {
      console.log('Transactions already exist, skipping seed');
      return;
    }
    // Add sample transactions
    const sampleTransactions: Omit<Transaction, 'id'>[] = [
      {
        amount: 3500,
        type: 'income',
        category: existingCategories.find(c => c.name === 'Salary')?.id || '',
        date: new Date().toISOString().split('T')[0],
        description: 'Monthly Salary',
        account: existingAccounts[0]?.id,
      },
      {
        amount: 850,
        type: 'expense',
        category: existingCategories.find(c => c.name === 'Rent')?.id || existingCategories.find(c => c.type === 'expense')?.id || '',
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        description: 'Monthly Rent',
        account: existingAccounts[0]?.id,
      },
      {
        amount: 120,
        type: 'expense',
        category: existingCategories.find(c => c.name === 'Food')?.id || existingCategories.find(c => c.type === 'expense')?.id || '',
        date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        description: 'Grocery Shopping',
        account: existingAccounts[0]?.id,
      },
      {
        amount: 45,
        type: 'expense',
        category: existingCategories.find(c => c.name === 'Transport')?.id || existingCategories.find(c => c.type === 'expense')?.id || '',
        date: new Date().toISOString().split('T')[0],
        description: 'Gas and Transportation',
        account: existingAccounts[0]?.id,
      },
      {
        amount: 250,
        type: 'income',
        category: existingCategories.find(c => c.name === 'Freelance')?.id || existingCategories.find(c => c.type === 'income')?.id || '',
        date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        description: 'Freelance Project Payment',
        account: existingAccounts[1]?.id,
      },
      {
        amount: 85,
        type: 'expense',
        category: existingCategories.find(c => c.name === 'Entertainment')?.id || existingCategories.find(c => c.type === 'expense')?.id || '',
        date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        description: 'Movie and Dinner',
        account: existingAccounts[0]?.id,
      },
    ];

    sampleTransactions.forEach(transaction => {
      try {
        db.addTransaction(transaction);
      } catch (error) {
        console.error('Error adding sample transaction:', error);
      }
    });

    console.log('Sample data seeded successfully');
  } catch (error) {
    console.error('Failed to seed sample data:', error);
  }
}
