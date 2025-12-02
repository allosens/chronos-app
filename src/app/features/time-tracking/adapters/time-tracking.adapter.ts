import { TimeEntry, BreakEntry, WorkStatus, DailyTimeInfo } from '../models/time-tracking.model';
import {
  IWorkSessionWithRelations,
  IBreak,
  ClockInDto,
  ClockOutDto,
  UpdateWorkSessionDto,
  IDailySummary,
  FilterWorkSessionsDto
} from '../models/time-tracking-api.types';

/**
 * Adapter class to transform data between API and local models
 */
export class TimeTrackingAdapter {
  
  /**
   * Transform API work session to local TimeEntry model
   */
  static apiToLocal(session: IWorkSessionWithRelations): TimeEntry {
    const breaks = session.breaks?.map(this.apiBreakToLocal) || [];
    const status = this.determineWorkStatus(session);
    
    return {
      id: session.id,
      date: new Date(session.clockIn).toISOString().split('T')[0],
      clockIn: new Date(session.clockIn),
      clockOut: session.clockOut ? new Date(session.clockOut) : undefined,
      breaks,
      totalHours: session.totalHours || 0,
      status
    };
  }

  /**
   * Transform local TimeEntry to API UpdateWorkSessionDto
   */
  static localToUpdateDto(entry: TimeEntry): UpdateWorkSessionDto {
    return {
      clockIn: entry.clockIn?.toISOString(),
      clockOut: entry.clockOut?.toISOString(),
      description: entry.description,
      breaks: entry.breaks.map(breakEntry => ({
        id: breakEntry.id,
        startTime: breakEntry.startTime.toISOString(),
        endTime: breakEntry.endTime?.toISOString(),
        type: breakEntry.type
      }))
    };
  }

  /**
   * Create ClockInDto from current time
   */
  static createClockInDto(project?: string, description?: string): ClockInDto {
    return {
      clockIn: new Date().toISOString(),
      project,
      description
    };
  }

  /**
   * Create ClockOutDto from current time
   */
  static createClockOutDto(description?: string): ClockOutDto {
    return {
      clockOut: new Date().toISOString(),
      description
    };
  }

  /**
   * Transform API break to local BreakEntry
   */
  private static apiBreakToLocal(apiBreak: IBreak): BreakEntry {
    return {
      id: apiBreak.id,
      startTime: new Date(apiBreak.startTime),
      endTime: apiBreak.endTime ? new Date(apiBreak.endTime) : undefined,
      duration: apiBreak.duration,
      type: apiBreak.type
    };
  }

  /**
   * Determine WorkStatus from API session data
   */
  private static determineWorkStatus(session: IWorkSessionWithRelations): WorkStatus {
    // If session is clocked out
    if (session.clockOut) {
      return WorkStatus.CLOCKED_OUT;
    }

    // Check if currently on break (has an active break)
    const activeBreak = session.breaks?.find(b => !b.endTime);
    if (activeBreak) {
      return WorkStatus.ON_BREAK;
    }

    // Otherwise, working
    return WorkStatus.WORKING;
  }

  /**
   * Transform API daily summary to DailyTimeInfo
   */
  static dailySummaryToTimeInfo(summary: IDailySummary): DailyTimeInfo {
    const activeSession = summary.sessions.find(s => !s.clockOut);
    
    return {
      date: summary.date,
      totalWorkedTime: Math.round(summary.totalHours * 60), // Convert to minutes
      totalBreakTime: summary.totalBreakTime,
      currentSession: activeSession ? {
        startTime: new Date(activeSession.clockIn),
        elapsedTime: this.calculateElapsedMinutes(activeSession.clockIn),
        isOnBreak: !!activeSession.breaks?.find(b => !b.endTime),
        currentBreakStart: activeSession.breaks?.find(b => !b.endTime)?.startTime 
          ? new Date(activeSession.breaks.find(b => !b.endTime)!.startTime)
          : undefined
      } : undefined,
      status: activeSession ? this.determineWorkStatus(activeSession) : WorkStatus.CLOCKED_OUT
    };
  }

  /**
   * Transform local filters to API FilterWorkSessionsDto
   */
  static filtersToApi(startDate?: Date, endDate?: Date, page = 1, limit = 50): FilterWorkSessionsDto {
    return {
      startDate: startDate?.toISOString(),
      endDate: endDate?.toISOString(),
      page,
      limit
    };
  }

  /**
   * Calculate elapsed time in minutes from a start time
   */
  private static calculateElapsedMinutes(startTime: string): number {
    const start = new Date(startTime);
    const now = new Date();
    return Math.floor((now.getTime() - start.getTime()) / (1000 * 60));
  }
}