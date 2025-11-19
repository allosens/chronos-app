/**
 * Vacation request models and types
 */

export enum VacationRequestType {
  VACATION = 'vacation',
  PERSONAL_DAY = 'personal_day',
  SICK_LEAVE = 'sick_leave',
  COMPENSATORY_TIME = 'compensatory_time',
  OTHER = 'other'
}

export enum VacationRequestStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled'
}

export interface VacationRequest {
  id: string;
  employeeId: string;
  employeeName?: string;
  type: VacationRequestType;
  startDate: Date;
  endDate: Date;
  totalDays: number;
  comments?: string;
  status: VacationRequestStatus;
  requestedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
  reviewComments?: string;
}

export interface VacationRequestFormData {
  type: VacationRequestType;
  startDate: string; // ISO date string for form input
  endDate: string; // ISO date string for form input
  comments?: string;
}

export interface VacationBalance {
  totalVacationDays: number;
  usedVacationDays: number;
  remainingVacationDays: number;
  pendingVacationDays: number;
}
