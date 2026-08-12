import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  ExpenseCategory, Expense, EmployeeSalary, SalaryPayment,
  OwnerWithdrawal, FinanceSummary
} from '../models/finance.model';

interface ApiResponse<T> { success: boolean; data: T; }

@Injectable({ providedIn: 'root' })
export class FinanceService {
  private readonly base = `${environment.localApiUrl}/finance`;
  constructor(private http: HttpClient) {}

  // Summary
  getSummary(period = 'MONTH'): Observable<FinanceSummary> {
    return this.http.get<ApiResponse<FinanceSummary>>(`${this.base}/summary?period=${period}`).pipe(map(r => r.data));
  }

  // Categories
  getCategories(): Observable<ExpenseCategory[]> {
    return this.http.get<ApiResponse<ExpenseCategory[]>>(`${this.base}/categories`).pipe(map(r => r.data));
  }
  createCategory(name: string, icon: string): Observable<ExpenseCategory> {
    return this.http.post<ApiResponse<ExpenseCategory>>(`${this.base}/categories`, { name, icon }).pipe(map(r => r.data));
  }
  deleteCategory(id: number): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.base}/categories/${id}`).pipe(map(() => void 0));
  }

  // Expenses
  getExpenses(from?: string, to?: string): Observable<Expense[]> {
    let params = new HttpParams();
    if (from) params = params.set('from', from);
    if (to)   params = params.set('to', to);
    return this.http.get<ApiResponse<Expense[]>>(`${this.base}/expenses`, { params }).pipe(map(r => r.data));
  }
  createExpense(req: any): Observable<Expense> {
    return this.http.post<ApiResponse<Expense>>(`${this.base}/expenses`, req).pipe(map(r => r.data));
  }
  deleteExpense(id: number): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.base}/expenses/${id}`).pipe(map(() => void 0));
  }

  // Employees
  getEmployees(): Observable<EmployeeSalary[]> {
    return this.http.get<ApiResponse<EmployeeSalary[]>>(`${this.base}/employees`).pipe(map(r => r.data));
  }
  upsertEmployee(req: any): Observable<EmployeeSalary> {
    return this.http.post<ApiResponse<EmployeeSalary>>(`${this.base}/employees`, req).pipe(map(r => r.data));
  }
  paySalary(employeeId: number, req: any): Observable<SalaryPayment> {
    return this.http.post<ApiResponse<SalaryPayment>>(`${this.base}/employees/${employeeId}/pay`, req).pipe(map(r => r.data));
  }
  getSalaryHistory(employeeId: number): Observable<SalaryPayment[]> {
    return this.http.get<ApiResponse<SalaryPayment[]>>(`${this.base}/employees/${employeeId}/payments`).pipe(map(r => r.data));
  }

  // Withdrawals
  getWithdrawals(from?: string, to?: string): Observable<OwnerWithdrawal[]> {
    let params = new HttpParams();
    if (from) params = params.set('from', from);
    if (to)   params = params.set('to', to);
    return this.http.get<ApiResponse<OwnerWithdrawal[]>>(`${this.base}/withdrawals`, { params }).pipe(map(r => r.data));
  }
  createWithdrawal(req: any): Observable<OwnerWithdrawal> {
    return this.http.post<ApiResponse<OwnerWithdrawal>>(`${this.base}/withdrawals`, req).pipe(map(r => r.data));
  }
  deleteWithdrawal(id: number): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.base}/withdrawals/${id}`).pipe(map(() => void 0));
  }
}
