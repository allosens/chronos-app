import { Component, computed, inject, effect, signal, PLATFORM_ID, DestroyRef } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CommonModule } from '@angular/common';
import { TimeTrackingService } from '../../services/time-tracking.service';
import { BreakManagementService } from '../../services/break-management.service';
import { WorkStatus } from '../../models/time-tracking.model';
import { DateUtils } from '../../../../shared/utils/date.utils';

@Component({
  selector: 'app-time-clock',
  imports: [CommonModule],
  templateUrl: './time-clock.html'
})
export class TimeClock {
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);
  private destroyRef = inject(DestroyRef);
  protected timeService = inject(TimeTrackingService);
  protected breakService = inject(BreakManagementService);
  protected DateUtils = DateUtils;

  private timerIntervalId: number | null = null;
  private currentBreakDurationSignal = signal<number>(0);

  protected dailyInfo = this.timeService.dailyInfo;
  protected currentBreak = this.breakService.currentBreak;

  protected formattedBreakDuration = computed((): string => {
    return DateUtils.formatDuration(this.currentBreakDurationSignal());
  });

  protected breakTimerColorClass = computed((): string => {
    const duration = this.currentBreakDurationSignal();
    const minutes = duration / 60;

    if (minutes >= 15) {
      return 'text-red-600';
    } else if (minutes >= 10) {
      return 'text-yellow-600';
    }
    return 'text-orange-600';
  });

  protected statusIcon = computed(() => {
    switch (this.timeService.currentStatus()) {
      case WorkStatus.WORKING:
        return '🟢';
      case WorkStatus.ON_BREAK:
        return '🟡';
      case WorkStatus.CLOCKED_OUT:
      default:
        return '⚫';
    }
  });

  protected statusText = computed(() => {
    switch (this.timeService.currentStatus()) {
      case WorkStatus.WORKING:
        return 'Working';
      case WorkStatus.ON_BREAK:
        return 'On Break';
      case WorkStatus.CLOCKED_OUT:
      default:
        return 'Clocked Out';
    }
  });

  protected statusBadgeClass = computed(() => {
    const baseClasses = 'inline-flex items-center px-4 py-2 rounded-full text-sm font-medium';
    switch (this.timeService.currentStatus()) {
      case WorkStatus.WORKING:
        return `${baseClasses} bg-green-100 text-green-800`;
      case WorkStatus.ON_BREAK:
        return `${baseClasses} bg-orange-100 text-orange-800`;
      case WorkStatus.CLOCKED_OUT:
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  });

  protected timerColorClass = computed(() => {
    switch (this.timeService.currentStatus()) {
      case WorkStatus.WORKING:
        return 'text-green-600';
      case WorkStatus.ON_BREAK:
        return 'text-orange-500';
      case WorkStatus.CLOCKED_OUT:
      default:
        return 'text-gray-600';
    }
  });

  constructor() {
    // Register cleanup on destroy
    this.destroyRef.onDestroy(() => this.stopBreakTimer());

    // Start/stop break timer based on break state
    effect(() => {
      if (this.timeService.isOnBreak()) {
        this.startBreakTimer();
      } else {
        this.stopBreakTimer();
      }
    });
  }

  private startBreakTimer(): void {
    if (!this.isBrowser || this.timerIntervalId) return;

    // Update immediately
    this.updateBreakDuration();

    // Update every second
    this.timerIntervalId = window.setInterval(() => {
      this.updateBreakDuration();
    }, 1000);
  }

  private stopBreakTimer(): void {
    if (!this.isBrowser || !this.timerIntervalId) return;

    clearInterval(this.timerIntervalId);
    this.timerIntervalId = null;
    this.currentBreakDurationSignal.set(0);
  }

  private updateBreakDuration(): void {
    const currentBreak = this.currentBreak();
    if (!currentBreak) {
      this.currentBreakDurationSignal.set(0);
      return;
    }

    const duration = DateUtils.getDurationSeconds(currentBreak.startTime);
    this.currentBreakDurationSignal.set(duration);
  }
}