/**
 * Vacation request models and types
 */

export enum VacationRequestType {
  VACATION = 'VACATION',
  PERSONAL = 'PERSONAL',
  SICK_LEAVE = 'SICK_LEAVE',
  OTHER = 'OTHER'
}

export enum VacationRequestStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  DENIED = 'DENIED',
  CANCELLED = 'CANCELLED'
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
