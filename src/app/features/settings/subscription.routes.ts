import { Routes } from '@angular/router';

export const subscriptionRoutes: Routes = [
  {
    path: 'expired',
    loadComponent: () => import('./subscription-expired/subscription-expired.component')
      .then(m => m.SubscriptionExpiredComponent)
  },
  {
    path: 'renew',
    loadComponent: () => import('./subscription-renew/subscription-renew.component')
      .then(m => m.SubscriptionRenewComponent)
  }
];
