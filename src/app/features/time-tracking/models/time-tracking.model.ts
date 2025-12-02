export enum WorkStatus {
  CLOCKED_OUT = 'CLOCKED_OUT',
  WORKING = 'WORKING',
  ON_BREAK = 'ON_BREAK'
}

// New API-compatible interfaces
export interface WorkSession {
  id: string;
  userId: string;
  companyId: string;
  date: Date;
  clockIn: Date;
  clockOut: Date | null;
  status: WorkStatus;
  totalHours: number | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  breaks?: Break[];
}

export interface Break {
  id: string;
  workSessionId: string;
  startTime: Date;
  endTime: Date | null;
  durationMinutes: number | null;
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
  notes?: string;
}

export interface ClockOutRequest {
  notes?: string;
}

export interface StartBreakRequest {
  // No fields required for now
}

export interface EndBreakRequest {
  // No fields required for now
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