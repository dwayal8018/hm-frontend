import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { DashboardSummary, SalesReport } from '../models/dashboard.model';

interface ApiResponse<T> { success: boolean; data: T; message?: string; }

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly base = `${environment.localApiUrl}/dashboard`;

  constructor(private http: HttpClient) {}

  getSummary(): Observable<DashboardSummary> {
    return this.http.get<ApiResponse<DashboardSummary>>(`${this.base}/summary`).pipe(map(r => r.data));
  }

  getSalesReport(period: string, startDate?: string, endDate?: string): Observable<SalesReport> {
    let url = `${this.base}/sales?period=${period}`;
    if (startDate) url += `&startDate=${startDate}`;
    if (endDate)   url += `&endDate=${endDate}`;
    return this.http.get<ApiResponse<SalesReport>>(url).pipe(map(r => r.data));
  }
}
