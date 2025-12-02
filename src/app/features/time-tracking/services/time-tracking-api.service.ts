import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  ClockInDto,
  ClockOutDto,
  StartBreakDto,
  EndBreakDto,
  UpdateWorkSessionDto,
  ValidateWorkSessionDto,
  ValidationResultDto,
  FilterWorkSessionsDto,
  IWorkSessionWithRelations,
  WorkSessionsListResponseDto,
  ITimeConflict
} from '../models/time-tracking-api.types';

/**
 * Service for Time Tracking API operations
 */
@Injectable({
  providedIn: 'root'
})
export class TimeTrackingApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/v1/work-sessions`;

  /**
   * Clock in - Start a new work session
   */
  clockIn(dto: ClockInDto): Observable<IWorkSessionWithRelations> {
    return this.http.post<IWorkSessionWithRelations>(`${this.baseUrl}/clock-in`, dto)
      .pipe(catchError(this.handleError));
  }

  /**
   * Clock out - End the current work session
   */
  clockOut(sessionId: string, dto: ClockOutDto): Observable<IWorkSessionWithRelations> {
    return this.http.patch<IWorkSessionWithRelations>(`${this.baseUrl}/${sessionId}/clock-out`, dto)
      .pipe(catchError(this.handleError));
  }

  /**
   * Start a break
   */
  startBreak(sessionId: string, dto: StartBreakDto): Observable<IWorkSessionWithRelations> {
    return this.http.post<IWorkSessionWithRelations>(`${this.baseUrl}/${sessionId}/breaks/start`, dto)
      .pipe(catchError(this.handleError));
  }

  /**
   * End a break
   */
  endBreak(sessionId: string, dto: EndBreakDto): Observable<IWorkSessionWithRelations> {
    return this.http.patch<IWorkSessionWithRelations>(`${this.baseUrl}/${sessionId}/breaks/end`, dto)
      .pipe(catchError(this.handleError));
  }

  /**
   * Get work sessions with optional filters
   */
  getWorkSessions(filters: FilterWorkSessionsDto = {}): Observable<WorkSessionsListResponseDto> {
    let params = new HttpParams();
    
    if (filters.startDate) params = params.set('startDate', filters.startDate);
    if (filters.endDate) params = params.set('endDate', filters.endDate);
    if (filters.userId) params = params.set('userId', filters.userId);
    if (filters.page) params = params.set('page', filters.page.toString());
    if (filters.limit) params = params.set('limit', filters.limit.toString());

    return this.http.get<WorkSessionsListResponseDto>(this.baseUrl, { params })
      .pipe(catchError(this.handleError));
  }

  /**
   * Get the current active session
   */
  getActiveSession(): Observable<IWorkSessionWithRelations | null> {
    return this.http.get<IWorkSessionWithRelations | null>(`${this.baseUrl}/active`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Get a specific work session by ID
   */
  getWorkSession(id: string): Observable<IWorkSessionWithRelations> {
    return this.http.get<IWorkSessionWithRelations>(`${this.baseUrl}/${id}`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Update a work session
   */
  updateWorkSession(id: string, dto: UpdateWorkSessionDto): Observable<IWorkSessionWithRelations> {
    return this.http.put<IWorkSessionWithRelations>(`${this.baseUrl}/${id}`, dto)
      .pipe(catchError(this.handleError));
  }

  /**
   * Delete a work session
   */
  deleteWorkSession(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Validate a work session for conflicts
   */
  validateWorkSession(dto: ValidateWorkSessionDto): Observable<ValidationResultDto> {
    return this.http.post<ValidationResultDto>(`${this.baseUrl}/validate`, dto)
      .pipe(catchError(this.handleError));
  }

  /**
   * Check for time conflicts
   */
  checkConflicts(clockIn: string, excludeId?: string): Observable<ITimeConflict[]> {
    let params = new HttpParams().set('clockIn', clockIn);
    if (excludeId) {
      params = params.set('excludeId', excludeId);
    }

    return this.http.get<ITimeConflict[]>(`${this.baseUrl}/conflicts/check`, { params })
      .pipe(catchError(this.handleError));
  }

  /**
   * Handle HTTP errors
   */
  private handleError = (error: HttpErrorResponse): Observable<never> => {
    let errorMessage = 'An error occurred while processing your request.';

    if (error.error?.message) {
      errorMessage = error.error.message;
    } else if (error.status === 0) {
      errorMessage = 'Unable to connect to the server. Please check your internet connection.';
    } else if (error.status >= 400 && error.status < 500) {
      errorMessage = error.error?.message || 'Invalid request. Please check your input.';
    } else if (error.status >= 500) {
      errorMessage = 'Server error. Please try again later.';
    }

    console.error('TimeTrackingApiService error:', error);
    return throwError(() => new Error(errorMessage));
  };
}