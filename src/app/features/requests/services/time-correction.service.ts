import { Injectable, signal, computed, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import {
  TimeCorrectionRequest,
  TimeCorrectionStatus,
  TimeCorrectionFormData,
  TimeEntrySummary
} from '../models/time-correction.model';
import { TimesheetEntry } from '../../time-tracking/models/timesheet-history.model';
import { DateUtils } from '../../../shared/utils/date.utils';

@Injectable({
  providedIn: 'root'
})
export class TimeCorrectionService {
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);

  private requestsSignal = signal<TimeCorrectionRequest[]>([]);
  private currentEmployeeId = 'current-user'; // In a real app, this would come from auth service
  private currentEmployeeName = 'Current User'; // In a real app, this would come from auth service

  // Public readonly signals
  readonly requests = this.requestsSignal.asReadonly();

  // Computed signals
  readonly pendingRequests = computed(() =>
    this.requestsSignal().filter(r => r.status === TimeCorrectionStatus.PENDING)
  );

  readonly approvedRequests = computed(() =>
    this.requestsSignal().filter(r => r.status === TimeCorrectionStatus.APPROVED)
  );

  readonly rejectedRequests = computed(() =>
    this.requestsSignal().filter(r => r.status === TimeCorrectionStatus.REJECTED)
  );

  readonly requestCount = computed(() => this.requestsSignal().length);
  readonly pendingCount = computed(() => this.pendingRequests().length);

  constructor() {
    this.loadSavedRequests();
  }

  /**
   * Submit a new time correction request
   */
  submitRequest(formData: TimeCorrectionFormData, originalEntry: TimesheetEntry): TimeCorrectionRequest {
    const request: TimeCorrectionRequest = {
      id: this.generateId(),
      employeeId: this.currentEmployeeId,
      employeeName: this.currentEmployeeName,
      timeEntryId: formData.timeEntryId,
      originalDate: originalEntry.date,
      originalClockIn: originalEntry.clockIn,
      originalClockOut: originalEntry.clockOut,
      requestedClockIn: formData.requestedClockIn 
        ? DateUtils.createTodayAtTime(formData.requestedClockIn) ?? undefined
        : undefined,
      requestedClockOut: formData.requestedClockOut
        ? DateUtils.createTodayAtTime(formData.requestedClockOut) ?? undefined
        : undefined,
      reason: formData.reason,
      status: TimeCorrectionStatus.PENDING,
      createdAt: new Date()
    };

    const currentRequests = this.requestsSignal();
    this.requestsSignal.set([...currentRequests, request]);
    this.saveRequests();

    return request;
  }

  /**
   * Get requests filtered by status
   */
  getRequestsByStatus(status: TimeCorrectionStatus): TimeCorrectionRequest[] {
    return this.requestsSignal().filter(r => r.status === status);
  }

  /**
   * Get a specific request by ID
   */
  getRequestById(id: string): TimeCorrectionRequest | undefined {
    return this.requestsSignal().find(r => r.id === id);
  }

  /**
   * Convert time entries to summary format for dropdown
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
   * Format time entry for display in dropdown
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
   * Mock method to approve a request (would be used by admin)
   */
  approveRequest(requestId: string, reviewNotes?: string): void {
    const requests = this.requestsSignal();
    const index = requests.findIndex(r => r.id === requestId);
    
    if (index !== -1) {
      const updatedRequests = [...requests];
      updatedRequests[index] = {
        ...updatedRequests[index],
        status: TimeCorrectionStatus.APPROVED,
        reviewedAt: new Date(),
        reviewedBy: 'Admin User',
        reviewNotes
      };
      this.requestsSignal.set(updatedRequests);
      this.saveRequests();
    }
  }

  /**
   * Mock method to reject a request (would be used by admin)
   */
  rejectRequest(requestId: string, reviewNotes?: string): void {
    const requests = this.requestsSignal();
    const index = requests.findIndex(r => r.id === requestId);
    
    if (index !== -1) {
      const updatedRequests = [...requests];
      updatedRequests[index] = {
        ...updatedRequests[index],
        status: TimeCorrectionStatus.REJECTED,
        reviewedAt: new Date(),
        reviewedBy: 'Admin User',
        reviewNotes
      };
      this.requestsSignal.set(updatedRequests);
      this.saveRequests();
    }
  }

  /**
   * Clear all requests (for testing/demo purposes)
   */
  clearAllRequests(): void {
    this.requestsSignal.set([]);
    this.saveRequests();
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  }

  private saveRequests(): void {
    if (!this.isBrowser) return;

    const requests = this.requestsSignal();
    localStorage.setItem('chronos-time-correction-requests', JSON.stringify(
      requests.map(r => ({
        ...r,
        originalClockIn: r.originalClockIn?.toISOString(),
        originalClockOut: r.originalClockOut?.toISOString(),
        requestedClockIn: r.requestedClockIn?.toISOString(),
        requestedClockOut: r.requestedClockOut?.toISOString(),
        createdAt: r.createdAt.toISOString(),
        reviewedAt: r.reviewedAt?.toISOString()
      }))
    ));
  }

  private loadSavedRequests(): void {
    if (!this.isBrowser) return;

    const saved = localStorage.getItem('chronos-time-correction-requests');
    if (!saved) return;

    try {
      const parsed = JSON.parse(saved);
      const requests: TimeCorrectionRequest[] = parsed.map((r: any) => ({
        ...r,
        originalClockIn: r.originalClockIn ? new Date(r.originalClockIn) : undefined,
        originalClockOut: r.originalClockOut ? new Date(r.originalClockOut) : undefined,
        requestedClockIn: r.requestedClockIn ? new Date(r.requestedClockIn) : undefined,
        requestedClockOut: r.requestedClockOut ? new Date(r.requestedClockOut) : undefined,
        createdAt: new Date(r.createdAt),
        reviewedAt: r.reviewedAt ? new Date(r.reviewedAt) : undefined
      }));

      this.requestsSignal.set(requests);
    } catch (error) {
      console.error('Error loading saved requests:', error);
      if (this.isBrowser) {
        localStorage.removeItem('chronos-time-correction-requests');
      }
    }
  }
}
