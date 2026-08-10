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
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { SettingsService } from '../../../core/services/settings.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterLink,
    MatCardModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatIconModule, MatProgressBarModule,
    MatProgressSpinnerModule, MatSnackBarModule
  ],
  templateUrl: './profile.component.html',
  styleUrl:    './profile.component.scss'
})
export class ProfileComponent implements OnInit {
  private settings  = inject(SettingsService);
  private auth      = inject(AuthService);
  private fb        = inject(FormBuilder);
  private snackBar  = inject(MatSnackBar);

  loading = false;
  saving  = false;

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
    // Pre-fill instantly from localStorage — no spinner needed
    const restaurant = this.auth.restaurant();
    const user       = this.auth.user();
    if (restaurant) {
      this.form.patchValue({
        restaurantName: restaurant.name,
        phone:          restaurant.phone,
        address:        restaurant.address        ?? '',
        upiId:          restaurant.upiId          ?? '',
        gstNumber:      restaurant.gstNumber      ?? '',
        logoUrl:        restaurant.logoUrl        ?? ''
      });
    }
    if (user) {
      this.form.patchValue({ ownerName: user.fullName });
    }
    // Also fetch from API to get ownerEmail (not stored in JWT/localStorage)
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
      },
      error: () => { /* form still usable from localStorage */ }
    });
  }

  save(): void {
    if (this.form.invalid) return;
    this.saving = true;
    this.settings.updateProfile(this.form.value as any).subscribe({
      next: (updated) => {
        this.saving = false;
        this.snackBar.open('Profile updated', '', { duration: 2500 });
        const stored = localStorage.getItem('hm_restaurant');
        if (stored) {
          const r     = JSON.parse(stored);
          r.name      = updated.restaurantName;
          r.address   = updated.address;
          r.phone     = updated.phone;
          r.upiId     = updated.upiId;
          r.gstNumber = updated.gstNumber;
          r.logoUrl   = updated.logoUrl;
          localStorage.setItem('hm_restaurant', JSON.stringify(r));
        }
      },
      error: (err) => {
        this.saving = false;
        this.snackBar.open(err.error?.message ?? 'Failed to update', 'Close', { duration: 4000 });
      }
    });
  }
}
