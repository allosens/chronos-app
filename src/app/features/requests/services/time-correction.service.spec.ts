import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { TimeCorrectionService } from './time-correction.service';
import { TimeCorrectionStatus, TimeCorrectionFormData } from '../models/time-correction.model';
import { TimesheetEntry, TimesheetStatus } from '../../time-tracking/models/timesheet-history.model';

describe('TimeCorrectionService', () => {
  let service: TimeCorrectionService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        TimeCorrectionService
      ]
    });

    service = TestBed.inject(TimeCorrectionService);
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('submitRequest', () => {
    it('should create a new time correction request', () => {
      const formData: TimeCorrectionFormData = {
        timeEntryId: 'entry-1',
        requestedClockIn: '09:00',
        requestedClockOut: '17:00',
        reason: 'Forgot to clock in on time'
      };

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

      const request = service.submitRequest(formData, originalEntry);

      expect(request).toBeTruthy();
      expect(request.status).toBe(TimeCorrectionStatus.PENDING);
      expect(request.reason).toBe(formData.reason);
      expect(request.timeEntryId).toBe('entry-1');
      expect(service.requests().length).toBe(1);
    });

    it('should add request to the list', () => {
      const formData: TimeCorrectionFormData = {
        timeEntryId: 'entry-1',
        requestedClockIn: '09:00',
        reason: 'Test reason for correction'
      };

      const originalEntry: TimesheetEntry = {
        id: 'entry-1',
        date: '2024-01-15',
        clockIn: new Date('2024-01-15T08:00:00'),
        breaks: [],
        totalHours: 0,
        totalBreakTime: 0,
        status: TimesheetStatus.IN_PROGRESS
      };

      service.submitRequest(formData, originalEntry);
      
      expect(service.requestCount()).toBe(1);
      expect(service.pendingCount()).toBe(1);
    });

    it('should save request to localStorage', () => {
      const formData: TimeCorrectionFormData = {
        timeEntryId: 'entry-1',
        requestedClockIn: '09:00',
        reason: 'Test reason that is long enough'
      };

      const originalEntry: TimesheetEntry = {
        id: 'entry-1',
        date: '2024-01-15',
        clockIn: new Date('2024-01-15T08:00:00'),
        breaks: [],
        totalHours: 0,
        totalBreakTime: 0,
        status: TimesheetStatus.IN_PROGRESS
      };

      service.submitRequest(formData, originalEntry);

      const saved = localStorage.getItem('chronos-time-correction-requests');
      expect(saved).toBeTruthy();
      
      const parsed = JSON.parse(saved!);
      expect(parsed.length).toBe(1);
      expect(parsed[0].reason).toBe(formData.reason);
    });
  });

  describe('filtering requests', () => {
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

      // Approve first, reject second
      service.approveRequest(request1.id, 'Approved by manager');
      service.rejectRequest(request2.id, 'Invalid reason');
    });

    it('should filter pending requests', () => {
      const pending = service.pendingRequests();
      expect(pending.length).toBe(1);
      expect(pending[0].status).toBe(TimeCorrectionStatus.PENDING);
    });

    it('should filter approved requests', () => {
      const approved = service.approvedRequests();
      expect(approved.length).toBe(1);
      expect(approved[0].status).toBe(TimeCorrectionStatus.APPROVED);
      expect(approved[0].reviewNotes).toBe('Approved by manager');
    });

    it('should filter rejected requests', () => {
      const rejected = service.rejectedRequests();
      expect(rejected.length).toBe(1);
      expect(rejected[0].status).toBe(TimeCorrectionStatus.DENIED);
      expect(rejected[0].reviewNotes).toBe('Invalid reason');
    });

    it('should return all requests', () => {
      const all = service.requests();
      expect(all.length).toBe(3);
    });
  });

  describe('getRequestsByStatus', () => {
    it('should return requests filtered by status', () => {
      const originalEntry: TimesheetEntry = {
        id: 'entry-1',
        date: '2024-01-15',
        clockIn: new Date('2024-01-15T08:00:00'),
        breaks: [],
        totalHours: 0,
        totalBreakTime: 0,
        status: TimesheetStatus.IN_PROGRESS
      };

      const request = service.submitRequest({
        timeEntryId: 'entry-1',
        requestedClockIn: '09:00',
        reason: 'Test correction request'
      }, originalEntry);

      const pending = service.getRequestsByStatus(TimeCorrectionStatus.PENDING);
      expect(pending.length).toBe(1);
      expect(pending[0].id).toBe(request.id);
    });
  });

  describe('getRequestById', () => {
    it('should return request by id', () => {
      const originalEntry: TimesheetEntry = {
        id: 'entry-1',
        date: '2024-01-15',
        clockIn: new Date('2024-01-15T08:00:00'),
        breaks: [],
        totalHours: 0,
        totalBreakTime: 0,
        status: TimesheetStatus.IN_PROGRESS
      };

      const request = service.submitRequest({
        timeEntryId: 'entry-1',
        requestedClockIn: '09:00',
        reason: 'Test correction request'
      }, originalEntry);

      const found = service.getRequestById(request.id);
      expect(found).toBeTruthy();
      expect(found?.id).toBe(request.id);
    });

    it('should return undefined for non-existent id', () => {
      const found = service.getRequestById('non-existent');
      expect(found).toBeUndefined();
    });
  });

  describe('convertToTimeEntrySummaries', () => {
    it('should convert time entries to summaries', () => {
      const entries: TimesheetEntry[] = [
        {
          id: 'entry-1',
          date: '2024-01-15',
          clockIn: new Date('2024-01-15T08:00:00'),
          clockOut: new Date('2024-01-15T16:00:00'),
          breaks: [],
          totalHours: 8,
          totalBreakTime: 0,
          status: TimesheetStatus.COMPLETE
        },
        {
          id: 'entry-2',
          date: '2024-01-16',
          clockIn: new Date('2024-01-16T09:00:00'),
          breaks: [],
          totalHours: 0,
          totalBreakTime: 0,
          status: TimesheetStatus.IN_PROGRESS
        }
      ];

      const summaries = service.convertToTimeEntrySummaries(entries);
      
      expect(summaries.length).toBe(2);
      expect(summaries[0].id).toBe('entry-1');
      expect(summaries[0].displayText).toContain('Jan 15');
      expect(summaries[1].id).toBe('entry-2');
    });

    it('should filter out entries without clock in', () => {
      const entries: TimesheetEntry[] = [
        {
          id: 'entry-1',
          date: '2024-01-15',
          breaks: [],
          totalHours: 0,
          totalBreakTime: 0,
          status: TimesheetStatus.INCOMPLETE
        }
      ];

      const summaries = service.convertToTimeEntrySummaries(entries);
      expect(summaries.length).toBe(0);
    });
  });

  describe('approveRequest', () => {
    it('should approve a request', () => {
      const originalEntry: TimesheetEntry = {
        id: 'entry-1',
        date: '2024-01-15',
        clockIn: new Date('2024-01-15T08:00:00'),
        breaks: [],
        totalHours: 0,
        totalBreakTime: 0,
        status: TimesheetStatus.IN_PROGRESS
      };

      const request = service.submitRequest({
        timeEntryId: 'entry-1',
        requestedClockIn: '09:00',
        reason: 'Test correction request'
      }, originalEntry);

      service.approveRequest(request.id, 'Approved');

      const approved = service.getRequestById(request.id);
      expect(approved?.status).toBe(TimeCorrectionStatus.APPROVED);
      expect(approved?.reviewNotes).toBe('Approved');
      expect(approved?.reviewedAt).toBeTruthy();
      expect(approved?.reviewedBy).toBe('Admin User');
    });
  });

  describe('rejectRequest', () => {
    it('should reject a request', () => {
      const originalEntry: TimesheetEntry = {
        id: 'entry-1',
        date: '2024-01-15',
        clockIn: new Date('2024-01-15T08:00:00'),
        breaks: [],
        totalHours: 0,
        totalBreakTime: 0,
        status: TimesheetStatus.IN_PROGRESS
      };

      const request = service.submitRequest({
        timeEntryId: 'entry-1',
        requestedClockIn: '09:00',
        reason: 'Test correction request'
      }, originalEntry);

      service.rejectRequest(request.id, 'Invalid');

      const rejected = service.getRequestById(request.id);
      expect(rejected?.status).toBe(TimeCorrectionStatus.DENIED);
      expect(rejected?.reviewNotes).toBe('Invalid');
      expect(rejected?.reviewedAt).toBeTruthy();
    });
  });

  describe('clearAllRequests', () => {
    it('should clear all requests', () => {
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

      expect(service.requestCount()).toBe(1);

      service.clearAllRequests();

      expect(service.requestCount()).toBe(0);
    });
  });

  describe('localStorage persistence', () => {
    it('should load saved requests on init', () => {
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

      // Create new service instance to test loading
      const newService = TestBed.inject(TimeCorrectionService);

      expect(newService.requestCount()).toBe(1);
    });
  });
});
