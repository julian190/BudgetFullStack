'use client';


import { useState, useEffect } from 'react';
import { useApi } from '@/lib/api';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DatePicker } from '@/components/ui/date-picker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { toast } from '@/components/ui/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { MonthWithPeriods } from '@/types/budget';
import Link  from 'next/link';

interface Expense {
  id: number;
  description: string;
  amount: number;
  categoryId: number;
  date: string;
}

interface ExpenseCategory {
  id: number;
  name: string;
  budget: number;
}

export default function ExpensesPage() {
  const api = useApi();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [periods, setPeriods] = useState<MonthWithPeriods[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string | undefined>("0");
  const [selectedPeriod, setSelectedPeriod] = useState<string | undefined>("0");
  const [filteredExpenses, setFilteredExpenses] = useState<Expense[]>([]);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    description: '',
    amount: 0,
    categoryId: '',
    date: new Date(),
    ChangeComment: '',
  });

  useEffect(() => {
    const loadInitialData = async () => {
      await loadExpenses();
      await loadCategories();
      await loadPeriods();
    };
    loadInitialData();
  });

  useEffect(() => {
    const fetchExpenses = async () => {
      try {
        let query = '';
        if (selectedMonth) {
          query += `MonthID=${selectedMonth}`;
        }
        if (selectedPeriod) {
          if (query) {
            query += '&';
          }
          query += `PeriodID=${selectedPeriod}`;
        }
        const response = await api.get<Expense[]>(`/api/expense/${query ? '?' + query : ''}`);
        if (response) {
             //@ts-expect-error hamada
          setExpenses(response);
        }
      } catch {
        toast({
          title: 'Error',
          description: 'Failed to load expenses',
          variant: 'destructive',
        });
      }
    };

    fetchExpenses();
  }, [selectedMonth, selectedPeriod]);
