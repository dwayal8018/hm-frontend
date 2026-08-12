import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule } from '@angular/forms';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { FinanceService } from '../../core/services/finance.service';
import { FinanceSummary } from '../../core/models/finance.model';

@Component({
  selector: 'app-finance',
  standalone: true,
  imports: [
    CommonModule, RouterLink, RouterLinkActive, FormsModule,
    MatCardModule, MatButtonModule, MatIconModule, MatTabsModule,
    MatProgressBarModule, MatSelectModule, MatSnackBarModule
  ],
  templateUrl: './finance.component.html',
  styleUrl:    './finance.component.scss'
})
export class FinanceComponent implements OnInit {
  private financeService = inject(FinanceService);
  private snackBar       = inject(MatSnackBar);

  summary: FinanceSummary | null = null;
  loading  = true;
  period   = 'MONTH';

  readonly periods = [
    { value: 'TODAY', label: 'Today'       },
    { value: 'WEEK',  label: 'This Week'   },
    { value: 'MONTH', label: 'This Month'  },
    { value: 'YEAR',  label: 'This Year'   }
  ];

  ngOnInit(): void { this.loadSummary(); }

  loadSummary(): void {
    this.loading = true;
    this.financeService.getSummary(this.period).subscribe({
      next:  (s) => { this.summary = s; this.loading = false; },
      error: ()  => { this.loading = false; }
    });
  }

  get totalOutflow(): number {
    if (!this.summary) return 0;
    return this.summary.totalExpenses + this.summary.totalSalaries + this.summary.totalWithdrawals;
  }

  profitColor(): string {
    if (!this.summary) return '#757575';
    return this.summary.netProfit >= 0 ? '#2e7d32' : '#c62828';
  }
}
