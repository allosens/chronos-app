/**
 * Model definitions for time correction requests
 */

export enum TimeCorrectionStatus {
  PENDING = 'Pendiente',
  APPROVED = 'Aprobada',
  REJECTED = 'Rechazada'
}

export interface TimeCorrectionRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  timeEntryId: string;
  originalDate: string; // ISO date string YYYY-MM-DD
  originalClockIn?: Date;
  originalClockOut?: Date;
  requestedClockIn?: Date;
  requestedClockOut?: Date;
  reason: string;
  status: TimeCorrectionStatus;
  createdAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
  reviewNotes?: string;
}

export interface TimeCorrectionFormData {
  timeEntryId: string;
  requestedClockIn?: string; // Time in HH:MM format
  requestedClockOut?: string; // Time in HH:MM format
  reason: string;
}

export interface TimeEntrySummary {
  id: string;
  date: string;
  clockIn?: Date;
  clockOut?: Date;
  displayText: string;
}
