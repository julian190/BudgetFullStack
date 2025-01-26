'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '../../lib/api';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { DashboardSummary } from '../../components/DashboardSummary';
import type { Income, ExpenseCategory, Expense, NewIncome, NewExpense, NewCategory } from '../../types/budget';
import { Period } from '@prisma/client';
export default function Dashboard() {
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [newIncome, setNewIncome] = useState<NewIncome>({ source: '', amount: '', frequency: 'Monthly' });
  const [newCategory, setNewCategory] = useState<NewCategory>({ name: '', budget: '' });
  const [newExpense, setNewExpense] = useState<NewExpense>({
    categoryId: '',
    description: '',
    amount: '',
    date: new Date().toISOString().split('T')[0]
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userSession, setUserSession] = useState<{ user?: { id: string } } | null>(null);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/session');
        const session = await response.json();
        
        if (!session?.user) {
          router.push('/login');
          return;
        }
        
        setUserSession(session);
        fetchData();
      } catch (error) {
        console.error('Auth check failed:', error);
        router.push('/login');
      }
    };

    checkAuth();
  }, [router]);

  // Access user ID throughout the component using:
  // const userId = userSession?.user?.id;

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch incomes and categories in parallel
      const [incomesResponse, categoriesResponse] = await Promise.all([
        api.get<Income[]>('/api/income'),
        api.get<ExpenseCategory[]>('/api/category')
      ]);

      if (incomesResponse && categoriesResponse) {
        setIncomes(incomesResponse);
        setCategories(categoriesResponse);
      }
    } catch (error: unknown) {
      console.error('Error fetching data:', error);
      if (error && typeof error === 'object' && 'data' in error) {
        const apiError = error as { data?: { message?: string } };
        setError(apiError.data?.message || 'Failed to load dashboard data');
      } else {
        setError('Failed to load dashboard data');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddIncome = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      setError('');

      await api.post<Income>('/api/income', {
        source: newIncome.source,
        amount: parseFloat(newIncome.amount),
        frequency: newIncome.frequency,
      });

      setNewIncome({ source: '', amount: '', frequency: 'Monthly' });
      await fetchData();
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'data' in error) {
        const apiError = error as { data?: { message?: string } };
        setError(apiError.data?.message || 'Failed to add income');
      } else {
        setError('Failed to add income');
      }
      console.error('Error adding income:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      setError('');

      await api.post<ExpenseCategory>('/api/category', {
        name: newCategory.name,
        budget: newCategory.budget,
      });

      setNewCategory({ name: '', budget: '' });
      await fetchData();
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'data' in error) {
        const apiError = error as { data?: { message?: string } };
        setError(apiError.data?.message || 'Failed to add category');
      } else {
        setError('Failed to add category');
      }
      console.error('Error adding category:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      setError('');

      await api.post<Expense>('/api/expense', {
        categoryId: newExpense.categoryId,
        description: newExpense.description,
        amount: newExpense.amount,
        date: newExpense.date,
        ChangeComment : 'Added'
      });

      setNewExpense({ 
        categoryId: '', 
        description: '', 
        amount: '',
        date: new Date().toISOString().split('T')[0]
      });
      await fetchData();
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'data' in error) {
        const apiError = error as { data?: { message?: string } };
        setError(apiError.data?.message || 'Failed to add expense');
      } else {
        setError('Failed to add expense');
      }
      console.error('Error adding expense:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const CreatePeriod = async () => {
    try {
      const response = await fetch('/api/period', {
        method: 'POST'
      });

      if (!response.ok) {
        throw new Error('Failed to create periods');
      }

      const result = await response.json();
      alert(result.message);
      
      // Refresh the page to show new periods
      window.location.reload();
    } catch (error) {
      console.error('Failed to create new period:', error);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Navigation Bar */}
      <div className="bg-white p-4 rounded-lg shadow-md mb-8 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Budget Dashboard</h1>
        <Link href="/expenses" className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors mr-2">
          Add Expense
        </Link>
        <Link href="#" onClick={CreatePeriod} className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors mr-2">
          Create Period
        </Link>
        <button
          onClick={async () => {
            try {
              await fetch('/api/auth/signout', { method: 'POST' });
              router.push('/login');
              router.refresh();
            } catch (error) {
              console.error('Logout failed:', error);
            }
          }}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
        >
          Logout
        </button>
      </div>

      {/* Summary Section */}
      <div className="mb-8">
        <DashboardSummary
          incomes={incomes}
          categories={categories}
          loading={loading}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Income Section */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-4">Income</h2>
          <form onSubmit={handleAddIncome} className="mb-4">
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Source"
                value={newIncome.source}
                onChange={(e) => setNewIncome({ ...newIncome, source: e.target.value })}
                className="w-full p-2 border rounded bg-white"
                required
              />
              <input
                type="number"
                step="0.01"
                placeholder="Amount"
                value={newIncome.amount}
                onChange={(e) => setNewIncome({ ...newIncome, amount: e.target.value })}
                className="w-full p-2 border rounded bg-white"
                required
              />
              <select
                value={newIncome.frequency}
                onChange={(e) => setNewIncome({ ...newIncome, frequency: e.target.value })}
                className="w-full p-2 border rounded bg-white"
              >
                <option value="Monthly">Monthly</option>
                <option value="Weekly">Weekly</option>
                <option value="Yearly">Yearly</option>
              </select>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-indigo-600 text-white p-2 rounded hover:bg-indigo-700 disabled:opacity-50"
              >
                {isSubmitting ? <LoadingSpinner size="sm" /> : 'Add Income'}
              </button>
            </div>
          </form>
          <div className="space-y-2">
            {incomes.map((income) => (
              <div key={income.id} className="p-3 bg-gray-50 rounded">
                <div className="font-semibold">{income.source}</div>
                <div className="text-sm text-gray-600">
                  ${income.amount} - {income.frequency}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Expenses Section */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-4">Expenses</h2>
          
          {/* Add Category Form */}
          <form onSubmit={handleAddCategory} className="mb-4">
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Category Name"
                value={newCategory.name}
                onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                className="w-full p-2 border rounded bg-white"
                required
              />
              <input
                type="number"
                step="0.01"
                placeholder="Budget Amount"
                value={newCategory.budget}
                onChange={(e) => setNewCategory({ ...newCategory, budget: e.target.value })}
                className="w-full p-2 border rounded bg-white"
                required
              />
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-indigo-600 text-white p-2 rounded hover:bg-indigo-700 disabled:opacity-50"
              >
                {isSubmitting ? <LoadingSpinner size="sm" /> : 'Add Category'}
              </button>
            </div>
          </form>

          {/* Add Expense Form */}
          <form onSubmit={handleAddExpense} className="mb-4">
            <div className="space-y-4">
              <select
                value={newExpense.categoryId}
                onChange={(e) => setNewExpense({ ...newExpense, categoryId: e.target.value })}
                className="w-full p-2 border rounded bg-white"
                required
              >
                <option value="">Select Category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Description"
                value={newExpense.description}
                onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                className="w-full p-2 border rounded bg-white"
                required
              />
              <input
                type="text"
                placeholder="Amount"
                value={newExpense.amount}
                onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value.toString() })}
                className="w-full p-2 border rounded bg-white"
                required
              />
               <input
                type="date"
                
                placeholder="Date"
                value={newExpense.date}
                onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })}
                className="w-full p-2 border rounded bg-white"
                required
              />
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-indigo-600 text-white p-2 rounded hover:bg-indigo-700 disabled:opacity-50"
              >
                {isSubmitting ? <LoadingSpinner size="sm" /> : 'Add Expense'}
              </button>
            </div>
          </form>

          {/* Display Categories and Expenses */}
          <div className="space-y-4">
            {categories.map((category) => (
              <div key={category.id} className="p-4 bg-gray-50 rounded">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-semibold">{category.name}</h3>
                  <span className="text-sm text-gray-600">
                    Budget: ${category.budget}
                  </span>
                </div>
                <div className="space-y-2">
                  {category.expenses.map((expense) => (
                    <div key={expense.id} className="p-2 bg-white rounded shadow-sm">
                      <div className="flex justify-between items-center">
                        <span>{expense.description}</span>
                        <span className="text-sm text-gray-600">${expense.amount}</span>
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(expense.date).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
