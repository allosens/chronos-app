import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { TimeCorrectionApiService } from './time-correction-api.service';
import { 
  TimeCorrectionRequest, 
  CreateTimeCorrectionRequest,
  TimeCorrectionStatus 
} from '../models/time-correction.model';
import { environment } from '../../../../environments/environment';

describe('TimeCorrectionApiService', () => {
  let service: TimeCorrectionApiService;
  let httpMock: HttpTestingController;
  const baseUrl = `${environment.apiUrl}/v1/time-corrections`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        TimeCorrectionApiService
      ]
    });

    service = TestBed.inject(TimeCorrectionApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('createCorrection', () => {
    it('should create a time correction request', async () => {
      const request: CreateTimeCorrectionRequest = {
        workSessionId: 'session-123',
        requestedClockIn: '2024-01-15T09:00:00Z',
        reason: 'Forgot to clock in on time'
      };

      const mockResponse: TimeCorrectionRequest = {
        id: 'correction-123',
        userId: 'user-123',
        companyId: 'company-123',
        workSessionId: 'session-123',
        requestedClockIn: '2024-01-15T09:00:00Z',
        reason: 'Forgot to clock in on time',
        status: TimeCorrectionStatus.PENDING,
        createdAt: '2024-01-15T10:00:00Z'
      };

      const promise = service.createCorrection(request);

      const req = httpMock.expectOne(baseUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(request);
      req.flush(mockResponse);

      const result = await promise;
      expect(result).toEqual(mockResponse);
    });

    it('should handle creation errors', async () => {
      const request: CreateTimeCorrectionRequest = {
        workSessionId: 'session-123',
        requestedClockIn: '2024-01-15T09:00:00Z',
        reason: 'Test'
      };

      const promise = service.createCorrection(request);

      const req = httpMock.expectOne(baseUrl);
      req.flush({ message: 'Invalid request' }, { status: 400, statusText: 'Bad Request' });

      await expectAsync(promise).toBeRejectedWithError(/Invalid request/);
    });
  });

  describe('getCorrections', () => {
    it('should fetch time correction requests', async () => {
      const mockRequests: TimeCorrectionRequest[] = [
        {
          id: 'correction-1',
          userId: 'user-123',
          companyId: 'company-123',
          workSessionId: 'session-1',
          requestedClockIn: '2024-01-15T09:00:00Z',
          reason: 'Test reason 1',
          status: TimeCorrectionStatus.PENDING,
          createdAt: '2024-01-15T10:00:00Z'
        },
        {
          id: 'correction-2',
          userId: 'user-123',
          companyId: 'company-123',
          workSessionId: 'session-2',
          requestedClockOut: '2024-01-15T17:00:00Z',
          reason: 'Test reason 2',
          status: TimeCorrectionStatus.APPROVED,
          createdAt: '2024-01-15T11:00:00Z'
        }
      ];

      const mockResponse = {
        requests: mockRequests,
        total: 2,
        limit: 20,
        offset: 0
      };

      const promise = service.getCorrections();

      const req = httpMock.expectOne(baseUrl);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);

      const result = await promise;
      expect(result).toEqual(mockResponse);
      expect(result.requests.length).toBe(2);
      expect(result.total).toBe(2);
    });

    it('should fetch with query parameters', async () => {
      const params = {
        status: TimeCorrectionStatus.PENDING,
        userId: 'user-123'
      };

      const mockResponse = {
        requests: [],
        total: 0,
        limit: 20,
        offset: 0
      };

      const promise = service.getCorrections(params);

      const req = httpMock.expectOne(request => 
        request.url === baseUrl && 
        request.params.get('status') === 'PENDING' &&
        request.params.get('userId') === 'user-123'
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);

      await promise;
    });
  });

  describe('getCorrectionById', () => {
    it('should fetch a specific correction request', async () => {
      const correctionId = 'correction-123';
      const mockResponse: TimeCorrectionRequest = {
        id: correctionId,
        userId: 'user-123',
        companyId: 'company-123',
        workSessionId: 'session-123',
        requestedClockIn: '2024-01-15T09:00:00Z',
        reason: 'Test reason',
        status: TimeCorrectionStatus.PENDING,
        createdAt: '2024-01-15T10:00:00Z'
      };

      const promise = service.getCorrectionById(correctionId);

      const req = httpMock.expectOne(`${baseUrl}/${correctionId}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);

      const result = await promise;
      expect(result).toEqual(mockResponse);
    });

    it('should handle 404 error', async () => {
      const correctionId = 'non-existent';

      const promise = service.getCorrectionById(correctionId);

      const req = httpMock.expectOne(`${baseUrl}/${correctionId}`);
      req.flush({ message: 'Not found' }, { status: 404, statusText: 'Not Found' });

      await expectAsync(promise).toBeRejectedWithError(/not found/i);
    });
  });

  describe('updateCorrection', () => {
    it('should update a correction request', async () => {
      const correctionId = 'correction-123';
      const updateData = {
        requestedClockIn: '2024-01-15T09:30:00Z',
        reason: 'Updated reason'
      };

      const mockResponse: TimeCorrectionRequest = {
        id: correctionId,
        userId: 'user-123',
        companyId: 'company-123',
        workSessionId: 'session-123',
        requestedClockIn: '2024-01-15T09:30:00Z',
        reason: 'Updated reason',
        status: TimeCorrectionStatus.PENDING,
        createdAt: '2024-01-15T10:00:00Z'
      };

      const promise = service.updateCorrection(correctionId, updateData);

      const req = httpMock.expectOne(`${baseUrl}/${correctionId}`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(updateData);
      req.flush(mockResponse);

      const result = await promise;
      expect(result).toEqual(mockResponse);
    });
  });

  describe('cancelCorrection', () => {
    it('should cancel a correction request', async () => {
      const correctionId = 'correction-123';

      const promise = service.cancelCorrection(correctionId);

      const req = httpMock.expectOne(`${baseUrl}/${correctionId}`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);

      await promise;
    });
  });

  describe('getPendingApprovals', () => {
    it('should fetch pending approval requests', async () => {
      const mockResponse: TimeCorrectionRequest[] = [
        {
          id: 'correction-1',
          userId: 'user-123',
          companyId: 'company-123',
          workSessionId: 'session-1',
          requestedClockIn: '2024-01-15T09:00:00Z',
          reason: 'Test reason',
          status: TimeCorrectionStatus.PENDING,
          createdAt: '2024-01-15T10:00:00Z'
        }
      ];

      const promise = service.getPendingApprovals();

      const req = httpMock.expectOne(`${baseUrl}/pending`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);

      const result = await promise;
      expect(result).toEqual(mockResponse);
    });
  });

  describe('approveCorrection', () => {
    it('should approve a correction request', async () => {
      const correctionId = 'correction-123';
      const reviewNotes = 'Approved by manager';

      const mockResponse: TimeCorrectionRequest = {
        id: correctionId,
        userId: 'user-123',
        companyId: 'company-123',
        workSessionId: 'session-123',
        requestedClockIn: '2024-01-15T09:00:00Z',
        reason: 'Test reason',
        status: TimeCorrectionStatus.APPROVED,
        createdAt: '2024-01-15T10:00:00Z',
        reviewedAt: '2024-01-15T11:00:00Z',
        reviewNotes
      };

      const promise = service.approveCorrection(correctionId, reviewNotes);

      const req = httpMock.expectOne(`${baseUrl}/${correctionId}`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body.status).toBe('APPROVED');
      expect(req.request.body.reviewNotes).toBe(reviewNotes);
      req.flush(mockResponse);

      const result = await promise;
      expect(result.status).toBe(TimeCorrectionStatus.APPROVED);
    });
  });

  describe('rejectCorrection', () => {
    it('should reject a correction request with notes', async () => {
      const correctionId = 'correction-123';
      const reviewNotes = 'Invalid reason provided';

      const mockResponse: TimeCorrectionRequest = {
        id: correctionId,
        userId: 'user-123',
        companyId: 'company-123',
        workSessionId: 'session-123',
        requestedClockIn: '2024-01-15T09:00:00Z',
        reason: 'Test reason',
        status: TimeCorrectionStatus.DENIED,
        createdAt: '2024-01-15T10:00:00Z',
        reviewedAt: '2024-01-15T11:00:00Z',
        reviewNotes
      };

      const promise = service.rejectCorrection(correctionId, reviewNotes);

      const req = httpMock.expectOne(`${baseUrl}/${correctionId}`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body.status).toBe('DENIED');
      expect(req.request.body.reviewNotes).toBe(reviewNotes);
      req.flush(mockResponse);

      const result = await promise;
      expect(result.status).toBe(TimeCorrectionStatus.DENIED);
    });

    it('should require review notes when rejecting', async () => {
      const correctionId = 'correction-123';

      await expectAsync(service.rejectCorrection(correctionId, '')).toBeRejectedWithError(/required/i);
    });
  });

  describe('error handling', () => {
    it('should handle network errors', async () => {
      const promise = service.getCorrections();

      const req = httpMock.expectOne(baseUrl);
      req.error(new ProgressEvent('error'));

      await expectAsync(promise).toBeRejectedWithError(/not available/i);
    });

    it('should handle 401 unauthorized', async () => {
      const promise = service.getCorrections();

      const req = httpMock.expectOne(baseUrl);
      req.flush({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });

      await expectAsync(promise).toBeRejectedWithError(/Unauthorized/i);
    });

    it('should handle 403 forbidden', async () => {
      const promise = service.getPendingApprovals();

      const req = httpMock.expectOne(`${baseUrl}/pending`);
      req.flush({ message: 'Forbidden' }, { status: 403, statusText: 'Forbidden' });

      await expectAsync(promise).toBeRejectedWithError(/permission/i);
    });

    it('should handle 500 server error', async () => {
      const promise = service.getCorrections();

      const req = httpMock.expectOne(baseUrl);
      req.flush({ message: 'Internal server error' }, { status: 500, statusText: 'Internal Server Error' });

      await expectAsync(promise).toBeRejectedWithError(/Server error/i);
    });
  });
});
