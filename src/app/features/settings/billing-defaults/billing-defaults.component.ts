import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatRadioModule } from '@angular/material/radio';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { SettingsService } from '../../../core/services/settings.service';

@Component({
  selector: 'app-billing-defaults',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterLink,
    MatCardModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatIconModule, MatRadioModule, MatSnackBarModule,
    MatProgressSpinnerModule, MatProgressBarModule
  ],
  templateUrl: './billing-defaults.component.html',
  styleUrl:    './billing-defaults.component.scss'
})
export class BillingDefaultsComponent implements OnInit {
  private settings = inject(SettingsService);
  private fb       = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);

  loading = true;
  saving  = false;

  form = this.fb.group({
    defaultTaxPercent:    [0, [Validators.min(0), Validators.max(100)]],
    defaultDiscountType:  ['percent'],
    defaultDiscountValue: [0, [Validators.min(0)]]
  });

  ngOnInit(): void {
    this.settings.getBillingDefaults().subscribe({
      next: defaults => { this.form.patchValue(defaults); this.loading = false; },
      // Fallback to localStorage if backend not reachable (offline)
      error: () => { this.form.patchValue(this.settings.getBillingDefaultsSync()); this.loading = false; }
    });
  }

  save(): void {
    if (this.form.invalid) return;
    this.saving = true;
    this.settings.saveBillingDefaults(this.form.value as any).subscribe({
      next: () => { this.saving = false; this.snackBar.open('Billing defaults saved', '', { duration: 2000 }); },
      error: () => { this.saving = false; this.snackBar.open('Failed to save — check backend connection', 'Close', { duration: 3000 }); }
    });
  }
}
