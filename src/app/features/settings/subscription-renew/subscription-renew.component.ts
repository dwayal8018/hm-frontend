import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../../core/services/auth.service';
import { environment } from '../../../../environments/environment';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const QRCode = require('qrcode');

@Component({
  selector: 'app-subscription-renew',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatCardModule, MatButtonModule, MatIconModule, MatFormFieldModule,
    MatInputModule, MatDividerModule, MatProgressSpinnerModule, MatSnackBarModule
  ],
  templateUrl: './subscription-renew.component.html',
  styleUrl:    './subscription-renew.component.scss'
})
export class SubscriptionRenewComponent implements OnInit {
  private auth     = inject(AuthService);
  private router   = inject(Router);
  private fb       = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);

  loading  = signal(false);
  qrDataUrl = signal<string>('');

  readonly plans = [
    { value: 'MONTHLY_3', label: '3 Months', days: 90,  price: 999  },
    { value: 'MONTHLY_6', label: '6 Months', days: 180, price: 1799 },
    { value: 'YEARLY',    label: '1 Year',   days: 365, price: 2999 }
  ];

  get currentPlan()   { return this.auth.subscription()?.planType ?? ''; }
  get expiryDate()    { return this.auth.subscription()?.expiryDate ?? ''; }
  get daysRemaining() { return this.auth.subscription()?.daysRemaining ?? 0; }

  readonly upiId = environment.upiId;

  form = this.fb.group({
    planType:   ['YEARLY', Validators.required],
    paymentRef: ['', [Validators.required, Validators.minLength(6)]]
  });

  get selectedPlan() { return this.plans.find(p => p.value === this.form.value.planType); }

  ngOnInit(): void {
    this.generateQr('YEARLY');
    this.form.get('planType')!.valueChanges.subscribe(v => { if (v) this.generateQr(v); });
  }

  private generateQr(planType: string): void {
    const plan   = this.plans.find(p => p.value === planType);
    const amount = plan?.price ?? 2999;
    const note   = encodeURIComponent('Hotel Manager Renewal');
    const upiLink = `upi://pay?pa=${environment.upiId}&pn=${encodeURIComponent(environment.upiName)}&am=${amount}&cu=INR&tn=${note}`;
    QRCode.toDataURL(upiLink, { width: 200, margin: 2, errorCorrectionLevel: 'M' })
      .then((url: string) => this.qrDataUrl.set(url))
      .catch(() => this.qrDataUrl.set(''));
  }

  submit(): void {
    if (this.form.invalid) return;
    this.loading.set(true);
    const v = this.form.value;
    this.auth.renewSubscription(v.planType!, v.paymentRef!, this.selectedPlan?.price ?? 0).subscribe({
      next: () => {
        this.loading.set(false);
        this.snackBar.open('Subscription renewed successfully!', '', { duration: 3000 });
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.loading.set(false);
        this.snackBar.open(
          err.error?.message ?? 'Renewal failed. Check your internet connection and try again.',
          'Close', { duration: 5000 }
        );
      }
    });
  }

  goBack(): void { this.router.navigate(['/subscription/expired']); }
}
