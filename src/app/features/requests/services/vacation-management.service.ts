import { Injectable, inject, signal, computed } from '@angular/core';
import { VacationRequestService } from './vacation-request.service';
import { VacationRequestStatus } from '../models/vacation-request.model';
import {
  VacationApprovalAction,
  VacationManagementFilters,
  TeamAvailability,
  VacationConflict,
  EmployeeVacationSummary,
  CalendarDay
} from '../models/vacation-management.model';

@Injectable({
  providedIn: 'root'
})
export class VacationManagementService {
  private vacationService = inject(VacationRequestService);

  // Configuration
  private readonly MINIMUM_TEAM_AVAILABILITY = 0.7; // 70% of team must be available
  private readonly DEFAULT_TOTAL_EMPLOYEES = 10;

  // Filters
  private filtersSignal = signal<VacationManagementFilters>({});

  // Public readonly
  readonly filters = this.filtersSignal.asReadonly();

  // All requests (for admin view)
  readonly allRequests = this.vacationService.vacationRequests;

  // Pending requests for approval
  readonly pendingRequestsForApproval = computed(() => {
    const requests = this.vacationService.pendingRequests();
    const filters = this.filters();
    return this.applyFilters(requests, filters);
  });

  // Approved requests
  readonly approvedRequestsFiltered = computed(() => {
    const requests = this.vacationService.approvedRequests();
    const filters = this.filters();
    return this.applyFilters(requests, filters);
  });

  /**
   * Approves a vacation request
   */
  approveRequest(action: VacationApprovalAction): void {
    const request = this.allRequests().find(r => r.id === action.requestId);
    if (request && request.status === VacationRequestStatus.PENDING) {
      this.vacationService.updateRequest(action.requestId, {
        status: VacationRequestStatus.APPROVED,
        reviewedAt: new Date(),
        reviewedBy: action.reviewedBy,
        reviewComments: action.reviewComments
      });
    }
  }

  /**
   * Rejects a vacation request
   */
  rejectRequest(action: VacationApprovalAction): void {
    const request = this.allRequests().find(r => r.id === action.requestId);
    if (request && request.status === VacationRequestStatus.PENDING) {
      this.vacationService.updateRequest(action.requestId, {
        status: VacationRequestStatus.REJECTED,
        reviewedAt: new Date(),
        reviewedBy: action.reviewedBy,
        reviewComments: action.reviewComments
      });
    }
  }

  /**
   * Sets filters for vacation management view
   */
  setFilters(filters: VacationManagementFilters): void {
    this.filtersSignal.set(filters);
  }

  /**
   * Clears all filters
   */
  clearFilters(): void {
    this.filtersSignal.set({});
  }

  /**
   * Checks if a vacation request has conflicts with other requests
   */
  getConflicts(requestId: string): VacationConflict[] {
    const request = this.allRequests().find(r => r.id === requestId);
    if (!request) return [];

    const conflicts: VacationConflict[] = [];
    const approvedRequests = this.vacationService.approvedRequests();

    approvedRequests.forEach(approved => {
      if (approved.id === requestId) return;

      const hasOverlap = this.datesOverlap(
        request.startDate,
        request.endDate,
        approved.startDate,
        approved.endDate
      );

      if (hasOverlap) {
        const overlapDays = this.calculateOverlapDays(
          request.startDate,
          request.endDate,
          approved.startDate,
          approved.endDate
        );

        conflicts.push({
          requestId: approved.id,
          employeeId: approved.employeeId,
          employeeName: approved.employeeName || 'Unknown Employee',
          startDate: approved.startDate,
          endDate: approved.endDate,
          overlapDays
        });
      }
    });

    return conflicts;
  }

  /**
   * Checks team availability for a date range
   */
  checkTeamAvailability(startDate: Date, endDate: Date): TeamAvailability[] {
    const availability: TeamAvailability[] = [];
    const current = new Date(startDate);
    const end = new Date(endDate);

    current.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    while (current <= end) {
      const dayOfWeek = current.getDay();
      
      // Skip weekends
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        const onVacation = this.getEmployeesOnVacation(current);
        const available = this.DEFAULT_TOTAL_EMPLOYEES - onVacation.length;
        const percentage = available / this.DEFAULT_TOTAL_EMPLOYEES;

        availability.push({
          date: new Date(current),
          totalEmployees: this.DEFAULT_TOTAL_EMPLOYEES,
          availableEmployees: available,
          onVacation,
          availabilityPercentage: percentage
        });
      }

      current.setDate(current.getDate() + 1);
    }

