import { Component, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HistoryFilters as HistoryFiltersModel, TimesheetStatus, DurationRange } from '../../models/timesheet-history.model';
import { TimesheetHistoryService } from '../../services/timesheet-history.service';
import { DateUtils } from '../../../../shared/utils/date.utils';
import { TimesheetUtils } from '../../utils/timesheet.utils';

@Component({
  selector: 'app-history-filters',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="bg-white rounded-lg shadow-md p-4 border border-gray-100">
      <div class="flex items-center justify-between mb-3">
        <h3 class="text-base font-semibold text-gray-900">Filters</h3>
        <button
          type="button"
          (click)="clearFilters()"
          class="px-3 py-1 text-xs font-medium text-red-700 bg-red-50 rounded-lg hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
          [attr.aria-label]="'Clear all filters'"
        >
          Clear All
        </button>
      </div>

      <div class="space-y-3">
        <!-- First Row: Date Range & Status -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
          <!-- Start Date -->
          <div>
            <label for="startDate" class="block text-xs font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              id="startDate"
              [(ngModel)]="startDate"
              (change)="onFilterChange()"
              class="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              [attr.aria-label]="'Filter by start date'"
            />
          </div>

          <!-- End Date -->
          <div>
            <label for="endDate" class="block text-xs font-medium text-gray-700 mb-1">
              End Date
            </label>
            <input
              type="date"
              id="endDate"
              [(ngModel)]="endDate"
              (change)="onFilterChange()"
              class="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              [attr.aria-label]="'Filter by end date'"
            />
          </div>

          <!-- Status Filter -->
          <div>
            <label for="status" class="block text-xs font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              id="status"
              [(ngModel)]="statusFilter"
              (change)="onFilterChange()"
              class="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              [attr.aria-label]="'Filter by status'"
            >
              <option [value]="''">All Statuses</option>
              <option [value]="TimesheetStatus.COMPLETE">Complete</option>
              <option [value]="TimesheetStatus.INCOMPLETE">Incomplete</option>
              <option [value]="TimesheetStatus.IN_PROGRESS">In Progress</option>
            </select>
          </div>

          <!-- Quick Filters -->
          <div>
            <label class="block text-xs font-medium text-gray-700 mb-1">Quick Filters</label>
            <div class="flex gap-1">
              <button
                type="button"
                (click)="applyQuickFilter('thisWeek')"
                class="px-2 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
                [attr.aria-label]="'Filter this week'"
              >
                Week
              </button>
              <button
                type="button"
                (click)="applyQuickFilter('thisMonth')"
                class="px-2 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
                [attr.aria-label]="'Filter this month'"
              >
                Month
              </button>
            </div>
          </div>
        </div>

        <!-- Second Row: Duration & Notes Search -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
          <!-- Duration Range -->
          <div>
            <label for="durationRange" class="block text-xs font-medium text-gray-700 mb-1">
              Duration
            </label>
            <select
              id="durationRange"
              [(ngModel)]="durationRange"
              (change)="onDurationRangeChange()"
              class="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              [attr.aria-label]="'Filter by duration'"
            >
              <option [value]="''">All Durations</option>
              <option [value]="DurationRange.LESS_THAN_4">&lt; 4 hours</option>
              <option [value]="DurationRange.FOUR_TO_EIGHT">4-8 hours</option>
              <option [value]="DurationRange.MORE_THAN_8">&gt; 8 hours</option>
              <option [value]="DurationRange.CUSTOM">Custom Range</option>
            </select>
          </div>

          <!-- Custom Duration Range (shown when Custom is selected) -->
          @if (durationRange === DurationRange.CUSTOM) {
            <div class="col-span-1 md:col-span-2 grid grid-cols-2 gap-2">
              <div>
                <label for="minHours" class="block text-xs font-medium text-gray-700 mb-1">
                  Min Hours
                </label>
                <input
                  type="number"
                  id="minHours"
                  [(ngModel)]="minHours"
                  (change)="onFilterChange()"
                  min="0"
                  step="0.5"
                  placeholder="0"
                  class="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  [attr.aria-label]="'Minimum hours'"
                />
              </div>
              <div>
                <label for="maxHours" class="block text-xs font-medium text-gray-700 mb-1">
                  Max Hours
                </label>
                <input
                  type="number"
                  id="maxHours"
                  [(ngModel)]="maxHours"
                  (change)="onFilterChange()"
                  min="0"
                  step="0.5"
                  placeholder="24"
                  class="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  [attr.aria-label]="'Maximum hours'"
                />
              </div>
            </div>
          } @else {
            <!-- Notes Search -->
            <div class="col-span-1 md:col-span-2">
              <label for="searchNotes" class="block text-xs font-medium text-gray-700 mb-1">
                Search Notes
              </label>
              <input
                type="text"
                id="searchNotes"
                [(ngModel)]="searchNotes"
                (input)="onSearchNotesChange()"
                placeholder="Search in session notes..."
                class="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                [attr.aria-label]="'Search notes'"
              />
            </div>
          }
        </div>

        <!-- Third Row: Break Time Filters (Advanced) -->
        <details class="mt-2">
          <summary class="cursor-pointer text-xs font-medium text-gray-700 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1">
            Advanced: Break Time Filters
          </summary>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3 pl-2">
            <div>
              <label for="minBreakTime" class="block text-xs font-medium text-gray-700 mb-1">
                Min Break Time (minutes)
              </label>
              <input
                type="number"
                id="minBreakTime"
                [(ngModel)]="minBreakTime"
                (change)="onFilterChange()"
                min="0"
                step="5"
                placeholder="0"
                class="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                [attr.aria-label]="'Minimum break time in minutes'"
              />
            </div>
            <div>
              <label for="maxBreakTime" class="block text-xs font-medium text-gray-700 mb-1">
                Max Break Time (minutes)
              </label>
              <input
                type="number"
                id="maxBreakTime"
                [(ngModel)]="maxBreakTime"
                (change)="onFilterChange()"
                min="0"
                step="5"
                placeholder="120"
                class="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                [attr.aria-label]="'Maximum break time in minutes'"
              />
            </div>
          </div>
        </details>
      </div>

      <!-- Active Filters Display -->
      @if (hasActiveFilters()) {
        <div id="active-filters-section" class="mt-3 pt-3 border-t border-gray-200">
          <p id="active-filters-label" class="text-xs text-gray-600 mb-2">Active filters:</p>
          <div class="flex flex-wrap gap-1.5">
            @if (startDate) {
              <span class="inline-flex items-center px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full">
                From: {{ formatDate(startDate) }}
              </span>
            }
            @if (endDate) {
              <span class="inline-flex items-center px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full">
                To: {{ formatDate(endDate) }}
              </span>
            }
            @if (statusFilter) {
              <span class="inline-flex items-center px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded-full">
                Status: {{ formatStatus(statusFilter) }}
              </span>
            }
            @if (durationRange) {
              <span class="inline-flex items-center px-2 py-0.5 bg-purple-100 text-purple-800 text-xs rounded-full">
                Duration: {{ formatDurationRange(durationRange) }}
              </span>
            }
            @if (searchNotes) {
              <span class="inline-flex items-center px-2 py-0.5 bg-orange-100 text-orange-800 text-xs rounded-full">
                Notes: "{{ searchNotes }}"
              </span>
            }
            @if (minBreakTime !== null || maxBreakTime !== null) {
              <span class="inline-flex items-center px-2 py-0.5 bg-indigo-100 text-indigo-800 text-xs rounded-full">
                Break: {{ formatBreakTimeRange() }}
              </span>
            }
          </div>
        </div>
      }
    </div>
  `
})
export class HistoryFiltersComponent implements OnDestroy {
  private historyService = inject(TimesheetHistoryService);
  private searchDebounceTimer: ReturnType<typeof setTimeout> | null = null;

  protected startDate = '';
  protected endDate = '';
  protected statusFilter = '';
  protected durationRange = '';
  protected minHours: number | null = null;
  protected maxHours: number | null = null;
  protected minBreakTime: number | null = null;
  protected maxBreakTime: number | null = null;
  protected searchNotes = '';
  
  protected TimesheetStatus = TimesheetStatus;
  protected DurationRange = DurationRange;

  ngOnDestroy(): void {
    // Clear any pending debounce timer to prevent memory leaks
    if (this.searchDebounceTimer) {
      clearTimeout(this.searchDebounceTimer);
      this.searchDebounceTimer = null;
    }
  }

  protected onFilterChange(): void {
    const filters: HistoryFiltersModel = {};

    if (this.startDate) {
      filters.startDate = this.startDate;
    }
    if (this.endDate) {
      filters.endDate = this.endDate;
    }
    if (this.statusFilter) {
      filters.status = this.statusFilter as TimesheetStatus;
    }
    if (this.durationRange) {
      filters.durationRange = this.durationRange as DurationRange;
      if (this.durationRange === DurationRange.CUSTOM) {
        if (this.minHours !== null) {
          filters.minHours = this.minHours;
        }
        if (this.maxHours !== null) {
          filters.maxHours = this.maxHours;
        }
      }
    }
    if (this.minBreakTime !== null) {
      filters.minBreakTime = this.minBreakTime;
    }
    if (this.maxBreakTime !== null) {
      filters.maxBreakTime = this.maxBreakTime;
    }
    if (this.searchNotes) {
      filters.searchNotes = this.searchNotes;
    }

    this.historyService.updateFilters(filters);
  }

  protected onDurationRangeChange(): void {
    // Clear custom range values when switching away from custom
    if (this.durationRange !== DurationRange.CUSTOM) {
      this.minHours = null;
      this.maxHours = null;
    }
    this.onFilterChange();
  }

  protected onSearchNotesChange(): void {
    // Debounce search to avoid excessive filtering
    if (this.searchDebounceTimer) {
      clearTimeout(this.searchDebounceTimer);
    }
    
    this.searchDebounceTimer = setTimeout(() => {
      this.onFilterChange();
    }, 300);
  }

  protected applyQuickFilter(period: 'thisWeek' | 'thisMonth'): void {
    const today = new Date();
    let startDate: Date;
    let endDate: Date;

    switch (period) {
      case 'thisWeek':
        startDate = DateUtils.getWeekStart(today);
        endDate = DateUtils.getWeekEnd(today);
        break;
      case 'thisMonth':
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        break;
    }

    this.startDate = startDate.toISOString().split('T')[0];
    this.endDate = endDate.toISOString().split('T')[0];
    this.onFilterChange();
  }

  protected clearFilters(): void {
    this.startDate = '';
    this.endDate = '';
    this.statusFilter = '';
    this.durationRange = '';
    this.minHours = null;
    this.maxHours = null;
    this.minBreakTime = null;
    this.maxBreakTime = null;
    this.searchNotes = '';
    this.historyService.clearFilters();
  }

  protected hasActiveFilters(): boolean {
    return !!(
      this.startDate || 
      this.endDate || 
      this.statusFilter || 
      this.durationRange ||
      this.searchNotes ||
      this.minBreakTime !== null ||
      this.maxBreakTime !== null
    );
  }

  protected formatDate(dateString: string): string {
    const date = new Date(dateString);
    return DateUtils.formatDate(date, 'medium');
  }

  protected formatStatus(status: string): string {
    return TimesheetUtils.formatStatus(status as TimesheetStatus);
  }

  protected formatDurationRange(range: string): string {
    switch (range) {
      case DurationRange.LESS_THAN_4:
        return '< 4 hours';
      case DurationRange.FOUR_TO_EIGHT:
        return '4-8 hours';
      case DurationRange.MORE_THAN_8:
        return '> 8 hours';
      case DurationRange.CUSTOM:
        const parts = [];
        if (this.minHours !== null) parts.push(`≥ ${this.minHours}h`);
        if (this.maxHours !== null) parts.push(`≤ ${this.maxHours}h`);
        return parts.join(', ') || 'Custom';
      default:
        return range;
    }
  }

  protected formatBreakTimeRange(): string {
    const parts = [];
    if (this.minBreakTime !== null) parts.push(`≥ ${this.minBreakTime}m`);
    if (this.maxBreakTime !== null) parts.push(`≤ ${this.maxBreakTime}m`);
    return parts.join(', ');
  }
}
