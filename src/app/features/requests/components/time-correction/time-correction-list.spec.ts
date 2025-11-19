import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { TimeCorrectionList } from './time-correction-list';
import { TimeCorrectionService } from '../../services/time-correction.service';
import { TimeCorrectionStatus } from '../../models/time-correction.model';
import { TimesheetEntry, TimesheetStatus } from '../../../time-tracking/models/timesheet-history.model';

describe('TimeCorrectionList', () => {
  let component: TimeCorrectionList;
  let fixture: ComponentFixture<TimeCorrectionList>;
  let service: TimeCorrectionService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TimeCorrectionList],
      providers: [
        provideZonelessChangeDetection(),
        TimeCorrectionService
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TimeCorrectionList);
    component = fixture.componentInstance;
    service = TestBed.inject(TimeCorrectionService);
    
    localStorage.clear();
    fixture.detectChanges();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('filter buttons', () => {
    it('should default to "all" filter', () => {
      expect(component['currentFilter']()).toBe('all');
    });

    it('should change filter when button is clicked', () => {
      component['setFilter']('pending');
      expect(component['currentFilter']()).toBe('pending');

      component['setFilter']('approved');
      expect(component['currentFilter']()).toBe('approved');

      component['setFilter']('rejected');
      expect(component['currentFilter']()).toBe('rejected');

      component['setFilter']('all');
      expect(component['currentFilter']()).toBe('all');
    });
  });

  describe('filtered requests', () => {
    beforeEach(() => {
      const originalEntry: TimesheetEntry = {
        id: 'entry-1',
        date: '2024-01-15',
        clockIn: new Date('2024-01-15T08:00:00'),
        clockOut: new Date('2024-01-15T16:00:00'),
        breaks: [],
        totalHours: 8,
        totalBreakTime: 0,
        status: TimesheetStatus.COMPLETE
      };

      // Create requests with different statuses
      const request1 = service.submitRequest({
        timeEntryId: 'entry-1',
        requestedClockIn: '09:00',
        reason: 'First request - will be approved'
      }, originalEntry);

      const request2 = service.submitRequest({
        timeEntryId: 'entry-1',
        requestedClockOut: '18:00',
        reason: 'Second request - will be rejected'
      }, originalEntry);

      service.submitRequest({
        timeEntryId: 'entry-1',
        requestedClockIn: '08:30',
        reason: 'Third request - stays pending'
      }, originalEntry);

      service.approveRequest(request1.id);
      service.rejectRequest(request2.id);

      fixture.detectChanges();
    });

    it('should show all requests when filter is "all"', () => {
      component['setFilter']('all');
      fixture.detectChanges();

      const filtered = component['filteredRequests']();
      expect(filtered.length).toBe(3);
    });

    it('should show only pending requests when filter is "pending"', () => {
      component['setFilter']('pending');
      fixture.detectChanges();

      const filtered = component['filteredRequests']();
      expect(filtered.length).toBe(1);
      expect(filtered[0].status).toBe(TimeCorrectionStatus.PENDING);
    });

    it('should show only approved requests when filter is "approved"', () => {
      component['setFilter']('approved');
      fixture.detectChanges();

      const filtered = component['filteredRequests']();
      expect(filtered.length).toBe(1);
      expect(filtered[0].status).toBe(TimeCorrectionStatus.APPROVED);
    });

    it('should show only rejected requests when filter is "rejected"', () => {
      component['setFilter']('rejected');
      fixture.detectChanges();

      const filtered = component['filteredRequests']();
      expect(filtered.length).toBe(1);
      expect(filtered[0].status).toBe(TimeCorrectionStatus.REJECTED);
    });
  });

  describe('empty state', () => {
    it('should display empty state when no requests', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const emptyState = compiled.querySelector('h3');
      
      expect(emptyState?.textContent).toContain('No requests found');
    });

    it('should not display empty state when requests exist', () => {
      const originalEntry: TimesheetEntry = {
        id: 'entry-1',
        date: '2024-01-15',
        clockIn: new Date('2024-01-15T08:00:00'),
        breaks: [],
        totalHours: 0,
        totalBreakTime: 0,
        status: TimesheetStatus.IN_PROGRESS
      };

      service.submitRequest({
        timeEntryId: 'entry-1',
        requestedClockIn: '09:00',
        reason: 'Test correction request'
      }, originalEntry);

      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const emptyState = compiled.querySelector('h3')?.textContent;
      
      expect(emptyState).not.toContain('No requests found');
    });
  });

  describe('request display', () => {
    beforeEach(() => {
      const originalEntry: TimesheetEntry = {
        id: 'entry-1',
        date: '2024-01-15',
        clockIn: new Date('2024-01-15T08:00:00'),
        clockOut: new Date('2024-01-15T16:00:00'),
        breaks: [],
        totalHours: 8,
        totalBreakTime: 0,
        status: TimesheetStatus.COMPLETE
      };

      service.submitRequest({
        timeEntryId: 'entry-1',
        requestedClockIn: '09:00',
        requestedClockOut: '17:00',
        reason: 'Test correction request'
      }, originalEntry);

      fixture.detectChanges();
    });

    it('should display request details', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      
      expect(compiled.textContent).toContain('Test correction request');
    });

    it('should display status badge', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const badge = compiled.querySelector('[aria-label*="Status"]');
      
      expect(badge?.textContent).toContain(TimeCorrectionStatus.PENDING);
    });
  });

  describe('request counts', () => {
    beforeEach(() => {
      const originalEntry: TimesheetEntry = {
        id: 'entry-1',
        date: '2024-01-15',
        clockIn: new Date('2024-01-15T08:00:00'),
        clockOut: new Date('2024-01-15T16:00:00'),
        breaks: [],
        totalHours: 8,
        totalBreakTime: 0,
        status: TimesheetStatus.COMPLETE
      };

      const request1 = service.submitRequest({
        timeEntryId: 'entry-1',
        requestedClockIn: '09:00',
        reason: 'First request'
      }, originalEntry);

      const request2 = service.submitRequest({
        timeEntryId: 'entry-1',
        requestedClockOut: '18:00',
        reason: 'Second request'
      }, originalEntry);

      service.approveRequest(request1.id);
      service.rejectRequest(request2.id);

      fixture.detectChanges();
    });

    it('should display correct counts in filter buttons', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      
      expect(compiled.textContent).toContain('All (2)');
      expect(compiled.textContent).toContain('Pending (0)');
      expect(compiled.textContent).toContain('Approved (1)');
      expect(compiled.textContent).toContain('Rejected (1)');
    });
  });

  describe('formatting methods', () => {
    it('should format date correctly', () => {
      const formatted = component['formatDate']('2024-01-15');
      expect(formatted).toContain('Jan');
      expect(formatted).toContain('15');
    });

    it('should format time correctly', () => {
      const date = new Date('2024-01-15T14:30:00');
      const formatted = component['formatTime'](date);
      expect(formatted).toContain('2:30');
      expect(formatted).toContain('PM');
    });

    it('should format relative time correctly', () => {
      const now = new Date();
      const formatted = component['formatRelativeTime'](now);
      expect(formatted).toBe('just now');
    });
  });
});
