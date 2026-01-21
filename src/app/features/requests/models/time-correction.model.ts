/**
 * Model definitions for time correction requests
 * Aligned with backend API schema
 */

export enum TimeCorrectionStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  DENIED = 'DENIED',
  CANCELLED = 'CANCELLED'
}

/**
 * Time Correction Request from API
 * Note: The API returns dates as ISO 8601 strings which may need conversion:
 * - originalClockIn, originalClockOut, requestedClockIn, requestedClockOut are ISO timestamps
 * - createdAt, reviewedAt are ISO timestamps
 * The interface allows both string (API format) and native Date types (after conversion)
 */
export interface TimeCorrectionRequest {
  id: string;
  userId: string;
  companyId: string;
  workSessionId: string;
  
  // Original values (for audit trail)
  originalClockIn?: Date | string | null;
  originalClockOut?: Date | string | null;
  
  // Requested changes
  requestedClockIn?: Date | string | null;
  requestedClockOut?: Date | string | null;
  
  reason: string;
  status: TimeCorrectionStatus;
  
  createdAt: Date | string;
  reviewedAt?: Date | string | null;
  reviewedBy?: string | null;
  reviewNotes?: string | null;
  
  // Optional user details (may be populated by API with joins)
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
}

/**
 * Form data for creating/updating time correction requests
 */
export interface TimeCorrectionFormData {
  workSessionId: string;
  requestedClockIn?: string; // Time in HH:MM format or ISO timestamp
  requestedClockInDate?: string; // Date in YYYY-MM-DD format (optional, defaults to session date)
  requestedClockOut?: string; // Time in HH:MM format or ISO timestamp
  requestedClockOutDate?: string; // Date in YYYY-MM-DD format (optional, defaults to session date)
  reason: string;
}

/**
 * DTO for creating a time correction request via API
 */
export interface CreateTimeCorrectionRequest {
  workSessionId: string;
  requestedClockIn?: string | null; // ISO timestamp
  requestedClockOut?: string | null; // ISO timestamp
  reason: string;
}

/**
 * DTO for updating a time correction request via API
 */
export interface UpdateTimeCorrectionRequest {
  requestedClockIn?: string | null; // ISO timestamp
  requestedClockOut?: string | null; // ISO timestamp
  reason?: string;
  status?: TimeCorrectionStatus;
  reviewNotes?: string;
}

/**
 * Query parameters for filtering time correction requests
 */
export interface TimeCorrectionQueryParams {
  userId?: string;
  workSessionId?: string;
  status?: TimeCorrectionStatus;
  startDate?: string; // ISO date
  endDate?: string; // ISO date
  limit?: number;
  offset?: number;
}

/**
 * Summary of work session for dropdown selection
 */
export interface WorkSessionSummary {
  id: string;
  date: string;
  clockIn?: Date;
  clockOut?: Date;
  displayText: string;
}

/**
 * Legacy interface - kept for backward compatibility during migration
 * @deprecated Use WorkSessionSummary instead
 */
export interface TimeEntrySummary {
  id: string;
  date: string;
  clockIn?: Date;
  clockOut?: Date;
  displayText: string;
}
