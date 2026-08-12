export interface ExpenseCategory {
  id: number;
  name: string;
  icon: string;
  predefined: boolean;
  active: boolean;
}

export interface Expense {
  id: number;
  categoryId: number;
  categoryName: string;
  categoryIcon: string;
  amount: number;
  description?: string;
  paymentMethod: string;
  expenseDate: string;
  recordedBy: string;
  createdAt: string;
}

export interface EmployeeSalary {
  id: number;
  cloudUserId: number;
  employeeName: string;
  role: string;
  baseSalary: number;
  effectiveFrom: string;
  active: boolean;
  paidThisMonth: boolean;
  paidThisMonthAmount?: number;
}

export interface SalaryPayment {
  id: number;
  employeeId: number;
  employeeName: string;
  role: string;
  paymentMonth: string;
  paidAmount: number;
  paymentMethod: string;
  notes?: string;
  paidBy: string;
  paidAt: string;
}

export interface OwnerWithdrawal {
  id: number;
  amount: number;
  reason?: string;
  withdrawalDate: string;
  paymentMethod: string;
  recordedBy: string;
  createdAt: string;
}

export interface FinanceSummary {
  period: string;
  totalRevenue: number;
  totalExpenses: number;
  totalSalaries: number;
  totalWithdrawals: number;
  netProfit: number;
  expenseByCategory: { category: string; amount: number }[];
  revenueByDay: { date: string; revenue: number }[];
}
