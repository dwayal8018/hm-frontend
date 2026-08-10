import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDividerModule } from '@angular/material/divider';
import { DashboardService } from '../../core/services/dashboard.service';
import { SalesReport } from '../../core/models/dashboard.model';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatCardModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatSelectModule,
    MatProgressBarModule, MatDividerModule
  ],
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.scss'
})
export class ReportsComponent implements OnInit {
  private dashboardService = inject(DashboardService);

  report:   SalesReport | null = null;
  loading   = false;
  period    = 'TODAY';

  periods = [
    { value: 'TODAY', label: "Today" },
    { value: 'WEEK',  label: "This Week" },
    { value: 'MONTH', label: "This Month" }
  ];

  ngOnInit(): void { this.loadReport(); }

  loadReport(): void {
    this.loading = true;
    this.dashboardService.getSalesReport(this.period).subscribe({
      next:  (r) => { this.report = r; this.loading = false; },
      error: ()  => { this.loading = false; }
    });
  }
}
