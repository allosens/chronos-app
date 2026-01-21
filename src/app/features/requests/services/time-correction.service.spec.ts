import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TimeCorrectionService } from './time-correction.service';
import { TimeCorrectionApiService } from './time-correction-api.service';
import { 
  TimeCorrectionStatus, 
  TimeCorrectionFormData, 
  TimeCorrectionRequest 
} from '../models/time-correction.model';
import { WorkSession, WorkStatus } from '../../time-tracking/models/time-tracking.model';

describe('TimeCorrectionService', () => {
  let service: TimeCorrectionService;
  let apiService: jasmine.SpyObj<TimeCorrectionApiService>;

  beforeEach(() => {
    const apiServiceSpy = jasmine.createSpyObj('TimeCorrectionApiService', [
      'createCorrection',
      'getCorrections',
      'getCorrectionById',
      'updateCorrection',
      'cancelCorrection',
      'approveCorrection',
      'rejectCorrection',
      'getPendingApprovals'
    ]);

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        TimeCorrectionService,
        { provide: TimeCorrectionApiService, useValue: apiServiceSpy }
      ]
    });

    service = TestBed.inject(TimeCorrectionService);
    apiService = TestBed.inject(TimeCorrectionApiService) as jasmine.SpyObj<TimeCorrectionApiService>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('loadRequests', () => {
    it('should load requests from API', async () => {
      const mockRequests: TimeCorrectionRequest[] = [
        {
          id: 'req-1',
          userId: 'user-1',
          companyId: 'company-1',
          workSessionId: 'session-1',
          requestedClockIn: '2024-01-15T09:00:00Z',
          reason: 'Test reason',
          status: TimeCorrectionStatus.PENDING,
          createdAt: '2024-01-15T10:00:00Z'
        }
      ];

      const mockResponse = {
        requests: mockRequests,
        total: 1,
        limit: 20,
        offset: 0
      };

      apiService.getCorrections.and.resolveTo(mockResponse);

      await service.loadRequests();

      expect(apiService.getCorrections).toHaveBeenCalled();
      expect(service.requests().length).toBe(1);
      expect(service.isLoading()).toBe(false);
    });

    it('should handle API errors', async () => {
      apiService.getCorrections.and.rejectWith(new Error('API Error'));

      await service.loadRequests();

      expect(service.error()).toContain('API Error');
      expect(service.isLoading()).toBe(false);
    });
  });

  describe('submitRequest', () => {
    it('should create a new time correction request', async () => {
      const formData: TimeCorrectionFormData = {
        workSessionId: 'session-1',
        requestedClockIn: '09:00',
        requestedClockOut: '17:00',
        reason: 'Forgot to clock in on time'
      };

      const workSession: WorkSession = {
        id: 'session-1',
        userId: 'user-1',
        companyId: 'company-1',
        date: '2024-01-15',
        clockIn: '2024-01-15T08:00:00Z',
        clockOut: '2024-01-15T16:00:00Z',
        status: WorkStatus.CLOCKED_OUT,
        totalHours: 8,
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const mockResponse: TimeCorrectionRequest = {
        id: 'req-1',
        userId: 'user-1',
        companyId: 'company-1',
        workSessionId: 'session-1',
        requestedClockIn: '2024-01-15T09:00:00Z',
        requestedClockOut: '2024-01-15T17:00:00Z',
        reason: 'Forgot to clock in on time',
        status: TimeCorrectionStatus.PENDING,
        createdAt: '2024-01-15T10:00:00Z'
      };

      apiService.createCorrection.and.resolveTo(mockResponse);

      const result = await service.submitRequest(formData, workSession);

      expect(apiService.createCorrection).toHaveBeenCalled();
      expect(result.status).toBe(TimeCorrectionStatus.PENDING);
      expect(result.reason).toBe(formData.reason);
      expect(service.requests().length).toBe(1);
    });

    it('should handle submission errors', async () => {
      const formData: TimeCorrectionFormData = {
        workSessionId: 'session-1',
        requestedClockIn: '09:00',
        reason: 'Test reason'
      };

      const workSession: WorkSession = {
        id: 'session-1',
        userId: 'user-1',
        companyId: 'company-1',
        date: '2024-01-15',
        clockIn: '2024-01-15T08:00:00Z',
        clockOut: null,
        status: WorkStatus.WORKING,
        totalHours: null,
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      apiService.createCorrection.and.rejectWith(new Error('Submission failed'));

      await expectAsync(service.submitRequest(formData, workSession)).toBeRejected();
      expect(service.error()).toContain('Submission failed');
    });
  });

  describe('getRequestById', () => {
    it('should return request from cache', async () => {
      const mockRequest: TimeCorrectionRequest = {
        id: 'req-1',
        userId: 'user-1',
        companyId: 'company-1',
        workSessionId: 'session-1',
        requestedClockIn: '2024-01-15T09:00:00Z',
        reason: 'Test reason',
        status: TimeCorrectionStatus.PENDING,
        createdAt: '2024-01-15T10:00:00Z'
      };

      // Set up cache
      const mockResponse = {
        requests: [mockRequest],
        total: 1,
        limit: 20,
        offset: 0
      };
      
      apiService.getCorrections.and.resolveTo(mockResponse);
      await service.loadRequests();

      const found = await service.getRequestById('req-1');
      expect(found).toBeTruthy();
      expect(found?.id).toBe('req-1');
    });

    it('should fetch from API if not in cache', async () => {
      const mockRequest: TimeCorrectionRequest = {
        id: 'req-2',
        userId: 'user-1',
        companyId: 'company-1',
        workSessionId: 'session-1',
        requestedClockIn: '2024-01-15T09:00:00Z',
        reason: 'Test reason',
        status: TimeCorrectionStatus.PENDING,
        createdAt: '2024-01-15T10:00:00Z'
      };

      apiService.getCorrectionById.and.resolveTo(mockRequest);

      const found = await service.getRequestById('req-2');
      expect(apiService.getCorrectionById).toHaveBeenCalledWith('req-2');
      expect(found?.id).toBe('req-2');
    });
  });

  describe('cancelRequest', () => {
    it('should cancel a request', async () => {
      const mockRequest: TimeCorrectionRequest = {
        id: 'req-1',
        userId: 'user-1',
        companyId: 'company-1',
        workSessionId: 'session-1',
        requestedClockIn: '2024-01-15T09:00:00Z',
        reason: 'Test reason',
        status: TimeCorrectionStatus.PENDING,
        createdAt: '2024-01-15T10:00:00Z'
      };

      // Set up cache
      const mockResponse = {
        requests: [mockRequest],
        total: 1,
        limit: 20,
        offset: 0
      };
      
      apiService.getCorrections.and.resolveTo(mockResponse);
      await service.loadRequests();

      apiService.cancelCorrection.and.resolveTo();

      await service.cancelRequest('req-1');

      expect(apiService.cancelCorrection).toHaveBeenCalledWith('req-1');
      expect(service.requests().length).toBe(0);
    });
  });

  describe('approveRequest', () => {
    it('should approve a request', async () => {
      const mockRequest: TimeCorrectionRequest = {
        id: 'req-1',
        userId: 'user-1',
        companyId: 'company-1',
        workSessionId: 'session-1',
        requestedClockIn: '2024-01-15T09:00:00Z',
        reason: 'Test reason',
        status: TimeCorrectionStatus.PENDING,
        createdAt: '2024-01-15T10:00:00Z'
      };

      const approvedRequest: TimeCorrectionRequest = {
        ...mockRequest,
        status: TimeCorrectionStatus.APPROVED,
        reviewedAt: '2024-01-15T11:00:00Z',
        reviewNotes: 'Approved'
      };

      // Set up cache
      const mockResponse = {
        requests: [mockRequest],
        total: 1,
        limit: 20,
        offset: 0
      };
      
      apiService.getCorrections.and.resolveTo(mockResponse);
      await service.loadRequests();

      apiService.approveCorrection.and.resolveTo(approvedRequest);

      await service.approveRequest('req-1', 'Approved');

      expect(apiService.approveCorrection).toHaveBeenCalledWith('req-1', 'Approved');
      const updated = service.requests().find(r => r.id === 'req-1');
      expect(updated?.status).toBe(TimeCorrectionStatus.APPROVED);
    });
  });

  describe('rejectRequest', () => {
    it('should reject a request', async () => {
      const mockRequest: TimeCorrectionRequest = {
        id: 'req-1',
        userId: 'user-1',
        companyId: 'company-1',
        workSessionId: 'session-1',
        requestedClockIn: '2024-01-15T09:00:00Z',
        reason: 'Test reason',
        status: TimeCorrectionStatus.PENDING,
        createdAt: '2024-01-15T10:00:00Z'
      };

      const rejectedRequest: TimeCorrectionRequest = {
        ...mockRequest,
        status: TimeCorrectionStatus.DENIED,
        reviewedAt: '2024-01-15T11:00:00Z',
        reviewNotes: 'Invalid'
      };

      // Set up cache
      const mockResponse = {
        requests: [mockRequest],
        total: 1,
        limit: 20,
        offset: 0
      };
      
      apiService.getCorrections.and.resolveTo(mockResponse);
      await service.loadRequests();

      apiService.rejectCorrection.and.resolveTo(rejectedRequest);

      await service.rejectRequest('req-1', 'Invalid');

      expect(apiService.rejectCorrection).toHaveBeenCalledWith('req-1', 'Invalid');
      const updated = service.requests().find(r => r.id === 'req-1');
      expect(updated?.status).toBe(TimeCorrectionStatus.DENIED);
    });
  });

  describe('computed signals', () => {
    beforeEach(async () => {
      const mockRequests: TimeCorrectionRequest[] = [
        {
          id: 'req-1',
          userId: 'user-1',
          companyId: 'company-1',
          workSessionId: 'session-1',
          requestedClockIn: '2024-01-15T09:00:00Z',
          reason: 'Test 1',
          status: TimeCorrectionStatus.PENDING,
          createdAt: '2024-01-15T10:00:00Z'
        },
        {
          id: 'req-2',
          userId: 'user-1',
          companyId: 'company-1',
          workSessionId: 'session-2',
          requestedClockOut: '2024-01-15T17:00:00Z',
          reason: 'Test 2',
          status: TimeCorrectionStatus.APPROVED,
          createdAt: '2024-01-15T11:00:00Z'
        },
        {
          id: 'req-3',
          userId: 'user-1',
          companyId: 'company-1',
          workSessionId: 'session-3',
          requestedClockIn: '2024-01-15T08:30:00Z',
          reason: 'Test 3',
          status: TimeCorrectionStatus.DENIED,
          createdAt: '2024-01-15T12:00:00Z'
        }
      ];

      const mockResponse = {
        requests: mockRequests,
        total: 3,
        limit: 20,
        offset: 0
      };

      apiService.getCorrections.and.resolveTo(mockResponse);
      await service.loadRequests();
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
    });

    it('should filter rejected requests', () => {
      const rejected = service.rejectedRequests();
      expect(rejected.length).toBe(1);
      expect(rejected[0].status).toBe(TimeCorrectionStatus.DENIED);
    });

    it('should count all requests', () => {
      expect(service.requestCount()).toBe(3);
    });

    it('should count pending requests', () => {
      expect(service.pendingCount()).toBe(1);
    });
  });

  describe('clearError', () => {
    it('should clear error state', async () => {
      apiService.getCorrections.and.rejectWith(new Error('Test error'));
      await service.loadRequests();

      expect(service.error()).toBeTruthy();

      service.clearError();

      expect(service.error()).toBeNull();
    });
  });
});
