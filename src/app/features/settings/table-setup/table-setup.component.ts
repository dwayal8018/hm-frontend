import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';
import { OrderService } from '../../../core/services/order.service';
import { DiningTable } from '../../../core/models/order.model';

@Component({
  selector: 'app-table-setup',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterLink,
    MatCardModule, MatButtonModule, MatIconModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatProgressBarModule,
    MatSnackBarModule, MatDividerModule, MatTooltipModule
  ],
  templateUrl: './table-setup.component.html',
  styleUrl:    './table-setup.component.scss'
})
export class TableSetupComponent implements OnInit {
  private orderService = inject(OrderService);
  private fb           = inject(FormBuilder);
  private snackBar     = inject(MatSnackBar);

  tables  = signal<DiningTable[]>([]);
  loading = signal(true);
  saving  = signal(false);
  editingId = signal<number | null>(null);   // null = adding new

  readonly floors = ['Ground Floor', 'First Floor', 'Second Floor', 'Terrace', 'Rooftop'];

  form = this.fb.group({
    tableNumber: ['', [Validators.required, Validators.minLength(1)]],
    capacity:    [4,  [Validators.required, Validators.min(1), Validators.max(50)]],
    floor:       ['Ground Floor']
  });

  ngOnInit(): void { this.loadTables(); }

  loadTables(): void {
    this.loading.set(true);
    this.orderService.getTables().subscribe({
      next:  (t) => { this.tables.set(t); this.loading.set(false); },
      error: ()  => { this.loading.set(false); }
    });
  }

  startEdit(table: DiningTable): void {
    this.editingId.set(table.id);
    this.form.setValue({
      tableNumber: table.tableNumber,
      capacity:    table.capacity,
      floor:       table.floor ?? 'Ground Floor'
    });
  }

  cancelEdit(): void {
    this.editingId.set(null);
    this.form.reset({ tableNumber: '', capacity: 4, floor: 'Ground Floor' });
  }

  save(): void {
    if (this.form.invalid) return;
    this.saving.set(true);
    const v = this.form.value;
    const payload: Partial<DiningTable> = {
      tableNumber: v.tableNumber!,
      capacity:    v.capacity!,
      floor:       v.floor ?? undefined
    };

    const id = this.editingId();
    const req = id
      ? this.orderService.updateTable(id, payload)
      : this.orderService.createTable(payload);

    req.subscribe({
      next: () => {
        this.snackBar.open(id ? 'Table updated' : 'Table added', '', { duration: 2000 });
        this.saving.set(false);
        this.cancelEdit();
        this.loadTables();
      },
      error: (err) => {
        this.saving.set(false);
        this.snackBar.open(err.error?.message ?? 'Failed to save table', 'Close', { duration: 4000 });
      }
    });
  }

  deleteTable(table: DiningTable): void {
    if (table.status === 'OCCUPIED') {
      this.snackBar.open('Cannot delete an occupied table', 'Close', { duration: 3000 });
      return;
    }
    if (!confirm(`Delete table "${table.tableNumber}"?`)) return;
    this.orderService.deleteTable(table.id).subscribe({
      next:  () => { this.snackBar.open('Table deleted', '', { duration: 2000 }); this.loadTables(); },
      error: (err) => this.snackBar.open(err.error?.message ?? 'Failed to delete', 'Close', { duration: 4000 })
    });
  }

  // Quick-add multiple tables e.g. "T1,T2,T3"
  bulkAdd(): void {
    const raw = prompt('Enter table numbers separated by commas (e.g. T1,T2,T3):');
    if (!raw) return;
    const names = raw.split(',').map(s => s.trim()).filter(Boolean);
    if (!names.length) return;

    let done = 0;
    names.forEach(name => {
      this.orderService.createTable({ tableNumber: name, capacity: 4, floor: 'Ground Floor' }).subscribe({
        next: () => { done++; if (done === names.length) this.loadTables(); },
        error: () => { done++; if (done === names.length) this.loadTables(); }
      });
    });
    this.snackBar.open(`Adding ${names.length} tables...`, '', { duration: 2000 });
  }
}
