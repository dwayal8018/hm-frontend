import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { DiningTable, Order, AddItemRequest, BillRequest } from '../models/order.model';

interface ApiResponse<T> { success: boolean; data: T; message?: string; }
interface PageResponse<T> { content: T[]; totalElements: number; totalPages: number; }

@Injectable({ providedIn: 'root' })
export class OrderService {
  private readonly base = environment.localApiUrl;

  constructor(private http: HttpClient) {}

  // ── Tables ────────────────────────────────────────────────────────────────
  getTables(): Observable<DiningTable[]> {
    return this.http.get<ApiResponse<DiningTable[]>>(`${this.base}/tables`).pipe(map(r => r.data));
  }
  getTable(id: number): Observable<DiningTable> {
    return this.http.get<ApiResponse<DiningTable>>(`${this.base}/tables/${id}`).pipe(map(r => r.data));
  }
  createTable(table: Partial<DiningTable>): Observable<DiningTable> {
    return this.http.post<ApiResponse<DiningTable>>(`${this.base}/tables`, table).pipe(map(r => r.data));
  }
  updateTable(id: number, table: Partial<DiningTable>): Observable<DiningTable> {
    return this.http.put<ApiResponse<DiningTable>>(`${this.base}/tables/${id}`, table).pipe(map(r => r.data));
  }
  deleteTable(id: number): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.base}/tables/${id}`).pipe(map(() => void 0));
  }

  // ── Orders ────────────────────────────────────────────────────────────────
  getActiveOrders(): Observable<Order[]> {
    return this.http.get<ApiResponse<Order[]>>(`${this.base}/orders?status=OPEN`).pipe(map(r => r.data));
  }
  getOrderByTable(tableId: number): Observable<Order> {
    return this.http.get<ApiResponse<Order>>(`${this.base}/orders/table/${tableId}`).pipe(map(r => r.data));
  }
  getOrder(orderId: number): Observable<Order> {
    return this.http.get<ApiResponse<Order>>(`${this.base}/orders/${orderId}`).pipe(map(r => r.data));
  }
  addItemToOrder(request: AddItemRequest): Observable<Order> {
    return this.http.post<ApiResponse<Order>>(`${this.base}/orders/add-item`, request).pipe(map(r => r.data));
  }
  removeItemFromOrder(orderId: number, orderItemId: number): Observable<Order> {
    return this.http.delete<ApiResponse<Order>>(`${this.base}/orders/${orderId}/items/${orderItemId}`).pipe(map(r => r.data));
  }
  updateItemQuantity(orderId: number, orderItemId: number, quantity: number): Observable<Order> {
    return this.http.patch<ApiResponse<Order>>(`${this.base}/orders/${orderId}/items/${orderItemId}`, { quantity }).pipe(map(r => r.data));
  }
  cancelOrder(orderId: number): Observable<void> {
    return this.http.patch<ApiResponse<void>>(`${this.base}/orders/${orderId}/cancel`, {}).pipe(map(() => void 0));
  }

  // ── Billing ───────────────────────────────────────────────────────────────
  generateBill(request: BillRequest): Observable<Order> {
    return this.http.post<ApiResponse<Order>>(`${this.base}/billing/generate`, request).pipe(map(r => r.data));
  }
  markAsPaid(orderId: number, paymentMethod: string): Observable<Order> {
    return this.http.patch<ApiResponse<Order>>(`${this.base}/billing/${orderId}/paid`, { paymentMethod }).pipe(map(r => r.data));
  }
  getBillHistory(page = 0, size = 20): Observable<PageResponse<Order>> {
    return this.http.get<ApiResponse<PageResponse<Order>>>(`${this.base}/billing/history?page=${page}&size=${size}`).pipe(map(r => r.data));
  }
}
