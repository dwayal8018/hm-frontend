import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface RestaurantProfile {
  id: number;
  restaurantCode: string;
  restaurantName: string;
  address: string;
  phone: string;
  upiId: string;
  gstNumber: string;
  logoUrl: string;
  ownerName: string;
  ownerEmail: string;
  enabledRoles: string[];
}

export interface AppUser {
  id: number;
  username: string;
  fullName: string;
  role: string;
  active: boolean;
}

export interface CreateUserRequest {
  username: string;
  fullName: string;
  role: string;
  password: string;
}

export interface BillingDefaults {
  defaultTaxPercent: number;
  defaultDiscountType: 'percent' | 'amount';
  defaultDiscountValue: number;
}

const BILLING_DEFAULTS_KEY = 'hm_billing_defaults';

interface ApiResponse<T> { success: boolean; data: T; message?: string; }

@Injectable({ providedIn: 'root' })
export class SettingsService {
  private readonly cloud = environment.cloudApiUrl;

  constructor(private http: HttpClient) {}

  // ── Restaurant Profile ────────────────────────────────────────────────────

  getProfile(): Observable<RestaurantProfile> {
    return this.http.get<ApiResponse<RestaurantProfile>>(`${this.cloud}/restaurants/profile`)
      .pipe(map(r => r.data));
  }

  updateProfile(profile: Partial<RestaurantProfile>): Observable<RestaurantProfile> {
    return this.http.put<ApiResponse<RestaurantProfile>>(`${this.cloud}/restaurants/profile`, profile)
      .pipe(map(r => r.data));
  }

  // ── User Management ───────────────────────────────────────────────────────

  listUsers(): Observable<AppUser[]> {
    return this.http.get<ApiResponse<AppUser[]>>(`${this.cloud}/restaurants/users`)
      .pipe(map(r => r.data));
  }

  createUser(req: CreateUserRequest): Observable<AppUser> {
    return this.http.post<ApiResponse<AppUser>>(`${this.cloud}/restaurants/users`, req)
      .pipe(map(r => r.data));
  }

  toggleUser(userId: number): Observable<AppUser> {
    return this.http.patch<ApiResponse<AppUser>>(`${this.cloud}/restaurants/users/${userId}/toggle`, {})
      .pipe(map(r => r.data));
  }

  deleteUser(userId: number): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.cloud}/restaurants/users/${userId}`)
      .pipe(map(() => void 0));
  }

  // ── Billing Defaults (stored locally) ────────────────────────────────────

  getBillingDefaults(): BillingDefaults {
    const raw = localStorage.getItem(BILLING_DEFAULTS_KEY);
    if (raw) return JSON.parse(raw);
    return { defaultTaxPercent: 0, defaultDiscountType: 'percent', defaultDiscountValue: 0 };
  }

  saveBillingDefaults(defaults: BillingDefaults): void {
    localStorage.setItem(BILLING_DEFAULTS_KEY, JSON.stringify(defaults));
  }
}
