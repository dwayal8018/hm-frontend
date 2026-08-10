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
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { SettingsService } from '../../../core/services/settings.service';

@Component({
  selector: 'app-billing-defaults',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterLink,
    MatCardModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatIconModule, MatRadioModule, MatSnackBarModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './billing-defaults.component.html',
  styleUrl:    './billing-defaults.component.scss'
})
export class BillingDefaultsComponent implements OnInit {
  private settings = inject(SettingsService);
  private fb       = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);

  form = this.fb.group({
    defaultTaxPercent:    [0, [Validators.min(0), Validators.max(100)]],
    defaultDiscountType:  ['percent'],
    defaultDiscountValue: [0, [Validators.min(0)]]
  });

  ngOnInit(): void {
    const defaults = this.settings.getBillingDefaults();
    this.form.patchValue(defaults);
  }

  save(): void {
    if (this.form.invalid) return;
    this.settings.saveBillingDefaults(this.form.value as any);
    this.snackBar.open('Billing defaults saved', '', { duration: 2000 });
  }
}
