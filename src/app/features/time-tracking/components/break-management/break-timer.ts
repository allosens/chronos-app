import { Component, computed, inject, effect, signal, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CommonModule } from '@angular/common';
import { BreakManagementService } from '../../services/break-management.service';
import { TimeTrackingService } from '../../services/time-tracking.service';
import { DateUtils } from '../../../../shared/utils/date.utils';

@Component({
  selector: 'app-break-timer',
  imports: [CommonModule],
  template: `
    <div class="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
      <h3 class="text-lg font-semibold text-gray-900 mb-4">Break Timer</h3>
      
      @if (timeService.isOnBreak()) {
        <div class="text-center">
          <!-- Break Duration -->
          <div class="mb-4">
            <div 
              class="text-5xl font-mono font-bold transition-colors duration-300"
              [class]="timerColorClass()"
            >
              {{ formattedDuration() }}
            </div>
            <p class="text-gray-500 text-sm mt-2">Current break duration</p>
          </div>

          <!-- Break Start Time -->
          @if (currentBreak()) {
            <div class="bg-orange-50 rounded-lg p-3 mb-4">
              <p class="text-sm text-orange-700">
                Started at {{ DateUtils.formatTime12Hour(currentBreak()!.startTime) }}
              </p>
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
                    You've been on break for over {{ LONG_BREAK_THRESHOLD }} minutes. Consider resuming work!
                  </p>
                </div>
              </div>
            </div>
          }

          <!-- Quick Stats -->
          <div class="grid grid-cols-2 gap-3">
            <div class="bg-gray-50 rounded-lg p-3">
              <div class="text-lg font-bold text-gray-900">
                {{ breakService.completedBreaks().length }}
              </div>
              <div class="text-xs text-gray-600">Breaks Today</div>
            </div>
            <div class="bg-gray-50 rounded-lg p-3">
              <div class="text-lg font-bold text-gray-900">
                {{ breakService.formattedTotalBreakTime() }}
              </div>
              <div class="text-xs text-gray-600">Total Break Time</div>
            </div>
          </div>
        </div>
      } @else {
        <div class="text-center py-8">
          <div class="text-4xl mb-3" aria-hidden="true">😌</div>
          <p class="text-gray-500 text-sm">
            @if (timeService.isClockedOut()) {
              Clock in to start tracking breaks
            } @else {
              No active break. Take one when you need it!
            }
          </p>
          
          @if (breakService.completedBreaks().length > 0) {
            <div class="mt-4 pt-4 border-t border-gray-200">
              <div class="text-sm text-gray-600">
                <span class="font-medium">{{ breakService.completedBreaks().length }}</span> 
                break{{ breakService.completedBreaks().length === 1 ? '' : 's' }} taken today
              </div>
              <div class="text-xs text-gray-500 mt-1">
                Total: {{ breakService.formattedTotalBreakTime() }}
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class BreakTimer {
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);
  protected breakService = inject(BreakManagementService);
  protected timeService = inject(TimeTrackingService);
  protected DateUtils = DateUtils;

  protected readonly LONG_BREAK_THRESHOLD = 15;

  private timerIntervalId: number | null = null;
  private currentDurationSignal = signal<number>(0);

  protected currentBreak = this.breakService.currentBreak;

  protected formattedDuration = computed((): string => {
    return DateUtils.formatDuration(this.currentDurationSignal());
  });

  protected timerColorClass = computed((): string => {
    const duration = this.currentDurationSignal();
    const minutes = duration / 60;

    if (minutes >= this.LONG_BREAK_THRESHOLD) {
      return 'text-red-600';
    } else if (minutes >= 10) {
      return 'text-yellow-600';
    }
    return 'text-orange-600';
  });

  constructor() {
    // Start/stop timer based on break state
    effect(() => {
      if (this.timeService.isOnBreak()) {
        this.startTimer();
      } else {
        this.stopTimer();
      }
    });
  }

  private startTimer(): void {
    if (!this.isBrowser || this.timerIntervalId) return;

    // Update immediately
    this.updateDuration();

    // Update every second
    this.timerIntervalId = window.setInterval(() => {
      this.updateDuration();
    }, 1000);
  }

  private stopTimer(): void {
    if (!this.isBrowser || !this.timerIntervalId) return;

    clearInterval(this.timerIntervalId);
    this.timerIntervalId = null;
    this.currentDurationSignal.set(0);
  }

  private updateDuration(): void {
    const currentBreak = this.currentBreak();
    if (!currentBreak) {
      this.currentDurationSignal.set(0);
      return;
    }

    const duration = DateUtils.getDurationSeconds(currentBreak.startTime);
    this.currentDurationSignal.set(duration);
  }
}
