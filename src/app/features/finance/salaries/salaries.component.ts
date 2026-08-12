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
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FinanceService } from '../../../core/services/finance.service';
import { EmployeeSalary, SalaryPayment } from '../../../core/models/finance.model';

@Component({
  selector: 'app-salaries',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterLink,
    MatCardModule, MatButtonModule, MatIconModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatProgressBarModule, MatDividerModule,
    MatSnackBarModule, MatProgressSpinnerModule
  ],
  templateUrl: './salaries.component.html',
  styleUrl: './salaries.component.scss'
})
export class SalariesComponent implements OnInit {
  private fs      = inject(FinanceService);
  private fb      = inject(FormBuilder);
  private snack   = inject(MatSnackBar);

  employees: EmployeeSalary[] = [];
  selected: EmployeeSalary | null = null;
  history: SalaryPayment[] = [];
  loading = true;
  saving  = false;
  showPay = false;

  currentMonth = new Date().toISOString().slice(0, 7);
  readonly methods = ['CASH', 'UPI', 'CARD', 'OTHER'];

  payForm = this.fb.group({
    paidAmount:    [null as number | null, [Validators.required, Validators.min(1)]],
    paymentMonth:  [this.currentMonth, Validators.required],
    paymentMethod: ['CASH'],
    notes:         ['']
  });

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.fs.getEmployees().subscribe({ next: e => { this.employees = e; this.loading = false; }, error: () => { this.loading = false; } });
  }

  select(emp: EmployeeSalary): void {
    this.selected = emp;
    this.showPay = false;
    this.payForm.patchValue({ paidAmount: emp.baseSalary, paymentMonth: this.currentMonth });
    this.fs.getSalaryHistory(emp.id).subscribe({ next: h => this.history = h });
  }

  pay(): void {
    if (this.payForm.invalid || !this.selected) return;
    this.saving = true;
    const v = this.payForm.value;
    this.fs.paySalary(this.selected.id, { paidAmount: v.paidAmount, paymentMonth: v.paymentMonth, paymentMethod: v.paymentMethod, notes: v.notes || undefined }).subscribe({
      next: p => {
        this.saving = false; this.history.unshift(p); this.showPay = false;
        this.selected!.paidThisMonth = true; this.selected!.paidThisMonthAmount = p.paidAmount;
        this.snack.open(`Paid ${this.selected!.employeeName}`, '', { duration: 2500 });
      },
      error: err => { this.saving = false; this.snack.open(err.error?.message ?? 'Failed', 'Close', { duration: 4000 }); }
    });
  }

  get unpaid(): number { return this.employees.filter(e => !e.paidThisMonth).length; }
}
