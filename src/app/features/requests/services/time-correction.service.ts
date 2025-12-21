import { Injectable, signal, computed, inject } from '@angular/core';
import {
  TimeCorrectionRequest,
  TimeCorrectionStatus,
  TimeCorrectionFormData,
  WorkSessionSummary,
  CreateTimeCorrectionRequest,
  TimeEntrySummary
} from '../models/time-correction.model';
import { TimesheetEntry } from '../../time-tracking/models/timesheet-history.model';
import { DateUtils } from '../../../shared/utils/date.utils';
import { TimeCorrectionApiService } from './time-correction-api.service';
import { AuthService } from '../../auth/services/auth.service';
import { WorkSession } from '../../time-tracking/models/time-tracking.model';

/**
 * Service for managing time correction requests
 * Integrates with the backend API and provides reactive state management
 */
@Injectable({
  providedIn: 'root'
})
export class TimeCorrectionService {
  private apiService = inject(TimeCorrectionApiService);
  private authService = inject(AuthService);

  private requestsSignal = signal<TimeCorrectionRequest[]>([]);
  private loadingSignal = signal<boolean>(false);
  private errorSignal = signal<string | null>(null);

  // Public readonly signals
  readonly requests = this.requestsSignal.asReadonly();
  readonly isLoading = this.loadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();

  // Computed signals
  readonly pendingRequests = computed(() =>
    this.requestsSignal().filter(r => r.status === TimeCorrectionStatus.PENDING)
  );

  readonly approvedRequests = computed(() =>
    this.requestsSignal().filter(r => r.status === TimeCorrectionStatus.APPROVED)
  );

  readonly rejectedRequests = computed(() =>
    this.requestsSignal().filter(r => r.status === TimeCorrectionStatus.DENIED)
  );

  readonly requestCount = computed(() => this.requestsSignal().length);
  readonly pendingCount = computed(() => this.pendingRequests().length);

  constructor() {
    // Load requests when service is initialized
    this.loadRequests();
  }

