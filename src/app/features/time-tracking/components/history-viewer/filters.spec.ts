import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HistoryFiltersComponent } from './filters';
import { TimesheetHistoryService } from '../../services/timesheet-history.service';
import { TimesheetStatus } from '../../models/timesheet-history.model';

describe('HistoryFiltersComponent', () => {
  let component: HistoryFiltersComponent;
  let fixture: ComponentFixture<HistoryFiltersComponent>;
  let service: TimesheetHistoryService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HistoryFiltersComponent, FormsModule],
      providers: [
        provideZonelessChangeDetection(),
        TimesheetHistoryService
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(HistoryFiltersComponent);
    component = fixture.componentInstance;
    service = TestBed.inject(TimesheetHistoryService);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display filter inputs', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const startDateInput = compiled.querySelector('#startDate');
    const endDateInput = compiled.querySelector('#endDate');
    const statusSelect = compiled.querySelector('#status');

    expect(startDateInput).toBeTruthy();
    expect(endDateInput).toBeTruthy();
    expect(statusSelect).toBeTruthy();
  });

  describe('filter changes', () => {
    it('should update service when start date changes', () => {
      const testDate = '2024-01-01';
      component['startDate'] = testDate;
      component['onFilterChange']();

      const filters = service.filters();
      expect(filters.startDate).toBe(testDate);
    });

    it('should update service when end date changes', () => {
      const testDate = '2024-01-31';
      component['endDate'] = testDate;
      component['onFilterChange']();

      const filters = service.filters();
      expect(filters.endDate).toBe(testDate);
    });

    it('should update service when status changes', () => {
      component['statusFilter'] = TimesheetStatus.COMPLETE;
      component['onFilterChange']();

      const filters = service.filters();
      expect(filters.status).toBe(TimesheetStatus.COMPLETE);
    });
  });

  describe('quick filters', () => {
    it('should apply this week filter', () => {
      component['applyQuickFilter']('thisWeek');

      expect(component['startDate']).toBeTruthy();
      expect(component['endDate']).toBeTruthy();

      const start = new Date(component['startDate']);
      const end = new Date(component['endDate']);
      const daysDiff = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

      expect(daysDiff).toBe(6); // Monday to Sunday
    });

    it('should apply last week filter', () => {
      component['applyQuickFilter']('lastWeek');

      expect(component['startDate']).toBeTruthy();
      expect(component['endDate']).toBeTruthy();

      const start = new Date(component['startDate']);
      const end = new Date(component['endDate']);
      const daysDiff = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

      expect(daysDiff).toBe(6);
    });

    it('should apply this month filter', () => {
      component['applyQuickFilter']('thisMonth');

      expect(component['startDate']).toBeTruthy();
      expect(component['endDate']).toBeTruthy();

      const start = new Date(component['startDate']);
      const today = new Date();

      expect(start.getMonth()).toBe(today.getMonth());
      expect(start.getDate()).toBe(1);
    });
  });

  describe('clear filters', () => {
    it('should clear all filter values', () => {
      component['startDate'] = '2024-01-01';
      component['endDate'] = '2024-01-31';
      component['statusFilter'] = TimesheetStatus.COMPLETE;

      component['clearFilters']();

      expect(component['startDate']).toBe('');
      expect(component['endDate']).toBe('');
      expect(component['statusFilter']).toBe('');
    });

    it('should clear service filters', () => {
      service.updateFilters({
        startDate: '2024-01-01',
        status: TimesheetStatus.COMPLETE
      });

      component['clearFilters']();

      const filters = service.filters();
      expect(filters.startDate).toBeUndefined();
      expect(filters.status).toBeUndefined();
    });
  });

  describe('active filters detection', () => {
    it('should detect no active filters initially', () => {
      expect(component['hasActiveFilters']()).toBe(false);
    });

    it('should detect active start date filter', () => {
      component['startDate'] = '2024-01-01';
      expect(component['hasActiveFilters']()).toBe(true);
    });

    it('should detect active end date filter', () => {
      component['endDate'] = '2024-01-31';
      expect(component['hasActiveFilters']()).toBe(true);
    });

    it('should detect active status filter', () => {
      component['statusFilter'] = TimesheetStatus.COMPLETE;
      expect(component['hasActiveFilters']()).toBe(true);
    });
  });

  describe('formatting', () => {
    it('should format date correctly', () => {
      const dateString = '2024-01-15';
      const formatted = component['formatDate'](dateString);
      expect(formatted).toContain('Jan');
      expect(formatted).toContain('15');
    });

    it('should format status correctly', () => {
      expect(component['formatStatus'](TimesheetStatus.COMPLETE)).toBe('Complete');
      expect(component['formatStatus'](TimesheetStatus.INCOMPLETE)).toBe('Incomplete');
      expect(component['formatStatus'](TimesheetStatus.IN_PROGRESS)).toBe('In Progress');
    });
  });

  describe('week calculation', () => {
    it('should get correct week start (Monday)', () => {
      const friday = new Date('2024-01-19'); // A Friday
      const weekStart = component['getWeekStart'](friday);
      
      expect(weekStart.getDay()).toBe(1); // Monday
    });

    it('should get correct week end (Sunday)', () => {
      const friday = new Date('2024-01-19'); // A Friday
      const weekEnd = component['getWeekEnd'](friday);
      
      expect(weekEnd.getDay()).toBe(0); // Sunday
    });

    it('should handle Sunday correctly', () => {
      const sunday = new Date('2024-01-21'); // A Sunday
      const weekStart = component['getWeekStart'](sunday);
      
      expect(weekStart.getDay()).toBe(1); // Previous Monday
    });
  });

  describe('UI elements', () => {
    it('should show quick filter buttons', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const buttons = compiled.querySelectorAll('button[type="button"]');
      
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('should display active filters when present', () => {
      component['startDate'] = '2024-01-01';
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const activeFilters = compiled.querySelector('.text-xs.text-gray-600.mb-2');
      
      expect(activeFilters?.textContent).toContain('Active filters');
    });

    it('should hide active filters when none present', () => {
      component['startDate'] = '';
      component['endDate'] = '';
      component['statusFilter'] = '';
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const activeFiltersSection = compiled.querySelector('.mt-4.pt-4.border-t');
      
      expect(activeFiltersSection).toBeFalsy();
    });
  });

  describe('accessibility', () => {
    it('should have aria-labels on inputs', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const startDateInput = compiled.querySelector('#startDate');
      const endDateInput = compiled.querySelector('#endDate');
      const statusSelect = compiled.querySelector('#status');

      expect(startDateInput?.getAttribute('aria-label')).toBeTruthy();
      expect(endDateInput?.getAttribute('aria-label')).toBeTruthy();
      expect(statusSelect?.getAttribute('aria-label')).toBeTruthy();
    });

    it('should have aria-labels on quick filter buttons', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const buttons = compiled.querySelectorAll('button[aria-label]');
      
      expect(buttons.length).toBeGreaterThan(0);
      buttons.forEach(button => {
        expect(button.getAttribute('aria-label')).toBeTruthy();
      });
    });
  });
});
