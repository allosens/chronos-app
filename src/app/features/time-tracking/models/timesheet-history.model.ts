/**
 * Represents a single timesheet entry in the history
 */
export interface TimesheetEntry {
  id: string;
  date: string; // YYYY-MM-DD format
  clockIn?: Date;
  clockOut?: Date;
  totalHours: number;
  totalBreakTime: number; // in minutes
  breaks: BreakPeriod[];
  status: TimesheetStatus;
}

/**
 * Represents a break period within a timesheet entry
 */
export interface BreakPeriod {
  id: string;
  startTime: Date;
  endTime?: Date;
  duration: number; // in minutes
}

/**
 * Status of a timesheet entry
 */
export enum TimesheetStatus {
  COMPLETE = 'complete',
  INCOMPLETE = 'incomplete',
  IN_PROGRESS = 'in_progress',
  ERROR = 'error'
}

/**
 * Filters for timesheet history
 */
export interface HistoryFilters {
  startDate?: string; // YYYY-MM-DD format
  endDate?: string; // YYYY-MM-DD format
  status?: TimesheetStatus;
}

/**
 * Pagination configuration
 */
export interface PaginationConfig {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

/**
 * Sort configuration
 */
export interface SortConfig {
  field: SortField;
  direction: SortDirection;
}

export type SortField = 'date' | 'clockIn' | 'clockOut' | 'totalHours';
export type SortDirection = 'asc' | 'desc';

/**
 * Weekly summary data
 */
export interface WeeklySummary {
  weekNumber: number;
  startDate: string;
  endDate: string;
  totalHours: number;
  totalBreakTime: number;
  daysWorked: number;
  averageHoursPerDay: number;
}

/**
 * Monthly summary data
 */
export interface MonthlySummary {
  month: number;
  year: number;
  totalHours: number;
  totalBreakTime: number;
  daysWorked: number;
  averageHoursPerDay: number;
  expectedHours: number;
}
