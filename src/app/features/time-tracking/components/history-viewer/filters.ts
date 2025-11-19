import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HistoryFilters as HistoryFiltersModel, TimesheetStatus } from '../../models/timesheet-history.model';
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
          </div>
        </div>
      }
    </div>
  `
})
export class HistoryFiltersComponent {
  private historyService = inject(TimesheetHistoryService);

  protected startDate = '';
  protected endDate = '';
  protected statusFilter = '';
  protected TimesheetStatus = TimesheetStatus;

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

    this.historyService.updateFilters(filters);
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
    this.historyService.clearFilters();
  }

  protected hasActiveFilters(): boolean {
    return !!(this.startDate || this.endDate || this.statusFilter);
  }

  protected formatDate(dateString: string): string {
    const date = new Date(dateString);
    return DateUtils.formatDate(date, 'medium');
  }

  protected formatStatus(status: string): string {
    return TimesheetUtils.formatStatus(status as TimesheetStatus);
  }
}
