import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `<router-outlet />`
})
export class AppComponent implements OnInit {
  private auth = inject(AuthService);

  ngOnInit(): void {
    if (this.auth.isAuthenticated()) {
      this.scheduleSubscriptionCheck();
    }
  }

  private scheduleSubscriptionCheck(): void {
    // One immediate check on startup (silent — no internet = no block)
    this.auth.refreshSubscription().subscribe({ error: () => {} });
    // Then every hour
    setInterval(() => {
      if (this.auth.isAuthenticated()) {
        this.auth.refreshSubscription().subscribe({ error: () => {} });
      }
    }, 3_600_000);
  }
}
