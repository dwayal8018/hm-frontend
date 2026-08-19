import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatStepperModule } from '@angular/material/stepper';
import { MatDividerModule } from '@angular/material/divider';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { environment } from '../../../../environments/environment';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const QRCode = require('qrcode');

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatCardModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatIconModule, MatProgressSpinnerModule, MatSnackBarModule,
    MatSelectModule, MatCheckboxModule, MatStepperModule, MatDividerModule, RouterLink
  ],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent implements OnInit {
  private auth     = inject(AuthService);
  private router   = inject(Router);
  private fb       = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);

  loading          = signal(false);
  hidePassword     = signal(true);
  hideConfirm      = signal(false);
  restaurantCode   = signal<string | null>(null);
  qrDataUrl        = signal<string>('');

  // UPI config — driven from environment so no code change needed to update payment details
  readonly UPI_ID   = environment.upiId;
  readonly UPI_NAME = environment.upiName;

  togglePassword(): void { this.hidePassword.set(!this.hidePassword()); }
  toggleConfirm():  void { this.hideConfirm.set(!this.hideConfirm()); }

  restaurantForm = this.fb.group({
    restaurantName: ['', [Validators.required, Validators.minLength(2)]],
    restaurantPin:  ['', [Validators.required, Validators.pattern(/^\d{4,6}$/)]],
    phone:          ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
    address:        [''],
    upiId:          [''],
    gstNumber:      ['']
  });

  ownerForm = this.fb.group({
    ownerName:       ['', [Validators.required, Validators.minLength(2)]],
    ownerEmail:      ['', [Validators.required, Validators.email]],
    ownerPassword:   ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', [Validators.required]]
  }, { validators: this.passwordMatchValidator });

  planForm = this.fb.group({
    planType:   ['YEARLY', Validators.required],
    roles:      [['OWNER', 'WAITER'], Validators.required],
    paymentRef: ['', [Validators.required, Validators.minLength(6)]]
  });

  readonly plans = [
    { value: 'MONTHLY_3', label: '3 Months', days: 90,  price: 1999  },
    { value: 'MONTHLY_6', label: '6 Months', days: 180, price: 3499 },
    { value: 'YEARLY',    label: '1 Year',   days: 365, price: 5999 }
  ];

  readonly roleOptions = [
    { value: 'OWNER',   label: 'Owner',   hint: 'Full access' },
    { value: 'MANAGER', label: 'Manager', hint: 'Menu, billing, reports' },
    { value: 'WAITER',  label: 'Waiter',  hint: 'Tables & order entry' },
    { value: 'CHEF',    label: 'Chef',    hint: 'Kitchen display — sees all orders' }
  ];

  ngOnInit(): void {
    this.generateQr('YEARLY');
    // Regenerate QR whenever plan changes
    this.planForm.get('planType')!.valueChanges.subscribe(val => {
      if (val) this.generateQr(val);
    });
  }

  private generateQr(planType: string): void {
    const plan   = this.plans.find(p => p.value === planType);
    const amount = plan?.price ?? 5999;
    const note   = encodeURIComponent('Hotel Manager Subscription');
    const upiLink = `upi://pay?pa=${this.UPI_ID}&pn=${encodeURIComponent(this.UPI_NAME)}&am=${amount}&cu=INR&tn=${note}`;
    QRCode.toDataURL(upiLink, { width: 220, margin: 2, color: { dark: '#000', light: '#fff' }, errorCorrectionLevel: 'M' })
      .then((url: string) => this.qrDataUrl.set(url))
      .catch(() => this.qrDataUrl.set(''));
  }

  get selectedPlan() { return this.plans.find(p => p.value === this.planForm.value.planType); }

  isRoleSelected(role: string): boolean {
    return (this.planForm.value.roles as string[])?.includes(role) ?? false;
  }

  toggleRole(role: string): void {
    if (role === 'OWNER') return;
    const current: string[] = [...((this.planForm.value.roles as string[]) ?? [])];
    const idx = current.indexOf(role);
    idx === -1 ? current.push(role) : current.splice(idx, 1);
    this.planForm.patchValue({ roles: current });
  }

  onSubmit(): void {
    if (this.restaurantForm.invalid || this.ownerForm.invalid || this.planForm.invalid) return;
    this.loading.set(true);
    const r = this.restaurantForm.value;
    const o = this.ownerForm.value;
    const p = this.planForm.value;
    this.auth.register({
      restaurantName: r.restaurantName!,
      restaurantPin:  r.restaurantPin!,
      phone:          r.phone!,
      address:        r.address ?? undefined,
      upiId:          r.upiId ?? undefined,
      gstNumber:      r.gstNumber ?? undefined,
      ownerName:      o.ownerName!,
      ownerEmail:     o.ownerEmail!,
      ownerPassword:  o.ownerPassword!,
      planType:       p.planType as 'MONTHLY_3' | 'MONTHLY_6' | 'YEARLY',
      enabledRoles:   p.roles as string[],
      paymentRef:     p.paymentRef!,
      amountPaid:     this.selectedPlan?.price
    }).subscribe({
      next: (res) => { this.loading.set(false); this.restaurantCode.set(res.data); },
      error: (err) => {
        this.loading.set(false);
        const msg = err.status === 409 ? 'Email already exists.' :
                    err.status === 400 ? (err.error?.message ?? 'Please check inputs.') :
                    'Cannot connect to server.';
        this.snackBar.open(msg, 'Close', { duration: 6000 });
      }
    });
  }

  goToLogin(): void { this.router.navigate(['/auth/login']); }

  copyCode(): void {
    const code = this.restaurantCode();
    if (code) { navigator.clipboard.writeText(code); this.snackBar.open('Copied!', '', { duration: 2000 }); }
  }

  private passwordMatchValidator(group: AbstractControl) {
    const pw  = group.get('ownerPassword')?.value;
    const cpw = group.get('confirmPassword')?.value;
    return pw && cpw && pw !== cpw ? { passwordMismatch: true } : null;
  }
}
