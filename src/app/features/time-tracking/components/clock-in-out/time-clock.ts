import { Component, computed, inject, effect, signal, PLATFORM_ID, DestroyRef } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CommonModule } from '@angular/common';
import { TimeTrackingService } from '../../services/time-tracking.service';
import { BreakManagementService } from '../../services/break-management.service';
import { WorkStatus } from '../../models/time-tracking.model';
import { DateUtils } from '../../../../shared/utils/date.utils';

@Component({
  selector: 'app-time-clock',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-white rounded-xl shadow-lg p-6 text-center border border-gray-100">
      <!-- Status Badge -->
      <div class="mb-4">
        <span 
          class="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium"
          [class]="statusBadgeClass()"
        >
          <span class="mr-2">{{ statusIcon() }}</span>
          {{ statusText() }}
        </span>
      </div>

      <!-- Timer Display - Shows break timer when on break, work timer otherwise -->
      @if (timeService.isOnBreak()) {
        <!-- Break Timer -->
        <div class="mb-6">
          <div 
            class="text-5xl lg:text-6xl font-mono font-bold mb-2 transition-colors duration-300"
            [class]="breakTimerColorClass()"
          >
            {{ formattedBreakDuration() }}
          </div>
          <p class="text-orange-600 text-base font-medium">
            Current break duration
          </p>
        </div>

        <!-- Break Session Info -->
        @if (currentBreak()) {
          <div class="bg-orange-50 rounded-lg p-4 mb-4">
            <div class="text-sm text-orange-700">
              Break started at {{ DateUtils.formatTime12Hour(currentBreak()!.startTime) }}
            </div>
          </div>
        }

        <!-- Long Break Warning -->
        @if (breakService.hasLongBreak()) {
          <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
            <div class="flex items-start gap-2">
              <span class="text-yellow-600 text-lg" aria-hidden="true">⚠️</span>
              <div class="flex-1 text-left">
                <p class="text-sm font-medium text-yellow-800">Extended Break</p>
                <p class="text-xs text-yellow-700 mt-1">
                  You've been on break for over 15 minutes. Consider resuming work!
                </p>
              </div>
            </div>
          </div>
        }
      } @else {
        <!-- Work Timer -->
        <div class="mb-6">
          <div 
            class="text-5xl lg:text-6xl font-mono font-bold mb-2 transition-colors duration-300"
            [class]="timerColorClass()"
          >
            {{ timeService.formattedElapsedTime() }}
          </div>
          <p class="text-gray-500 text-base">
            @if (timeService.isWorking()) {
              Time worked today
            } @else {
              Ready to start your day
            }
          </p>
        </div>

        <!-- Current Session Info -->
        @if (dailyInfo().currentSession) {
          <div class="bg-gray-50 rounded-lg p-4">
            <h4 class="text-sm font-medium text-gray-700 mb-2">Current Session</h4>
            <div class="text-sm text-gray-600">
              Started at {{ DateUtils.formatTime12Hour(dailyInfo().currentSession!.startTime) }}
            </div>
          </div>
        }
      }
    </div>
  `
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