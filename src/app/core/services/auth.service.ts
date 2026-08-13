import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, map, catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AuthResponse, LoginRequest, User, RestaurantInfo, SubscriptionInfo,
  RegisterRestaurantRequest, RegisterRestaurantResponse
} from '../models/user.model';

const TOKEN_KEY = 'hm_token';
const USER_KEY  = 'hm_user';
const REST_KEY  = 'hm_restaurant';
const SUB_KEY   = 'hm_subscription';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private currentUser       = signal<User | null>(null);
  private restaurantInfo    = signal<RestaurantInfo | null>(null);
  private subscriptionInfo  = signal<SubscriptionInfo | null>(null);

  readonly user         = this.currentUser.asReadonly();
  readonly restaurant   = this.restaurantInfo.asReadonly();
  readonly subscription = this.subscriptionInfo.asReadonly();

  constructor(private http: HttpClient, private router: Router) {
    this.loadFromStorage();
  }

  login(request: LoginRequest): Observable<AuthResponse> {
    return this.http.post<{ success: boolean; data: AuthResponse }>(`${environment.cloudApiUrl}/auth/login`, request).pipe(
      tap(r => this.handleAuthSuccess(r.data)),
      map(r => r.data),
      catchError(err => throwError(() => err))
    );
  }

  register(request: RegisterRestaurantRequest): Observable<RegisterRestaurantResponse> {
    return this.http.post<RegisterRestaurantResponse>(
      `${environment.cloudApiUrl}/restaurants/register`, request
    ).pipe(
      catchError(err => throwError(() => err))
    );
  }

  logout(): void {
    [TOKEN_KEY, USER_KEY, REST_KEY, SUB_KEY].forEach(k => localStorage.removeItem(k));
    this.currentUser.set(null);
    this.restaurantInfo.set(null);
    this.subscriptionInfo.set(null);
    this.router.navigate(['/auth/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;
    try {
      // JWT uses base64url — convert to standard base64 before decoding
      const base64url = token.split('.')[1];
      const base64    = base64url.replace(/-/g, '+').replace(/_/g, '/');
      const padded    = base64.padEnd(base64.length + (4 - base64.length % 4) % 4, '=');
      const payload   = JSON.parse(atob(padded));
      return payload.exp * 1000 > Date.now();
    } catch { return false; }
  }

  isSubscriptionActive(): boolean {
    const sub = this.subscriptionInfo();
    return !!sub && (sub.status === 'ACTIVE' || sub.status === 'EXPIRING_SOON');
  }

  isSubscriptionExpired(): boolean {
    // If we have a valid token but subscription signal isn't loaded yet,
    // default to NOT expired — subscription info will load from storage.
    if (this.isAuthenticated() && !this.subscriptionInfo()) {
      const raw = localStorage.getItem(SUB_KEY);
      if (raw) {
        try {
          const sub = JSON.parse(raw) as SubscriptionInfo;
          this.subscriptionInfo.set(sub);
          return sub.status === 'EXPIRED';
        } catch { return false; }
      }
      return false;  // token valid but no sub info yet — don't block
    }
    const sub = this.subscriptionInfo();
    return !sub || sub.status === 'EXPIRED';
  }

  hasRole(...roles: string[]): boolean {
    const user = this.currentUser();
    return !!user && roles.includes(user.role);
  }

  /** Call this after updating the restaurant profile so enabledRoles reflects immediately */
  updateRestaurantInfo(partial: Partial<RestaurantInfo>): void {
    const current = this.restaurantInfo();
    if (!current) return;
    const updated = { ...current, ...partial };
    this.restaurantInfo.set(updated);
    localStorage.setItem(REST_KEY, JSON.stringify(updated));
  }

  refreshSubscription(): Observable<SubscriptionInfo> {
    return this.http.get<{ success: boolean; data: SubscriptionInfo }>(`${environment.cloudApiUrl}/subscription/status`).pipe(
      map(r => r.data),
      tap(sub => {
        this.subscriptionInfo.set(sub);
        localStorage.setItem(SUB_KEY, JSON.stringify(sub));
      })
    );
  }

  renewSubscription(planType: string, paymentRef: string, amountPaid: number): Observable<SubscriptionInfo> {
    return this.http.post<{ success: boolean; data: SubscriptionInfo }>(
      `${environment.cloudApiUrl}/subscription/renew`,
      { planType, paymentRef, amountPaid }
    ).pipe(
      map(r => r.data),
      tap(sub => {
        this.subscriptionInfo.set(sub);
        localStorage.setItem(SUB_KEY, JSON.stringify(sub));
      })
    );
  }

  private handleAuthSuccess(response: AuthResponse): void {
    localStorage.setItem(TOKEN_KEY, response.token);
    localStorage.setItem(USER_KEY,  JSON.stringify(response.user));
    localStorage.setItem(REST_KEY,  JSON.stringify(response.restaurant));
    localStorage.setItem(SUB_KEY,   JSON.stringify(response.subscription));
    this.currentUser.set(response.user);
    this.restaurantInfo.set(response.restaurant);
    this.subscriptionInfo.set(response.subscription);
  }

  private loadFromStorage(): void {
    if (!this.getToken()) return;
    try {
      const user         = JSON.parse(localStorage.getItem(USER_KEY)  || 'null');
      const restaurant   = JSON.parse(localStorage.getItem(REST_KEY)  || 'null');
      const subscription = JSON.parse(localStorage.getItem(SUB_KEY)   || 'null');
      if (user)         this.currentUser.set(user);
      if (restaurant)   this.restaurantInfo.set(restaurant);
      if (subscription) this.subscriptionInfo.set(subscription);
    } catch { this.logout(); }
  }
}
