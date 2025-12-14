import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { TimeTrackingApiService } from './time-tracking-api.service';
import { WorkSession, WorkStatus, Break } from '../models/time-tracking.model';
import { environment } from '../../../../environments/environment';

describe('TimeTrackingApiService', () => {
  let service: TimeTrackingApiService;
  let httpMock: HttpTestingController;
  const baseUrl = `${environment.apiUrl}/v1`;

  const mockWorkSession: WorkSession = {
    id: '123',
    userId: 'user-1',
    companyId: 'company-1',
    date: new Date('2024-01-01'),
    clockIn: new Date('2024-01-01T09:00:00Z'),
    clockOut: null,
    status: WorkStatus.WORKING,
    totalHours: null,
    notes: null,
    createdAt: new Date('2024-01-01T09:00:00Z'),
    updatedAt: new Date('2024-01-01T09:00:00Z'),
    breaks: [],
  };

  const mockBreak: Break = {
    id: 'break-1',
    workSessionId: '123',
    startTime: new Date('2024-01-01T12:00:00Z'),
    endTime: null,
    durationMinutes: null,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        TimeTrackingApiService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(TimeTrackingApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('clockIn', () => {
    it('should clock in and return work session', async () => {
      const clockInTime = new Date().toISOString();
      const promise = service.clockIn({ clockIn: clockInTime, notes: 'Starting work' });

      const req = httpMock.expectOne(`${baseUrl}/work-sessions/clock-in`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ clockIn: clockInTime, notes: 'Starting work' });

      req.flush(mockWorkSession);

      const result = await promise;
      expect(result).toEqual(mockWorkSession);
    });

    it('should handle clock-in errors', async () => {
      const clockInTime = new Date().toISOString();
      const promise = service.clockIn({ clockIn: clockInTime });

      const req = httpMock.expectOne(`${baseUrl}/work-sessions/clock-in`);
      req.flush({ message: 'Already clocked in' }, { status: 409, statusText: 'Conflict' });

      await expectAsync(promise).toBeRejectedWithError(/Already clocked in/);
    });
  });

  describe('clockOut', () => {
    it('should clock out and return updated work session', async () => {
      const clockOutTime = new Date().toISOString();
      const completedSession = { ...mockWorkSession, clockOut: new Date(), status: WorkStatus.CLOCKED_OUT };
      const promise = service.clockOut('123', { clockOut: clockOutTime, notes: 'Done for the day' });

      const req = httpMock.expectOne(`${baseUrl}/work-sessions/123/clock-out`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual({ clockOut: clockOutTime, notes: 'Done for the day' });

      req.flush(completedSession);

      const result = await promise;
      expect(result).toEqual(completedSession);
    });
  });

  describe('startBreak', () => {
    it('should start a break and return updated work session', async () => {
      const startTime = new Date().toISOString();
      const updatedSession = { ...mockWorkSession, status: WorkStatus.ON_BREAK, breaks: [mockBreak] };
      const promise = service.startBreak('123', { startTime });

      const req = httpMock.expectOne(`${baseUrl}/work-sessions/123/breaks/start`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ startTime });

      req.flush(updatedSession);

      const result = await promise;
      expect(result).toEqual(updatedSession);
    });
  });

  describe('endBreak', () => {
    it('should end a break and return updated work session', async () => {
      const endTime = new Date().toISOString();
      const updatedSession = { 
        ...mockWorkSession, 
        status: WorkStatus.WORKING,
        breaks: [{ ...mockBreak, endTime: new Date(), durationMinutes: 30 }]
      };
      const promise = service.endBreak('123', { endTime });

      const req = httpMock.expectOne(`${baseUrl}/work-sessions/123/breaks/end`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual({ endTime });

      req.flush(updatedSession);

      const result = await promise;
      expect(result).toEqual(updatedSession);
    });
  });

  describe('getActiveSession', () => {
    it('should return active session when one exists', async () => {
      const promise = service.getActiveSession();

      const req = httpMock.expectOne(`${baseUrl}/work-sessions/active`);
      expect(req.request.method).toBe('GET');

      req.flush(mockWorkSession);

      const result = await promise;
      expect(result).toEqual(mockWorkSession);
    });

    it('should return null when no active session exists', async () => {
      const promise = service.getActiveSession();

      const req = httpMock.expectOne(`${baseUrl}/work-sessions/active`);
      req.flush({ message: 'No active session' }, { status: 404, statusText: 'Not Found' });

      const result = await promise;
      expect(result).toBeNull();
    });
  });

  describe('getSession', () => {
    it('should get a specific session by ID', async () => {
      const promise = service.getSession('123');

      const req = httpMock.expectOne(`${baseUrl}/work-sessions/123`);
      expect(req.request.method).toBe('GET');

      req.flush(mockWorkSession);

      const result = await promise;
      expect(result).toEqual(mockWorkSession);
    });
  });

  describe('listSessions', () => {
    it('should list sessions with query parameters', async () => {
      const promise = service.listSessions({
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        status: WorkStatus.WORKING,
      });

      const req = httpMock.expectOne((request) => {
        return (
          request.url === `${baseUrl}/work-sessions` &&
          request.params.get('startDate') === '2024-01-01' &&
          request.params.get('endDate') === '2024-01-31' &&
          request.params.get('status') === 'WORKING'
        );
      });
      expect(req.request.method).toBe('GET');

      // Return paginated response as the API does
      req.flush({
        sessions: [mockWorkSession],
        total: 1,
        limit: 20,
        offset: 0
      });

      const result = await promise;
      expect(result).toEqual([mockWorkSession]);
    });
  });

  describe('getDailyReport', () => {
    it('should get daily report', async () => {
      const mockReport = {
        date: '2024-01-01',
        totalMinutes: 480,
        totalHours: 8,
        sessions: [mockWorkSession],
      };

      const promise = service.getDailyReport('2024-01-01');

      const req = httpMock.expectOne((request) => {
        return request.url === `${baseUrl}/time-reports/daily` && request.params.get('date') === '2024-01-01';
      });
      expect(req.request.method).toBe('GET');

      req.flush(mockReport);

      const result = await promise;
      expect(result).toEqual(mockReport);
    });
  });

  describe('getWeeklyReport', () => {
    it('should get weekly report', async () => {
      const mockReport = {
        weekStart: '2024-01-01',
        weekEnd: '2024-01-07',
        totalMinutes: 2400,
        totalHours: 40,
        dailySummaries: [],
      };

      const promise = service.getWeeklyReport('2024-01-01');

      const req = httpMock.expectOne((request) => {
        return request.url === `${baseUrl}/time-reports/weekly` && request.params.get('weekStart') === '2024-01-01';
      });

      req.flush(mockReport);

      const result = await promise;
      expect(result).toEqual(mockReport);
    });
  });

  describe('getMonthlyReport', () => {
    it('should get monthly report', async () => {
      const mockReport = {
        month: 1,
        year: 2024,
        totalMinutes: 9600,
        totalHours: 160,
        weeklySummaries: [],
      };

      const promise = service.getMonthlyReport(2024, 1);

      const req = httpMock.expectOne((request) => {
        return (
          request.url === `${baseUrl}/time-reports/monthly` &&
          request.params.get('year') === '2024' &&
          request.params.get('month') === '1'
        );
      });

      req.flush(mockReport);

      const result = await promise;
      expect(result).toEqual(mockReport);
    });
  });
});
