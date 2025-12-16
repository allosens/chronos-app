import { Injectable, signal, computed } from '@angular/core';
import {
  TimesheetEntry,
  TimesheetStatus,
  HistoryFilters,
  PaginationConfig,
  SortConfig,
  SortDirection,
  WeeklySummary,
  MonthlySummary,
  BreakPeriod,
  DurationRange
} from '../models/timesheet-history.model';
import { DateUtils } from '../../../shared/utils/date.utils';

@Injectable({
  providedIn: 'root'
})
export class TimesheetHistoryService {
  // Signals for reactive state
  private entriesSignal = signal<TimesheetEntry[]>([]);
  private filtersSignal = signal<HistoryFilters>({});
  private sortSignal = signal<SortConfig>({ field: 'date', direction: 'desc' });
  private paginationSignal = signal<PaginationConfig>({
    page: 1,
    pageSize: 10,
    totalItems: 0,
    totalPages: 0
  });
  private isLoadingSignal = signal<boolean>(false);
  private errorSignal = signal<string | null>(null);

  // Public readonly signals
  readonly entries = this.entriesSignal.asReadonly();
  readonly filters = this.filtersSignal.asReadonly();
  readonly sort = this.sortSignal.asReadonly();
  readonly pagination = this.paginationSignal.asReadonly();
  readonly isLoading = this.isLoadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();

  // Computed signals
  readonly filteredEntries = computed(() => {
    let entries = [...this.entriesSignal()];
    const filters = this.filtersSignal();

    // Apply date range filter
    if (filters.startDate) {
      entries = entries.filter(e => e.date >= filters.startDate!);
    }
    if (filters.endDate) {
      entries = entries.filter(e => e.date <= filters.endDate!);
    }

    // Apply status filter
    if (filters.status) {
      entries = entries.filter(e => e.status === filters.status);
    }

    // Apply duration filter
    if (filters.durationRange) {
      switch (filters.durationRange) {
        case DurationRange.LESS_THAN_4:
          entries = entries.filter(e => e.totalHours < 4);
          break;
        case DurationRange.FOUR_TO_EIGHT:
          entries = entries.filter(e => e.totalHours >= 4 && e.totalHours <= 8);
          break;
        case DurationRange.MORE_THAN_8:
          entries = entries.filter(e => e.totalHours > 8);
          break;
        case DurationRange.CUSTOM:
          if (filters.minHours !== undefined) {
            entries = entries.filter(e => e.totalHours >= filters.minHours!);
          }
          if (filters.maxHours !== undefined) {
            entries = entries.filter(e => e.totalHours <= filters.maxHours!);
          }
          break;
      }
    }

    // Apply break time filter
    if (filters.minBreakTime !== undefined) {
      entries = entries.filter(e => e.totalBreakTime >= filters.minBreakTime!);
    }
    if (filters.maxBreakTime !== undefined) {
      entries = entries.filter(e => e.totalBreakTime <= filters.maxBreakTime!);
    }

    // Apply notes search filter
    if (filters.searchNotes) {
      const searchTerm = filters.searchNotes.toLowerCase();
      entries = entries.filter(e => 
        e.notes?.toLowerCase().includes(searchTerm)
      );
    }

    return entries;
  });

  readonly sortedEntries = computed(() => {
    const entries = [...this.filteredEntries()];
    const sort = this.sortSignal();

    return entries.sort((a, b) => {
      let comparison = 0;

      switch (sort.field) {
        case 'date':
          comparison = a.date.localeCompare(b.date);
          break;
        case 'clockIn': {
          const aTime = a.clockIn?.getTime() ?? (sort.direction === 'asc' ? Infinity : -Infinity);
          const bTime = b.clockIn?.getTime() ?? (sort.direction === 'asc' ? Infinity : -Infinity);
          comparison = aTime - bTime;
          break;
        }
        case 'clockOut': {
          const aTime = a.clockOut?.getTime() ?? (sort.direction === 'asc' ? Infinity : -Infinity);
          const bTime = b.clockOut?.getTime() ?? (sort.direction === 'asc' ? Infinity : -Infinity);
          comparison = aTime - bTime;
          break;
        }
        case 'totalHours':
          comparison = a.totalHours - b.totalHours;
          break;
      }

      return sort.direction === 'asc' ? comparison : -comparison;
    });
  });

