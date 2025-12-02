/**
 * API types and DTOs for Time Tracking
 * These interfaces match the API controllers in chronos-api
 */

export interface ClockInDto {
  clockIn: string; // ISO date string
  project?: string;
  description?: string;
}

export interface ClockOutDto {
  clockOut: string; // ISO date string
  description?: string;
}

export interface StartBreakDto {
  startTime: string; // ISO date string
  type?: string;
}

export interface EndBreakDto {
  endTime: string; // ISO date string
}

export interface UpdateWorkSessionDto {
  clockIn?: string;
  clockOut?: string;
  project?: string;
  description?: string;
  breaks?: {
    id?: string;
    startTime: string;
    endTime?: string;
    type?: string;
  }[];
}

export interface ValidateWorkSessionDto {
  clockIn: string;
  clockOut?: string;
  excludeId?: string;
}

export interface FilterWorkSessionsDto {
  startDate?: string;
  endDate?: string;
  userId?: string;
  page?: number;
  limit?: number;
}

export interface TimeReportQueryDto {
  date?: string;
  year?: number;
  month?: number;
  week?: number;
}

// API Response Types
export interface IWorkSessionWithRelations {
  id: string;
  userId: string;
  clockIn: string;
  clockOut?: string;
  totalHours?: number;
  project?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  breaks?: IBreak[];
}

export interface IBreak {
  id: string;
  workSessionId: string;
  startTime: string;
  endTime?: string;
  duration?: number; // in minutes
  type?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkSessionsListResponseDto {
  sessions: IWorkSessionWithRelations[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ValidationResultDto {
  isValid: boolean;
  conflicts: ITimeConflict[];
  warnings: string[];
}

export interface ITimeConflict {
  id: string;
  clockIn: string;
  clockOut?: string;
  conflictType: 'overlap' | 'duplicate' | 'gap';
  message: string;
}

// Time Reports API Types
export interface IDailySummary {
  date: string;
  totalHours: number;
  totalBreakTime: number;
  sessions: IWorkSessionWithRelations[];
  isComplete: boolean;
}

export interface IWeeklySummary {
  year: number;
  week: number;
  totalHours: number;
  dailySummaries: IDailySummary[];
  expectedHours: number;
}

export interface IMonthlySummary {
  year: number;
  month: number;
  totalHours: number;
  weeklySummaries: IWeeklySummary[];
  expectedHours: number;
}