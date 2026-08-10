import { Component, Inject, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MenuService } from '../../../../core/services/menu.service';
import { MenuCategory, MenuCategoryType } from '../../../../core/models/menu.model';

export interface MenuCategoryDialogData {
  category?: MenuCategory;   // present when editing
}

@Component({
  selector: 'app-menu-category-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatDialogModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule
  ],
  templateUrl: './menu-category-dialog.component.html',
  styleUrl:    './menu-category-dialog.component.scss'
})
export class MenuCategoryDialogComponent {
  private fb          = inject(FormBuilder);
  private menuService = inject(MenuService);
  private dialogRef   = inject(MatDialogRef<MenuCategoryDialogComponent>);

  data: MenuCategoryDialogData = inject(MAT_DIALOG_DATA);

  saving = false;
  isEdit = !!this.data.category;

  readonly categoryTypes: { value: MenuCategoryType; label: string; icon: string }[] = [
    { value: 'STARTERS',    label: 'Starters',       icon: 'soup_kitchen'    },
    { value: 'MAINS',       label: 'Mains',          icon: 'dinner_dining'   },
    { value: 'BREADS',      label: 'Breads',         icon: 'bakery_dining'   },
    { value: 'RICE_BIRYANI',label: 'Rice & Biryani', icon: 'rice_bowl'       },
    { value: 'DESSERTS',    label: 'Desserts',       icon: 'icecream'        },
    { value: 'DRINKS',      label: 'Drinks',         icon: 'local_bar'       },
    { value: 'MOCKTAILS',   label: 'Mocktails',      icon: 'local_drink'     },
    { value: 'JUICES',      label: 'Juices',         icon: 'emoji_food_beverage' },
    { value: 'COMBOS',      label: 'Combos',         icon: 'set_meal'        },
    { value: 'CUSTOM',      label: 'Custom',         icon: 'category'        }
  ];

  form = this.fb.group({
    name:         [this.data.category?.name ?? '',       [Validators.required, Validators.minLength(2)]],
    categoryType: [this.data.category?.categoryType ?? 'CUSTOM' as MenuCategoryType, Validators.required],
    displayOrder: [this.data.category?.displayOrder ?? 0]
  });

  save(): void {
    if (this.form.invalid) return;
    this.saving = true;
    const v = this.form.value;
    const payload: Partial<MenuCategory> = {
      name:         v.name!,
      categoryType: v.categoryType! as MenuCategoryType,
      displayOrder: v.displayOrder ?? 0,
      active:       true
    };

    const req = this.isEdit
      ? this.menuService.updateCategory(this.data.category!.id, payload)
      : this.menuService.createCategory(payload);

    req.subscribe({
      next:  (cat) => { this.saving = false; this.dialogRef.close(cat); },
      error: ()    => { this.saving = false; }
    });
  }

  cancel(): void { this.dialogRef.close(); }
}
