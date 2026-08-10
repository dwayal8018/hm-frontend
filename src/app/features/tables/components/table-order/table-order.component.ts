import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatBadgeModule } from '@angular/material/badge';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { OrderService } from '../../../../core/services/order.service';
import { MenuService } from '../../../../core/services/menu.service';
import { AuthService } from '../../../../core/services/auth.service';
import { DiningTable, Order, OrderItem } from '../../../../core/models/order.model';
import { MenuCategory, MenuItem } from '../../../../core/models/menu.model';
import { GenerateBillDialogComponent, GenerateBillDialogData } from '../generate-bill-dialog/generate-bill-dialog.component';

type FoodFilter = 'ALL' | 'VEG' | 'NON_VEG';

@Component({
  selector: 'app-table-order',
  standalone: true,
  imports: [
    CommonModule, RouterLink, FormsModule,
    MatCardModule, MatButtonModule, MatIconModule,
    MatDividerModule, MatProgressBarModule, MatTabsModule,
    MatBadgeModule, MatSnackBarModule
  ],
  templateUrl: './table-order.component.html',
  styleUrl:    './table-order.component.scss'
})
export class TableOrderComponent implements OnInit {
  private route        = inject(ActivatedRoute);
  private router       = inject(Router);
  private orderService = inject(OrderService);
  private menuService  = inject(MenuService);
  private snackBar     = inject(MatSnackBar);
  private dialog       = inject(MatDialog);
  private auth         = inject(AuthService);

  table:      DiningTable | null = null;
  order:      Order | null       = null;
  categories: MenuCategory[]     = [];
  menuItems:  MenuItem[]         = [];
  loading = true;

  foodFilter: FoodFilter = 'ALL';

  get filteredItems(): MenuItem[] {
    if (this.foodFilter === 'ALL') return this.menuItems;
    if (this.foodFilter === 'VEG') return this.menuItems.filter(i => i.foodType === 'VEG');
    return this.menuItems.filter(i => i.foodType === 'NON_VEG' || i.foodType === 'EGG');
  }

  setFilter(f: FoodFilter): void { this.foodFilter = f; }

  ngOnInit(): void {
    const tableId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadTable(tableId);
    this.loadMenu();
  }

  loadTable(tableId: number): void {
    this.orderService.getTable(tableId).subscribe({
      next: (t) => {
        this.table = t;
        // Only load the active order if it exists AND table is OCCUPIED
        // (activeOrderId may point to a PAID/BILLED order from a previous session)
        if (t.activeOrderId && t.status === 'OCCUPIED') {
          this.orderService.getOrder(t.activeOrderId).subscribe({
            next: (o) => {
              // Extra guard: only use it if it's still OPEN
              this.order = o.status === 'OPEN' ? o : null;
              this.loading = false;
            },
            error: () => { this.loading = false; }
          });
        } else {
          this.loading = false;
        }
      },
      error: () => { this.loading = false; }
    });
  }

  loadMenu(): void {
    this.menuService.getCategories().subscribe({
      next: (cats) => {
        this.categories = cats;
        if (cats.length) this.loadItemsForCategory(cats[0].id);
      }
    });
  }

  onCategoryTabChange(index: number): void {
    const cat = this.categories[index];
    if (cat?.id) this.loadItemsForCategory(cat.id);
  }

  loadItemsForCategory(categoryId: number): void {
    this.menuService.getItems(categoryId).subscribe({
      next: (items) => { this.menuItems = items.filter(i => i.available); }
    });
  }

  addItem(item: MenuItem): void {
    if (!this.table) return;
    this.orderService.addItemToOrder({
      orderId:    this.order?.id,
      tableId:    this.table.id,
      menuItemId: item.id,
      quantity:   1
    }).subscribe({
      next:  (o) => { this.order = o; this.snackBar.open(`${item.name} added`, '', { duration: 1200 }); },
      error: ()  => this.snackBar.open('Failed to add item', 'Close', { duration: 3000 })
    });
  }

  removeItem(orderItem: OrderItem): void {
    if (!this.order || !orderItem.id) return;
    this.orderService.removeItemFromOrder(this.order.id, orderItem.id).subscribe({
      next: (o) => { this.order = o; }
    });
  }

  updateQty(orderItem: OrderItem, delta: number): void {
    if (!this.order || !orderItem.id) return;
    const newQty = orderItem.quantity + delta;
    if (newQty <= 0) { this.removeItem(orderItem); return; }
    this.orderService.updateItemQuantity(this.order.id, orderItem.id, newQty).subscribe({
      next: (o) => { this.order = o; }
    });
  }

  openGenerateBill(): void {
    if (!this.order) return;
    const ref = this.dialog.open(GenerateBillDialogComponent, {
      width: '420px',
      disableClose: true,
      data: { order: this.order } as GenerateBillDialogData
    });
    ref.afterClosed().subscribe((billedOrder) => {
      if (billedOrder) this.router.navigate(['/billing', billedOrder.id]);
    });
  }

  get orderTotal():  number  { return this.order?.totalAmount ?? 0; }
  get itemCount():   number  { return this.order?.items?.reduce((s, i) => s + i.quantity, 0) ?? 0; }
  get canBill():     boolean { return this.auth.hasRole('OWNER', 'MANAGER'); }

  /** True when table is marked OCCUPIED but has no active OPEN order — orphaned state */
  get isOrphaned(): boolean {
    return !!this.table &&
           this.table.status === 'OCCUPIED' &&
           !this.order &&
           !this.loading;
  }

  /** Called when table is OCCUPIED but order is null/not OPEN — orphaned state */
  freeTable(): void {
    if (!this.table) return;
    if (!confirm(`Mark Table ${this.table.tableNumber} as Available? This clears the occupied status.`)) return;
    this.orderService.updateTable(this.table.id, {
      ...this.table,
      status: 'AVAILABLE',
      activeOrderId: undefined
    }).subscribe({
      next: () => {
        this.snackBar.open('Table marked as available', '', { duration: 2000 });
        this.router.navigate(['/tables']);
      },
      error: () => this.snackBar.open('Failed to free table', 'Close', { duration: 3000 })
    });
  }
}
