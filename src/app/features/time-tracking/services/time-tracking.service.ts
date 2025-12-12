import { Injectable, signal, computed, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { WorkStatus, TimeEntry, DailyTimeInfo, WorkSession } from '../models/time-tracking.model';
import { DateUtils } from '../../../shared/utils/date.utils';
import { TimeTrackingApiService } from './time-tracking-api.service';

@Injectable({
  providedIn: 'root'
})
export class TimeTrackingService {
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);
  private apiService = inject(TimeTrackingApiService);

  // Signals for reactive state management
  private currentTimeEntrySignal = signal<TimeEntry | null>(null);
  private todaySessionsSignal = signal<WorkSession[]>([]); // Store all sessions for today
  private timerIntervalId: number | null = null;
  private elapsedTimeSignal = signal<number>(0); // in seconds
  private errorSignal = signal<string | null>(null);
  private loadingSignal = signal<boolean>(false);

  // Public readonly signals
  readonly currentTimeEntry = this.currentTimeEntrySignal.asReadonly();
  readonly todaySessions = this.todaySessionsSignal.asReadonly(); // Expose today's sessions
  readonly elapsedTime = this.elapsedTimeSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();
  readonly isLoading = this.loadingSignal.asReadonly();

  // Computed signals
  readonly currentStatus = computed(() => 
    this.currentTimeEntrySignal()?.status ?? WorkStatus.CLOCKED_OUT
  );

  readonly isWorking = computed(() => 
    this.currentStatus() === WorkStatus.WORKING
  );

  readonly isOnBreak = computed(() => 
    this.currentStatus() === WorkStatus.ON_BREAK
  );

  readonly isClockedOut = computed(() => 
    this.currentStatus() === WorkStatus.CLOCKED_OUT
  );

  readonly formattedElapsedTime = computed(() => 
    DateUtils.formatDuration(this.elapsedTime(), true) // Force hours display
  );

  readonly dailyInfo = computed((): DailyTimeInfo => {
    const entry = this.currentTimeEntrySignal();
    const today = DateUtils.getTodayString();
    const todaySessions = this.todaySessionsSignal();
    
    // Force recomputation when elapsed time changes (updates every second)
    const _elapsed = this.elapsedTime();
    
    // If no active entry and no sessions for today, return empty state
    if (!entry && todaySessions.length === 0) {
      return {
        date: today,
        totalWorkedTime: 0,
        totalBreakTime: 0,
        status: WorkStatus.CLOCKED_OUT
      };
    }

    // Calculate totals from completed sessions
    let totalWorkedMinutes = 0;
    let totalBreakMinutes = 0;

    // Add completed sessions for today
    // Note: totalHours is null for active sessions and only calculated when clocked out
    todaySessions.forEach(session => {
      if (session.totalHours) {
        // Handle both string and number types from API
        const hours = typeof session.totalHours === 'string' 
          ? parseFloat(session.totalHours) 
          : session.totalHours;
        totalWorkedMinutes += hours * 60;
      }
      // Add completed breaks from this session
      if (session.breaks) {
        session.breaks.forEach(b => {
          if (b.durationMinutes) {
            totalBreakMinutes += b.durationMinutes;
          }
        });
      }
    });

    // If there's a current active entry, add its time
    if (entry && entry.date === today) {
      // Add current working time
      totalWorkedMinutes += Math.floor(_elapsed / 60);

      // Calculate completed break time from current entry
      const completedBreakTime = entry.breaks.reduce((total, breakEntry) => {
        if (breakEntry.endTime) {
          return total + Math.floor((breakEntry.endTime.getTime() - breakEntry.startTime.getTime()) / 60000);
        }
        return total;
      }, 0);

      // Add current ongoing break time if on break
      let currentBreakTime = 0;
      if (this.isOnBreak()) {
        const currentBreakStart = this.getCurrentBreakStart();
        if (currentBreakStart) {
          const now = new Date();
          currentBreakTime = Math.floor((now.getTime() - currentBreakStart.getTime()) / 60000);
        }
      }

      totalBreakMinutes += completedBreakTime + currentBreakTime;

      // Set current session info
      const currentSession = entry.clockIn && !entry.clockOut ? {
        startTime: entry.clockIn,
        elapsedTime: Math.floor(_elapsed / 60), // convert to minutes
        isOnBreak: this.isOnBreak(),
        currentBreakStart: this.getCurrentBreakStart()
      } : undefined;

      return {
        date: today,
        totalWorkedTime: totalWorkedMinutes,
        totalBreakTime: totalBreakMinutes,
        currentSession,
        status: entry.status
      };
    }

    // No active entry, just return totals from completed sessions
    return {
      date: today,
      totalWorkedTime: totalWorkedMinutes,
      totalBreakTime: totalBreakMinutes,
      status: WorkStatus.CLOCKED_OUT
    };
  });

  constructor() {
    // Load active session from API
    this.loadActiveSession();
  }

  /**
   * Load active session and today's completed sessions from API
   */
  private async loadActiveSession(): Promise<void> {
    if (!this.isBrowser) return;

    try {
      this.loadingSignal.set(true);
      
      // Load active session
      const activeSession = await this.apiService.getActiveSession();
      
      if (activeSession) {
        const entry = this.convertWorkSessionToTimeEntry(activeSession);
        this.currentTimeEntrySignal.set(entry);
        
        // Start timer if working or on break
        if (entry.status === WorkStatus.WORKING || entry.status === WorkStatus.ON_BREAK) {
          this.startTimer();
        }
      }

      // Load today's completed sessions for the summary
      await this.loadTodaySessions();
    } catch (error) {
      console.error('Error loading active session:', error);
      // Try to load today's sessions even if active session fails
      try {
        await this.loadTodaySessions();
      } catch (sessionsError) {
        console.error('Error loading today sessions:', sessionsError);
      }
    } finally {
      this.loadingSignal.set(false);
    }
  }

  /**
   * Load all work sessions for today
   */
  private async loadTodaySessions(): Promise<void> {
    if (!this.isBrowser) return;

    try {
      const today = DateUtils.getTodayString();
      const sessions = await this.apiService.listSessions({
        startDate: today,
        endDate: today
      });
      
      // Filter to only clocked out sessions (completed ones)
      const completedSessions = sessions.filter(s => s.status === WorkStatus.CLOCKED_OUT);
      this.todaySessionsSignal.set(completedSessions);
    } catch (error) {
      console.error('Error loading today sessions:', error);
      // Don't throw - just log the error
    }
  }

  /**
   * Clock in - starts a new work session via API
   */
  async clockIn(): Promise<void> {
    try {
      this.loadingSignal.set(true);
      this.errorSignal.set(null);

      const now = new Date();
      const session = await this.apiService.clockIn({
        clockIn: now.toISOString()
      });
      const entry = this.convertWorkSessionToTimeEntry(session);
      
      this.currentTimeEntrySignal.set(entry);
      this.startTimer();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to clock in';
      this.errorSignal.set(errorMessage);
      console.error('Clock in error:', error);
      throw error;
    } finally {
      this.loadingSignal.set(false);
    }
  }

  /**
   * Clock out - ends the current work session via API
   */
  async clockOut(): Promise<void> {
    const currentEntry = this.currentTimeEntrySignal();
    if (!currentEntry || !currentEntry.clockIn) return;
    
    // Prevent multiple simultaneous clock-out requests
    if (this.loadingSignal()) return;

    try {
      this.loadingSignal.set(true);
      this.errorSignal.set(null);

      // End current break if on break
      if (this.isOnBreak()) {
        await this.endBreak();
      }

      const now = new Date();
      await this.apiService.clockOut(currentEntry.id, {
        clockOut: now.toISOString()
      });

      // Clear the current session after clocking out so user can clock in again
      this.currentTimeEntrySignal.set(null);
      this.stopTimer();

      // Reload today's sessions to show the completed session in the summary
      await this.loadTodaySessions();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to clock out';
      this.errorSignal.set(errorMessage);
      console.error('Clock out error:', error);
      throw error;
    } finally {
      this.loadingSignal.set(false);
    }
  }

  /**
   * Start a break via API
   */
  async startBreak(): Promise<void> {
    const currentEntry = this.currentTimeEntrySignal();
    if (!currentEntry || currentEntry.status !== WorkStatus.WORKING) return;

    try {
      this.loadingSignal.set(true);
      this.errorSignal.set(null);

      const now = new Date();
      const session = await this.apiService.startBreak(currentEntry.id, {
        startTime: now.toISOString()
      });
      const entry = this.convertWorkSessionToTimeEntry(session);
      
      this.currentTimeEntrySignal.set(entry);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to start break';
      this.errorSignal.set(errorMessage);
      console.error('Start break error:', error);
      throw error;
    } finally {
      this.loadingSignal.set(false);
    }
  }

  /**
   * End the current break via API
   */
  async endBreak(): Promise<void> {
    const currentEntry = this.currentTimeEntrySignal();
    if (!currentEntry || currentEntry.status !== WorkStatus.ON_BREAK) return;

    try {
      this.loadingSignal.set(true);
      this.errorSignal.set(null);

      const now = new Date();
      const session = await this.apiService.endBreak(currentEntry.id, {
        endTime: now.toISOString()
      });
      const entry = this.convertWorkSessionToTimeEntry(session);
      
      this.currentTimeEntrySignal.set(entry);
      this.updateElapsedTime(); // Update timer immediately
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to end break';
      this.errorSignal.set(errorMessage);
      console.error('End break error:', error);
      throw error;
    } finally {
      this.loadingSignal.set(false);
    }
  }

  /**
   * Helper to convert date or string to Date object
   */
  private convertToDate(value: Date | string): Date {
    return typeof value === 'string' ? new Date(value) : value;
  }

  /**
   * Helper to parse numeric value that may be string or number
   */
  private parseNumericValue(value: number | string | null): number {
    if (value === null) return 0;
    return typeof value === 'string' ? parseFloat(value) : value;
  }

  /**
   * Convert WorkSession from API to TimeEntry for backward compatibility
   * API returns dates as ISO 8601 strings, need to convert to Date objects
   * API returns totalHours as string, need to convert to number
   */
  private convertWorkSessionToTimeEntry(session: WorkSession): TimeEntry {
    // Extract just the date part (YYYY-MM-DD) from the ISO string for comparison
    const dateString = typeof session.date === 'string' 
      ? session.date.split('T')[0]
      : session.date.toISOString().split('T')[0];
    
    return {
      id: session.id,
      date: dateString,
      clockIn: this.convertToDate(session.clockIn),
      clockOut: session.clockOut ? this.convertToDate(session.clockOut) : undefined,
      breaks: (session.breaks || []).map(b => ({
        id: b.id,
        startTime: this.convertToDate(b.startTime),
        endTime: b.endTime ? this.convertToDate(b.endTime) : undefined,
        duration: b.durationMinutes ?? undefined,
      })),
      totalHours: this.parseNumericValue(session.totalHours),
      status: session.status,
    };
  }

  /**
   * Clear any errors
   */
  clearError(): void {
    this.errorSignal.set(null);
  }

  private startTimer(): void {
    if (!this.isBrowser) return;
    if (this.timerIntervalId) return;

    const startTime = this.currentTimeEntrySignal()?.clockIn;
    if (!startTime) return;

    // Update immediately
    this.updateElapsedTime();

    this.timerIntervalId = window.setInterval(() => {
      this.updateElapsedTime();
    }, 1000);
  }

  private updateElapsedTime(): void {
    const currentEntry = this.currentTimeEntrySignal();
    if (!currentEntry?.clockIn) return;

    const now = new Date();
    const totalElapsed = Math.floor((now.getTime() - currentEntry.clockIn.getTime()) / 1000);
    
    // Calculate total break time in seconds
    const totalBreakTimeSeconds = this.getTotalBreakTime() * 60;
    
    // If currently on break, add the current break time
    let currentBreakTime = 0;
    if (this.isOnBreak()) {
      const currentBreakStart = this.getCurrentBreakStart();
      if (currentBreakStart) {
        currentBreakTime = Math.floor((now.getTime() - currentBreakStart.getTime()) / 1000);
      }
    }
    
    const workingTime = Math.max(0, totalElapsed - totalBreakTimeSeconds - currentBreakTime);
    this.elapsedTimeSignal.set(workingTime);
  }

  private stopTimer(): void {
    if (!this.isBrowser) return;
    if (this.timerIntervalId) {
      clearInterval(this.timerIntervalId);
      this.timerIntervalId = null;
    }
    this.elapsedTimeSignal.set(0);
  }

  private getTotalBreakTime(): number {
    const currentEntry = this.currentTimeEntrySignal();
    if (!currentEntry) return 0;

    return currentEntry.breaks.reduce((total, breakEntry) => {
      if (breakEntry.endTime) {
        return total + (breakEntry.endTime.getTime() - breakEntry.startTime.getTime()) / 60000;
      }
      return total;
    }, 0);
  }

  private getCurrentBreakStart(): Date | undefined {
    const currentEntry = this.currentTimeEntrySignal();
    if (!currentEntry || !this.isOnBreak()) return undefined;

    const currentBreak = currentEntry.breaks.find(b => !b.endTime);
    return currentBreak?.startTime;
  }
}