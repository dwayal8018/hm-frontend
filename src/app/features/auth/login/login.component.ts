import { Component, inject, signal } from '@angular/core';
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
export class LoginComponent {
  private auth     = inject(AuthService);
  private router   = inject(Router);
  private route    = inject(ActivatedRoute);
  private fb       = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);

  loading      = signal(false);
  hidePassword = signal(true);
  togglePasswordVisibility(): void { this.hidePassword.set(!this.hidePassword()); }

  form = this.fb.group({
    restaurantCode: ['', [Validators.required, Validators.minLength(4)]],
    username:       ['', [Validators.required]],
    password:       ['', [Validators.required, Validators.minLength(6)]]
  });

  onSubmit(): void {
    if (this.form.invalid) return;
    this.loading.set(true);

    const { restaurantCode, username, password } = this.form.value;
    this.auth.login({ restaurantCode: restaurantCode!, username: username!, password: password! }).subscribe({
      next: () => {
        this.loading.set(false);
        // Waiters go straight to tables — they have no dashboard access
        const role       = this.auth.user()?.role;
        const defaultUrl = role === 'WAITER' ? '/tables'
                         : role === 'CHEF'   ? '/kitchen'
                         : '/dashboard';
        const returnUrl  = this.route.snapshot.queryParams['returnUrl'] || defaultUrl;
        this.router.navigateByUrl(returnUrl, { replaceUrl: true });
      },
      error: (err) => {
        this.  loading.set(false);
        console.error('[Login] error:', err.status, err.error);
        const message =
          err.status === 400 ? (err.error?.message ?? 'Invalid credentials. Please check and try again.') :
          err.status === 401 ? 'Invalid credentials. Please check and try again.' :
          err.status === 423 ? 'Your subscription has expired. Please renew to continue.' :
          'Cannot connect to server. Please check your internet connection.';
        this.snackBar.open(message, 'Close', { duration: 5000 });
      }
    });
  }
}
