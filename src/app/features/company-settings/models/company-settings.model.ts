/**
 * Company settings model and interfaces
 */

export interface CompanySettings {
  id: string;
  companyId: string;
  workingHours: WorkingHoursConfig;
  vacationPolicy: VacationPolicyConfig;
  breakPolicy: BreakPolicyConfig;
  timeTracking: TimeTrackingConfig;
  updatedAt?: Date;
  updatedBy?: string;
}

export interface WorkingHoursConfig {
  dailyHours: number;
  weeklyHours: number;
  workDays: WorkDay[];
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  timezone: string;
}

export interface VacationPolicyConfig {
  annualDaysAllowed: number;
  carryOverDays: number;
  requiresApproval: boolean;
  minAdvanceNoticeDays: number;
  maxConsecutiveDays: number;
}

export interface BreakPolicyConfig {
  minimumBreakMinutes: number;
  maximumBreakMinutes: number;
  paidBreak: boolean;
  automaticBreakDeduction: boolean;
  breakReminderEnabled: boolean;
}

export interface TimeTrackingConfig {
  requireGeoLocation: boolean;
  allowManualEntry: boolean;
  requirePhotos: boolean;
  gracePeriodMinutes: number;
  autoClockOutHours: number;
  requireNotes: boolean;
}

export enum WorkDay {
  MONDAY = 'Monday',
  TUESDAY = 'Tuesday',
  WEDNESDAY = 'Wednesday',
  THURSDAY = 'Thursday',
  FRIDAY = 'Friday',
  SATURDAY = 'Saturday',
  SUNDAY = 'Sunday'
}

export interface CompanySettingsFormData {
  workingHours: WorkingHoursConfig;
  vacationPolicy: VacationPolicyConfig;
  breakPolicy: BreakPolicyConfig;
  timeTracking: TimeTrackingConfig;
}

/**
 * Default company settings
 */
export const DEFAULT_COMPANY_SETTINGS: Omit<CompanySettings, 'id' | 'companyId'> = {
  workingHours: {
    dailyHours: 8,
    weeklyHours: 40,
    workDays: [
      WorkDay.MONDAY,
      WorkDay.TUESDAY,
      WorkDay.WEDNESDAY,
      WorkDay.THURSDAY,
      WorkDay.FRIDAY
    ],
    startTime: '09:00',
    endTime: '17:00',
    timezone: 'America/New_York'
  },
  vacationPolicy: {
    annualDaysAllowed: 15,
    carryOverDays: 5,
    requiresApproval: true,
    minAdvanceNoticeDays: 7,
    maxConsecutiveDays: 10
  },
  breakPolicy: {
    minimumBreakMinutes: 30,
    maximumBreakMinutes: 60,
    paidBreak: true,
    automaticBreakDeduction: false,
    breakReminderEnabled: true
  },
  timeTracking: {
    requireGeoLocation: false,
    allowManualEntry: true,
    requirePhotos: false,
    gracePeriodMinutes: 5,
    autoClockOutHours: 12,
    requireNotes: false
  }
};