  /**
   * Load all time correction requests from API
   */
  async loadRequests(): Promise<void> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    try {
      const requests = await this.apiService.getCorrections();
      // Convert date strings to Date objects
      const convertedRequests = requests.map(this.convertRequestDates);
      this.requestsSignal.set(convertedRequests);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load requests';
      this.errorSignal.set(errorMessage);
      console.error('Error loading time correction requests:', error);
    } finally {
      this.loadingSignal.set(false);
    }
  }

  /**
   * Submit a new time correction request
   */
  async submitRequest(formData: TimeCorrectionFormData, originalSession: WorkSession): Promise<TimeCorrectionRequest> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    try {
      // Convert time strings to ISO timestamps
      const requestedClockIn = formData.requestedClockIn 
        ? this.convertTimeToISOString(formData.requestedClockIn, originalSession.date)
        : null;
      
      const requestedClockOut = formData.requestedClockOut
        ? this.convertTimeToISOString(formData.requestedClockOut, originalSession.date)
        : null;

      const apiRequest: CreateTimeCorrectionRequest = {
        workSessionId: formData.workSessionId,
        requestedClockIn,
        requestedClockOut,
        reason: formData.reason
      };

      const createdRequest = await this.apiService.createCorrection(apiRequest);
      const convertedRequest = this.convertRequestDates(createdRequest);
      
      // Add to local state
      const currentRequests = this.requestsSignal();
      this.requestsSignal.set([...currentRequests, convertedRequest]);

      return convertedRequest;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to submit request';
      this.errorSignal.set(errorMessage);
      console.error('Error submitting time correction request:', error);
      throw error;
    } finally {
      this.loadingSignal.set(false);
    }
  }

  /**
   * Get requests filtered by status
   */
  getRequestsByStatus(status: TimeCorrectionStatus): TimeCorrectionRequest[] {
    return this.requestsSignal().filter(r => r.status === status);
  }

  /**
   * Get a specific request by ID (from local cache or API)
   */
  async getRequestById(id: string): Promise<TimeCorrectionRequest | undefined> {
    // First check local cache
    const localRequest = this.requestsSignal().find(r => r.id === id);
    if (localRequest) {
      return localRequest;
    }

    // If not found locally, fetch from API
    try {
      const request = await this.apiService.getCorrectionById(id);
      return this.convertRequestDates(request);
    } catch (error) {
      console.error('Error fetching request by ID:', error);
      return undefined;
    }
  }

  /**
   * Update a time correction request
   */
  async updateRequest(id: string, formData: Partial<TimeCorrectionFormData>): Promise<TimeCorrectionRequest> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    try {
      // Note: For full update support, we'd need the session date
      // For now, we'll only support updating the reason
      const updateData = {
        reason: formData.reason
      };

      const updatedRequest = await this.apiService.updateCorrection(id, updateData);
      const convertedRequest = this.convertRequestDates(updatedRequest);
      
      // Update local state
      const requests = this.requestsSignal();
      const index = requests.findIndex(r => r.id === id);
      if (index !== -1) {
        const updatedRequests = [...requests];
        updatedRequests[index] = convertedRequest;
        this.requestsSignal.set(updatedRequests);
      }

      return convertedRequest;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update request';
      this.errorSignal.set(errorMessage);
      console.error('Error updating time correction request:', error);
      throw error;
    } finally {
      this.loadingSignal.set(false);
    }
  }

  /**
   * Cancel a time correction request
   */
  async cancelRequest(id: string): Promise<void> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    try {
      await this.apiService.cancelCorrection(id);
      
      // Remove from local state
      const requests = this.requestsSignal();
      this.requestsSignal.set(requests.filter(r => r.id !== id));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to cancel request';
      this.errorSignal.set(errorMessage);
      console.error('Error canceling time correction request:', error);
      throw error;
    } finally {
      this.loadingSignal.set(false);
    }
  }

  /**
   * Convert work sessions to summary format for dropdown
   */
  convertToWorkSessionSummaries(sessions: WorkSession[]): WorkSessionSummary[] {
    return sessions
      .filter(session => session.clockIn) // Only show sessions with clock in
      .map(session => ({
        id: session.id,
        date: typeof session.date === 'string' ? session.date : session.date.toISOString(),
        clockIn: this.ensureDate(session.clockIn),
        clockOut: session.clockOut ? this.ensureDate(session.clockOut) : undefined,
        displayText: this.formatWorkSessionDisplay(session)
      }));
  }

  /**
   * Convert time entries to summary format for dropdown (legacy support)
   * @deprecated Use convertToWorkSessionSummaries instead
   */
  convertToTimeEntrySummaries(entries: TimesheetEntry[]): TimeEntrySummary[] {
    return entries
      .filter(entry => entry.clockIn) // Only show entries with clock in
      .map(entry => ({
        id: entry.id,
        date: entry.date,
        clockIn: entry.clockIn,
        clockOut: entry.clockOut,
        displayText: this.formatTimeEntryDisplay(entry)
      }));
  }

  /**
   * Format work session for display in dropdown
   */
  private formatWorkSessionDisplay(session: WorkSession): string {
    const sessionDate = this.ensureDate(session.date);
    const date = DateUtils.formatDate(sessionDate, 'medium');
    let timeInfo = '';

    if (session.clockIn) {
      const clockIn = this.ensureDate(session.clockIn);
      timeInfo = DateUtils.formatTime12Hour(clockIn);
      if (session.clockOut) {
        const clockOut = this.ensureDate(session.clockOut);
        timeInfo += ` - ${DateUtils.formatTime12Hour(clockOut)}`;
      } else {
        timeInfo += ' (No clock out)';
      }
    }

    return `${date} - ${timeInfo}`;
  }

  /**
   * Format time entry for display in dropdown (legacy support)
   */
  private formatTimeEntryDisplay(entry: TimesheetEntry): string {
    const date = DateUtils.formatDate(new Date(entry.date), 'medium');
    let timeInfo = '';

    if (entry.clockIn) {
      timeInfo = DateUtils.formatTime12Hour(entry.clockIn);
      if (entry.clockOut) {
        timeInfo += ` - ${DateUtils.formatTime12Hour(entry.clockOut)}`;
      } else {
        timeInfo += ' (No clock out)';
      }
    }

    return `${date} - ${timeInfo}`;
  }

  /**
   * Approve a request (admin only)
   */
  async approveRequest(requestId: string, reviewNotes?: string): Promise<void> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    try {
      const updatedRequest = await this.apiService.approveCorrection(requestId, reviewNotes);
      const convertedRequest = this.convertRequestDates(updatedRequest);
      
      // Update local state
      const requests = this.requestsSignal();
      const index = requests.findIndex(r => r.id === requestId);
      if (index !== -1) {
        const updatedRequests = [...requests];
        updatedRequests[index] = convertedRequest;
        this.requestsSignal.set(updatedRequests);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to approve request';
      this.errorSignal.set(errorMessage);
      console.error('Error approving time correction request:', error);
      throw error;
    } finally {
      this.loadingSignal.set(false);
    }
  }

  /**
   * Reject a request (admin only)
   */
  async rejectRequest(requestId: string, reviewNotes?: string): Promise<void> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    try {
      const updatedRequest = await this.apiService.rejectCorrection(requestId, reviewNotes);
      const convertedRequest = this.convertRequestDates(updatedRequest);
      
      // Update local state
      const requests = this.requestsSignal();
      const index = requests.findIndex(r => r.id === requestId);
      if (index !== -1) {
        const updatedRequests = [...requests];
        updatedRequests[index] = convertedRequest;
        this.requestsSignal.set(updatedRequests);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to reject request';
      this.errorSignal.set(errorMessage);
      console.error('Error rejecting time correction request:', error);
      throw error;
    } finally {
      this.loadingSignal.set(false);
    }
  }

  /**
   * Get pending approvals (admin only)
   */
  async getPendingApprovals(): Promise<TimeCorrectionRequest[]> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    try {
      const requests = await this.apiService.getPendingApprovals();
      return requests.map(this.convertRequestDates);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch pending approvals';
      this.errorSignal.set(errorMessage);
      console.error('Error fetching pending approvals:', error);
      throw error;
    } finally {
      this.loadingSignal.set(false);
    }
  }

  /**
   * Clear error state
   */
  clearError(): void {
    this.errorSignal.set(null);
  }

  /**
   * Convert API date strings to Date objects
   */
  private convertRequestDates(request: TimeCorrectionRequest): TimeCorrectionRequest {
    return {
      ...request,
      originalClockIn: request.originalClockIn ? this.ensureDate(request.originalClockIn) : null,
      originalClockOut: request.originalClockOut ? this.ensureDate(request.originalClockOut) : null,
      requestedClockIn: request.requestedClockIn ? this.ensureDate(request.requestedClockIn) : null,
      requestedClockOut: request.requestedClockOut ? this.ensureDate(request.requestedClockOut) : null,
      createdAt: this.ensureDate(request.createdAt),
      reviewedAt: request.reviewedAt ? this.ensureDate(request.reviewedAt) : null,
    };
  }

  /**
   * Ensure value is a Date object
   */
  private ensureDate(value: Date | string | null | undefined): Date | undefined {
    if (!value) return undefined;
    return value instanceof Date ? value : new Date(value);
  }

  /**
   * Convert time string (HH:MM) to ISO timestamp for a given date
   */
  private convertTimeToISOString(timeString: string, sessionDate: Date | string): string | null {
    const date = this.ensureDate(sessionDate);
    if (!date) return null;

    const timeDate = DateUtils.createTodayAtTime(timeString);
    if (!timeDate) return null;

    // Combine the session date with the requested time
    const combined = new Date(date);
    combined.setHours(timeDate.getHours(), timeDate.getMinutes(), 0, 0);
    
    return combined.toISOString();
  }
}
