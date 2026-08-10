import { Routes } from '@angular/router';
import { authGuard, subscriptionGuard, roleGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes').then(m => m.authRoutes)
  },
  {
    path: 'subscription',
    loadChildren: () => import('./features/settings/subscription.routes').then(m => m.subscriptionRoutes)
  },
  {
    path: '',
    loadComponent: () => import('./shared/components/shell/shell.component').then(m => m.ShellComponent),
    canActivate: [authGuard, subscriptionGuard],
    children: [
      {
        path: 'dashboard',
        canActivate: [roleGuard(['OWNER', 'MANAGER'])],
        loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'tables',
        loadComponent: () => import('./features/tables/tables.component').then(m => m.TablesComponent)
      },
      {
        path: 'tables/:id/order',
        loadComponent: () => import('./features/tables/components/table-order/table-order.component')
          .then(m => m.TableOrderComponent)
      },
      {
        path: 'menu',
        canActivate: [roleGuard(['OWNER', 'MANAGER'])],
        loadComponent: () => import('./features/menu/menu.component').then(m => m.MenuComponent)
      },
      {
        path: 'billing',
        canActivate: [roleGuard(['OWNER', 'MANAGER'])],
        loadComponent: () => import('./features/billing/billing.component').then(m => m.BillingComponent)
      },
      {
        path: 'billing/:orderId',
        canActivate: [roleGuard(['OWNER', 'MANAGER'])],
        loadComponent: () => import('./features/billing/components/bill-detail/bill-detail.component')
          .then(m => m.BillDetailComponent)
      },
      {
        path: 'reports',
        canActivate: [roleGuard(['OWNER', 'MANAGER'])],
        loadComponent: () => import('./features/reports/reports.component').then(m => m.ReportsComponent)
      },
      {
        path: 'settings',
        canActivate: [roleGuard(['OWNER'])],
        loadComponent: () => import('./features/settings/settings.component').then(m => m.SettingsComponent)
      },
      {
        path: 'settings/tables',
        canActivate: [roleGuard(['OWNER'])],
        loadComponent: () => import('./features/settings/table-setup/table-setup.component').then(m => m.TableSetupComponent)
      },
      {
        path: 'settings/profile',
        canActivate: [roleGuard(['OWNER'])],
        loadComponent: () => import('./features/settings/profile/profile.component').then(m => m.ProfileComponent)
      },
      {
        path: 'settings/billing',
        canActivate: [roleGuard(['OWNER'])],
        loadComponent: () => import('./features/settings/billing-defaults/billing-defaults.component').then(m => m.BillingDefaultsComponent)
      },
      {
        path: 'settings/users',
        canActivate: [roleGuard(['OWNER'])],
        loadComponent: () => import('./features/settings/user-management/user-management.component').then(m => m.UserManagementComponent)
      }
    ]
  },
  { path: '**', redirectTo: 'tables' }
];
