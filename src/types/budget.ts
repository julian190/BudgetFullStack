export interface Period {
  id: string;
  weekName: string;
  PeriodStart: string;
  PeriodEnd: string;
}

export interface MonthWithPeriods {
  id: string;
  monthNumber: number;
  year: number;
  periods: Period[];
}

export interface Income {
  id: string;
  source: string;
  amount: number;
  frequency: string;
  createdAt: string;
}

export interface ExpenseCategory {
  id: string;
  name: string;
  budget: number;
  expenses: Expense[];
}

export interface Expense {
  id: string;
  categoryId: string;
  description: string;
  amount: number;
  date: string;
}

export interface NewIncome {
  source: string;
  amount: string;
  frequency: string;
}

export interface NewExpense {
  categoryId: string;
  description: string;
  amount: string;
  date: string;
}

export interface NewCategory {
  name: string;
  budget: string;
}
