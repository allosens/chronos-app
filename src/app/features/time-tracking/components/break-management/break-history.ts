import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BreakManagementService } from '../../services/break-management.service';
import { BreakEntry } from '../../models/time-tracking.model';
import { DateUtils } from '../../../../shared/utils/date.utils';

@Component({
  selector: 'app-break-history',
  imports: [CommonModule],
  template: `
    <div class="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold text-gray-900">Today's Breaks</h3>
        @if (allBreaks().length > 0) {
          <span class="text-sm text-gray-500">
            {{ allBreaks().length }} break{{ allBreaks().length === 1 ? '' : 's' }}
          </span>
        }
      </div>
      
      @if (allBreaks().length === 0) {
        <div class="text-center py-8">
          <div class="text-4xl mb-3" aria-hidden="true">📋</div>
          <p class="text-gray-500 text-sm">No breaks recorded today</p>
          <p class="text-gray-400 text-xs mt-1">
            Your break history will appear here
          </p>
        </div>
      } @else {
        <div class="space-y-3">
          @for (breakEntry of allBreaks(); track breakEntry.id) {
            <div 
              class="border rounded-lg p-4 transition-all hover:shadow-md"
              [class]="getBreakCardClass(breakEntry)"
            >
              <div class="flex items-start justify-between">
                <!-- Break Info -->
                <div class="flex-1">
                  <div class="flex items-center gap-2 mb-2">
                    <span class="text-lg" aria-hidden="true">
                      {{ getBreakIcon(breakEntry) }}
                    </span>
                    <span class="font-medium text-gray-900">
                      {{ getBreakLabel(breakEntry) }}
                    </span>
                  </div>
                  
                  <!-- Time Details -->
                  <div class="space-y-1 text-sm text-gray-600">
                    <div class="flex items-center gap-2">
                      <span class="text-gray-400">Start:</span>
                      <span>{{ DateUtils.formatTime12Hour(breakEntry.startTime) }}</span>
                    </div>
                    
                    @if (breakEntry.endTime) {
                      <div class="flex items-center gap-2">
                        <span class="text-gray-400">End:</span>
                        <span>{{ DateUtils.formatTime12Hour(breakEntry.endTime) }}</span>
                      </div>
                    } @else {
                      <div class="flex items-center gap-2">
                        <span class="text-orange-600 font-medium">In progress...</span>
                      </div>
                    }
                  </div>
                </div>

                <!-- Duration Badge -->
                <div class="ml-4">
                  <div 
                    class="px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap"
                    [class]="getDurationBadgeClass(breakEntry)"
                  >
                    {{ getFormattedDuration(breakEntry) }}
                  </div>
                </div>
              </div>
            </div>
          }
        </div>

        <!-- Summary -->
        @if (completedBreaks().length > 0) {
          <div class="mt-4 pt-4 border-t border-gray-200">
            <div class="flex justify-between items-center text-sm">
              <span class="text-gray-600">Total break time:</span>
              <span class="font-semibold text-gray-900">
                {{ breakService.formattedTotalBreakTime() }}
              </span>
            </div>
            @if (averageBreakDuration() > 0) {
              <div class="flex justify-between items-center text-sm mt-1">
                <span class="text-gray-600">Average break:</span>
                <span class="text-gray-700">
                  {{ DateUtils.formatMinutesToHoursAndMinutes(averageBreakDuration()) }}
                </span>
              </div>
            }
          </div>
        }
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class BreakHistory {
  protected breakService = inject(BreakManagementService);
  protected DateUtils = DateUtils;

  protected allBreaks = computed(() => {
    // Show most recent breaks first
    return [...this.breakService.todayBreaks()].reverse();
  });

  protected completedBreaks = this.breakService.completedBreaks;

  protected averageBreakDuration = computed((): number => {
    const completed = this.completedBreaks();
    if (completed.length === 0) return 0;

    const total = completed.reduce((sum, b) => sum + (b.duration ?? 0), 0);
    return Math.floor(total / completed.length);
  });

  protected getBreakIcon(breakEntry: BreakEntry): string {
    if (!breakEntry.endTime) {
      return '🟡'; // In progress
    }
    
    const duration = breakEntry.duration ?? 0;
    if (duration >= 15) {
      return '🔴'; // Long break
    } else if (duration >= 10) {
      return '🟠'; // Medium break
    }
    return '🟢'; // Short break
  }

  protected getBreakLabel(breakEntry: BreakEntry): string {
    if (!breakEntry.endTime) {
      return 'Active Break';
    }

    const duration = breakEntry.duration ?? 0;
    if (duration >= 15) {
      return 'Extended Break';
    } else if (duration >= 10) {
      return 'Standard Break';
    }
    return 'Quick Break';
  }

  protected getBreakCardClass(breakEntry: BreakEntry): string {
    if (!breakEntry.endTime) {
      return 'border-orange-300 bg-orange-50';
    }
    return 'border-gray-200 bg-white';
  }

  protected getDurationBadgeClass(breakEntry: BreakEntry): string {
    if (!breakEntry.endTime) {
      return 'bg-orange-100 text-orange-700';
    }

    const duration = breakEntry.duration ?? 0;
    if (duration >= 15) {
      return 'bg-red-100 text-red-700';
    } else if (duration >= 10) {
      return 'bg-yellow-100 text-yellow-700';
    }
    return 'bg-green-100 text-green-700';
  }

  protected getFormattedDuration(breakEntry: BreakEntry): string {
    if (breakEntry.endTime && breakEntry.duration !== undefined) {
      return DateUtils.formatMinutesToHoursAndMinutes(breakEntry.duration);
    }
    
    // For active breaks, calculate current duration
    const currentDuration = DateUtils.getDurationMinutes(breakEntry.startTime);
    return DateUtils.formatMinutesToHoursAndMinutes(currentDuration);
  }
}
