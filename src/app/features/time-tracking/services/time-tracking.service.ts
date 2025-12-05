import { Injectable, signal, computed, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { WorkStatus, TimeEntry, DailyTimeInfo, BreakEntry, WorkSession } from '../models/time-tracking.model';
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
  private timerIntervalId: number | null = null;
  private elapsedTimeSignal = signal<number>(0); // in seconds
  private errorSignal = signal<string | null>(null);
  private loadingSignal = signal<boolean>(false);

  // Public readonly signals
  readonly currentTimeEntry = this.currentTimeEntrySignal.asReadonly();
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
    
    // Force recomputation when elapsed time changes (updates every second)
    const _elapsed = this.elapsedTime();
    
    if (!entry || entry.date !== today) {
      return {
        date: today,
        totalWorkedTime: 0,
        totalBreakTime: 0,
        status: WorkStatus.CLOCKED_OUT
      };
    }

    // Calculate completed break time
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

    const totalBreakTime = completedBreakTime + currentBreakTime;

    let currentSession;
    if (entry.clockIn && !entry.clockOut) {
      currentSession = {
        startTime: entry.clockIn,
        elapsedTime: Math.floor(_elapsed / 60), // convert to minutes
        isOnBreak: this.isOnBreak(),
        currentBreakStart: this.getCurrentBreakStart()
      };
    }

    return {
      date: today,
      totalWorkedTime: Math.floor(_elapsed / 60), // convert to minutes
      totalBreakTime: totalBreakTime,
      currentSession,
      status: entry.status
    };
  });

  constructor() {
    // Load active session from API
    this.loadActiveSession();
  }

  /**
   * Load active session from API
   */
  private async loadActiveSession(): Promise<void> {
    if (!this.isBrowser) return;

    try {
      this.loadingSignal.set(true);
      const activeSession = await this.apiService.getActiveSession();
      
      if (activeSession) {
        const entry = this.convertWorkSessionToTimeEntry(activeSession);
        this.currentTimeEntrySignal.set(entry);
        
        // Start timer if working or on break
        if (entry.status === WorkStatus.WORKING || entry.status === WorkStatus.ON_BREAK) {
          this.startTimer();
        }
      }
    } catch (error) {
      console.error('Error loading active session:', error);
      // Don't set error for initial load failure - user might just not have a session
    } finally {
      this.loadingSignal.set(false);
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

    try {
      this.loadingSignal.set(true);
      this.errorSignal.set(null);

      // End current break if on break
      if (this.isOnBreak()) {
        await this.endBreak();
      }

      const now = new Date();
      const session = await this.apiService.clockOut(currentEntry.id, {
        clockOut: now.toISOString()
      });
      const entry = this.convertWorkSessionToTimeEntry(session);

      this.currentTimeEntrySignal.set(entry);
      this.stopTimer();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to clock out';
      this.errorSignal.set(errorMessage);
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
      throw error;
    } finally {
      this.loadingSignal.set(false);
    }
  }

  /**
   * Convert WorkSession from API to TimeEntry for backward compatibility
   * API returns dates as ISO 8601 strings, need to convert to Date objects
   */
  private convertWorkSessionToTimeEntry(session: WorkSession): TimeEntry {
    return {
      id: session.id,
      date: typeof session.date === 'string' ? session.date : session.date.toISOString().split('T')[0],
      clockIn: typeof session.clockIn === 'string' ? new Date(session.clockIn) : session.clockIn,
      clockOut: session.clockOut ? (typeof session.clockOut === 'string' ? new Date(session.clockOut) : session.clockOut) : undefined,
      breaks: (session.breaks || []).map(b => ({
        id: b.id,
        startTime: typeof b.startTime === 'string' ? new Date(b.startTime) : b.startTime,
        endTime: b.endTime ? (typeof b.endTime === 'string' ? new Date(b.endTime) : b.endTime) : undefined,
        duration: b.durationMinutes ?? undefined,
      })),
      totalHours: session.totalHours ?? 0,
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