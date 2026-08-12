import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { FinanceService } from '../../../core/services/finance.service';
import { Expense, ExpenseCategory } from '../../../core/models/finance.model';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-expenses',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterLink,
    MatCardModule, MatButtonModule, MatIconModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatDatepickerModule, MatNativeDateModule,
    MatProgressBarModule, MatDividerModule, MatSnackBarModule,MatProgressSpinnerModule
  ],
  templateUrl: './expenses.component.html',
  styleUrl: './expenses.component.scss'
})
export class ExpensesComponent implements OnInit {
  private financeService = inject(FinanceService);
  private fb             = inject(FormBuilder);
  private snackBar       = inject(MatSnackBar);

  expenses:   Expense[]         = [];
  categories: ExpenseCategory[] = [];
  loading = true;
  saving  = false;
  showForm = false;

  readonly paymentMethods = ['CASH', 'UPI', 'CARD', 'OTHER'];

  form = this.fb.group({
    categoryId:    [null as number | null, Validators.required],
    amount:        [null as number | null, [Validators.required, Validators.min(1)]],
    description:   [''],
    paymentMethod: ['CASH'],
    expenseDate:   [new Date(), Validators.required]
  });

  ngOnInit(): void {
    this.loadCategories();
    this.loadExpenses();
  }

  loadCategories(): void {
    this.financeService.getCategories().subscribe({ next: c => this.categories = c });
  }

  loadExpenses(): void {
    this.loading = true;
    const today   = new Date();
    const from    = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
    const to      = today.toISOString().split('T')[0];
    this.financeService.getExpenses(from, to).subscribe({
      next:  e  => { this.expenses = e; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  save(): void {
    if (this.form.invalid) return;
    this.saving = true;
    const v = this.form.value;
    const req = {
      categoryId:    v.categoryId,
      amount:        v.amount,
      description:   v.description || undefined,
      paymentMethod: v.paymentMethod,
      expenseDate:   (v.expenseDate as Date).toISOString().split('T')[0]
    };
    this.financeService.createExpense(req).subscribe({
      next: e => {
        this.saving = false;
        this.expenses.unshift(e);
        this.form.reset({ paymentMethod: 'CASH', expenseDate: new Date() });
        this.showForm = false;
        this.snackBar.open('Expense recorded', '', { duration: 2000 });
      },
      error: () => { this.saving = false; this.snackBar.open('Failed', 'Close', { duration: 3000 }); }
    });
  }

  deleteExpense(exp: Expense): void {
    if (!confirm(`Delete ₹${exp.amount} expense?`)) return;
    this.financeService.deleteExpense(exp.id).subscribe({
      next: () => { this.expenses = this.expenses.filter(e => e.id !== exp.id); this.snackBar.open('Deleted', '', { duration: 1500 }); }
    });
  }

  categoryIcon(id: number): string {
    return this.categories.find(c => c.id === id)?.icon ?? 'payments';
  }

  get totalThisMonth(): number {
    return this.expenses.reduce((s, e) => s + e.amount, 0);
  }
}
