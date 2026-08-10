import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MenuService } from '../../core/services/menu.service';
import { MenuCategory, MenuItem } from '../../core/models/menu.model';
import { MenuItemDialogComponent, MenuItemDialogData } from './components/menu-item-dialog/menu-item-dialog.component';
import { MenuCategoryDialogComponent, MenuCategoryDialogData } from './components/menu-category-dialog/menu-category-dialog.component';

type FoodFilter = 'ALL' | 'VEG' | 'NON_VEG';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule, MatButtonModule, MatIconModule, MatTabsModule,
    MatChipsModule, MatProgressBarModule, MatSlideToggleModule,
    MatTooltipModule, MatMenuModule, MatSnackBarModule
  ],
  templateUrl: './menu.component.html',
  styleUrl:    './menu.component.scss'
})
export class MenuComponent implements OnInit {
  private menuService = inject(MenuService);
  private dialog      = inject(MatDialog);
  private snackBar    = inject(MatSnackBar);

  categories:    MenuCategory[] = [];
  allItems:      MenuItem[]     = [];   // full unfiltered list for current tab
  loading        = true;
  activeTabIndex = 0;
  foodFilter:    FoodFilter     = 'ALL';

  // Category types that are always veg — no point showing veg/nonveg filter
  private readonly vegOnlyTypes = new Set(['DRINKS', 'MOCKTAILS', 'JUICES', 'DESSERTS']);

  get currentCategoryType(): string {
    return this.categories[this.activeTabIndex]?.categoryType ?? '';
  }

  get showFoodFilter(): boolean {
    return !this.vegOnlyTypes.has(this.currentCategoryType);
  }

  get items(): MenuItem[] {
    if (!this.showFoodFilter || this.foodFilter === 'ALL') return this.allItems;
    if (this.foodFilter === 'VEG') return this.allItems.filter(i => i.foodType === 'VEG');
    return this.allItems.filter(i => i.foodType === 'NON_VEG' || i.foodType === 'EGG');
  }

  setFilter(f: FoodFilter): void { this.foodFilter = f; }

  ngOnInit(): void { this.loadCategories(); }

  // ── Categories ────────────────────────────────────────────────────────────

  loadCategories(): void {
    this.loading = true;
    this.menuService.getCategories().subscribe({
      next: (cats) => {
        this.categories = cats;
        if (cats.length) this.loadItems(cats[this.activeTabIndex]?.id ?? cats[0].id);
        else this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  onTabChange(index: number): void {
    this.activeTabIndex = index;
    this.foodFilter = 'ALL';   // reset filter on tab switch
    const cat = this.categories[index];
    if (cat) this.loadItems(cat.id);
  }

  openAddCategory(): void {
    this.dialog.open(MenuCategoryDialogComponent, { width: '420px', data: {} as MenuCategoryDialogData })
      .afterClosed().subscribe(cat => {
        if (cat) { this.snackBar.open('Category added', '', { duration: 2000 }); this.loadCategories(); }
      });
  }

  openEditCategory(cat: MenuCategory, event: Event): void {
    event.stopPropagation();
    this.dialog.open(MenuCategoryDialogComponent, { width: '420px', data: { category: cat } as MenuCategoryDialogData })
      .afterClosed().subscribe(updated => {
        if (updated) { this.snackBar.open('Category updated', '', { duration: 2000 }); this.loadCategories(); }
      });
  }

  deleteCategory(cat: MenuCategory, event: Event): void {
    event.stopPropagation();
    if ((cat.itemCount ?? 0) > 0) {
      this.snackBar.open('Remove all items from this category first', 'Close', { duration: 3000 }); return;
    }
    if (!confirm(`Delete category "${cat.name}"?`)) return;
    this.menuService.deleteCategory(cat.id).subscribe({
      next:  () => { this.snackBar.open('Category deleted', '', { duration: 2000 }); this.loadCategories(); },
      error: (err) => this.snackBar.open(err.error?.message ?? 'Failed to delete', 'Close', { duration: 4000 })
    });
  }

  // ── Items ─────────────────────────────────────────────────────────────────

  loadItems(categoryId: number): void {
    this.loading = true;
    this.menuService.getItems(categoryId).subscribe({
      next:  (items) => { this.allItems = items; this.loading = false; },
      error: ()      => { this.loading = false; }
    });
  }

  openAddItem(): void {
    const currentCat = this.categories[this.activeTabIndex];
    this.dialog.open(MenuItemDialogComponent, {
      width: '560px',
      data: { categories: this.categories, defaultCategoryId: currentCat?.id } as MenuItemDialogData
    }).afterClosed().subscribe(item => {
      if (item) { this.snackBar.open('Item added', '', { duration: 2000 }); this.loadCategories(); }
    });
  }

  openEditItem(item: MenuItem): void {
    this.dialog.open(MenuItemDialogComponent, {
      width: '560px',
      data: { item, categories: this.categories } as MenuItemDialogData
    }).afterClosed().subscribe(updated => {
      if (updated) {
        this.snackBar.open('Item updated', '', { duration: 2000 });
        const idx = this.allItems.findIndex(i => i.id === updated.id);
        if (idx !== -1) this.allItems[idx] = updated;
        else this.loadCategories();
      }
    });
  }

  deleteItem(item: MenuItem): void {
    if (!confirm(`Delete "${item.name}"?`)) return;
    this.menuService.deleteItem(item.id).subscribe({
      next: () => {
        this.snackBar.open('Item deleted', '', { duration: 2000 });
        this.allItems = this.allItems.filter(i => i.id !== item.id);
        const cat = this.categories.find(c => c.id === item.categoryId);
        if (cat && cat.itemCount) cat.itemCount--;
      },
      error: () => this.snackBar.open('Failed to delete item', 'Close', { duration: 3000 })
    });
  }

  toggleAvailability(item: MenuItem): void {
    this.menuService.toggleAvailability(item.id, !item.available).subscribe({
      next: (updated) => {
        const idx = this.allItems.findIndex(i => i.id === updated.id);
        if (idx !== -1) this.allItems[idx] = updated;
      }
    });
  }
}
