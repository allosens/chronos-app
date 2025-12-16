import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { TimesheetHistoryService } from './timesheet-history.service';
import { TimesheetStatus, DurationRange } from '../models/timesheet-history.model';

describe('TimesheetHistoryService', () => {
  let service: TimesheetHistoryService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        TimesheetHistoryService
      ]
    });
    service = TestBed.inject(TimesheetHistoryService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should generate mock data on initialization', () => {
    const entries = service.entries();
    expect(entries.length).toBeGreaterThan(0);
  });

  it('should have default pagination settings', () => {
    const pagination = service.pagination();
    expect(pagination.page).toBe(1);
    expect(pagination.pageSize).toBe(10);
    expect(pagination.totalItems).toBeGreaterThan(0);
  });

  it('should have default sort by date descending', () => {
    const sort = service.sort();
    expect(sort.field).toBe('date');
    expect(sort.direction).toBe('desc');
  });

  describe('filtering', () => {
    it('should filter entries by start date', () => {
      const today = new Date();
      const startDate = new Date(today);
      startDate.setDate(today.getDate() - 7);

      service.updateFilters({
        startDate: startDate.toISOString().split('T')[0]
      });

      const filtered = service.filteredEntries();
      filtered.forEach(entry => {
        expect(entry.date >= startDate.toISOString().split('T')[0]).toBe(true);
      });
    });

    it('should filter entries by end date', () => {
      const today = new Date();
      const endDate = new Date(today);
      endDate.setDate(today.getDate() - 7);

      service.updateFilters({
        endDate: endDate.toISOString().split('T')[0]
      });

      const filtered = service.filteredEntries();
      filtered.forEach(entry => {
        expect(entry.date <= endDate.toISOString().split('T')[0]).toBe(true);
      });
    });

    it('should filter entries by status', () => {
      service.updateFilters({
        status: TimesheetStatus.COMPLETE
      });

      const filtered = service.filteredEntries();
      filtered.forEach(entry => {
        expect(entry.status).toBe(TimesheetStatus.COMPLETE);
      });
    });

    it('should filter entries by duration range (less than 4)', () => {
      service.updateFilters({
        durationRange: 'less_than_4' as any
      });

      const filtered = service.filteredEntries();
      filtered.forEach(entry => {
        expect(entry.totalHours).toBeLessThan(4);
      });
    });

    it('should filter entries by duration range (4 to 8)', () => {
      service.updateFilters({
        durationRange: '4_to_8' as any
      });

      const filtered = service.filteredEntries();
      filtered.forEach(entry => {
        expect(entry.totalHours).toBeGreaterThanOrEqual(4);
        expect(entry.totalHours).toBeLessThanOrEqual(8);
      });
    });

    it('should filter entries by duration range (more than 8)', () => {
      service.updateFilters({
        durationRange: 'more_than_8' as any
      });

      const filtered = service.filteredEntries();
      filtered.forEach(entry => {
        expect(entry.totalHours).toBeGreaterThan(8);
      });
    });

    it('should filter entries by custom duration range', () => {
      service.updateFilters({
        durationRange: 'custom' as any,
        minHours: 5,
        maxHours: 7
      });

      const filtered = service.filteredEntries();
      filtered.forEach(entry => {
        expect(entry.totalHours).toBeGreaterThanOrEqual(5);
        expect(entry.totalHours).toBeLessThanOrEqual(7);
      });
    });

    it('should filter entries by notes search', () => {
      service.updateFilters({
        searchNotes: 'meeting'
      });

      const filtered = service.filteredEntries();
      filtered.forEach(entry => {
        expect(entry.notes?.toLowerCase()).toContain('meeting');
      });
    });

    it('should filter entries by minimum break time', () => {
      service.updateFilters({
        minBreakTime: 45
      });

      const filtered = service.filteredEntries();
      filtered.forEach(entry => {
        expect(entry.totalBreakTime).toBeGreaterThanOrEqual(45);
      });
    });

    it('should filter entries by maximum break time', () => {
      service.updateFilters({
        maxBreakTime: 40
      });

      const filtered = service.filteredEntries();
      filtered.forEach(entry => {
        expect(entry.totalBreakTime).toBeLessThanOrEqual(40);
      });
    });

    it('should clear filters', () => {
      service.updateFilters({
        status: TimesheetStatus.COMPLETE
      });

      service.clearFilters();

      const filters = service.filters();
      expect(filters.startDate).toBeUndefined();
      expect(filters.endDate).toBeUndefined();
      expect(filters.status).toBeUndefined();
    });

    it('should reset to first page when filters change', () => {
      service.setPage(2);
      expect(service.pagination().page).toBe(2);

      service.updateFilters({ status: TimesheetStatus.COMPLETE });
      expect(service.pagination().page).toBe(1);
    });
  });

  describe('sorting', () => {
    it('should sort by date ascending', () => {
      service.updateSort('date');
      
      const sorted = service.sortedEntries();
      for (let i = 1; i < sorted.length; i++) {
        expect(sorted[i].date >= sorted[i - 1].date).toBe(true);
      }
    });

    it('should toggle sort direction', () => {
      service.updateSort('date');
      expect(service.sort().direction).toBe('asc');

      service.updateSort('date');
      expect(service.sort().direction).toBe('desc');
    });

    it('should sort by total hours', () => {
      service.updateSort('totalHours');

      const sorted = service.sortedEntries();
      expect(service.sort().field).toBe('totalHours');
      expect(service.sort().direction).toBe('asc');
    });
  });

  describe('pagination', () => {
    it('should paginate entries correctly', () => {
      const pageSize = 5;
      service.setPageSize(pageSize);

      const paginated = service.paginatedEntries();
      expect(paginated.length).toBeLessThanOrEqual(pageSize);
    });

    it('should change page', () => {
      service.setPage(2);
      expect(service.pagination().page).toBe(2);
    });

    it('should update page size and reset to first page', () => {
      service.setPage(2);
      service.setPageSize(25);

      expect(service.pagination().pageSize).toBe(25);
      expect(service.pagination().page).toBe(1);
    });

    it('should calculate total pages correctly', () => {
      const totalItems = service.pagination().totalItems;
      const pageSize = service.pagination().pageSize;
      const expectedPages = Math.ceil(totalItems / pageSize);

      expect(service.pagination().totalPages).toBe(expectedPages);
    });
  });

  describe('summaries', () => {
    it('should calculate weekly summary', () => {
      const summary = service.weeklySummary();
      
      if (summary) {
        expect(summary.totalHours).toBeGreaterThanOrEqual(0);
        expect(summary.daysWorked).toBeGreaterThanOrEqual(0);
        expect(summary.totalBreakTime).toBeGreaterThanOrEqual(0);
        expect(summary.weekNumber).toBeGreaterThan(0);
      }
    });

    it('should calculate monthly summary', () => {
      const summary = service.monthlySummary();
      
      if (summary) {
        expect(summary.totalHours).toBeGreaterThanOrEqual(0);
        expect(summary.daysWorked).toBeGreaterThanOrEqual(0);
        expect(summary.totalBreakTime).toBeGreaterThanOrEqual(0);
        expect(summary.expectedHours).toBeGreaterThan(0);
      }
    });

    it('should calculate average hours per day', () => {
      const summary = service.weeklySummary();
      
      if (summary && summary.daysWorked > 0) {
        const expectedAverage = summary.totalHours / summary.daysWorked;
        expect(Math.abs(summary.averageHoursPerDay - expectedAverage)).toBeLessThan(0.01);
      }
    });
  });

  describe('combined filters and sorting', () => {
    it('should apply filters before sorting', () => {
      service.updateFilters({ status: TimesheetStatus.COMPLETE });
      service.updateSort('date');

      const filtered = service.filteredEntries();
      const sorted = service.sortedEntries();

      expect(sorted.length).toBe(filtered.length);
      sorted.forEach(entry => {
        expect(entry.status).toBe(TimesheetStatus.COMPLETE);
      });
    });

    it('should apply sorting before pagination', () => {
      service.updateSort('totalHours');
      service.setPageSize(5);

      const paginated = service.paginatedEntries();
      const sorted = service.sortedEntries();

      expect(paginated[0]).toEqual(sorted[0]);
    });
  });
});
