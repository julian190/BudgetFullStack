'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { Income, ExpenseCategory } from '@/types/budget';
import { LoadingSpinner } from './LoadingSpinner';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

interface DashboardSummaryProps {
  incomes: Income[];
  categories: ExpenseCategory[];
  loading: boolean;
}

interface CategoryData {
  name: string;
  budget: number;
  actual: number;
}

export function DashboardSummary({ incomes, categories, loading }: DashboardSummaryProps) {
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Calculate total income
  const totalIncome = incomes.reduce((sum, income) => {
    const multiplier = income.frequency === 'Monthly' ? 1 : income.frequency === 'Weekly' ? 4 : 1/12;
    return sum + (income.amount * multiplier);
  }, 0);

  // Calculate expenses by category
  const expensesByCategory: CategoryData[] = categories.map(category => ({
    name: category.name,
    budget: category.budget,
    actual: category.expenses.reduce((sum, expense) => sum + expense.amount, 0),
  }));
  // Calculate total expenses
  const totalExpenses = expensesByCategory.reduce((sum, category) => sum + category.actual, 0);

  // Prepare data for the spending distribution pie chart
  const pieChartData = expensesByCategory.map(category => ({
    name: category.name,
    value: category.actual,
  }));
console.log(categories)
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">Financial Summary</h2>
      
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="text-blue-800 text-sm font-medium">Monthly Income</h3>
          <p className="text-2xl font-bold text-blue-900">${totalIncome.toFixed(2)}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <h3 className="text-green-800 text-sm font-medium">Total Expenses</h3>
          <p className="text-2xl font-bold text-green-900">${totalExpenses.toFixed(2)}</p>
        </div>
        <div className={`${totalIncome - totalExpenses >= 0 ? 'bg-emerald-50' : 'bg-red-50'} p-4 rounded-lg`}>
          <h3 className={`${totalIncome - totalExpenses >= 0 ? 'text-emerald-800' : 'text-red-800'} text-sm font-medium`}>
            Net Balance
          </h3>
          <p className={`text-2xl font-bold ${totalIncome - totalExpenses >= 0 ? 'text-emerald-900' : 'text-red-900'}`}>
            ${(totalIncome - totalExpenses).toFixed(2)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Spending Distribution */}
        <div className="h-80">
          <h3 className="text-lg font-semibold mb-4">Spending Distribution</h3>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieChartData}
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {pieChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Budget vs Actual */}
        <div className="h-80">
          <h3 className="text-lg font-semibold mb-4">Budget vs Actual</h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={expensesByCategory}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
              <Legend />
              <Bar dataKey="budget" name="Budget" fill="#8884d8" />
              <Bar dataKey="actual" name="Actual">
                {expensesByCategory.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.actual > entry.budget ? '#ef4444' : '#82ca9d'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
