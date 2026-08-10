export type UserRole = 'OWNER' | 'MANAGER' | 'WAITER';

export interface User {
  id: number;
  username: string;
  fullName: string;
  role: UserRole;
  restaurantId: number;
  active: boolean;
}

export interface AuthResponse {
  token: string;
  user: User;
  restaurant: RestaurantInfo;
  subscription: SubscriptionInfo;
}

export interface RestaurantInfo {
  id: number;
  name: string;
  address: string;
  phone: string;
  upiId: string;
  gstNumber?: string;
  logoUrl?: string;
  enabledRoles: UserRole[];
}

export interface SubscriptionInfo {
  planType: 'MONTHLY_3' | 'MONTHLY_6' | 'YEARLY';
  startDate: string;
  expiryDate: string;
  status: 'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED' | 'GRACE_PERIOD';
  daysRemaining: number;
}

export interface LoginRequest {
  username: string;
  password: string;
  restaurantCode: string;
}

export type PlanType = 'MONTHLY_3' | 'MONTHLY_6' | 'YEARLY';

export interface RegisterRestaurantRequest {
  restaurantName: string;
  ownerName: string;
  ownerEmail: string;
  ownerPassword: string;
  phone: string;
  address?: string;
  upiId?: string;
  gstNumber?: string;
  enabledRoles: string[];
  planType: PlanType;
  amountPaid?: number;
  paymentRef?: string;
}

export interface RegisterRestaurantResponse {
  status: string;
  message: string;
  data: string;   // the generated restaurant code e.g. REST-AB3XY7
}
