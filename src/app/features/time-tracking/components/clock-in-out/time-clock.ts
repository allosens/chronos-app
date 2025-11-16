import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TimeTrackingService } from '../../services/time-tracking.service';
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

      <!-- Timer Display -->
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
          } @else if (timeService.isOnBreak()) {
            On break - timer paused
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
          @if (dailyInfo().currentSession!.isOnBreak && dailyInfo().currentSession!.currentBreakStart) {
            <div class="text-sm text-orange-600 mt-1">
              Break started at {{ DateUtils.formatTime12Hour(dailyInfo().currentSession!.currentBreakStart!) }}
            </div>
          }
        </div>
      }
    </div>
  `
})
export class TimeClock {
  protected timeService = inject(TimeTrackingService);
  protected DateUtils = DateUtils;

  protected dailyInfo = this.timeService.dailyInfo;

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
}