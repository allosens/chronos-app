import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { VacationManagementService } from './vacation-management.service';
import { VacationRequestService } from './vacation-request.service';
import { VacationRequestStatus, VacationRequestType } from '../models/vacation-request.model';

describe('VacationManagementService', () => {
  let service: VacationManagementService;
  let vacationService: VacationRequestService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        VacationManagementService,
        VacationRequestService
      ]
    });
    service = TestBed.inject(VacationManagementService);
    vacationService = TestBed.inject(VacationRequestService);
    
    // Clear localStorage before each test
    if (typeof window !== 'undefined') {
      localStorage.clear();
    }

    // Clear requests
    vacationService['vacationRequestsSignal'].set([]);
  });

  afterEach(() => {
    if (typeof window !== 'undefined') {
      localStorage.clear();
    }
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Approval and Rejection', () => {
    it('should approve a pending request', () => {
      // Create a pending request
      const request = vacationService.createVacationRequest({
        type: VacationRequestType.VACATION,
        startDate: '2025-12-01',
        endDate: '2025-12-05'
      });

      expect(request.status).toBe(VacationRequestStatus.PENDING);

      // Approve it
      service.approveRequest({
        requestId: request.id,
        action: 'approve',
        reviewComments: 'Approved for year-end vacation',
        reviewedBy: 'Manager'
      });

      const updatedRequest = vacationService.getRequestById(request.id);
      expect(updatedRequest?.status).toBe(VacationRequestStatus.APPROVED);
      expect(updatedRequest?.reviewComments).toBe('Approved for year-end vacation');
      expect(updatedRequest?.reviewedBy).toBe('Manager');
      expect(updatedRequest?.reviewedAt).toBeTruthy();
    });

    it('should reject a pending request', () => {
      const request = vacationService.createVacationRequest({
        type: VacationRequestType.VACATION,
        startDate: '2025-12-01',
        endDate: '2025-12-05'
      });

      service.rejectRequest({
        requestId: request.id,
        action: 'reject',
        reviewComments: 'Team capacity issue',
        reviewedBy: 'Manager'
      });

      const updatedRequest = vacationService.getRequestById(request.id);
      expect(updatedRequest?.status).toBe(VacationRequestStatus.DENIED);
      expect(updatedRequest?.reviewComments).toBe('Team capacity issue');
      expect(updatedRequest?.reviewedBy).toBe('Manager');
    });

    it('should not approve a non-pending request', () => {
      const request = vacationService.createVacationRequest({
        type: VacationRequestType.VACATION,
        startDate: '2025-12-01',
        endDate: '2025-12-05'
      });

      // First approval
      service.approveRequest({
        requestId: request.id,
        action: 'approve',
        reviewedBy: 'Manager1'
      });

      // Try to approve again
      service.approveRequest({
        requestId: request.id,
        action: 'approve',
        reviewedBy: 'Manager2'
      });

      const updatedRequest = vacationService.getRequestById(request.id);
      expect(updatedRequest?.reviewedBy).toBe('Manager1'); // Should still be the first reviewer
    });
  });

  describe('Filters', () => {
    beforeEach(() => {
      // Create some test data
      const req1 = vacationService.createVacationRequest({
        type: VacationRequestType.VACATION,
        startDate: '2025-12-01',
        endDate: '2025-12-05'
      }, 'emp-1');

      vacationService.createVacationRequest({
        type: VacationRequestType.PERSONAL,
        startDate: '2025-12-10',
        endDate: '2025-12-10'
      }, 'emp-2');

      // Approve one request
      service.approveRequest({
        requestId: req1.id,
        action: 'approve',
        reviewedBy: 'Admin'
      });
    });

    it('should filter by employee ID', () => {
      service.setFilters({ employeeId: 'emp-1' });
      
      const filtered = service.pendingRequestsForApproval();
      expect(filtered.every(r => r.employeeId === 'emp-1')).toBe(true);
    });

    it('should filter by status', () => {
      service.setFilters({ status: VacationRequestStatus.APPROVED });
      
      const filtered = service.approvedRequestsFiltered();
      expect(filtered.every(r => r.status === VacationRequestStatus.APPROVED)).toBe(true);
    });

    it('should clear all filters', () => {
      service.setFilters({ employeeId: 'emp-1' });
      service.clearFilters();
      
      expect(service.filters().employeeId).toBeUndefined();
    });
  });

  describe('Conflict Detection', () => {
    it('should detect conflicts with existing approved requests', () => {
      // Create and approve a request
      const request1 = vacationService.createVacationRequest({
        type: VacationRequestType.VACATION,
        startDate: '2025-12-01',
        endDate: '2025-12-10'
      }, 'emp-1');

      service.approveRequest({
        requestId: request1.id,
        action: 'approve',
        reviewedBy: 'Admin'
      });

      // Create a conflicting request
      const request2 = vacationService.createVacationRequest({
        type: VacationRequestType.VACATION,
        startDate: '2025-12-05',
        endDate: '2025-12-15'
      }, 'emp-2');

      const conflicts = service.getConflicts(request2.id);
      expect(conflicts.length).toBeGreaterThan(0);
      expect(conflicts[0].employeeId).toBe('emp-1');
    });

    it('should not detect conflicts with non-overlapping dates', () => {
      const request1 = vacationService.createVacationRequest({
        type: VacationRequestType.VACATION,
        startDate: '2025-12-01',
        endDate: '2025-12-05'
      });

      service.approveRequest({
        requestId: request1.id,
        action: 'approve',
        reviewedBy: 'Admin'
      });

      const request2 = vacationService.createVacationRequest({
        type: VacationRequestType.VACATION,
        startDate: '2025-12-10',
        endDate: '2025-12-15'
      });

      const conflicts = service.getConflicts(request2.id);
      expect(conflicts.length).toBe(0);
    });

    it('should calculate overlap days correctly', () => {
      const request1 = vacationService.createVacationRequest({
        type: VacationRequestType.VACATION,
        startDate: '2025-12-01',
        endDate: '2025-12-10'
      }, 'emp-1');

      service.approveRequest({
        requestId: request1.id,
        action: 'approve',
        reviewedBy: 'Admin'
      });

      const request2 = vacationService.createVacationRequest({
        type: VacationRequestType.VACATION,
        startDate: '2025-12-05',
        endDate: '2025-12-08'
      }, 'emp-2');

      const conflicts = service.getConflicts(request2.id);
      expect(conflicts.length).toBeGreaterThan(0);
      expect(conflicts[0].overlapDays).toBeGreaterThan(0);
    });
  });

  describe('Team Availability', () => {
    it('should check team availability for a date range', () => {
      const startDate = new Date('2025-12-01');
      const endDate = new Date('2025-12-05');

      const availability = service.checkTeamAvailability(startDate, endDate);
      
      expect(availability.length).toBeGreaterThan(0);
      expect(availability[0].totalEmployees).toBe(10); // Default
    });

    it('should validate team availability when approving', () => {
      const request = vacationService.createVacationRequest({
        type: VacationRequestType.VACATION,
        startDate: '2025-12-01',
        endDate: '2025-12-05'
      });

      const validation = service.validateTeamAvailability(request.id);
      expect(validation.valid).toBeDefined();
    });

    it('should return invalid for non-existent request', () => {
      const validation = service.validateTeamAvailability('non-existent-id');
      expect(validation.valid).toBe(false);
      expect(validation.message).toBeTruthy();
    });
  });

  describe('Employee Summaries', () => {
    it('should generate employee vacation summaries', () => {
      vacationService.createVacationRequest({
        type: VacationRequestType.VACATION,
        startDate: '2025-12-01',
        endDate: '2025-12-05'
      }, 'emp-1');

      const summaries = service.getEmployeeSummaries();
      expect(summaries.length).toBeGreaterThan(0);
      expect(summaries[0].employeeId).toBeTruthy();
      expect(summaries[0].totalDaysAllowed).toBe(22);
    });

    it('should calculate days used and pending correctly', () => {
      const req1 = vacationService.createVacationRequest({
        type: VacationRequestType.VACATION,
        startDate: '2025-12-01',
        endDate: '2025-12-05'
      }, 'emp-1');

      service.approveRequest({
        requestId: req1.id,
        action: 'approve',
        reviewedBy: 'Admin'
      });

      vacationService.createVacationRequest({
        type: VacationRequestType.VACATION,
        startDate: '2025-12-10',
        endDate: '2025-12-12'
      }, 'emp-1');

      const summaries = service.getEmployeeSummaries();
      const emp1Summary = summaries.find(s => s.employeeId === 'emp-1');
      
      expect(emp1Summary).toBeTruthy();
      expect(emp1Summary!.daysUsed).toBeGreaterThan(0);
      expect(emp1Summary!.daysPending).toBeGreaterThan(0);
      expect(emp1Summary!.daysRemaining).toBeLessThan(22);
    });
  });

  describe('Calendar Generation', () => {
    it('should generate calendar days', () => {
      const startDate = new Date('2025-12-01');
      const endDate = new Date('2025-12-07');

      const calendar = service.generateCalendar(startDate, endDate);
      expect(calendar.length).toBe(7);
    });

    it('should mark weekends correctly', () => {
      // December 6, 2025 is a Saturday
      const startDate = new Date('2025-12-06');
      const endDate = new Date('2025-12-07'); // Sunday

      const calendar = service.generateCalendar(startDate, endDate);
      expect(calendar.every(day => day.isWeekend)).toBe(true);
    });

    it('should include vacation information in calendar days', () => {
      const request = vacationService.createVacationRequest({
        type: VacationRequestType.VACATION,
        startDate: '2025-12-01',
        endDate: '2025-12-05'
      });

      service.approveRequest({
        requestId: request.id,
        action: 'approve',
        reviewedBy: 'Admin'
      });

      const calendar = service.generateCalendar(
        new Date('2025-12-01'),
        new Date('2025-12-05')
      );

      const hasVacations = calendar.some(day => day.vacations.length > 0);
      expect(hasVacations).toBe(true);
    });

    it('should calculate availability percentage correctly', () => {
      const startDate = new Date('2025-12-01');
      const endDate = new Date('2025-12-05');

      const calendar = service.generateCalendar(startDate, endDate);
      
      // Weekdays should have availability
      const weekdays = calendar.filter(d => !d.isWeekend);
      weekdays.forEach(day => {
        expect(day.availability).toBeGreaterThanOrEqual(0);
        expect(day.availability).toBeLessThanOrEqual(1);
      });
    });
  });
});
