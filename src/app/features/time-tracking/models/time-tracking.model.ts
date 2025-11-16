export enum WorkStatus {
  CLOCKED_OUT = 'clocked_out',
  WORKING = 'working', 
  ON_BREAK = 'on_break'
}

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