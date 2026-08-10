import { Routes } from '@angular/router';

export const subscriptionRoutes: Routes = [
  {
    path: 'expired',
    loadComponent: () => import('./subscription-expired/subscription-expired.component')
      .then(m => m.SubscriptionExpiredComponent)
  }
];