    return availability;
  }

  /**
   * Validates if approving a request would violate team availability rules
   */
  validateTeamAvailability(requestId: string): { valid: boolean; message?: string } {
    const request = this.allRequests().find(r => r.id === requestId);
    if (!request) {
      return { valid: false, message: 'Request not found' };
    }

    const availability = this.checkTeamAvailability(request.startDate, request.endDate);
    
    // Check if any day would fall below minimum availability
    // Simulate adding this employee to vacation
    for (const day of availability) {
      const wouldBeAvailable = day.availableEmployees - 1;
      const wouldBePercentage = wouldBeAvailable / this.DEFAULT_TOTAL_EMPLOYEES;

      if (wouldBePercentage < this.MINIMUM_TEAM_AVAILABILITY) {
        return {
          valid: false,
          message: `Approving would reduce team availability below ${this.MINIMUM_TEAM_AVAILABILITY * 100}% on ${day.date.toLocaleDateString()}`
        };
      }
    }

    return { valid: true };
  }

  /**
   * Gets vacation summary for all employees
   */
  getEmployeeSummaries(): EmployeeVacationSummary[] {
    const summariesMap = new Map<string, EmployeeVacationSummary>();
    const requests = this.allRequests();

    requests.forEach(req => {
      let summary = summariesMap.get(req.employeeId);
      
      if (!summary) {
        summary = {
          employeeId: req.employeeId,
          employeeName: req.employeeName || `Employee ${req.employeeId}`,
          totalDaysAllowed: 22, // Default
          daysUsed: 0,
          daysPending: 0,
          daysRemaining: 22,
          approvedRequests: [],
          pendingRequests: []
        };
        summariesMap.set(req.employeeId, summary);
      }

      if (req.status === VacationRequestStatus.APPROVED) {
        summary.daysUsed += req.totalDays;
        summary.approvedRequests.push(req);
      } else if (req.status === VacationRequestStatus.PENDING) {
        summary.daysPending += req.totalDays;
        summary.pendingRequests.push(req);
      }

      summary.daysRemaining = summary.totalDaysAllowed - summary.daysUsed;
    });

    return Array.from(summariesMap.values()).sort((a, b) => 
      a.employeeName.localeCompare(b.employeeName)
    );
  }

  /**
   * Generates calendar days with vacation information
   */
  generateCalendar(startDate: Date, endDate: Date): CalendarDay[] {
    const days: CalendarDay[] = [];
    const current = new Date(startDate);
    const end = new Date(endDate);

    current.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    while (current <= end) {
      const dayOfWeek = current.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const vacations = this.getVacationsForDate(new Date(current));
      const onVacation = this.getEmployeesOnVacation(new Date(current));
      const availability = isWeekend ? 0 : 
        (this.DEFAULT_TOTAL_EMPLOYEES - onVacation.length) / this.DEFAULT_TOTAL_EMPLOYEES;

      days.push({
        date: new Date(current),
        isWeekend,
        vacations,
        availability
      });

      current.setDate(current.getDate() + 1);
    }

    return days;
  }

  /**
   * Private helper methods
   */

  private applyFilters(requests: any[], filters: VacationManagementFilters): any[] {
    let filtered = [...requests];

    if (filters.employeeId) {
      filtered = filtered.filter(r => r.employeeId === filters.employeeId);
    }

    if (filters.status) {
      filtered = filtered.filter(r => r.status === filters.status);
    }

    if (filters.startDate) {
      filtered = filtered.filter(r => r.startDate >= filters.startDate!);
    }

    if (filters.endDate) {
      filtered = filtered.filter(r => r.endDate <= filters.endDate!);
    }

    return filtered;
  }

  private datesOverlap(start1: Date, end1: Date, start2: Date, end2: Date): boolean {
    return (
      (start1 >= start2 && start1 <= end2) ||
      (end1 >= start2 && end1 <= end2) ||
      (start1 <= start2 && end1 >= end2)
    );
  }

  private calculateOverlapDays(start1: Date, end1: Date, start2: Date, end2: Date): number {
    const overlapStart = start1 > start2 ? start1 : start2;
    const overlapEnd = end1 < end2 ? end1 : end2;

    if (overlapStart > overlapEnd) return 0;

    return this.vacationService.calculateWorkingDays(overlapStart, overlapEnd);
  }

  private getEmployeesOnVacation(date: Date): string[] {
    const approvedRequests = this.vacationService.approvedRequests();
    const employees: string[] = [];

    approvedRequests.forEach(req => {
      if (date >= req.startDate && date <= req.endDate) {
        employees.push(req.employeeId);
      }
    });

    return employees;
  }

  private getVacationsForDate(date: Date): any[] {
    const approvedRequests = this.vacationService.approvedRequests();
    return approvedRequests.filter(req => 
      date >= req.startDate && date <= req.endDate
    );
  }
}
