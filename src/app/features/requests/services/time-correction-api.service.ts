import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { catchError, throwError, firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  TimeCorrectionRequest,
  CreateTimeCorrectionRequest,
  UpdateTimeCorrectionRequest,
  TimeCorrectionQueryParams,
  TimeCorrectionPaginatedResponse,
  TimeCorrectionStatus,
} from '../models/time-correction.model';

/**
 * Service for interacting with the Time Corrections API
 * Handles all HTTP requests for time correction functionality
 */
@Injectable({
  providedIn: 'root',
})
export class TimeCorrectionApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/v1`;

  /**
   * Create a new time correction request
   * POST /api/v1/time-corrections
   */
  async createCorrection(request: CreateTimeCorrectionRequest): Promise<TimeCorrectionRequest> {
    return await firstValueFrom(
      this.http.post<TimeCorrectionRequest>(`${this.baseUrl}/time-corrections`, request).pipe(
        catchError((error: HttpErrorResponse) => {
          return throwError(() => this.handleError(error, 'Failed to create time correction request'));
        })
      )
    );
  }

  /**
   * Get time correction requests with optional filters
   * GET /api/v1/time-corrections
   */
  async getCorrections(params?: TimeCorrectionQueryParams): Promise<TimeCorrectionPaginatedResponse> {
    let httpParams = new HttpParams();

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          httpParams = httpParams.set(key, value.toString());
        }
      });
    }

    return await firstValueFrom(
      this.http.get<TimeCorrectionPaginatedResponse>(`${this.baseUrl}/time-corrections`, { params: httpParams }).pipe(
        catchError((error: HttpErrorResponse) => {
          return throwError(() => this.handleError(error, 'Failed to fetch time correction requests'));
        })
      )
    );
  }

  /**
   * Get a specific time correction request by ID
   * GET /api/v1/time-corrections/:id
   */
  async getCorrectionById(id: string): Promise<TimeCorrectionRequest> {
    return await firstValueFrom(
      this.http.get<TimeCorrectionRequest>(`${this.baseUrl}/time-corrections/${id}`).pipe(
        catchError((error: HttpErrorResponse) => {
          return throwError(() => this.handleError(error, 'Failed to fetch time correction request'));
        })
      )
    );
  }

  /**
   * Update a time correction request
   * PUT /api/v1/time-corrections/:id
   */
  async updateCorrection(id: string, request: UpdateTimeCorrectionRequest): Promise<TimeCorrectionRequest> {
    return await firstValueFrom(
      this.http.put<TimeCorrectionRequest>(`${this.baseUrl}/time-corrections/${id}`, request).pipe(
        catchError((error: HttpErrorResponse) => {
          return throwError(() => this.handleError(error, 'Failed to update time correction request'));
        })
      )
    );
  }

  /**
   * Cancel a time correction request
   * DELETE /api/v1/time-corrections/:id
   */
  async cancelCorrection(id: string): Promise<void> {
    return await firstValueFrom(
      this.http.delete<void>(`${this.baseUrl}/time-corrections/${id}`).pipe(
        catchError((error: HttpErrorResponse) => {
          return throwError(() => this.handleError(error, 'Failed to cancel time correction request'));
        })
      )
    );
  }

  /**
   * Get pending time correction requests for approval
   * GET /api/v1/time-corrections/pending
   * (Admin only)
   */
  async getPendingApprovals(): Promise<TimeCorrectionRequest[]> {
    return await firstValueFrom(
      this.http.get<TimeCorrectionRequest[]>(`${this.baseUrl}/time-corrections/pending`).pipe(
        catchError((error: HttpErrorResponse) => {
          return throwError(() => this.handleError(error, 'Failed to fetch pending approvals'));
        })
      )
    );
  }

  /**
   * Approve a time correction request
   * PUT /api/v1/time-corrections/:id with status APPROVED
   * (Admin only)
   */
  async approveCorrection(id: string, reviewNotes?: string): Promise<TimeCorrectionRequest> {
    return await this.updateCorrection(id, {
      status: TimeCorrectionStatus.APPROVED,
      reviewNotes,
    });
  }

  /**
   * Reject a time correction request
   * PUT /api/v1/time-corrections/:id with status DENIED
   * (Admin only)
   * @param id - The ID of the correction request
   * @param reviewNotes - Required notes explaining the rejection reason
   */
  async rejectCorrection(id: string, reviewNotes: string): Promise<TimeCorrectionRequest> {
    if (!reviewNotes || reviewNotes.trim().length === 0) {
      throw new Error('Review notes are required when rejecting a request');
    }
    
    return await this.updateCorrection(id, {
      status: TimeCorrectionStatus.DENIED,
      reviewNotes,
    });
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
      errorMessage = error.error?.message || 'Time correction request not found.';
    } else if (error.status === 409) {
      errorMessage = error.error?.message || 'Conflict. The operation cannot be completed.';
    } else if (error.status >= 500) {
      errorMessage = 'Server error. Please try again later.';
    } else if (error.error?.message) {
      errorMessage = error.error.message;
    }

    // Log detailed error for debugging
    console.error('Time Correction API error:', {
      status: error.status,
      statusText: error.statusText,
      message: error.message,
      error: error.error,
      url: error.url,
    });

    return new Error(errorMessage);
  }
}
