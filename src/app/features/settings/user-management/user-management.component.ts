import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { SettingsService, AppUser } from '../../../core/services/settings.service';
import { FinanceService } from '../../../core/services/finance.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterLink,
    MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule,
    MatIconModule, MatSelectModule, MatProgressBarModule, MatDividerModule,
    MatChipsModule, MatTooltipModule, MatSnackBarModule, MatProgressSpinnerModule
  ],
  templateUrl: './user-management.component.html',
  styleUrl:    './user-management.component.scss'
})
export class UserManagementComponent implements OnInit {
  private settings = inject(SettingsService);
  private finance  = inject(FinanceService);
  private auth     = inject(AuthService);
  private fb       = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);

  users:       AppUser[] = [];
  loading      = true;
  saving       = false;
  showAddForm  = false;
  hidePassword = true;

  get enabledRoles(): string[] {
    return this.auth.restaurant()?.enabledRoles ?? ['OWNER', 'WAITER'];
  }

  get addableRoles(): string[] {
    return this.enabledRoles.filter(r => r !== 'OWNER');
  }

  form = this.fb.group({
    username:   ['', [Validators.required, Validators.minLength(3), Validators.pattern(/^[a-z0-9_]+$/)]],
    fullName:   ['', Validators.required],
    role:       ['WAITER', Validators.required],
    password:   ['', [Validators.required, Validators.minLength(8)]],
    baseSalary: [null as number | null, [Validators.min(0)]]
  });

  ngOnInit(): void { this.loadUsers(); }

  loadUsers(): void {
    this.loading = true;
    this.settings.listUsers().subscribe({
      next:  (u) => { this.users = u; this.loading = false; },
      error: ()  => { this.loading = false; }
    });
  }

  addUser(): void {
    if (this.form.invalid) return;
    this.saving = true;
    const v = this.form.value;

    this.settings.createUser({
      username: v.username!, fullName: v.fullName!,
      role: v.role!, password: v.password!
    }).subscribe({
      next: (u) => {
        const finalize = () => {
          this.saving = false;
          this.users.push(u);
          this.form.reset({ role: this.addableRoles[0] ?? 'WAITER', baseSalary: null });
          this.showAddForm = false;
          this.snackBar.open(`User "${u.username}" created`, '', { duration: 2500 });
        };

        // If salary configured, create salary record in backend-local first
        if (v.baseSalary && v.baseSalary > 0) {
          this.finance.upsertEmployee({
            cloudUserId:  u.id,
            employeeName: u.fullName,
            role:         u.role,
            baseSalary:   v.baseSalary
          }).subscribe({
            next:  () => finalize(),
            error: () => {
              this.snackBar.open('User created but salary config failed — set it in Finance → Salaries', 'OK', { duration: 5000 });
              finalize();
            }
          });
        } else {
          finalize();
        }
      },
      error: (err) => {
        this.saving = false;
        this.snackBar.open(err.error?.message ?? 'Failed to create user', 'Close', { duration: 4000 });
      }
    });
  }

  toggleUser(user: AppUser): void {
    this.settings.toggleUser(user.id).subscribe({
      next: (updated) => {
        const idx = this.users.findIndex(u => u.id === updated.id);
        if (idx !== -1) this.users[idx] = updated;
        this.snackBar.open(updated.active ? 'User activated' : 'User deactivated', '', { duration: 2000 });
      },
      error: (err) => this.snackBar.open(err.error?.message ?? 'Failed', 'Close', { duration: 3000 })
    });
  }

  deleteUser(user: AppUser): void {
    if (!confirm(`Delete user "${user.username}"? This cannot be undone.`)) return;
    this.settings.deleteUser(user.id).subscribe({
      next: () => {
        this.users = this.users.filter(u => u.id !== user.id);
        this.snackBar.open('User deleted', '', { duration: 2000 });
      },
      error: (err) => this.snackBar.open(err.error?.message ?? 'Failed to delete', 'Close', { duration: 3000 })
    });
  }

  roleColor(role: string): string {
    return role === 'OWNER' ? 'primary' : role === 'MANAGER' ? 'accent' : '';
  }
}