  readonly paginatedEntries = computed(() => {
    const sorted = this.sortedEntries();
    const { page, pageSize } = this.paginationSignal();
    const start = (page - 1) * pageSize;
    const end = start + pageSize;

    return sorted.slice(start, end);
  });

  readonly weeklySummary = computed((): WeeklySummary | null => {
    const entries = this.filteredEntries();
    if (entries.length === 0) return null;

    // Get current week entries
    const today = new Date();
    const weekStart = DateUtils.getWeekStart(today);
    const weekEnd = DateUtils.getWeekEnd(today);

    const weekEntries = entries.filter(e => {
      const entryDate = new Date(e.date);
      return entryDate >= weekStart && entryDate <= weekEnd;
    });

    return this.calculateWeeklySummary(weekEntries, weekStart, weekEnd);
  });

  readonly monthlySummary = computed((): MonthlySummary | null => {
    const entries = this.filteredEntries();
    if (entries.length === 0) return null;

    const today = new Date();
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    const monthEntries = entries.filter(e => {
      const entryDate = new Date(e.date);
      return entryDate >= monthStart && entryDate <= monthEnd;
    });

    return this.calculateMonthlySummary(monthEntries, today.getMonth(), today.getFullYear());
  });

  constructor() {
    // Generate mock data for demonstration
    this.generateMockData();
  }

  /**
   * Updates the filters and resets pagination
   */
  updateFilters(filters: Partial<HistoryFilters>): void {
    this.filtersSignal.update(current => ({ ...current, ...filters }));
    this.updatePaginationTotals();
    this.setPage(1);
  }

  /**
   * Clears all filters
   */
  clearFilters(): void {
    this.filtersSignal.set({});
    this.updatePaginationTotals();
    this.setPage(1);
  }

  /**
   * Updates the sort configuration
   */
  updateSort(field: SortConfig['field']): void {
    const currentSort = this.sortSignal();
    const direction: SortDirection =
      currentSort.field === field && currentSort.direction === 'asc' ? 'desc' : 'asc';

    this.sortSignal.set({ field, direction });
  }

  /**
   * Sets the current page
   */
  setPage(page: number): void {
    this.paginationSignal.update(config => ({ ...config, page }));
  }

  /**
   * Sets the page size and resets to first page
   */
  setPageSize(pageSize: number): void {
    this.paginationSignal.update(config => ({ ...config, pageSize, page: 1 }));
    this.updatePaginationTotals();
  }

  /**
   * Updates pagination totals based on filtered entries
   */
  private updatePaginationTotals(): void {
    const totalItems = this.filteredEntries().length;
    const { pageSize } = this.paginationSignal();
    const totalPages = Math.ceil(totalItems / pageSize);

    this.paginationSignal.update(config => ({
      ...config,
      totalItems,
      totalPages
    }));
  }

  /**
   * Calculates weekly summary from entries
   */
  private calculateWeeklySummary(
    entries: TimesheetEntry[],
    weekStart: Date,
    weekEnd: Date
  ): WeeklySummary {
    const totalHours = entries.reduce((sum, e) => sum + e.totalHours, 0);
    const totalBreakTime = entries.reduce((sum, e) => sum + e.totalBreakTime, 0);
    const daysWorked = entries.filter(e => e.totalHours > 0).length;

    return {
      weekNumber: this.getWeekNumber(weekStart),
      startDate: weekStart.toISOString().split('T')[0],
      endDate: weekEnd.toISOString().split('T')[0],
      totalHours: Math.round(totalHours * 100) / 100,
      totalBreakTime,
      daysWorked,
      averageHoursPerDay: daysWorked > 0 ? Math.round((totalHours / daysWorked) * 100) / 100 : 0
    };
  }

