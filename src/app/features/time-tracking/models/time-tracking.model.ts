export enum WorkStatus {
  CLOCKED_OUT = 'CLOCKED_OUT',
  WORKING = 'WORKING',
  ON_BREAK = 'ON_BREAK'
}

/**
 * Work Session from API
 * Note: The API returns dates and numeric fields as strings which need conversion:
 * - Date fields (date, clockIn, clockOut, createdAt, updatedAt) are ISO 8601 strings
 * - totalHours is a decimal string (e.g., "0.03") or null for active sessions
 * The interface allows both string (API format) and native types (after conversion)
 */
export interface WorkSession {
  id: string;
  userId: string;
  companyId: string;
  /** ISO date string from API (e.g., "2025-12-10T00:00:00.000Z") or Date after conversion */
  date: Date | string;
  /** ISO timestamp string from API or Date after conversion */
  clockIn: Date | string;
  /** ISO timestamp string from API, Date after conversion, or null if not clocked out */
  clockOut: Date | string | null;
  status: WorkStatus;
  /** Decimal string from API (e.g., "0.03"), number after conversion, or null for active sessions */
  totalHours: number | string | null;
  notes: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  breaks?: Break[];
}

/**
 * Break within a work session
 * Note: API returns date fields as ISO 8601 strings
 */
export interface Break {
  id: string;
  workSessionId: string;
  /** ISO timestamp string from API or Date after conversion */
  startTime: Date | string;
  /** ISO timestamp string from API, Date after conversion, or null if still active */
  endTime: Date | string | null;
  /** Duration in minutes, calculated by API when break ends */
  durationMinutes: number | null;
  /** Optional timestamp from API */
  createdAt?: Date | string;
}

// Report interfaces
export interface DailySummary {
  date: string;
  totalMinutes: number;
  totalHours: number;
  sessions: WorkSession[];
}

export interface WeeklySummary {
  weekStart: string;
  weekEnd: string;
  totalMinutes: number;
  totalHours: number;
  dailySummaries: DailySummary[];
}

export interface MonthlySummary {
  month: number;
  year: number;
  totalMinutes: number;
  totalHours: number;
  weeklySummaries: WeeklySummary[];
}

// Legacy interfaces (kept for backward compatibility during transition)
export interface TimeEntry {
  id: string;
  date: string; // ISO date string
  clockIn?: Date;
  clockOut?: Date;
  breaks: BreakEntry[];
  totalHours: number;
  status: WorkStatus;
}

export interface BreakEntry {
  id: string;
  startTime: Date;
  endTime?: Date;
  duration?: number; // in minutes
}

export interface DailyTimeInfo {
  date: string;
  totalWorkedTime: number; // in minutes
  totalBreakTime: number; // in minutes
  currentSession?: {
    startTime: Date;
    elapsedTime: number; // in minutes
    isOnBreak: boolean;
    currentBreakStart?: Date;
  };
  status: WorkStatus;
}

// DTOs for API requests
export interface ClockInRequest {
  clockIn: string; // ISO 8601 date string
  notes?: string;
}

export interface ClockOutRequest {
  clockOut: string; // ISO 8601 date string
  notes?: string;
}

export interface StartBreakRequest {
  startTime: string; // ISO 8601 date string
}

export interface EndBreakRequest {
  endTime: string; // ISO 8601 date string
}

// Query parameters for filtering
export interface WorkSessionQueryParams {
  startDate?: string;
  endDate?: string;
  status?: WorkStatus;
  userId?: string;
  page?: number;
  limit?: number;
}

// Extended query parameters for timesheet history with advanced filtering
export interface TimesheetHistoryQueryParams {
  startDate?: string;
  endDate?: string;
  status?: WorkStatus | string; // Accept both enum and string for flexibility
  userId?: string;
  page?: number;
  limit?: number;
  minHours?: number;
  maxHours?: number;
  minBreakTime?: number;
  maxBreakTime?: number;
  searchNotes?: string;
  pageSize?: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}

// Paginated response from API
export interface PaginatedWorkSessionsResponse {
  sessions: WorkSession[];
  total: number;
  limit: number;
  offset: number;
}