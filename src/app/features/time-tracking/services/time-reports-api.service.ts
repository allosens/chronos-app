import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  TimeReportQueryDto,
  IDailySummary,
  IWeeklySummary,
  IMonthlySummary
} from '../models/time-tracking-api.types';

/**
 * Service for Time Reports API operations
 */
@Injectable({
  providedIn: 'root'
})
export class TimeReportsApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/v1/time-reports`;

  /**
   * Get daily time summary
   */
  getDailySummary(date?: string): Observable<IDailySummary> {
    let params = new HttpParams();
    if (date) {
      params = params.set('date', date);
    }

    return this.http.get<IDailySummary>(`${this.baseUrl}/daily`, { params })
      .pipe(catchError(this.handleError));
  }

  /**
   * Get weekly time summary
   */
  getWeeklySummary(year?: number, week?: number): Observable<IWeeklySummary> {
    let params = new HttpParams();
    if (year) params = params.set('year', year.toString());
    if (week) params = params.set('week', week.toString());

    return this.http.get<IWeeklySummary>(`${this.baseUrl}/weekly`, { params })
      .pipe(catchError(this.handleError));
  }

  /**
   * Get monthly time summary
   */
  getMonthlySummary(year?: number, month?: number): Observable<IMonthlySummary> {
    let params = new HttpParams();
    if (year) params = params.set('year', year.toString());
    if (month) params = params.set('month', month.toString());

    return this.http.get<IMonthlySummary>(`${this.baseUrl}/monthly`, { params })
      .pipe(catchError(this.handleError));
  }

  /**
   * Handle HTTP errors
   */
  private handleError = (error: HttpErrorResponse): Observable<never> => {
    let errorMessage = 'An error occurred while fetching time reports.';

    if (error.error?.message) {
      errorMessage = error.error.message;
    } else if (error.status === 0) {
      errorMessage = 'Unable to connect to the server. Please check your internet connection.';
    } else if (error.status >= 400 && error.status < 500) {
      errorMessage = error.error?.message || 'Invalid request. Please check your parameters.';
    } else if (error.status >= 500) {
      errorMessage = 'Server error. Please try again later.';
    }

    console.error('TimeReportsApiService error:', error);
    return throwError(() => new Error(errorMessage));
  };
}