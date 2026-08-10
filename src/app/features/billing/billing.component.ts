import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { OrderService } from '../../core/services/order.service';
import { Order } from '../../core/models/order.model';

@Component({
  selector: 'app-billing',
  standalone: true,
  imports: [
    CommonModule, RouterLink,
    MatCardModule, MatButtonModule, MatIconModule,
    MatProgressBarModule, MatChipsModule, MatDividerModule
  ],
  templateUrl: './billing.component.html',
  styleUrl: './billing.component.scss'
})
export class BillingComponent implements OnInit {
  private orderService = inject(OrderService);

  orders:  Order[] = [];
  loading = true;
  error   = false;

  ngOnInit(): void { this.loadHistory(); }

  loadHistory(): void {
    this.loading = true;
    this.error   = false;
    this.orderService.getBillHistory(0, 30).subscribe({
      next:  (res) => { this.orders = res.content ?? []; this.loading = false; },
      error: ()    => { this.error  = true; this.loading = false; }
    });
  }
}
