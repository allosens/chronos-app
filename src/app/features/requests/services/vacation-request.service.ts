import { Injectable, signal, computed } from '@angular/core';
import { 
  VacationRequest, 
  VacationRequestFormData, 
  VacationRequestType, 
  VacationRequestStatus,
  VacationBalance 
} from '../models/vacation-request.model';

@Injectable({
  providedIn: 'root'
})
export class VacationRequestService {
  // Configuration
  private readonly DEFAULT_VACATION_DAYS = 22;

  // Signal for all vacation requests
  private vacationRequestsSignal = signal<VacationRequest[]>([]);
  
  // Public readonly signal
  readonly vacationRequests = this.vacationRequestsSignal.asReadonly();

  // Computed signals
  readonly pendingRequests = computed(() => 
    this.vacationRequests().filter(req => req.status === VacationRequestStatus.PENDING)
  );

  readonly approvedRequests = computed(() => 
    this.vacationRequests().filter(req => req.status === VacationRequestStatus.APPROVED)
  );

  readonly rejectedRequests = computed(() => 
    this.vacationRequests().filter(req => req.status === VacationRequestStatus.REJECTED)
  );

  readonly vacationBalance = computed((): VacationBalance => {
    const totalVacationDays = this.DEFAULT_VACATION_DAYS;
    const approved = this.approvedRequests();
    const pending = this.pendingRequests();

    const usedVacationDays = approved
      .filter(req => req.type === VacationRequestType.VACATION)
      .reduce((total, req) => total + req.totalDays, 0);

    const pendingVacationDays = pending
      .filter(req => req.type === VacationRequestType.VACATION)
      .reduce((total, req) => total + req.totalDays, 0);

    return {
      totalVacationDays,
      usedVacationDays,
      remainingVacationDays: totalVacationDays - usedVacationDays,
      pendingVacationDays
    };
  });

  constructor() {
    // Load initial data (in a real app, this would be from an API)
    this.loadVacationRequests();
  }

  /**
   * Creates a new vacation request
   */
  createVacationRequest(formData: VacationRequestFormData, employeeId: string = 'current-user'): VacationRequest {
    const startDate = new Date(formData.startDate);
    const endDate = new Date(formData.endDate);
    const totalDays = this.calculateWorkingDays(startDate, endDate);

    const newRequest: VacationRequest = {
      id: this.generateId(),
      employeeId,
      type: formData.type,
      startDate,
      endDate,
      totalDays,
      comments: formData.comments,
      status: VacationRequestStatus.PENDING,
      requestedAt: new Date()
    };

    const currentRequests = this.vacationRequestsSignal();
    this.vacationRequestsSignal.set([newRequest, ...currentRequests]);
    this.saveToLocalStorage();

    return newRequest;
  }

  /**
   * Cancels a pending vacation request
   */
  cancelRequest(requestId: string): void {
    const currentRequests = this.vacationRequestsSignal();
    const updatedRequests = currentRequests.map(req => {
      if (req.id === requestId && req.status === VacationRequestStatus.PENDING) {
        return { ...req, status: VacationRequestStatus.CANCELLED };
      }
      return req;
    });
    this.vacationRequestsSignal.set(updatedRequests);
    this.saveToLocalStorage();
  }

  /**
   * Calculates working days between two dates (excluding weekends)
   */
  calculateWorkingDays(startDate: Date, endDate: Date): number {
    // Validate inputs
    if (!(startDate instanceof Date) || isNaN(startDate.getTime())) {
      throw new Error('Invalid start date');
    }
    if (!(endDate instanceof Date) || isNaN(endDate.getTime())) {
      throw new Error('Invalid end date');
    }
    if (endDate < startDate) {
      return 0;
    }

    let count = 0;
    const current = new Date(startDate);
    const end = new Date(endDate);

    // Set to start of day to avoid time issues
    current.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    while (current <= end) {
      const dayOfWeek = current.getDay();
      // Count only weekdays (Monday = 1, Friday = 5)
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        count++;
      }
      current.setDate(current.getDate() + 1);
    }

    return count;
  }

  /**
   * Validates if dates overlap with existing approved requests
   */
  hasOverlappingRequests(startDate: Date, endDate: Date, excludeId?: string): boolean {
    const approvedRequests = this.approvedRequests().filter(req => 
      !excludeId || req.id !== excludeId
    );

    return approvedRequests.some(req => {
      return (
        (startDate >= req.startDate && startDate <= req.endDate) ||
        (endDate >= req.startDate && endDate <= req.endDate) ||
        (startDate <= req.startDate && endDate >= req.endDate)
      );
    });
  }

  /**
   * Gets vacation request by ID
   */
  getRequestById(id: string): VacationRequest | undefined {
    return this.vacationRequests().find(req => req.id === id);
  }

  private generateId(): string {
    return `vr-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }

  private loadVacationRequests(): void {
    // Load from localStorage (in a real app, this would be an API call)
    const stored = localStorage.getItem('chronos-vacation-requests');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const requests: VacationRequest[] = parsed.map((req: any) => ({
          ...req,
          startDate: new Date(req.startDate),
          endDate: new Date(req.endDate),
          requestedAt: new Date(req.requestedAt),
          reviewedAt: req.reviewedAt ? new Date(req.reviewedAt) : undefined
        }));
        this.vacationRequestsSignal.set(requests);
      } catch (error) {
        console.error('Error loading vacation requests:', error);
        // Fall back to sample data if stored data is corrupted
        this.initializeSampleData();
      }
    } else {
      // Initialize with some sample data for demo purposes
      this.initializeSampleData();
    }
  }

  private saveToLocalStorage(): void {
    const requests = this.vacationRequests().map(req => ({
      ...req,
      startDate: req.startDate.toISOString(),
      endDate: req.endDate.toISOString(),
      requestedAt: req.requestedAt.toISOString(),
      reviewedAt: req.reviewedAt?.toISOString()
    }));
    localStorage.setItem('chronos-vacation-requests', JSON.stringify(requests));
  }

  private initializeSampleData(): void {
    const today = new Date();
    const futureDate1 = new Date(today);
    futureDate1.setDate(today.getDate() + 30); // 30 days from now
    const futureDate2 = new Date(futureDate1);
    futureDate2.setDate(futureDate1.getDate() + 9); // +9 more days
    
    const pastDate1 = new Date(today);
    pastDate1.setDate(today.getDate() - 15);
    const pastDate2 = new Date(today);
    pastDate2.setDate(today.getDate() - 10);

    const sampleRequests: VacationRequest[] = [
      {
        id: this.generateId(),
        employeeId: 'current-user',
        type: VacationRequestType.VACATION,
        startDate: futureDate1,
        endDate: futureDate2,
        totalDays: this.calculateWorkingDays(futureDate1, futureDate2),
        comments: 'End of year holidays',
        status: VacationRequestStatus.APPROVED,
        requestedAt: pastDate1,
        reviewedAt: pastDate2,
        reviewedBy: 'Manager',
        reviewComments: 'Approved for end of year holidays'
      },
      {
        id: this.generateId(),
        employeeId: 'current-user',
        type: VacationRequestType.PERSONAL_DAY,
        startDate: new Date(today.getTime() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
        endDate: new Date(today.getTime() + 10 * 24 * 60 * 60 * 1000),
        totalDays: 1,
        comments: 'Personal matters',
        status: VacationRequestStatus.PENDING,
        requestedAt: new Date()
      }
    ];
    this.vacationRequestsSignal.set(sampleRequests);
    this.saveToLocalStorage();
  }
}
