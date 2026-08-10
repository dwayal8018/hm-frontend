import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { OrderService } from '../../core/services/order.service';
import { DiningTable } from '../../core/models/order.model';

@Component({
  selector: 'app-tables',
  standalone: true,
  imports: [CommonModule, RouterLink, MatCardModule, MatButtonModule, MatIconModule, MatProgressBarModule],
  templateUrl: './tables.component.html',
  styleUrl: './tables.component.scss'
})
export class TablesComponent implements OnInit {
  private orderService = inject(OrderService);
  tables:  DiningTable[] = [];
  loading = true;

  ngOnInit(): void { this.loadTables(); }

  loadTables(): void {
    this.loading = true;
    this.orderService.getTables().subscribe({
      next:  (t) => { this.tables = t; this.loading = false; },
      error: ()  => { this.loading = false; }
    });
  }

  get availableTables(): number { return this.tables.filter(t => t.status === 'AVAILABLE').length; }
  get occupiedTables():  number { return this.tables.filter(t => t.status === 'OCCUPIED').length; }
  get billedTables():    number { return this.tables.filter(t => t.status === 'BILLED').length; }
}
