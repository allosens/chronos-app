import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { VacationList } from './vacation-list';
import { VacationRequestService } from '../../services/vacation-request.service';
import { VacationRequest, VacationRequestType, VacationRequestStatus } from '../../models/vacation-request.model';

describe('VacationList', () => {
  let component: VacationList;
  let fixture: ComponentFixture<VacationList>;
  let vacationService: jasmine.SpyObj<VacationRequestService>;

  const mockRequests: VacationRequest[] = [
    {
      id: '1',
      employeeId: 'user-1',
      type: VacationRequestType.VACATION,
      startDate: new Date('2025-12-01'),
      endDate: new Date('2025-12-05'),
      totalDays: 5,
      status: VacationRequestStatus.PENDING,
      requestedAt: new Date('2025-11-15')
    },
    {
      id: '2',
      employeeId: 'user-1',
      type: VacationRequestType.PERSONAL_DAY,
      startDate: new Date('2025-11-25'),
      endDate: new Date('2025-11-25'),
      totalDays: 1,
      status: VacationRequestStatus.APPROVED,
      requestedAt: new Date('2025-11-10'),
      reviewedAt: new Date('2025-11-12'),
      reviewedBy: 'Manager',
      reviewComments: 'Approved'
    },
    {
      id: '3',
      employeeId: 'user-1',
      type: VacationRequestType.VACATION,
      startDate: new Date('2025-10-01'),
      endDate: new Date('2025-10-05'),
      totalDays: 5,
      status: VacationRequestStatus.REJECTED,
      requestedAt: new Date('2025-09-20'),
      reviewedAt: new Date('2025-09-22'),
      reviewedBy: 'Manager',
      reviewComments: 'Not enough coverage'
    }
  ];

  beforeEach(() => {
    const serviceSpy = jasmine.createSpyObj('VacationRequestService', ['cancelRequest']);
    
    // Create signals for the service
    const requestsSignal = signal<VacationRequest[]>(mockRequests);
    const pendingSignal = signal<VacationRequest[]>(
      mockRequests.filter(r => r.status === VacationRequestStatus.PENDING)
    );
    const approvedSignal = signal<VacationRequest[]>(
      mockRequests.filter(r => r.status === VacationRequestStatus.APPROVED)
    );

    Object.defineProperty(serviceSpy, 'vacationRequests', {
      get: () => requestsSignal.asReadonly()
    });
    Object.defineProperty(serviceSpy, 'pendingRequests', {
      get: () => pendingSignal.asReadonly()
    });
    Object.defineProperty(serviceSpy, 'approvedRequests', {
      get: () => approvedSignal.asReadonly()
    });

    TestBed.configureTestingModule({
      imports: [VacationList],
      providers: [
        provideZonelessChangeDetection(),
        { provide: VacationRequestService, useValue: serviceSpy }
      ]
    });

    fixture = TestBed.createComponent(VacationList);
    component = fixture.componentInstance;
    vacationService = TestBed.inject(VacationRequestService) as jasmine.SpyObj<VacationRequestService>;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display all requests by default', () => {
    expect(component['currentFilter']()).toBe('all');
    expect(component['filteredRequests']().length).toBe(3);
  });

  it('should filter pending requests', () => {
    component['setFilter']('pending');
    fixture.detectChanges();

    expect(component['currentFilter']()).toBe('pending');
    expect(component['filteredRequests']().length).toBe(1);
    expect(component['filteredRequests']()[0].status).toBe(VacationRequestStatus.PENDING);
  });

  it('should filter approved requests', () => {
    component['setFilter']('approved');
    fixture.detectChanges();

    expect(component['currentFilter']()).toBe('approved');
    expect(component['filteredRequests']().length).toBe(1);
    expect(component['filteredRequests']()[0].status).toBe(VacationRequestStatus.APPROVED);
  });

  it('should call cancelRequest on service when cancel button is clicked', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    
    component['cancelRequest']('1');

    expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to cancel this request?');
    expect(vacationService.cancelRequest).toHaveBeenCalledWith('1');
  });

  it('should not cancel request if user cancels confirmation', () => {
    spyOn(window, 'confirm').and.returnValue(false);
    
    component['cancelRequest']('1');

    expect(window.confirm).toHaveBeenCalled();
    expect(vacationService.cancelRequest).not.toHaveBeenCalled();
  });

  it('should format dates correctly', () => {
    const date = new Date('2025-12-01');
    const formatted = component['formatDate'](date);
    
    expect(formatted).toBeTruthy();
    expect(typeof formatted).toBe('string');
  });

  it('should format relative time correctly', () => {
    const date = new Date();
    const relativeTime = component['getRelativeTime'](date);
    
    expect(relativeTime).toBeTruthy();
    expect(typeof relativeTime).toBe('string');
  });

  it('should return correct status labels', () => {
    expect(component['getStatusLabel'](VacationRequestStatus.PENDING)).toBe('Pending');
    expect(component['getStatusLabel'](VacationRequestStatus.APPROVED)).toBe('Approved');
    expect(component['getStatusLabel'](VacationRequestStatus.REJECTED)).toBe('Rejected');
    expect(component['getStatusLabel'](VacationRequestStatus.CANCELLED)).toBe('Cancelled');
  });

  it('should return correct type labels', () => {
    expect(component['getTypeLabel']('vacation')).toBe('Vacation');
    expect(component['getTypeLabel']('personal_day')).toBe('Personal Day');
    expect(component['getTypeLabel']('sick_leave')).toBe('Sick Leave');
    expect(component['getTypeLabel']('compensatory_time')).toBe('Compensatory Time');
    expect(component['getTypeLabel']('other')).toBe('Other');
  });

  it('should display request count for each filter', () => {
    expect(component['allRequests']().length).toBe(3);
    expect(component['pendingRequests']().length).toBe(1);
    expect(component['approvedRequests']().length).toBe(1);
  });

  it('should render empty state when no requests match filter', () => {
    // Create a new service with no approved requests
    const emptyApprovedSignal = signal<VacationRequest[]>([]);
    Object.defineProperty(vacationService, 'approvedRequests', {
      get: () => emptyApprovedSignal.asReadonly()
    });

    component['setFilter']('approved');
    fixture.detectChanges();

    expect(component['filteredRequests']().length).toBe(0);
  });
});
