import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatBadgeModule } from '@angular/material/badge';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { OrderService } from '../../core/services/order.service';
import { Order, OrderItem, KitchenStatus } from '../../core/models/order.model';

@Component({
  selector: 'app-kitchen',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule, MatButtonModule, MatIconModule,
    MatChipsModule, MatProgressBarModule, MatBadgeModule, MatSnackBarModule
  ],
  templateUrl: './kitchen.component.html',
  styleUrl: './kitchen.component.scss'
})
export class KitchenComponent implements OnInit, OnDestroy {
  private orderService = inject(OrderService);
  private snackBar = inject(MatSnackBar);

  orders: Order[] = [];
  loading = true;
  private refreshInterval: any;

  ngOnInit(): void {
    this.loadOrders();
    // Auto-refresh every 15 seconds
    this.refreshInterval = setInterval(() => this.loadOrders(), 15000);
  }

  ngOnDestroy(): void {
    if (this.refreshInterval) clearInterval(this.refreshInterval);
  }

  loadOrders(): void {
    this.orderService.getKitchenOrders().subscribe({
      next: (orders) => {
        // Only show orders that have at least one non-READY item
        this.orders = orders.filter(o =>
          o.items.some(i => i.kitchenStatus !== 'READY')
        );
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  pendingItems(order: Order): OrderItem[] {
    return order.items.filter(i => i.kitchenStatus === 'PENDING');
  }

  cookingItems(order: Order): OrderItem[] {
    return order.items.filter(i => i.kitchenStatus === 'COOKING');
  }

  readyItems(order: Order): OrderItem[] {
    return order.items.filter(i => i.kitchenStatus === 'READY');
  }

  markCooking(item: OrderItem): void {
    if (!item.id) return;
    this.orderService.updateKitchenStatus(item.id, 'COOKING').subscribe({
      next: () => { item.kitchenStatus = 'COOKING'; },
      error: () => this.snackBar.open('Failed to update', 'Close', { duration: 2000 })
    });
  }

  markReady(item: OrderItem): void {
    if (!item.id) return;
    this.orderService.updateKitchenStatus(item.id, 'READY').subscribe({
      next: () => {
        item.kitchenStatus = 'READY';
        // Remove order from view if all items are ready
        this.orders = this.orders.filter(o =>
          o.items.some(i => i.kitchenStatus !== 'READY')
        );
      },
      error: () => this.snackBar.open('Failed to update', 'Close', { duration: 2000 })
    });
  }

  statusColor(status: string): string {
    return status === 'COOKING' ? 'accent' : status === 'READY' ? 'primary' : '';
  }
}
