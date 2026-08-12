import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { SettingsService } from '../../../core/services/settings.service';

@Component({
  selector: 'app-backup',
  standalone: true,
  imports: [
    CommonModule, RouterLink,
    MatCardModule, MatButtonModule, MatIconModule,
    MatProgressBarModule, MatProgressSpinnerModule,
    MatSnackBarModule, MatDividerModule
  ],
  templateUrl: './backup.component.html',
  styleUrl:    './backup.component.scss'
})
export class BackupComponent implements OnInit {
  private settings = inject(SettingsService);
  private snackBar = inject(MatSnackBar);

  status: {
    level: string; message: string; dbSizeMb: number;
    warnThresholdMb: number; archiveThresholdMb: number;
    backupCount: number; backupsTotalMb: number; dbPath: string;
  } | null = null;

  loadingStatus = true;
  backing       = false;
  lastBackupPath: string | null = null;

  ngOnInit(): void { this.loadStatus(); }

  loadStatus(): void {
    this.loadingStatus = true;
    this.settings.getBackupStatus().subscribe({
      next:  s  => { this.status = s; this.loadingStatus = false; },
      error: () => { this.loadingStatus = false; }
    });
  }

  backupNow(): void {
    this.backing = true;
    this.settings.backupNow().subscribe({
      next: r => {
        this.backing = false;
        this.lastBackupPath = r.savedTo;
        this.snackBar.open('Backup saved successfully', '', { duration: 3000 });
        this.loadStatus(); // refresh counts
      },
      error: err => {
        this.backing = false;
        this.snackBar.open(err.error?.message ?? 'Backup failed', 'Close', { duration: 4000 });
      }
    });
  }

  get levelColor(): string {
    if (!this.status) return '';
    return this.status.level === 'OK' ? 'ok' :
           this.status.level === 'WARNING' ? 'warn' : 'critical';
  }

  get usagePercent(): number {
    if (!this.status) return 0;
    return Math.min(100, Math.round((this.status.dbSizeMb / this.status.archiveThresholdMb) * 100));
  }
}
