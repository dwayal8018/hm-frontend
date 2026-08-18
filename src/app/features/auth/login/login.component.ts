import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../../core/services/auth.service';
import { getMachineId } from '../../../core/utils/machine-id';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterLink,
    MatCardModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatIconModule, MatProgressSpinnerModule, MatSnackBarModule
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit {
  private auth     = inject(AuthService);
  private router   = inject(Router);
  private route    = inject(ActivatedRoute);
  private fb       = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);

  loading      = signal(false);
  hidePassword = signal(true);
  togglePasswordVisibility(): void { this.hidePassword.set(!this.hidePassword()); }

  ngOnInit(): void {
    // Show message if redirected due to token expiry
    const reason = this.route.snapshot.queryParams['reason'];
    if (reason === 'session_expired') {
      this.snackBar.open('Your session has expired. Please log in again to continue.', 'OK', { duration: 6000 });
    }
  }

  form = this.fb.group({
    restaurantCode: ['', [Validators.required, Validators.minLength(4)]],
    username:       ['', [Validators.required]],
    password:       ['', [Validators.required, Validators.minLength(6)]]
  });

  onSubmit(): void {
    if (this.form.invalid) return;
    this.loading.set(true);

    const { restaurantCode, username, password } = this.form.value;

    // Generate machine fingerprint and include in login request
    getMachineId().then(machineId => {
      this.auth.login({ restaurantCode: restaurantCode!, username: username!, password: password!, machineId }).subscribe({
        next: () => {
          // Always refresh subscription from cloud on login — catches any expiry since last session.
          this.auth.refreshSubscription().subscribe({ error: () => {} });

          this.loading.set(false);
          const role       = this.auth.user()?.role;
          const defaultUrl = role === 'WAITER' ? '/tables'
                           : role === 'CHEF'   ? '/kitchen'
                           : '/dashboard';
          const returnUrl  = this.route.snapshot.queryParams['returnUrl'] || defaultUrl;
          this.router.navigateByUrl(returnUrl, { replaceUrl: true });
        },
        error: (err) => {
          this.loading.set(false);
          console.error('[Login] error:', err.status, err.error);
          const msg = err.error?.message ?? '';
          const message =
            msg.startsWith('MACHINE_MISMATCH') ? 'This software is registered to a different computer. Contact support.' :
            msg === 'SUBSCRIPTION_EXPIRED' ? 'Your subscription has expired. Please renew to continue.' :
            err.status === 400 ? (msg || 'Invalid credentials. Please check and try again.') :
            err.status === 401 ? 'Invalid credentials. Please check and try again.' :
            'Cannot connect to server. Please check your internet connection.';
          this.snackBar.open(message, 'Close', { duration: 5000 });
        }
      });
    });
  }
}
