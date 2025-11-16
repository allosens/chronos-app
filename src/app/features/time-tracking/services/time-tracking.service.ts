import { Injectable, signal, computed, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { WorkStatus, TimeEntry, DailyTimeInfo, BreakEntry } from '../models/time-tracking.model';
import { DateUtils } from '../../../shared/utils/date.utils';

@Injectable({
  providedIn: 'root'
})
export class TimeTrackingService {
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);

  // Signals for reactive state management
  private currentTimeEntrySignal = signal<TimeEntry | null>(null);
  private timerIntervalId: number | null = null;
  private elapsedTimeSignal = signal<number>(0); // in seconds

  // Public readonly signals
  readonly currentTimeEntry = this.currentTimeEntrySignal.asReadonly();
  readonly elapsedTime = this.elapsedTimeSignal.asReadonly();

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
    
    if (!entry || entry.date !== today) {
      return {
        date: today,
        totalWorkedTime: 0,
        totalBreakTime: 0,
        status: WorkStatus.CLOCKED_OUT
      };
    }

    const totalBreakTime = entry.breaks.reduce((total, breakEntry) => {
      if (breakEntry.endTime) {
        return total + Math.floor((breakEntry.endTime.getTime() - breakEntry.startTime.getTime()) / 60000);
      }
      return total;
    }, 0);

    let currentSession;
    if (entry.clockIn && !entry.clockOut) {
      currentSession = {
        startTime: entry.clockIn,
        elapsedTime: Math.floor(this.elapsedTime() / 60), // convert to minutes
        isOnBreak: this.isOnBreak(),
        currentBreakStart: this.getCurrentBreakStart()
      };
    }

    return {
      date: today,
      totalWorkedTime: Math.floor(this.elapsedTime() / 60), // convert to minutes
      totalBreakTime: totalBreakTime,
      currentSession,
      status: entry.status
    };
  });

  constructor() {
    // Load saved state from localStorage
    this.loadSavedState();
  }

  clockIn(): void {
    const today = DateUtils.getTodayString();
    const now = new Date();

    const newEntry: TimeEntry = {
      id: this.generateId(),
      date: today,
      clockIn: now,
      breaks: [],
      totalHours: 0,
      status: WorkStatus.WORKING
    };

    this.currentTimeEntrySignal.set(newEntry);
    this.startTimer();
    this.saveState();
  }

  clockOut(): void {
    const currentEntry = this.currentTimeEntrySignal();
    if (!currentEntry || !currentEntry.clockIn) return;

    // End current break if on break
    if (this.isOnBreak()) {
      this.endBreak();
    }

    const now = new Date();
    const totalHours = (now.getTime() - currentEntry.clockIn.getTime()) / (1000 * 60 * 60);

    const updatedEntry: TimeEntry = {
      ...currentEntry,
      clockOut: now,
      totalHours,
      status: WorkStatus.CLOCKED_OUT
    };

    this.currentTimeEntrySignal.set(updatedEntry);
    this.stopTimer();
    this.saveState();
  }

  startBreak(): void {
    const currentEntry = this.currentTimeEntrySignal();
    if (!currentEntry || currentEntry.status !== WorkStatus.WORKING) return;

    const breakEntry: BreakEntry = {
      id: this.generateId(),
      startTime: new Date()
    };

    const updatedEntry: TimeEntry = {
      ...currentEntry,
      breaks: [...currentEntry.breaks, breakEntry],
      status: WorkStatus.ON_BREAK
    };

    this.currentTimeEntrySignal.set(updatedEntry);
    this.saveState();
  }

  endBreak(): void {
    const currentEntry = this.currentTimeEntrySignal();
    if (!currentEntry || currentEntry.status !== WorkStatus.ON_BREAK) return;

    const currentBreakIndex = currentEntry.breaks.findIndex(b => !b.endTime);
    if (currentBreakIndex === -1) return;

    const now = new Date();
    const updatedBreaks = [...currentEntry.breaks];
    const currentBreak = updatedBreaks[currentBreakIndex];
    
    updatedBreaks[currentBreakIndex] = {
      ...currentBreak,
      endTime: now,
      duration: (now.getTime() - currentBreak.startTime.getTime()) / 60000 // in minutes
    };

    const updatedEntry: TimeEntry = {
      ...currentEntry,
      breaks: updatedBreaks,
      status: WorkStatus.WORKING
    };

    this.currentTimeEntrySignal.set(updatedEntry);
    this.updateElapsedTime(); // Update timer immediately
    this.saveState();
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

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private saveState(): void {
    if (!this.isBrowser) return;
    
    const currentEntry = this.currentTimeEntrySignal();
    if (currentEntry) {
      localStorage.setItem('chronos-current-entry', JSON.stringify({
        ...currentEntry,
        clockIn: currentEntry.clockIn?.toISOString(),
        clockOut: currentEntry.clockOut?.toISOString(),
        breaks: currentEntry.breaks.map(b => ({
          ...b,
          startTime: b.startTime.toISOString(),
          endTime: b.endTime?.toISOString()
        }))
      }));
    }
  }

  private loadSavedState(): void {
    if (!this.isBrowser) return;
    
    const saved = localStorage.getItem('chronos-current-entry');
    if (!saved) return;

    try {
      const parsed = JSON.parse(saved);
      const today = new Date().toISOString().split('T')[0];
      
      // Only load if it's from today
      if (parsed.date === today) {
        const entry: TimeEntry = {
          ...parsed,
          clockIn: parsed.clockIn ? new Date(parsed.clockIn) : undefined,
          clockOut: parsed.clockOut ? new Date(parsed.clockOut) : undefined,
          breaks: parsed.breaks.map((b: any) => ({
            ...b,
            startTime: new Date(b.startTime),
            endTime: b.endTime ? new Date(b.endTime) : undefined
          }))
        };

        this.currentTimeEntrySignal.set(entry);
        
        // Resume timer if working or on break
        if ((entry.status === WorkStatus.WORKING || entry.status === WorkStatus.ON_BREAK) && !entry.clockOut) {
          this.startTimer();
        }
      }
    } catch (error) {
      console.error('Error loading saved state:', error);
      if (this.isBrowser) {
        localStorage.removeItem('chronos-current-entry');
      }
    }
  }
}