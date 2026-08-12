import { Component, inject, signal, computed } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthService } from '../../../core/services/auth.service';

interface NavItem { label: string; icon: string; route: string; roles: string[]; }

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [
    CommonModule, RouterOutlet, RouterLink, RouterLinkActive,
    MatToolbarModule, MatSidenavModule, MatListModule,
    MatIconModule, MatButtonModule, MatChipsModule, MatTooltipModule
  ],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.scss'
})
export class ShellComponent {
  auth = inject(AuthService);

  // CHEF/WAITER: sidebar starts collapsed; Owner/Manager: starts open
  sidenavOpen = signal(!['WAITER', 'CHEF'].includes(this.auth.user()?.role ?? ''));

  // To completely hide sidebar for waiters/chefs, comment the line above and use:
  // sidenavOpen = signal(false);

  get isWaiter(): boolean { return this.auth.user()?.role === 'WAITER'; }
  get isChef():   boolean { return this.auth.user()?.role === 'CHEF'; }

  navItems: NavItem[] = [
    { label: 'Dashboard', icon: 'dashboard',        route: '/dashboard', roles: ['OWNER', 'MANAGER'] },
    { label: 'Tables',    icon: 'table_restaurant', route: '/tables',    roles: ['OWNER', 'MANAGER', 'WAITER'] },
    { label: 'Kitchen',   icon: 'restaurant',       route: '/kitchen',   roles: ['CHEF', 'OWNER', 'MANAGER'] },
    { label: 'Menu',      icon: 'restaurant_menu',  route: '/menu',      roles: ['OWNER', 'MANAGER'] },
    { label: 'Billing',   icon: 'receipt_long',     route: '/billing',   roles: ['OWNER', 'MANAGER'] },
    { label: 'Reports',   icon: 'bar_chart',              route: '/reports',   roles: ['OWNER', 'MANAGER'] },
    { label: 'Finance',   icon: 'account_balance_wallet', route: '/finance',   roles: ['OWNER'] },
    { label: 'Settings',  icon: 'settings',               route: '/settings',  roles: ['OWNER'] }
  ];

  get visibleNavItems(): NavItem[] {
    return this.navItems.filter(i => i.roles.length === 0 || this.auth.hasRole(...i.roles));
  }

  get restaurantName(): string { return this.auth.restaurant()?.name ?? 'Hotel Manager'; }
  get userName():       string { return this.auth.user()?.fullName ?? ''; }
  get userRole():       string { return this.auth.user()?.role ?? ''; }
  get subscriptionStatus()     { return this.auth.subscription()?.status; }
  get daysRemaining(): number  { return this.auth.subscription()?.daysRemaining ?? 0; }

  toggleSidenav(): void { this.sidenavOpen.update(v => !v); }
  logout(): void        { this.auth.logout(); }
}