  /**
   * Calculates monthly summary from entries
   */
  private calculateMonthlySummary(
    entries: TimesheetEntry[],
    month: number,
    year: number
  ): MonthlySummary {
    const totalHours = entries.reduce((sum, e) => sum + e.totalHours, 0);
    const totalBreakTime = entries.reduce((sum, e) => sum + e.totalBreakTime, 0);
    const daysWorked = entries.filter(e => e.totalHours > 0).length;
    const expectedHours = this.getExpectedMonthlyHours(month, year);

    return {
      month,
      year,
      totalHours: Math.round(totalHours * 100) / 100,
      totalBreakTime,
      daysWorked,
      averageHoursPerDay: daysWorked > 0 ? Math.round((totalHours / daysWorked) * 100) / 100 : 0,
      expectedHours
    };
  }

  /**
   * Gets the ISO week number
   */
  private getWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  }

  /**
   * Calculates expected working hours for a month (assuming 8h/day, 5 days/week)
   */
  private getExpectedMonthlyHours(month: number, year: number): number {
    return DateUtils.getWorkingDays(month, year) * 8;
  }

  /**
   * Generates mock timesheet data for demonstration
   */
  private generateMockData(): void {
    const mockEntries: TimesheetEntry[] = [];
    const today = new Date();

    // Generate entries for the last 30 days
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateString = date.toISOString().split('T')[0];
      const dayOfWeek = date.getDay();

      // Skip weekends
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        continue;
      }

      // Randomly skip some days (incomplete entries)
      if (Math.random() < 0.1) {
        mockEntries.push(this.createIncompleteEntry(dateString));
        continue;
      }

      // Create normal entry
      const clockIn = new Date(date);
      clockIn.setHours(8 + Math.floor(Math.random() * 2), Math.floor(Math.random() * 60), 0, 0);

      const clockOut = new Date(date);
      clockOut.setHours(17 + Math.floor(Math.random() * 2), Math.floor(Math.random() * 60), 0, 0);

      const breaks = this.generateBreaks(date);
      const totalBreakTime = breaks.reduce((sum, b) => sum + b.duration, 0);
      const totalHours =
        (clockOut.getTime() - clockIn.getTime()) / (1000 * 60 * 60) - totalBreakTime / 60;

      mockEntries.push({
        id: `entry-${i}`,
        date: dateString,
        clockIn,
        clockOut,
        totalHours: Math.round(totalHours * 100) / 100,
        totalBreakTime,
        breaks,
        status: TimesheetStatus.COMPLETE,
        notes: this.generateRandomNotes()
      });
    }

    this.entriesSignal.set(mockEntries);
    this.updatePaginationTotals();
  }

  /**
   * Creates an incomplete entry
   */
  private createIncompleteEntry(dateString: string): TimesheetEntry {
    const date = new Date(dateString);
    const clockIn = new Date(date);
    clockIn.setHours(8 + Math.floor(Math.random() * 2), Math.floor(Math.random() * 60), 0, 0);

    return {
      id: `entry-incomplete-${dateString}`,
      date: dateString,
      clockIn,
      totalHours: 0,
      totalBreakTime: 0,
      breaks: [],
      status: TimesheetStatus.INCOMPLETE,
      notes: 'Incomplete entry - forgot to clock out'
    };
  }

  /**
   * Generates random notes for demonstration
   */
  private generateRandomNotes(): string {
    const noteOptions = [
      'Worked on project implementation',
      'Team meeting and code review',
      'Client consultation and planning',
      'Development and testing features',
      'Bug fixes and maintenance',
      'Documentation updates',
      'Sprint planning and retrospective',
      'Training and knowledge sharing',
      'Worked on API integration',
      'Database optimization tasks',
      ''
    ];
    return noteOptions[Math.floor(Math.random() * noteOptions.length)];
  }

  /**
   * Generates random breaks for a day
   */
  private generateBreaks(date: Date): BreakPeriod[] {
    const numBreaks = Math.random() < 0.5 ? 1 : 2;
    const breaks: BreakPeriod[] = [];

    for (let i = 0; i < numBreaks; i++) {
      const startHour = 12 + i * 2;
      const start = new Date(date);
      start.setHours(startHour, Math.floor(Math.random() * 60), 0, 0);

      const duration = 30 + Math.floor(Math.random() * 30);
      const end = new Date(start);
      end.setMinutes(start.getMinutes() + duration);

      breaks.push({
        id: `break-${i}`,
        startTime: start,
        endTime: end,
        duration
      });
    }

    return breaks;
  }
}
