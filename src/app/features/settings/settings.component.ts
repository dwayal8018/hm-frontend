import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, RouterLink, MatCardModule, MatButtonModule, MatIconModule, MatListModule, MatSnackBarModule],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss'
})
export class SettingsComponent {
  private http     = inject(HttpClient);
  private snackBar = inject(MatSnackBar);

  resetting = false;

  resetData(): void {
    const confirmed = confirm(
      'This will permanently delete ALL orders, billing history, finance records (expenses, salaries, withdrawals).\n\n' +
      'Menus, tables, and expense categories will be kept.\n\n' +
      'Are you sure?'
    );
    if (!confirmed) return;

    // Double confirm
    const doubleConfirm = confirm('This CANNOT be undone. Type OK to proceed.');
    if (!doubleConfirm) return;

    this.resetting = true;
    this.http.post<any>(`${environment.localApiUrl}/reset`, { confirm: 'RESET' }).subscribe({
      next: () => {
        this.resetting = false;
        this.snackBar.open('Data reset complete. Orders & finance cleared.', '', { duration: 4000 });
      },
      error: (err) => {
        this.resetting = false;
        this.snackBar.open(err.error?.message ?? 'Reset failed', 'Close', { duration: 4000 });
      }
    });
  }
}
