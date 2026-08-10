import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (_route, state) => {
  const auth   = inject(AuthService);
  const router = inject(Router);
  const isAuth = auth.isAuthenticated();
  if (!isAuth) {
    router.navigate(['/auth/login'], { queryParams: { returnUrl: state.url } });
    return false;
  }
  return true;
};

export const subscriptionGuard: CanActivateFn = (_route, _state) => {
  const auth   = inject(AuthService);
  const router = inject(Router);
  if (!auth.isAuthenticated()) {
    router.navigate(['/auth/login']);
    return false;
  }
  if (auth.isSubscriptionExpired()) {
    router.navigate(['/subscription/expired']);
    return false;
  }
  return true;
};

export const roleGuard = (allowedRoles: string[]): CanActivateFn => () => {
  const auth   = inject(AuthService);
  const router = inject(Router);
  if (!auth.hasRole(...allowedRoles)) {
    // Redirect waiter to tables; others to dashboard
    const role = auth.user()?.role;
    router.navigate([role === 'WAITER' ? '/tables' : '/dashboard']);
    return false;
  }
  return true;
};
