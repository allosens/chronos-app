import { Component, computed, inject, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TimesheetHistoryService } from '../../services/timesheet-history.service';
import { TimesheetStatus } from '../../models/timesheet-history.model';
import { DateUtils } from '../../../../shared/utils/date.utils';
import { HistoryFiltersComponent } from './filters';
import { TimesheetUtils } from '../../utils/timesheet.utils';

@Component({
  selector: 'app-timesheet-history',
  imports: [CommonModule, FormsModule, HistoryFiltersComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-4">
      <!-- Compact Header with Summary Stats -->
      <div class="bg-white rounded-lg shadow-md border border-gray-100">
        <div class="p-4 border-b border-gray-100">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-xl font-bold text-gray-900">Timesheet History</h2>
              <p class="text-sm text-gray-600">View and manage your work time records</p>
            </div>
            <button
              type="button"
              (click)="toggleFilters()"
              class="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              [attr.aria-label]="showFilters() ? 'Hide filters' : 'Show filters'"
              [attr.aria-expanded]="showFilters()"
            >
              <span class="flex items-center gap-2">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                {{ showFilters() ? 'Hide Filters' : 'Show Filters' }}
              </span>
            </button>
          </div>
        </div>

        <!-- Summary Stats Row -->
        <div class="grid grid-cols-3 divide-x divide-gray-100">
          <div class="p-4">
            <div class="flex items-center gap-3">
              <div class="p-2 bg-blue-100 rounded-lg">
                <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <p class="text-xs text-gray-600">Total Entries</p>
                <p class="text-xl font-bold text-gray-900">{{ pagination().totalItems }}</p>
              </div>
            </div>
          </div>

          @if (weeklySummary(); as summary) {
            <div class="p-4">
              <div class="flex items-center gap-3">
                <div class="p-2 bg-green-100 rounded-lg">
                  <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p class="text-xs text-gray-600">This Week</p>
                  <p class="text-xl font-bold text-gray-900">{{ summary.totalHours.toFixed(1) }}h</p>
                  <p class="text-xs text-gray-500">{{ summary.daysWorked }} days</p>
                </div>
              </div>
            </div>
          }

          @if (monthlySummary(); as summary) {
            <div class="p-4">
              <div class="flex items-center gap-3">
                <div class="p-2 bg-purple-100 rounded-lg">
                  <svg class="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p class="text-xs text-gray-600">This Month</p>
                  <p class="text-xl font-bold text-gray-900">{{ summary.totalHours.toFixed(1) }}h</p>
                  <p class="text-xs text-gray-500">{{ summary.daysWorked }} / {{ getWorkingDays(summary.month, summary.year) }} days</p>
                </div>
              </div>
            </div>
          }
        </div>
      </div>

      <!-- Collapsible Filters -->
      @if (showFilters()) {
        <app-history-filters />
      }

      <!-- Timesheet Table -->
      <div class="bg-white rounded-lg shadow-md border border-gray-100 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200" role="table" aria-label="Timesheet history table">
            <thead class="bg-gray-50">
              <tr>
                <th 
                  scope="col"
                  class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                  (click)="onSort('date')"
                  tabindex="0"
                  role="button"
                  [attr.aria-label]="'Sort by date ' + getSortAriaLabel('date')"
                  (keydown.enter)="onSort('date')"
                  (keydown.space)="onSort('date')"
                >
                  <div class="flex items-center gap-2">
                    Date
                    @if (sort().field === 'date') {
                      <span class="text-blue-600">
                        {{ sort().direction === 'asc' ? '↑' : '↓' }}
                      </span>
                    }
                  </div>
                </th>
                <th 
                  scope="col"
                  class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                  (click)="onSort('clockIn')"
                  tabindex="0"
                  role="button"
                  [attr.aria-label]="'Sort by clock in time ' + getSortAriaLabel('clockIn')"
                  (keydown.enter)="onSort('clockIn')"
                  (keydown.space)="onSort('clockIn')"
                >
                  <div class="flex items-center gap-2">
                    Clock In
                    @if (sort().field === 'clockIn') {
                      <span class="text-blue-600">
                        {{ sort().direction === 'asc' ? '↑' : '↓' }}
                      </span>
                    }
                  </div>
                </th>
                <th 
                  scope="col"
                  class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                  (click)="onSort('clockOut')"
                  tabindex="0"
                  role="button"
                  [attr.aria-label]="'Sort by clock out time ' + getSortAriaLabel('clockOut')"
                  (keydown.enter)="onSort('clockOut')"
                  (keydown.space)="onSort('clockOut')"
                >
                  <div class="flex items-center gap-2">
                    Clock Out
                    @if (sort().field === 'clockOut') {
                      <span class="text-blue-600">
                        {{ sort().direction === 'asc' ? '↑' : '↓' }}
                      </span>
                    }
                  </div>
                </th>
                <th 
                  scope="col"
                  class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                  (click)="onSort('totalHours')"
                  tabindex="0"
                  role="button"
                  [attr.aria-label]="'Sort by total hours ' + getSortAriaLabel('totalHours')"
                  (keydown.enter)="onSort('totalHours')"
                  (keydown.space)="onSort('totalHours')"
                >
                  <div class="flex items-center gap-2">
                    Hours Worked
                    @if (sort().field === 'totalHours') {
                      <span class="text-blue-600">
                        {{ sort().direction === 'asc' ? '↑' : '↓' }}
                      </span>
                    }
                  </div>
                </th>
                <th scope="col" class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Break Time
                </th>
                <th scope="col" class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              @if (paginatedEntries().length === 0) {
                <tr>
                  <td colspan="6" class="px-4 py-8 text-center text-gray-500">
                    <div class="flex flex-col items-center">
                      <svg class="w-10 h-10 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p class="text-base font-medium">No timesheet entries found</p>
                      <p class="text-sm mt-1">Try adjusting your filters</p>
                    </div>
                  </td>
                </tr>
              }
              @for (entry of paginatedEntries(); track entry.id) {
                <tr 
                  class="hover:bg-gray-50 transition-colors"
                  [class.bg-yellow-50]="entry.status === TimesheetStatus.INCOMPLETE"
                  [class.bg-red-50]="entry.status === TimesheetStatus.ERROR"
                >
                  <td class="px-4 py-2.5 whitespace-nowrap text-sm font-medium text-gray-900">
                    {{ formatDate(entry.date) }}
                  </td>
                  <td class="px-4 py-2.5 whitespace-nowrap text-sm text-gray-700">
                    {{ entry.clockIn ? formatTime(entry.clockIn) : '-' }}
                  </td>
                  <td class="px-4 py-2.5 whitespace-nowrap text-sm text-gray-700">
                    {{ entry.clockOut ? formatTime(entry.clockOut) : '-' }}
                  </td>
                  <td class="px-4 py-2.5 whitespace-nowrap text-sm font-medium text-gray-900">
                    {{ entry.totalHours.toFixed(2) }}h
                  </td>
                  <td class="px-4 py-2.5 whitespace-nowrap text-sm text-gray-700">
                    {{ formatMinutes(entry.totalBreakTime) }}
                  </td>
                  <td class="px-4 py-2.5 whitespace-nowrap">
                    <span [class]="getStatusBadgeClass(entry.status)">
                      {{ getStatusLabel(entry.status) }}
                    </span>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        @if (pagination().totalPages > 1) {
          <div class="bg-gray-50 px-4 py-3 border-t border-gray-200">
            <div class="flex items-center justify-between">
              <div class="text-xs text-gray-700">
                <span class="font-medium">{{ getStartIndex() }}</span>
                -
                <span class="font-medium">{{ getEndIndex() }}</span>
                of 
                <span class="font-medium">{{ pagination().totalItems }}</span>
              </div>

              <div class="flex items-center gap-2">
                <!-- Page Size Selector -->
                <select
                  [value]="pageSize()"
                  (change)="onPageSizeChange($any($event.target).value)"
                  class="px-2 py-1 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  [attr.aria-label]="'Select page size'"
                >
                  <option [value]="10">10</option>
                  <option [value]="25">25</option>
                  <option [value]="50">50</option>
                </select>

                <!-- Previous Button -->
                <button
                  type="button"
                  (click)="onPreviousPage()"
                  [disabled]="pagination().page === 1"
                  class="px-3 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                  [attr.aria-label]="'Previous page'"
                >
                  Prev
                </button>

                <!-- Page Numbers -->
                <div class="flex items-center gap-1">
                  @for (page of getPageNumbers(); track page) {
                    <button
                      type="button"
                      (click)="onPageChange(page)"
                      [class.bg-blue-600]="page === pagination().page"
                      [class.text-white]="page === pagination().page"
                      [class.bg-white]="page !== pagination().page"
                      [class.text-gray-700]="page !== pagination().page"
                      class="px-2 py-1 text-xs font-medium border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                      [attr.aria-label]="'Page ' + page"
                      [attr.aria-current]="page === pagination().page ? 'page' : undefined"
                    >
                      {{ page }}
                    </button>
                  }
                </div>

                <!-- Next Button -->
                <button
                  type="button"
                  (click)="onNextPage()"
                  [disabled]="pagination().page === pagination().totalPages"
                  class="px-3 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                  [attr.aria-label]="'Next page'"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        }
      </div>
    </div>
  `
})
export class TimesheetHistory {
  private historyService = inject(TimesheetHistoryService);

  protected paginatedEntries = this.historyService.paginatedEntries;
  protected pagination = this.historyService.pagination;
  protected sort = this.historyService.sort;
  protected weeklySummary = this.historyService.weeklySummary;
  protected monthlySummary = this.historyService.monthlySummary;
  protected TimesheetStatus = TimesheetStatus;

  protected pageSize = signal(10);
  protected showFilters = signal(false);

  protected toggleFilters(): void {
    this.showFilters.update(value => !value);
  }

  protected onSort(field: 'date' | 'clockIn' | 'clockOut' | 'totalHours'): void {
    this.historyService.updateSort(field);
  }

  protected onPageChange(page: number): void {
    this.historyService.setPage(page);
  }

  protected onPreviousPage(): void {
    const currentPage = this.pagination().page;
    if (currentPage > 1) {
      this.historyService.setPage(currentPage - 1);
    }
  }

  protected onNextPage(): void {
    const { page, totalPages } = this.pagination();
    if (page < totalPages) {
      this.historyService.setPage(page + 1);
    }
  }

  protected onPageSizeChange(value: string): void {
    const size = parseInt(value, 10);
    this.pageSize.set(size);
    this.historyService.setPageSize(size);
  }

  protected getPageNumbers(): number[] {
    const { page, totalPages } = this.pagination();
    const pages: number[] = [];
    const maxVisible = 5;

    let start = Math.max(1, page - Math.floor(maxVisible / 2));
    const end = Math.min(totalPages, start + maxVisible - 1);

    if (end - start < maxVisible - 1) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  }

  protected getStartIndex(): number {
    const { page, pageSize } = this.pagination();
    return (page - 1) * pageSize + 1;
  }

  protected getEndIndex(): number {
    const { page, pageSize, totalItems } = this.pagination();
    return Math.min(page * pageSize, totalItems);
  }

  protected formatDate(dateString: string): string {
    const date = new Date(dateString);
    return DateUtils.formatDate(date, 'medium');
  }

  protected formatTime(date: Date): string {
    return DateUtils.formatTime(date);
  }

  protected formatMinutes(minutes: number): string {
    return DateUtils.formatMinutesToHoursAndMinutes(minutes);
  }

  protected getStatusLabel(status: TimesheetStatus): string {
    return TimesheetUtils.formatStatus(status);
  }

  protected getStatusBadgeClass(status: TimesheetStatus): string {
    const baseClass = 'inline-flex px-2 py-1 text-xs font-medium rounded-full';
    
    switch (status) {
      case TimesheetStatus.COMPLETE:
        return `${baseClass} bg-green-100 text-green-800`;
      case TimesheetStatus.INCOMPLETE:
        return `${baseClass} bg-yellow-100 text-yellow-800`;
      case TimesheetStatus.IN_PROGRESS:
        return `${baseClass} bg-blue-100 text-blue-800`;
      case TimesheetStatus.ERROR:
        return `${baseClass} bg-red-100 text-red-800`;
      default:
        return `${baseClass} bg-gray-100 text-gray-800`;
    }
  }

  protected getSortAriaLabel(field: string): string {
    const current = this.sort();
    if (current.field === field) {
      return current.direction === 'asc' ? 'sorted ascending' : 'sorted descending';
    }
    return 'not sorted';
  }

  protected getWorkingDays(month: number, year: number): number {
    return DateUtils.getWorkingDays(month, year);
  }
}
