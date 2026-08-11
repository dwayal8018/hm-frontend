import { Component, inject, signal } from '@angular/core';
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
export class RegisterComponent {
  private auth     = inject(AuthService);
  private router   = inject(Router);
  private fb       = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);

  loading          = signal(false);
  hidePassword     = signal(true);
  hideConfirm      = signal(false);
  restaurantCode   = signal<string | null>(null);   // set after success

  togglePassword(): void { this.hidePassword.set(!this.hidePassword()); }
  toggleConfirm():  void { this.hideConfirm.set(!this.hideConfirm()); }

  // ── Step 1: Restaurant details ──────────────────────────────────────────────
  restaurantForm = this.fb.group({
    restaurantName: ['', [Validators.required, Validators.minLength(2)]],
    phone:          ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
    address:        [''],
    upiId:          [''],
    gstNumber:      ['']
  });

  // ── Step 2: Owner + password ─────────────────────────────────────────────────
  ownerForm = this.fb.group({
    ownerName:       ['', [Validators.required, Validators.minLength(2)]],
    ownerEmail:      ['', [Validators.required, Validators.email]],
    ownerPassword:   ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', [Validators.required]]
  }, { validators: this.passwordMatchValidator });

  // ── Step 3: Plan + roles ─────────────────────────────────────────────────────
  planForm = this.fb.group({
    planType:    ['YEARLY', Validators.required],
    roles:       [['OWNER', 'WAITER'], Validators.required],
    amountPaid:  [null as number | null],
    paymentRef:  ['']
  });

  readonly plans = [
    { value: 'MONTHLY_3', label: '3 Months',  days: 90  },
    { value: 'MONTHLY_6', label: '6 Months',  days: 180 },
    { value: 'YEARLY',    label: '1 Year',    days: 365 }
  ];

  readonly roleOptions = [
    { value: 'OWNER',   label: 'Owner',   hint: 'Full access' },
    { value: 'MANAGER', label: 'Manager', hint: 'Menu, billing, reports' },
    { value: 'WAITER',  label: 'Waiter',  hint: 'Tables & order entry' },
    { value: 'CHEF',    label: 'Chef',    hint: 'Kitchen display — sees all orders' }
  ];

  isRoleSelected(role: string): boolean {
    return (this.planForm.value.roles as string[])?.includes(role) ?? false;
  }

  toggleRole(role: string): void {
    if (role === 'OWNER') return;   // OWNER is always required
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
      phone:          r.phone!,
      address:        r.address ?? undefined,
      upiId:          r.upiId ?? undefined,
      gstNumber:      r.gstNumber ?? undefined,
      ownerName:      o.ownerName!,
      ownerEmail:     o.ownerEmail!,
      ownerPassword:  o.ownerPassword!,
      planType:       p.planType as 'MONTHLY_3' | 'MONTHLY_6' | 'YEARLY',
      enabledRoles:   p.roles as string[],
      amountPaid:     p.amountPaid ?? undefined,
      paymentRef:     p.paymentRef ?? undefined
    }).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.restaurantCode.set(res.data);   // show success screen
      },
      error: (err) => {
        this.loading.set(false);
        const msg =
          err.status === 409 ? 'An account with this email already exists.' :
          err.status === 400 ? (err.error?.message ?? 'Please check your inputs.') :
          'Cannot connect to server. Please check your connection.';
        this.snackBar.open(msg, 'Close', { duration: 6000 });
      }
    });
  }

  goToLogin(): void {
    this.router.navigate(['/auth/login']);
  }

  copyCode(): void {
    const code = this.restaurantCode();
    if (code) {
      navigator.clipboard.writeText(code);
      this.snackBar.open('Restaurant code copied!', '', { duration: 2000 });
    }
  }

  private passwordMatchValidator(group: AbstractControl) {
    const pw  = group.get('ownerPassword')?.value;
    const cpw = group.get('confirmPassword')?.value;
    return pw && cpw && pw !== cpw ? { passwordMismatch: true } : null;
  }
}
