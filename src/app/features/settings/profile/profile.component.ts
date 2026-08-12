import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { SettingsService } from '../../../core/services/settings.service';
import { AuthService } from '../../../core/services/auth.service';

interface RoleOption {
  value: string;
  label: string;
  icon: string;
  hint: string;
  locked: boolean;
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterLink,
    MatCardModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatIconModule, MatProgressBarModule,
    MatProgressSpinnerModule, MatDividerModule, MatSnackBarModule
  ],
  templateUrl: './profile.component.html',
  styleUrl:    './profile.component.scss'
})
export class ProfileComponent implements OnInit {
  private settings  = inject(SettingsService);
  private auth      = inject(AuthService);
  private fb        = inject(FormBuilder);
  private snackBar  = inject(MatSnackBar);

  loading      = false;
  saving       = false;
  enabledRoles: string[] = ['OWNER'];

  readonly allRoles: RoleOption[] = [
    { value: 'OWNER',   label: 'Owner',   icon: 'admin_panel_settings', hint: 'Full access — always required',         locked: true  },
    { value: 'MANAGER', label: 'Manager', icon: 'manage_accounts',      hint: 'Menu, billing, reports',                locked: false },
    { value: 'WAITER',  label: 'Waiter',  icon: 'room_service',         hint: 'Tables and order entry only',           locked: false },
    { value: 'CHEF',    label: 'Chef',    icon: 'restaurant',           hint: 'Kitchen display — sees all open orders', locked: false },
  ];

  form = this.fb.group({
    restaurantName: ['', Validators.required],
    ownerName:      ['', Validators.required],
    ownerEmail:     ['', [Validators.required, Validators.email]],
    phone:          ['', Validators.required],
    address:        [''],
    upiId:          [''],
    gstNumber:      [''],
    logoUrl:        ['']
  });

  ngOnInit(): void {
    const restaurant = this.auth.restaurant();
    const user       = this.auth.user();

    // Pre-fill form from auth signals (instant, no network)
    if (restaurant) {
      this.form.patchValue({
        restaurantName: restaurant.name,
        phone:          restaurant.phone,
        address:        restaurant.address   ?? '',
        upiId:          restaurant.upiId     ?? '',
        gstNumber:      restaurant.gstNumber ?? '',
        logoUrl:        restaurant.logoUrl   ?? ''
      });
    }
    if (user) {
      this.form.patchValue({ ownerName: user.fullName });
    }

    // Load enabledRoles from raw localStorage — handles the case where the
    // auth signal's enabledRoles is missing (logged in before this feature was added)
    try {
      const raw = localStorage.getItem('hm_restaurant');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed?.enabledRoles) && parsed.enabledRoles.length > 0) {
          this.enabledRoles = parsed.enabledRoles.map((r: string) => r.trim()).filter(Boolean);
        }
      }
    } catch { /* keep default ['OWNER'] */ }

    // Fetch from API — authoritative source, overwrites localStorage on success
    this.settings.getProfile().subscribe({
      next: (p) => {
        this.form.patchValue({
          restaurantName: p.restaurantName,
          ownerName:      p.ownerName,
          ownerEmail:     p.ownerEmail,
          phone:          p.phone,
          address:        p.address    ?? '',
          upiId:          p.upiId      ?? '',
          gstNumber:      p.gstNumber  ?? '',
          logoUrl:        p.logoUrl    ?? ''
        });
        // Normalize — trim whitespace in case backend CSV split produced spaces
        if (Array.isArray(p.enabledRoles) && p.enabledRoles.length > 0) {
          this.enabledRoles = p.enabledRoles.map((r: string) => r.trim()).filter(Boolean);
        }
      },
      error: () => { /* keep localStorage roles as fallback */ }
    });
  }

  isRoleEnabled(role: string): boolean {
    return this.enabledRoles.includes(role);
  }

  toggleRole(role: string): void {
    if (role === 'OWNER') return;
    if (this.isRoleEnabled(role)) {
      this.enabledRoles = this.enabledRoles.filter(r => r !== role);
    } else {
      this.enabledRoles = [...this.enabledRoles, role];
    }
  }

  save(): void {
    if (this.form.invalid) return;
    this.saving = true;
    const payload = { ...this.form.value, enabledRoles: this.enabledRoles };
    this.settings.updateProfile(payload as any).subscribe({
      next: (updated) => {
        this.saving = false;
        this.snackBar.open('Profile updated', '', { duration: 2500 });
        // Update the auth signal immediately so other components (user-management)
        // see the new enabledRoles without requiring a re-login
        this.auth.updateRestaurantInfo({
          name:         updated.restaurantName,
          address:      updated.address,
          phone:        updated.phone,
          upiId:        updated.upiId,
          gstNumber:    updated.gstNumber,
          logoUrl:      updated.logoUrl,
          enabledRoles: updated.enabledRoles as any
        });
      },
      error: (err) => {
        this.saving = false;
        // err.error is the ApiResponse wrapper: { success: false, message: "..." }
        const msg = err.error?.message
          ?? (err.status === 409 ? 'This email is already used by another restaurant.' : null)
          ?? (err.status === 0   ? 'Cannot connect to server. Please check your connection.' : null)
          ?? 'Failed to save profile. Please try again.';
        this.snackBar.open(msg, 'Close', { duration: 5000 });
      }
    });
  }
}
