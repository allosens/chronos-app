/**
 * Vacation management models for admin operations
 */

import { VacationRequest, VacationRequestStatus } from './vacation-request.model';

/**
 * Filter options for vacation requests
 */
export interface VacationManagementFilters {
  employeeId?: string;
  status?: VacationRequestStatus;
  startDate?: Date;
  endDate?: Date;
}

/**
 * Vacation approval/rejection action
 */
export interface VacationApprovalAction {
  requestId: string;
  action: 'approve' | 'reject';
  reviewComments?: string;
  reviewedBy: string;
}

/**
 * Team availability information
 */
export interface TeamAvailability {
  date: Date;
  totalEmployees: number;
  availableEmployees: number;
  onVacation: string[]; // employee IDs
  availabilityPercentage: number;
}

/**
 * Vacation conflict information
 */
export interface VacationConflict {
  requestId: string;
  employeeId: string;
  employeeName: string;
  startDate: Date;
  endDate: Date;
  overlapDays: number;
}

/**
 * Employee vacation summary
 */
export interface EmployeeVacationSummary {
  employeeId: string;
  employeeName: string;
  totalDaysAllowed: number;
  daysUsed: number;
  daysPending: number;
  daysRemaining: number;
  approvedRequests: VacationRequest[];
  pendingRequests: VacationRequest[];
}

/**
 * Calendar day with vacation information
 */
export interface CalendarDay {
  date: Date;
  isWeekend: boolean;
  vacations: VacationRequest[];
  availability: number; // percentage of team available
}
