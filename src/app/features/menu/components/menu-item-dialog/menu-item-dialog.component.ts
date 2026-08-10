import { Component, Inject, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MenuService } from '../../../../core/services/menu.service';
import { MenuItem, MenuCategory, FoodType } from '../../../../core/models/menu.model';

export interface MenuItemDialogData {
  item?: MenuItem;         // present when editing
  categories: MenuCategory[];
  defaultCategoryId?: number;
}

@Component({
  selector: 'app-menu-item-dialog',
  standalone: true,
  imports: [FormsModule,
    CommonModule, ReactiveFormsModule,
    MatDialogModule, MatFormFieldModule, MatInputModule, MatSelectModule,
    MatButtonModule, MatIconModule, MatSlideToggleModule,
    MatChipsModule, MatProgressSpinnerModule
  ],
  templateUrl: './menu-item-dialog.component.html',
  styleUrl:    './menu-item-dialog.component.scss'
})
export class MenuItemDialogComponent {
  private fb          = inject(FormBuilder);
  private menuService = inject(MenuService);
  private dialogRef   = inject(MatDialogRef<MenuItemDialogComponent>);

  data: MenuItemDialogData = inject(MAT_DIALOG_DATA);

  saving  = false;
  isEdit  = !!this.data.item;
  tagInput = '';

  readonly foodTypes: { value: FoodType; label: string; color: string }[] = [
    { value: 'VEG',     label: 'Veg',     color: '#2e7d32' },
    { value: 'NON_VEG', label: 'Non-Veg', color: '#c62828' },
    { value: 'EGG',     label: 'Egg',     color: '#f57f17' }
  ];

  form = this.fb.group({
    name:                   [this.data.item?.name ?? '',          [Validators.required, Validators.minLength(2)]],
    description:            [this.data.item?.description ?? ''],
    price:                  [this.data.item?.price ?? null,       [Validators.required, Validators.min(0)]],
    foodType:               [this.data.item?.foodType ?? 'VEG' as FoodType, Validators.required],
    categoryId:             [this.data.item?.categoryId ?? this.data.defaultCategoryId ?? null, Validators.required],
    available:              [this.data.item?.available ?? true],
    displayOrder:           [this.data.item?.displayOrder ?? 0],
    preparationTimeMinutes: [this.data.item?.preparationTimeMinutes ?? null],
    tags:                   [this.data.item?.tags ?? [] as string[]]
  });

  addTag(): void {
    const tag = this.tagInput.trim();
    if (!tag) return;
    const current: string[] = this.form.value.tags as string[] ?? [];
    if (!current.includes(tag)) {
      this.form.patchValue({ tags: [...current, tag] });
    }
    this.tagInput = '';
  }

  removeTag(tag: string): void {
    const current: string[] = this.form.value.tags as string[] ?? [];
    this.form.patchValue({ tags: current.filter(t => t !== tag) });
  }

  onTagKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      this.addTag();
    }
  }

  save(): void {
    if (this.form.invalid) return;
    this.saving = true;
    const v = this.form.value;
    const payload = {
      name:                   v.name!,
      description:            v.description ?? undefined,
      price:                  v.price!,
      foodType:               v.foodType! as FoodType,
      categoryId:             v.categoryId!,
      available:              v.available ?? true,
      displayOrder:           v.displayOrder ?? 0,
      preparationTimeMinutes: v.preparationTimeMinutes ?? undefined,
      tags:                   v.tags as string[]
    };

    const req = this.isEdit
      ? this.menuService.updateItem(this.data.item!.id, payload)
      : this.menuService.createItem(payload);

    req.subscribe({
      next:  (item) => { this.saving = false; this.dialogRef.close(item); },
      error: ()     => { this.saving = false; }
    });
  }

  cancel(): void { this.dialogRef.close(); }
}
