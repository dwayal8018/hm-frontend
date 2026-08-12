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
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FinanceService } from '../../../core/services/finance.service';
import { OwnerWithdrawal } from '../../../core/models/finance.model';

@Component({
  selector: 'app-withdrawals',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterLink,
    MatCardModule, MatButtonModule, MatIconModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatDatepickerModule, MatNativeDateModule,
    MatProgressBarModule, MatDividerModule, MatSnackBarModule, MatProgressSpinnerModule
  ],
  templateUrl: './withdrawals.component.html',
  styleUrl: './withdrawals.component.scss'
})
export class WithdrawalsComponent implements OnInit {
  private fs    = inject(FinanceService);
  private fb    = inject(FormBuilder);
  private snack = inject(MatSnackBar);

  list: OwnerWithdrawal[] = [];
  loading  = true;
  saving   = false;
  showForm = false;
  readonly methods = ['CASH', 'UPI', 'CARD', 'OTHER'];

  form = this.fb.group({
    amount:         [null as number | null, [Validators.required, Validators.min(1)]],
    reason:         [''],
    paymentMethod:  ['CASH'],
    withdrawalDate: [new Date(), Validators.required]
  });

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    const today = new Date();
    const from  = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
    this.fs.getWithdrawals(from, today.toISOString().split('T')[0]).subscribe({
      next: w => { this.list = w; this.loading = false; }, error: () => { this.loading = false; }
    });
  }

  save(): void {
    if (this.form.invalid) return;
    this.saving = true;
    const v = this.form.value;
    this.fs.createWithdrawal({
      amount: v.amount, reason: v.reason || undefined,
      paymentMethod: v.paymentMethod,
      withdrawalDate: (v.withdrawalDate as Date).toISOString().split('T')[0]
    }).subscribe({
      next: w => { this.saving = false; this.list.unshift(w); this.form.reset({ paymentMethod: 'CASH', withdrawalDate: new Date() }); this.showForm = false; this.snack.open('Recorded', '', { duration: 2000 }); },
      error: () => { this.saving = false; this.snack.open('Failed', 'Close', { duration: 3000 }); }
    });
  }

  del(w: OwnerWithdrawal): void {
    if (!confirm(`Delete ₹${w.amount}?`)) return;
    this.fs.deleteWithdrawal(w.id).subscribe({ next: () => this.list = this.list.filter(x => x.id !== w.id) });
  }

  get total(): number { return this.list.reduce((s, w) => s + w.amount, 0); }
}
