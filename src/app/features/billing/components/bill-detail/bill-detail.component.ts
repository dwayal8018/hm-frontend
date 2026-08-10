import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { OrderService } from '../../../../core/services/order.service';
import { AuthService } from '../../../../core/services/auth.service';
import { QrService } from '../../../../core/services/qr.service';
import { Order } from '../../../../core/models/order.model';

@Component({
  selector: 'app-bill-detail',
  standalone: true,
  imports: [
    CommonModule, RouterLink,
    MatCardModule, MatButtonModule, MatIconModule,
    MatDividerModule, MatProgressBarModule, MatSnackBarModule
  ],
  templateUrl: './bill-detail.component.html',
  styleUrl:    './bill-detail.component.scss'
})
export class BillDetailComponent implements OnInit {
  private route        = inject(ActivatedRoute);
  private orderService = inject(OrderService);
  private authService  = inject(AuthService);
  private qrService    = inject(QrService);
  private snackBar     = inject(MatSnackBar);

  order      = signal<Order | null>(null);
  loading    = signal(true);
  qrDataUrl  = signal<string>('');   // base64 QR — generated offline

  get restaurantName():  string { return this.authService.restaurant()?.name      ?? 'Restaurant'; }
  get restaurantPhone(): string { return this.authService.restaurant()?.phone     ?? ''; }
  get restaurantAddr():  string { return this.authService.restaurant()?.address   ?? ''; }
  get restaurantGst():   string { return this.authService.restaurant()?.gstNumber ?? ''; }
  get restaurantLogo():  string { return this.authService.restaurant()?.logoUrl   ?? ''; }
  get upiId():           string { return this.authService.restaurant()?.upiId     ?? ''; }

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('orderId'));
    this.orderService.getOrder(id).subscribe({
      next: (o) => {
        this.order.set(o);
        this.loading.set(false);
        this.generateQr(o);
      },
      error: () => this.loading.set(false)
    });
  }

  private generateQr(order: Order): void {
    if (!this.upiId || order.status === 'PAID') return;

    // UPI deep-link — clean note, no internal hotel details exposed to customer
    const name    = encodeURIComponent(this.restaurantName);
    const amount  = order.totalAmount.toFixed(2);
    const note    = encodeURIComponent('Restaurant Payment');
    const upiLink = `upi://pay?pa=${this.upiId}&pn=${name}&am=${amount}&cu=INR&tn=${note}`;

    // Pure browser-side generation — no internet needed
    this.qrService.generateDataUrl(upiLink, 200).then(dataUrl => {
      this.qrDataUrl.set(dataUrl);
    });
  }

  markPaid(method: string): void {
    const o = this.order();
    if (!o) return;
    this.orderService.markAsPaid(o.id, method).subscribe({
      next: (updated) => {
        this.order.set(updated);
        this.qrDataUrl.set('');   // hide QR after payment
        this.snackBar.open(`Marked as paid via ${method}`, '', { duration: 2500 });
      },
      error: () => this.snackBar.open('Failed to update payment', 'Close', { duration: 3000 })
    });
  }

  printBill(): void { window.print(); }
}
