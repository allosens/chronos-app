import { Injectable, computed, effect, signal, PLATFORM_ID, inject, DestroyRef } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { TimeTrackingService } from './time-tracking.service';
import { BreakEntry } from '../models/time-tracking.model';
import { DateUtils } from '../../../shared/utils/date.utils';

export interface BreakNotification {
  type: 'warning' | 'info';
  message: string;
  timestamp: Date;
}

@Injectable({
  providedIn: 'root'
})
export class BreakManagementService {
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);
  private timeTrackingService = inject(TimeTrackingService);
  private destroyRef = inject(DestroyRef);

  // Notification settings
  private readonly LONG_BREAK_THRESHOLD_MINUTES = 15;
  private readonly NOTIFICATION_CHECK_INTERVAL = 60000; // Check every minute
  
  private notificationIntervalId: number | null = null;
  private notificationsSignal = signal<BreakNotification[]>([]);
  private sentNotificationMinutes = new Set<number>(); // Track sent notifications

  // Public readonly signals
  readonly notifications = this.notificationsSignal.asReadonly();

  // Computed signals for break information
  readonly currentBreak = computed((): BreakEntry | null => {
    const entry = this.timeTrackingService.currentTimeEntry();
    if (!entry || !this.timeTrackingService.isOnBreak()) return null;
    
    return entry.breaks.find(b => !b.endTime) ?? null;
  });

  readonly currentBreakDuration = computed((): number => {
    const currentBreak = this.currentBreak();
    if (!currentBreak) return 0;
    
    return DateUtils.getDurationSeconds(currentBreak.startTime);
  });

  readonly formattedBreakDuration = computed((): string => {
    return DateUtils.formatDuration(this.currentBreakDuration());
  });

  readonly todayBreaks = computed((): BreakEntry[] => {
    const breaks: BreakEntry[] = [];
    
    // Add breaks from completed sessions for today
    const todaySessions = this.timeTrackingService.todaySessions();
    todaySessions.forEach(session => {
      if (session.breaks) {
        session.breaks.forEach(apiBreak => {
          // Convert API break to BreakEntry
          breaks.push({
            id: apiBreak.id,
            startTime: typeof apiBreak.startTime === 'string' 
              ? new Date(apiBreak.startTime) 
              : apiBreak.startTime,
            endTime: apiBreak.endTime 
              ? (typeof apiBreak.endTime === 'string' ? new Date(apiBreak.endTime) : apiBreak.endTime)
              : undefined,
            duration: apiBreak.durationMinutes ?? undefined
          });
        });
      }
    });
    
    // Add breaks from current active entry (if any)
    const entry = this.timeTrackingService.currentTimeEntry();
    if (entry?.breaks) {
      breaks.push(...entry.breaks);
    }
    
    return breaks;
  });

  readonly completedBreaks = computed((): BreakEntry[] => {
    return this.todayBreaks().filter(b => b.endTime !== undefined);
  });

  readonly totalBreakTime = computed((): number => {
    return this.completedBreaks().reduce((total, b) => total + (b.duration ?? 0), 0);
  });

  readonly formattedTotalBreakTime = computed((): string => {
    return DateUtils.formatMinutesToHoursAndMinutes(this.totalBreakTime());
  });

  readonly hasLongBreak = computed((): boolean => {
    const durationMinutes = this.currentBreakDuration() / 60;
    return durationMinutes >= this.LONG_BREAK_THRESHOLD_MINUTES;
  });

  constructor() {
    // Register cleanup on destroy
    this.destroyRef.onDestroy(() => this.stopNotificationMonitoring());

    // Monitor break state and manage notifications
    effect(() => {
      if (this.timeTrackingService.isOnBreak()) {
        this.startNotificationMonitoring();
      } else {
        this.stopNotificationMonitoring();
        // Clear sent notifications tracker when break ends
        this.sentNotificationMinutes.clear();
      }
    });
  }

  /**
   * Starts a break with optional confirmation
   */
  async startBreak(skipConfirmation = false): Promise<boolean> {
    if (!this.canStartBreak()) {
      return false;
    }

    if (!skipConfirmation && this.isBrowser) {
      const confirmed = confirm('Start your break? The timer will pause while you\'re away.');
      if (!confirmed) return false;
    }

    try {
      await this.timeTrackingService.startBreak();
      this.addNotification('info', 'Break started. Take your time! ☕');
      return true;
    } catch (error) {
      console.error('Failed to start break:', error);
      return false;
    }
  }

  /**
   * Ends a break with optional confirmation
   */
  async endBreak(skipConfirmation = false): Promise<boolean> {
    if (!this.canEndBreak()) {
      return false;
    }

    if (!skipConfirmation && this.isBrowser) {
      const confirmed = confirm('End your break and resume work?');
      if (!confirmed) return false;
    }

    try {
      await this.timeTrackingService.endBreak();
      this.addNotification('info', 'Welcome back! Break ended. 💼');
      return true;
    } catch (error) {
      console.error('Failed to end break:', error);
      return false;
    }
  }

  /**
   * Validates if a break can be started
   */
  canStartBreak(): boolean {
    return this.timeTrackingService.isWorking();
  }

  /**
   * Validates if a break can be ended
   */
  canEndBreak(): boolean {
    return this.timeTrackingService.isOnBreak();
  }

  /**
   * Adds a notification to the notification queue
   */
  private addNotification(type: BreakNotification['type'], message: string): void {
    const notification: BreakNotification = {
      type,
      message,
      timestamp: new Date()
    };

    this.notificationsSignal.update(notifications => [...notifications, notification]);

    // Auto-remove notification after 5 seconds
    if (this.isBrowser) {
      setTimeout(() => {
        this.removeNotification(notification);
      }, 5000);
    }
  }

  /**
   * Removes a notification from the queue
   */
  removeNotification(notification: BreakNotification): void {
    this.notificationsSignal.update(notifications => 
      notifications.filter(n => n !== notification)
    );
  }

  /**
   * Clears all notifications
   */
  clearNotifications(): void {
    this.notificationsSignal.set([]);
  }

  /**
   * Starts monitoring for long breaks
   */
  private startNotificationMonitoring(): void {
    if (!this.isBrowser || this.notificationIntervalId) return;

    this.notificationIntervalId = window.setInterval(() => {
      this.checkBreakDuration();
    }, this.NOTIFICATION_CHECK_INTERVAL);
  }

  /**
   * Stops monitoring for long breaks
   */
  private stopNotificationMonitoring(): void {
    if (!this.isBrowser || !this.notificationIntervalId) return;

    clearInterval(this.notificationIntervalId);
    this.notificationIntervalId = null;
  }

  /**
   * Checks current break duration and sends notification if needed
   */
  private checkBreakDuration(): void {
    if (!this.hasLongBreak()) return;

    const durationMinutes = Math.floor(this.currentBreakDuration() / 60);
    
    // Send notification at specific intervals (15, 30, 45, 60 minutes)
    // Only send if we haven't already sent a notification for this exact minute
    if (durationMinutes % 15 === 0 && !this.sentNotificationMinutes.has(durationMinutes)) {
      this.sentNotificationMinutes.add(durationMinutes);
      this.addNotification(
        'warning',
        `You've been on break for ${durationMinutes} minutes. Consider resuming work! ⏰`
      );
    }
  }
}
