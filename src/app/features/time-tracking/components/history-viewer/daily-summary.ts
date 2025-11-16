import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TimeTrackingService } from '../../services/time-tracking.service';
import { DateUtils } from '../../../../shared/utils/date.utils';

@Component({
  selector: 'app-daily-summary',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
      <h3 class="text-lg font-semibold text-gray-900 mb-4">Today's Summary</h3>
      
      <div class="space-y-4">
        <!-- Date -->
        <div class="text-sm text-gray-500 mb-4">
          {{ formattedDate() }}
        </div>

        <!-- Time Stats Grid -->
        <div class="grid grid-cols-2 gap-4">
          <!-- Total Worked -->
          <div class="bg-green-50 rounded-lg p-4 text-center">
            <div class="text-2xl font-bold text-green-700">
              {{ DateUtils.formatMinutesToHoursAndMinutes(dailyInfo().totalWorkedTime) }}
            </div>
            <div class="text-sm text-green-600 font-medium">Total Worked</div>
          </div>

          <!-- Break Time -->
          <div class="bg-orange-50 rounded-lg p-4 text-center">
            <div class="text-2xl font-bold text-orange-700">
              {{ DateUtils.formatMinutesToHoursAndMinutes(dailyInfo().totalBreakTime) }}
            </div>
            <div class="text-sm text-orange-600 font-medium">Break Time</div>
          </div>
        </div>

        <!-- Expected vs Actual -->
        <div class="pt-4 border-t border-gray-200">
          <div class="flex justify-between items-center text-sm">
            <span class="text-gray-600">Expected workday:</span>
            <span class="font-medium text-gray-900">8h 00m</span>
          </div>
          <div class="flex justify-between items-center text-sm mt-1">
            <span class="text-gray-600">Remaining:</span>
            <span class="font-medium" [class]="remainingTimeClass()">
              {{ remainingTime() }}
            </span>
          </div>
        </div>

        <!-- Progress Bar -->
        <div class="mt-4">
          <div class="flex justify-between items-center text-sm mb-2">
            <span class="text-gray-600">Progress</span>
            <span class="text-gray-900 font-medium">{{ progressPercentage() }}%</span>
          </div>
          <div class="w-full bg-gray-200 rounded-full h-2">
            <div 
              class="bg-green-500 h-2 rounded-full transition-all duration-300"
              [style.width.%]="progressPercentage()"
            ></div>
          </div>
        </div>

        <!-- Session Times -->
        @if (dailyInfo().currentSession) {
          <div class="pt-4 border-t border-gray-200">
            <h4 class="text-sm font-medium text-gray-700 mb-2">Session Details</h4>
            <div class="space-y-1 text-sm text-gray-600">
              <div class="flex justify-between">
                <span>Started:</span>
                <span>{{ DateUtils.formatTime(dailyInfo().currentSession!.startTime) }}</span>
              </div>
              <div class="flex justify-between">
                <span>Duration:</span>
                <span>{{ DateUtils.formatMinutesToHoursAndMinutes(dailyInfo().currentSession!.elapsedTime) }}</span>
              </div>
            </div>
          </div>
        }
      </div>
    </div>
  `
})
export class DailySummary {
  private timeService = inject(TimeTrackingService);
  protected dailyInfo = this.timeService.dailyInfo;
  protected DateUtils = DateUtils;

  private readonly EXPECTED_WORK_MINUTES = 8 * 60; // 8 hours in minutes

  protected formattedDate = computed(() => {
    const today = new Date();
    return DateUtils.formatDate(today, 'full');
  });

  protected progressPercentage = computed(() => {
    const workedMinutes = this.dailyInfo().totalWorkedTime;
    return Math.min(Math.round((workedMinutes / this.EXPECTED_WORK_MINUTES) * 100), 100);
  });

  protected remainingTime = computed(() => {
    const workedMinutes = this.dailyInfo().totalWorkedTime;
    const remaining = this.EXPECTED_WORK_MINUTES - workedMinutes;
    
    if (remaining <= 0) {
      return 'Complete! 🎉';
    }
    
    return DateUtils.formatMinutesToHoursAndMinutes(remaining);
  });

  protected remainingTimeClass = computed(() => {
    const workedMinutes = this.dailyInfo().totalWorkedTime;
    const remaining = this.EXPECTED_WORK_MINUTES - workedMinutes;
    
    if (remaining <= 0) {
      return 'text-green-600 font-medium';
    } else if (remaining <= 60) { // Less than 1 hour remaining
      return 'text-orange-600 font-medium';
    }
    
    return 'text-gray-900';
  });
}