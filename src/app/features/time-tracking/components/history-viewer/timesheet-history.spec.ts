import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { TimesheetHistory } from './timesheet-history';
import { TimesheetHistoryService } from '../../services/timesheet-history.service';
import { TimesheetStatus } from '../../models/timesheet-history.model';

describe('TimesheetHistory', () => {
  let component: TimesheetHistory;
  let fixture: ComponentFixture<TimesheetHistory>;
  let service: TimesheetHistoryService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TimesheetHistory],
      providers: [
        provideZonelessChangeDetection(),
        TimesheetHistoryService
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TimesheetHistory);
    component = fixture.componentInstance;
    service = TestBed.inject(TimesheetHistoryService);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display timesheet entries', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const table = compiled.querySelector('table');
    expect(table).toBeTruthy();
  });

  it('should show pagination controls when there are multiple pages', () => {
    service.setPageSize(5);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    
    if (service.pagination().totalPages > 1) {
      const paginationControls = compiled.querySelector('.flex.items-center.gap-2');
      expect(paginationControls).toBeTruthy();
    }
  });

  it('should display summary stats', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    // Look for the summary stats container with the new compact layout
    const statsContainer = compiled.querySelector('.grid.grid-cols-3.divide-x');
    expect(statsContainer).toBeTruthy();
  });

  describe('sorting', () => {
    it('should update sort when header clicked', () => {
      const initialSort = service.sort();
      component['onSort']('totalHours');
      
      const newSort = service.sort();
      expect(newSort.field).toBe('totalHours');
    });

    it('should toggle sort direction on same field', () => {
      component['onSort']('date');
      const firstDirection = service.sort().direction;

      component['onSort']('date');
      const secondDirection = service.sort().direction;

      expect(firstDirection).not.toBe(secondDirection);
    });
  });

  describe('pagination', () => {
    it('should change to next page', () => {
      service.setPage(1);
      component['onNextPage']();
      
      if (service.pagination().totalPages > 1) {
        expect(service.pagination().page).toBe(2);
      }
    });

    it('should change to previous page', () => {
      service.setPage(2);
      component['onPreviousPage']();
      
      expect(service.pagination().page).toBe(1);
    });

    it('should not go below page 1', () => {
      service.setPage(1);
      component['onPreviousPage']();
      
      expect(service.pagination().page).toBe(1);
    });

    it('should not exceed total pages', () => {
      const totalPages = service.pagination().totalPages;
      service.setPage(totalPages);
      component['onNextPage']();
      
      expect(service.pagination().page).toBe(totalPages);
    });

    it('should update page size', () => {
      component['onPageSizeChange']('25');
      
      expect(service.pagination().pageSize).toBe(25);
    });
  });

  describe('formatting', () => {
    it('should format date correctly', () => {
      const dateString = '2024-01-15';
      const formatted = component['formatDate'](dateString);
      expect(formatted).toContain('Jan');
      expect(formatted).toContain('15');
    });

    it('should format time correctly', () => {
      const date = new Date('2024-01-15T14:30:00');
      const formatted = component['formatTime'](date);
      expect(formatted).toMatch(/\d{2}:\d{2}/);
    });

    it('should format minutes correctly', () => {
      const minutes = 90;
      const formatted = component['formatMinutes'](minutes);
      expect(formatted).toBe('1h 30m');
    });

    it('should get correct status label', () => {
      expect(component['getStatusLabel'](TimesheetStatus.COMPLETE)).toBe('Complete');
      expect(component['getStatusLabel'](TimesheetStatus.INCOMPLETE)).toBe('Incomplete');
      expect(component['getStatusLabel'](TimesheetStatus.IN_PROGRESS)).toBe('In Progress');
    });

    it('should get correct status badge class', () => {
      const completeClass = component['getStatusBadgeClass'](TimesheetStatus.COMPLETE);
      expect(completeClass).toContain('bg-green-100');
      expect(completeClass).toContain('text-green-800');
    });
  });

  describe('page numbers', () => {
    it('should generate correct page numbers', () => {
      service.setPageSize(5);
      const pages = component['getPageNumbers']();
      
      expect(pages.length).toBeGreaterThan(0);
      expect(pages[0]).toBeGreaterThanOrEqual(1);
    });

    it('should limit visible pages to 5', () => {
      service.setPageSize(2);
      const pages = component['getPageNumbers']();
      
      expect(pages.length).toBeLessThanOrEqual(5);
    });
  });

  describe('index calculations', () => {
    it('should calculate start index correctly', () => {
      service.setPageSize(10);
      fixture.detectChanges();
      service.setPage(2);
      fixture.detectChanges();
      
      const startIndex = component['getStartIndex']();
      expect(startIndex).toBe(11);
    });

    it('should calculate end index correctly', () => {
      service.setPage(1);
      service.setPageSize(10);
      
      const endIndex = component['getEndIndex']();
      expect(endIndex).toBeLessThanOrEqual(10);
    });

    it('should not exceed total items for end index', () => {
      const totalPages = service.pagination().totalPages;
      service.setPage(totalPages);
      
      const endIndex = component['getEndIndex']();
      const totalItems = service.pagination().totalItems;
      
      expect(endIndex).toBeLessThanOrEqual(totalItems);
    });
  });

  describe('working days calculation', () => {
    it('should calculate working days correctly for a month', () => {
      const workingDays = component['getWorkingDays'](0, 2024); // January 2024
      expect(workingDays).toBeGreaterThan(0);
      expect(workingDays).toBeLessThanOrEqual(31);
    });

    it('should exclude weekends', () => {
      const workingDays = component['getWorkingDays'](0, 2024);
      expect(workingDays).toBeLessThan(31);
    });
  });

  describe('accessibility', () => {
    it('should have aria-label on table', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const table = compiled.querySelector('table');
      expect(table?.getAttribute('aria-label')).toBeTruthy();
    });

    it('should have aria-labels on sort buttons', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const sortButtons = compiled.querySelectorAll('th[role="button"]');
      sortButtons.forEach(button => {
        expect(button.getAttribute('aria-label')).toBeTruthy();
      });
    });

    it('should have aria-current on active page button', () => {
      const currentPage = service.pagination().page;
      fixture.detectChanges();
      
      const compiled = fixture.nativeElement as HTMLElement;
      const pageButtons = compiled.querySelectorAll('button[aria-current]');
      
      if (pageButtons.length > 0) {
        expect(pageButtons[0].textContent?.trim()).toBe(currentPage.toString());
      }
    });
  });
});
