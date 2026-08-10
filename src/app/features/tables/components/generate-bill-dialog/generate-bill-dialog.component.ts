import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatRadioModule } from '@angular/material/radio';
import { OrderService } from '../../../../core/services/order.service';
import { Order } from '../../../../core/models/order.model';

export interface GenerateBillDialogData {
  order: Order;
}

@Component({
  selector: 'app-generate-bill-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatDialogModule, MatFormFieldModule, MatInputModule, MatSelectModule,
    MatButtonModule, MatIconModule, MatDividerModule,
    MatProgressSpinnerModule, MatRadioModule
  ],
  templateUrl: './generate-bill-dialog.component.html',
  styleUrl:    './generate-bill-dialog.component.scss'
})
export class GenerateBillDialogComponent {
  private fb           = inject(FormBuilder);
  private orderService = inject(OrderService);
  private dialogRef    = inject(MatDialogRef<GenerateBillDialogComponent>);

  data: GenerateBillDialogData = inject(MAT_DIALOG_DATA);
  saving = false;

  readonly paymentMethods = [
    { value: 'CASH',  label: 'Cash',       icon: 'payments'     },
    { value: 'UPI',   label: 'UPI',        icon: 'qr_code_2'    },
    { value: 'CARD',  label: 'Card',       icon: 'credit_card'  },
    { value: 'OTHER', label: 'Other',      icon: 'more_horiz'   }
  ];

  form = this.fb.group({
    discountType:    ['percent'],          // 'percent' | 'amount'
    discountPercent: [0, [Validators.min(0), Validators.max(100)]],
    discountAmount:  [0, [Validators.min(0)]],
    taxPercent:      [0, [Validators.min(0), Validators.max(100)]],
    paymentMethod:   ['CASH', Validators.required],
    customerName:    [''],
    customerPhone:   ['']
  });

  get subtotal():  number { return this.data.order.subtotal || this.itemsTotal; }
  get itemsTotal():number {
    return this.data.order.items.reduce((s, i) => s + i.totalPrice, 0);
  }

  get discountAmt(): number {
    const v = this.form.value;
    if (v.discountType === 'percent') {
      return +(this.subtotal * (v.discountPercent ?? 0) / 100).toFixed(2);
    }
    return Math.min(v.discountAmount ?? 0, this.subtotal);
  }

  get taxAmt(): number {
    const base = this.subtotal - this.discountAmt;
    return +(base * (this.form.value.taxPercent ?? 0) / 100).toFixed(2);
  }

  get grandTotal(): number {
    return +(this.subtotal - this.discountAmt + this.taxAmt).toFixed(2);
  }

  onDiscountTypeChange(): void {
    // Reset the other field when switching type
    if (this.form.value.discountType === 'percent') {
      this.form.patchValue({ discountAmount: 0 });
    } else {
      this.form.patchValue({ discountPercent: 0 });
    }
  }

  generate(): void {
    if (this.form.invalid) return;
    this.saving = true;
    const v = this.form.value;

    this.orderService.generateBill({
      orderId:         this.data.order.id,
      discountPercent: v.discountType === 'percent' ? (v.discountPercent ?? 0) : 0,
      discountAmount:  v.discountType === 'amount'  ? (v.discountAmount ?? 0)  : 0,
      taxPercent:      v.taxPercent ?? 0,
      paymentMethod:   v.paymentMethod as any,
      customerName:    v.customerName  || undefined,
      customerPhone:   v.customerPhone || undefined
    }).subscribe({
      next:  (billed) => { this.saving = false; this.dialogRef.close(billed); },
      error: (err)    => {
        this.saving = false;
        // stay open on error so user sees the issue via snackbar from parent
      }
    });
  }

  cancel(): void { this.dialogRef.close(); }
}
