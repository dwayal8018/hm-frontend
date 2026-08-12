import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-subscription-expired',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, RouterLink],
  templateUrl: './subscription-expired.component.html',
  styleUrl: './subscription-expired.component.scss'
})
export class SubscriptionExpiredComponent {
  private auth = inject(AuthService);

  get expiryDate(): string { return this.auth.subscription()?.expiryDate ?? 'N/A'; }
  get planType():   string { return this.auth.subscription()?.planType   ?? ''; }

  renewNow(): void {
    // Will open the renewal URL/payment flow in Phase 2
    alert('Renewal flow coming soon. Please contact your administrator.');
  }

  logout(): void { this.auth.logout(); }
}
