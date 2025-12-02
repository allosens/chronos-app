import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { catchError, throwError, firstValueFrom, Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  WorkSession,
  Break,
  DailySummary,
  WeeklySummary,
  MonthlySummary,
  ClockInRequest,
  ClockOutRequest,
  StartBreakRequest,
  EndBreakRequest,
  WorkSessionQueryParams,
} from '../models/time-tracking.model';

/**
 * Service for interacting with the Work Sessions API
 * Handles all HTTP requests for time tracking functionality
 */
@Injectable({
  providedIn: 'root',
})
export class TimeTrackingApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/v1`;

  /**
   * Start a new work session (clock-in)
   */
  async clockIn(request: ClockInRequest = {}): Promise<WorkSession> {
    try {
      return await firstValueFrom(
        this.http.post<WorkSession>(`${this.baseUrl}/work-sessions/clock-in`, request).pipe(
          catchError((error: HttpErrorResponse) => {
            return throwError(() => this.handleError(error, 'Failed to clock in'));
          })
        )
      );
    } catch (error) {
      throw this.normalizeError(error);
    }
  }

  /**
   * End a work session (clock-out)
   */
  async clockOut(sessionId: string, request: ClockOutRequest = {}): Promise<WorkSession> {
    try {
      return await firstValueFrom(
        this.http
          .patch<WorkSession>(`${this.baseUrl}/work-sessions/${sessionId}/clock-out`, request)
          .pipe(
            catchError((error: HttpErrorResponse) => {
              return throwError(() => this.handleError(error, 'Failed to clock out'));
            })
          )
      );
    } catch (error) {
      throw this.normalizeError(error);
    }
  }

  /**
   * Start a break within a work session
   * Returns the updated work session with the new break
   */
  async startBreak(sessionId: string, request: StartBreakRequest = {}): Promise<WorkSession> {
    try {
      return await firstValueFrom(
        this.http
          .post<WorkSession>(`${this.baseUrl}/work-sessions/${sessionId}/breaks/start`, request)
          .pipe(
            catchError((error: HttpErrorResponse) => {
              return throwError(() => this.handleError(error, 'Failed to start break'));
            })
          )
      );
    } catch (error) {
      throw this.normalizeError(error);
    }
  }

  /**
   * End the current break
   * Returns the updated work session with the completed break
   */
  async endBreak(sessionId: string, request: EndBreakRequest = {}): Promise<WorkSession> {
    try {
      return await firstValueFrom(
        this.http
          .patch<WorkSession>(`${this.baseUrl}/work-sessions/${sessionId}/breaks/end`, request)
          .pipe(
            catchError((error: HttpErrorResponse) => {
              return throwError(() => this.handleError(error, 'Failed to end break'));
            })
          )
      );
    } catch (error) {
      throw this.normalizeError(error);
    }
  }

  /**
   * Get the current active work session
   */
  async getActiveSession(): Promise<WorkSession | null> {
    try {
      return await firstValueFrom(
        this.http.get<WorkSession>(`${this.baseUrl}/work-sessions/active`).pipe(
          catchError((error: HttpErrorResponse) => {
            // 404 is expected when there's no active session
            if (error.status === 404) {
              return throwError(() => null);
            }
            return throwError(() => this.handleError(error, 'Failed to get active session'));
          })
        )
      );
    } catch (error) {
      if (error === null) {
        return null;
      }
      throw this.normalizeError(error);
    }
  }

  /**
   * Get a specific work session by ID
   */
  async getSession(sessionId: string): Promise<WorkSession> {
    try {
      return await firstValueFrom(
        this.http.get<WorkSession>(`${this.baseUrl}/work-sessions/${sessionId}`).pipe(
          catchError((error: HttpErrorResponse) => {
            return throwError(() => this.handleError(error, 'Failed to get work session'));
          })
        )
      );
    } catch (error) {
      throw this.normalizeError(error);
    }
  }

  /**
   * List work sessions with optional filters
   */
  async listSessions(params?: WorkSessionQueryParams): Promise<WorkSession[]> {
    try {
      let httpParams = new HttpParams();

      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            httpParams = httpParams.set(key, value.toString());
          }
        });
      }

      return await firstValueFrom(
        this.http.get<WorkSession[]>(`${this.baseUrl}/work-sessions`, { params: httpParams }).pipe(
          catchError((error: HttpErrorResponse) => {
            return throwError(() => this.handleError(error, 'Failed to list work sessions'));
          })
        )
      );
    } catch (error) {
      throw this.normalizeError(error);
    }
  }

  /**
   * Validate a work session before saving
   */
  async validateSession(session: Partial<WorkSession>): Promise<{ valid: boolean; errors?: string[] }> {
    try {
      return await firstValueFrom(
        this.http.post<{ valid: boolean; errors?: string[] }>(
          `${this.baseUrl}/work-sessions/validate`,
          session
        ).pipe(
          catchError((error: HttpErrorResponse) => {
            return throwError(() => this.handleError(error, 'Failed to validate work session'));
          })
        )
      );
    } catch (error) {
      throw this.normalizeError(error);
    }
  }

  /**
   * Get daily time report
   */
  async getDailyReport(date?: string): Promise<DailySummary> {
    try {
      let httpParams = new HttpParams();
      if (date) {
        httpParams = httpParams.set('date', date);
      }

      return await firstValueFrom(
        this.http.get<DailySummary>(`${this.baseUrl}/time-reports/daily`, { params: httpParams }).pipe(
          catchError((error: HttpErrorResponse) => {
            return throwError(() => this.handleError(error, 'Failed to get daily report'));
          })
        )
      );
    } catch (error) {
      throw this.normalizeError(error);
    }
  }

  /**
   * Get weekly time report
   */
  async getWeeklyReport(weekStart?: string): Promise<WeeklySummary> {
    try {
      let httpParams = new HttpParams();
      if (weekStart) {
        httpParams = httpParams.set('weekStart', weekStart);
      }

      return await firstValueFrom(
        this.http.get<WeeklySummary>(`${this.baseUrl}/time-reports/weekly`, { params: httpParams }).pipe(
          catchError((error: HttpErrorResponse) => {
            return throwError(() => this.handleError(error, 'Failed to get weekly report'));
          })
        )
      );
    } catch (error) {
      throw this.normalizeError(error);
    }
  }

  /**
   * Get monthly time report
   */
  async getMonthlyReport(year?: number, month?: number): Promise<MonthlySummary> {
    try {
      let httpParams = new HttpParams();
      if (year !== undefined) {
        httpParams = httpParams.set('year', year.toString());
      }
      if (month !== undefined) {
        httpParams = httpParams.set('month', month.toString());
      }

      return await firstValueFrom(
        this.http.get<MonthlySummary>(`${this.baseUrl}/time-reports/monthly`, { params: httpParams }).pipe(
          catchError((error: HttpErrorResponse) => {
            return throwError(() => this.handleError(error, 'Failed to get monthly report'));
          })
        )
      );
    } catch (error) {
      throw this.normalizeError(error);
    }
  }

  /**
   * Handle HTTP errors and return user-friendly messages
   */
  private handleError(error: HttpErrorResponse, defaultMessage: string): Error {
    let errorMessage = defaultMessage;

    // Check if error is due to parsing HTML as JSON
    if (error.error instanceof ProgressEvent || typeof error.error === 'string') {
      errorMessage = 'The server is not available or the API is not configured correctly. Please verify that the backend is running.';
    } else if (error.status === 0) {
      // Network error or CORS
      errorMessage = 'Cannot connect to the server. Please verify that the backend is running and the proxy is configured correctly.';
    } else if (error.status === 400) {
      errorMessage = error.error?.message || 'Invalid request. Please check your input.';
    } else if (error.status === 401) {
      errorMessage = 'Unauthorized. Please log in again.';
    } else if (error.status === 403) {
      errorMessage = 'You do not have permission to perform this action.';
    } else if (error.status === 404) {
      errorMessage = error.error?.message || 'Resource not found.';
    } else if (error.status === 409) {
      errorMessage = error.error?.message || 'Conflict. The operation cannot be completed.';
    } else if (error.status >= 500) {
      errorMessage = 'Server error. Please try again later.';
    } else if (error.error?.message) {
      errorMessage = error.error.message;
    }

    // Log detailed error for debugging
    console.error('API error:', {
      status: error.status,
      statusText: error.statusText,
      message: error.message,
      error: error.error,
      url: error.url,
    });

    return new Error(errorMessage);
  }

  /**
   * Normalize error to ensure it's an Error instance
   */
  private normalizeError(error: unknown): Error {
    if (error instanceof Error) {
      return error;
    }
    return new Error(String(error));
  }
}
