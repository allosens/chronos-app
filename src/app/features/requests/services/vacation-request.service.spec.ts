import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { VacationRequestService } from './vacation-request.service';
import { VacationRequestFormData, VacationRequestType, VacationRequestStatus } from '../models/vacation-request.model';

describe('VacationRequestService', () => {
  let service: VacationRequestService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        VacationRequestService
      ]
    });
    service = TestBed.inject(VacationRequestService);
    
    // Clear localStorage before each test
    if (typeof window !== 'undefined') {
      localStorage.clear();
    }
  });

  afterEach(() => {
    // Clean up localStorage after each test
    if (typeof window !== 'undefined') {
      localStorage.clear();
    }
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialize with sample data', () => {
    expect(service.vacationRequests().length).toBeGreaterThan(0);
  });

  it('should create a new vacation request', () => {
    const formData: VacationRequestFormData = {
      type: VacationRequestType.VACATION,
      startDate: '2025-12-01',
      endDate: '2025-12-05',
      comments: 'Year-end vacation'
    };

    const initialCount = service.vacationRequests().length;
    const request = service.createVacationRequest(formData);

    expect(request).toBeTruthy();
    expect(request.type).toBe(VacationRequestType.VACATION);
    expect(request.status).toBe(VacationRequestStatus.PENDING);
    expect(request.comments).toBe('Year-end vacation');
    expect(service.vacationRequests().length).toBe(initialCount + 1);
  });

  it('should calculate working days correctly', () => {
    // Monday to Friday (5 working days)
    const monday = new Date('2025-12-01'); // Monday
    const friday = new Date('2025-12-05'); // Friday
    expect(service.calculateWorkingDays(monday, friday)).toBe(5);

    // Including a weekend (5 working days, 7 total days)
    const monday2 = new Date('2025-12-01'); // Monday
    const nextMonday = new Date('2025-12-08'); // Next Monday
    expect(service.calculateWorkingDays(monday2, nextMonday)).toBe(6);

    // Single day
    const singleDay = new Date('2025-12-01');
    expect(service.calculateWorkingDays(singleDay, singleDay)).toBe(1);

    // Weekend day only
    const saturday = new Date('2025-12-06'); // Saturday
    expect(service.calculateWorkingDays(saturday, saturday)).toBe(0);
  });

  it('should cancel a pending request', () => {
    const formData: VacationRequestFormData = {
      type: VacationRequestType.PERSONAL,
      startDate: '2025-12-10',
      endDate: '2025-12-10'
    };

    const request = service.createVacationRequest(formData);
    expect(request.status).toBe(VacationRequestStatus.PENDING);

    service.cancelRequest(request.id);

    const updatedRequest = service.getRequestById(request.id);
    expect(updatedRequest?.status).toBe(VacationRequestStatus.CANCELLED);
  });

  it('should not cancel a non-pending request', () => {
    // Create a request and manually change its status to approved
    const formData: VacationRequestFormData = {
      type: VacationRequestType.VACATION,
      startDate: '2025-12-15',
      endDate: '2025-12-20'
    };

    const request = service.createVacationRequest(formData);
    
    // Manually update to approved status (simulating approval)
    const requests = service.vacationRequests();
    const updated = requests.map(r => 
      r.id === request.id ? { ...r, status: VacationRequestStatus.APPROVED } : r
    );
    
    // This is a bit hacky but needed for testing
    // In a real app, there would be an approval method
    service['vacationRequestsSignal'].set(updated);

    service.cancelRequest(request.id);

    const stillApproved = service.getRequestById(request.id);
    expect(stillApproved?.status).toBe(VacationRequestStatus.APPROVED);
  });

  it('should detect overlapping requests', () => {
    // Clear all requests first
    service['vacationRequestsSignal'].set([]);
    
    // Create an approved request
    const formData: VacationRequestFormData = {
      type: VacationRequestType.VACATION,
      startDate: '2025-12-10',
      endDate: '2025-12-15'
    };

    const request = service.createVacationRequest(formData);
    
    // Manually approve it
    const requests = service.vacationRequests();
    const updated = requests.map(r => 
      r.id === request.id ? { ...r, status: VacationRequestStatus.APPROVED } : r
    );
    service['vacationRequestsSignal'].set(updated);

    // Check for overlap
    const overlappingStart = new Date('2025-12-12');
    const overlappingEnd = new Date('2025-12-17');
    expect(service.hasOverlappingRequests(overlappingStart, overlappingEnd)).toBe(true);

    // Check for non-overlapping dates
    const nonOverlappingStart = new Date('2025-12-20');
    const nonOverlappingEnd = new Date('2025-12-25');
    expect(service.hasOverlappingRequests(nonOverlappingStart, nonOverlappingEnd)).toBe(false);
  });

  it('should calculate vacation balance correctly', () => {
    // Clear existing requests
    service['vacationRequestsSignal'].set([]);

    const balance = service.vacationBalance();
    expect(balance.totalVacationDays).toBe(22);
    expect(balance.usedVacationDays).toBe(0);
    expect(balance.remainingVacationDays).toBe(22);
    expect(balance.pendingVacationDays).toBe(0);

    // Add an approved vacation request
    const formData: VacationRequestFormData = {
      type: VacationRequestType.VACATION,
      startDate: '2025-12-01',
      endDate: '2025-12-05' // 5 working days
    };

    const request = service.createVacationRequest(formData);
    
    // Approve it
    const requests = service.vacationRequests();
    const updated = requests.map(r => 
      r.id === request.id ? { ...r, status: VacationRequestStatus.APPROVED } : r
    );
    service['vacationRequestsSignal'].set(updated);

    const newBalance = service.vacationBalance();
    expect(newBalance.usedVacationDays).toBe(5);
    expect(newBalance.remainingVacationDays).toBe(17);
  });

  it('should filter pending requests correctly', () => {
    service['vacationRequestsSignal'].set([]);

    const formData1: VacationRequestFormData = {
      type: VacationRequestType.VACATION,
      startDate: '2025-12-01',
      endDate: '2025-12-05'
    };

    const formData2: VacationRequestFormData = {
      type: VacationRequestType.PERSONAL,
      startDate: '2025-12-10',
      endDate: '2025-12-10'
    };

    service.createVacationRequest(formData1);
    service.createVacationRequest(formData2);

    expect(service.pendingRequests().length).toBe(2);
  });

  it('should filter approved requests correctly', () => {
    service['vacationRequestsSignal'].set([]);

    const formData: VacationRequestFormData = {
      type: VacationRequestType.VACATION,
      startDate: '2025-12-01',
      endDate: '2025-12-05'
    };

    const request = service.createVacationRequest(formData);
    
    // Initially no approved requests
    expect(service.approvedRequests().length).toBe(0);

    // Approve the request
    const requests = service.vacationRequests();
    const updated = requests.map(r => 
      r.id === request.id ? { ...r, status: VacationRequestStatus.APPROVED } : r
    );
    service['vacationRequestsSignal'].set(updated);

    expect(service.approvedRequests().length).toBe(1);
  });

  it('should get request by ID', () => {
    const formData: VacationRequestFormData = {
      type: VacationRequestType.VACATION,
      startDate: '2025-12-01',
      endDate: '2025-12-05'
    };

    const request = service.createVacationRequest(formData);
    const found = service.getRequestById(request.id);

    expect(found).toBeTruthy();
    expect(found?.id).toBe(request.id);
    expect(found?.type).toBe(VacationRequestType.VACATION);
  });

  it('should return undefined for non-existent request ID', () => {
    const found = service.getRequestById('non-existent-id');
    expect(found).toBeUndefined();
  });

  it('should persist requests to localStorage', () => {
    if (typeof window === 'undefined') {
      pending('localStorage not available in this environment');
      return;
    }

    const formData: VacationRequestFormData = {
      type: VacationRequestType.VACATION,
      startDate: '2025-12-01',
      endDate: '2025-12-05'
    };

    service.createVacationRequest(formData);

    const stored = localStorage.getItem('chronos-vacation-requests');
    expect(stored).toBeTruthy();

    const parsed = JSON.parse(stored!);
    expect(parsed).toBeInstanceOf(Array);
    expect(parsed.length).toBeGreaterThan(0);
  });

  it('should load requests from localStorage on initialization', () => {
    if (typeof window === 'undefined') {
      pending('localStorage not available in this environment');
      return;
    }

    const mockRequests = [
      {
        id: 'test-1',
        employeeId: 'user-1',
        type: VacationRequestType.VACATION,
        startDate: new Date('2025-12-01').toISOString(),
        endDate: new Date('2025-12-05').toISOString(),
        totalDays: 5,
        status: VacationRequestStatus.PENDING,
        requestedAt: new Date().toISOString()
      }
    ];

    localStorage.setItem('chronos-vacation-requests', JSON.stringify(mockRequests));

    // Create a new service instance
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        VacationRequestService
      ]
    });
    const newService = TestBed.inject(VacationRequestService);

    expect(newService.vacationRequests().length).toBeGreaterThan(0);
    expect(newService.vacationRequests().some(r => r.id === 'test-1')).toBe(true);
  });
});
