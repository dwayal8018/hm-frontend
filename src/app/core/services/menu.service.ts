import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { MenuCategory, MenuItem, MenuItemRequest } from '../models/menu.model';

interface ApiResponse<T> { success: boolean; data: T; message?: string; }

@Injectable({ providedIn: 'root' })
export class MenuService {
  private readonly base = `${environment.localApiUrl}/menu`;

  constructor(private http: HttpClient) {}

  getCategories(): Observable<MenuCategory[]> {
    return this.http.get<ApiResponse<MenuCategory[]>>(`${this.base}/categories`).pipe(map(r => r.data));
  }

  createCategory(category: Partial<MenuCategory>): Observable<MenuCategory> {
    return this.http.post<ApiResponse<MenuCategory>>(`${this.base}/categories`, category).pipe(map(r => r.data));
  }

  updateCategory(id: number, category: Partial<MenuCategory>): Observable<MenuCategory> {
    return this.http.put<ApiResponse<MenuCategory>>(`${this.base}/categories/${id}`, category).pipe(map(r => r.data));
  }

  deleteCategory(id: number): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.base}/categories/${id}`).pipe(map(() => void 0));
  }

  getItems(categoryId?: number): Observable<MenuItem[]> {
    const params = categoryId ? `?categoryId=${categoryId}` : '';
    return this.http.get<ApiResponse<MenuItem[]>>(`${this.base}/items${params}`).pipe(map(r => r.data));
  }

  getItem(id: number): Observable<MenuItem> {
    return this.http.get<ApiResponse<MenuItem>>(`${this.base}/items/${id}`).pipe(map(r => r.data));
  }

  createItem(item: MenuItemRequest): Observable<MenuItem> {
    return this.http.post<ApiResponse<MenuItem>>(`${this.base}/items`, item).pipe(map(r => r.data));
  }

  updateItem(id: number, item: MenuItemRequest): Observable<MenuItem> {
    return this.http.put<ApiResponse<MenuItem>>(`${this.base}/items/${id}`, item).pipe(map(r => r.data));
  }

  toggleAvailability(id: number, available: boolean): Observable<MenuItem> {
    return this.http.patch<ApiResponse<MenuItem>>(`${this.base}/items/${id}/availability`, { available }).pipe(map(r => r.data));
  }

  deleteItem(id: number): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.base}/items/${id}`).pipe(map(() => void 0));
  }

  searchItems(query: string): Observable<MenuItem[]> {
    return this.http.get<ApiResponse<MenuItem[]>>(`${this.base}/items/search?q=${encodeURIComponent(query)}`).pipe(map(r => r.data));
  }
}