console.debug(filteredExpenses);
  const loadExpenses = async () => {
    try {
      const response = await api.get<Expense[]>('/api/expense/');
      if (response) {
           //@ts-expect-error hamada
        setExpenses(response);
      }
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to load expenses',
        variant: 'destructive',
      });
    }
  };

  const loadCategories = async () => {
    try {
      const response = await api.get<ExpenseCategory[]>('/api/category');
      if (response) {
           //@ts-expect-error hamada
        setCategories(response);
      }
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to load categories',
        variant: 'destructive',
      });
    }
  };

  const loadPeriods = async () => {
    try {
      const response = await api.get<MonthWithPeriods[]>('/api/period?endpoint=list');
      if (response) {
           //@ts-expect-error hamada
        setPeriods(response);
      }
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to load periods',
        variant: 'destructive',
      });
    }
  };

  const handleSubmit = async () => {
    try {
      if (!formData.description || !formData.amount || !formData.categoryId) {
        toast({
          title: 'Error',
          description: 'Please fill in all required fields',
          variant: 'destructive',
        });
        return;
      }

      if (selectedExpense) {
        await api.put(`/api/expenses/${selectedExpense.id}`, {
          ...formData,
          amount: Number(formData.amount),
          categoryId: Number(formData.categoryId),
        });
      } else {
        await api.post('/api/expense/', {
          ...formData,
          amount: Number(formData.amount),
          categoryId: Number(formData.categoryId),
        });
      }
      
      setIsDialogOpen(false);
      resetForm();
      loadExpenses();
      toast({
        title: 'Success',
        description: `Expense ${selectedExpense ? 'updated' : 'added'} successfully`,
      });
    } catch {
      toast({
        title: 'Error',
        description: `Failed to ${selectedExpense ? 'update' : 'add'} expense`,
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/api/expense/${id}`);
      loadExpenses();
      toast({
        title: 'Success',
        description: 'Expense deleted successfully',
      });
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to delete expense',
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setFormData({
      description: '',
      amount: 0,
      categoryId: '',
      date: new Date(),
      ChangeComment: '',
    });
    setSelectedExpense(null);
  };

  const openEditDialog = (expense: Expense) => {
    setSelectedExpense(expense);
    setFormData({
      description: expense.description,
      amount: expense.amount,
         //@ts-expect-error hamada
      categoryId: expense.category.id,
      date: new Date(expense.date),
      ChangeComment: '',
    });
    setIsDialogOpen(true);
  };
  const ClearFilters = () => {
    setSelectedMonth('0');
    setSelectedPeriod('0');
    setFilteredExpenses([]);
  }
  const selectedFilteredMonth = periods.find(month => month.id === selectedMonth);

      return (
    <div className="container mx-auto py-8 px-4 space-y-6">
                  <Link href='/' className="text-accent">Back</Link>

      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Expenses</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} size="sm">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mr-2"
              >
                <path d="M12 5v14M5 12h14" />
              </svg>
              Add Expense
            </Button>

          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{selectedExpense ? 'Edit' : 'Add'} Expense</DialogTitle>
            </DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-6">
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="description">Description *</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Enter description"
                    className="w-full"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="amount">Amount *</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.amount}
                      onChange={(e) =>
                        setFormData({ ...formData, amount: parseFloat(e.target.value) })
                      }
                      placeholder="0.00"
                      className="pl-7"
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select
                    value={formData.categoryId}
                    onValueChange={(value) =>
                      setFormData({ ...formData, categoryId: value })
                    }
                  >
                    <SelectTrigger id="category" className="w-full">
                      <SelectValue placeholder="Select category"  >
                        {categories.find((c) => c.id === parseInt(formData.categoryId))?.name || 'Select category'}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id.toString()}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="date">Date *</Label>
                  <DatePicker
                    date={formData.date}
                    onChange={(date) => setFormData({ ...formData, date: date || new Date() })}
                  />
                </div>
                {selectedExpense && (
                  
                  <div className="grid gap-2">
                    <Label htmlFor="ChangeComment">ChangeComment</Label>
                    <Textarea
                      id="ChangeComment"
                      value={formData.ChangeComment}
                      onChange={(e) =>
                        setFormData({ ...formData, ChangeComment: e.target.value })
                      }
                      placeholder="Reason for change"
                      className="min-h-[100px]"
                    />
                  </div>
                )}
              </div>
              <DialogFooter className="gap-2 sm:gap-0">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {selectedExpense ? 'Update' : 'Add'} Expense
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Expense List</h2>
          <div className="flex items-center space-x-2">
            
            <Select onValueChange={(value) => setSelectedMonth(String(value))}>
              <SelectTrigger id="month">
                <SelectValue placeholder="Filter by Month" >
                  {selectedMonth === "0" ? 'Filter by Month' : periods.find((m) => m.id === selectedMonth)?.monthNumber}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={'0'}>Filter by Month</SelectItem>
                {periods.map((month) => (
                  <SelectItem key={month.id} value={month.id}>
                    {new Date(month.year, month.monthNumber -1).toLocaleString('default', { month: 'long' }) + ' ' + month.year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select onValueChange={(value) => setSelectedPeriod(value)}>
              <SelectTrigger id="period">
                <SelectValue placeholder="Filter by Week" >
                  {selectedPeriod === '0' ? 'Filter by Week' : periods.flatMap((m) => m.periods).find((p) => p.id === selectedPeriod)?.weekName}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
              <SelectItem value={'0'}>All Weeks</SelectItem>

                { selectedFilteredMonth ?  selectedFilteredMonth.periods.map(period => (
                  <SelectItem key={period.id} value={period.id}>
                    {period.weekName}
                  </SelectItem>)):periods.flatMap(month => month.periods.map(period => (
                  <SelectItem key={period.id} value={period.id}>
                    {period.weekName}
                  </SelectItem>
                )))}
              </SelectContent>
            </Select>
            <Button onClick={() => ClearFilters()} size="sm">Clear Filters</Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {expenses.length === 0 && (selectedMonth != '0' || selectedPeriod !='0') ? (
              <div className="text-center py-12">
                <h3 className="text-lg font-semibold mb-2">No expenses match the current filters</h3>
              </div>
            ) : expenses.length === 0 && (selectedMonth === '0' || selectedPeriod === '0') ? (
              <div className="text-center py-12">
                <div className="text-4xl font-semibold text-muted-foreground mb-4">💰</div>
                <h3 className="text-lg font-semibold mb-2">No expenses yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Add your first expense to start tracking your spending.
                </p>
                <Button onClick={() => setIsDialogOpen(true)}>Add Your First Expense</Button>
              </div>
            ) : (
              expenses.map((expense) => (
                <div
                  key={expense.id}
                  className="flex items-center justify-between p-4 bg-card hover:bg-accent transition-colors rounded-lg border"
                >
                  <div>
                    <div className="font-medium">{expense.description}</div>
                    <div className="text-sm text-muted-foreground">
                      {categories.find((c) => c.id === expense.categoryId)?.name} -{' '}
                      {new Date(expense.date).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="font-medium text-green-600 dark:text-green-400">
                      ${expense.amount.toFixed(2)}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(expense)}
                        className="h-8 px-2"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="mr-2"
                        >
                          <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                          <path d="m15 5 4 4" />
                        </svg>
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(expense.id)}
                        className="h-8 px-2 text-red-600 hover:text-red-600 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/20"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="mr-2"
                        >
                          <path d="M3 6h18" />
                          <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                          <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                          <line x1="10" y1="11" x2="10" y2="17" />
                          <line x1="14" y1="11" x2="14" y2="17" />
                        </svg>
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
