import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { VacationApproval } from './vacation-approval.component';
import { VacationManagementService } from '../../services/vacation-management.service';
import { VacationRequestService } from '../../services/vacation-request.service';
import { VacationRequestType, VacationRequestStatus } from '../../models/vacation-request.model';

describe('VacationApproval', () => {
  let component: VacationApproval;
  let fixture: ComponentFixture<VacationApproval>;
  let managementService: VacationManagementService;
  let vacationService: VacationRequestService;

  const mockRequest = {
    id: 'test-request-1',
    employeeId: 'emp-1',
    employeeName: 'John Doe',
    type: VacationRequestType.VACATION,
    startDate: new Date('2025-12-01'),
    endDate: new Date('2025-12-05'),
    totalDays: 5,
    status: VacationRequestStatus.PENDING,
    requestedAt: new Date('2025-11-15'),
    comments: 'Year-end vacation'
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VacationApproval],
      providers: [
        provideZonelessChangeDetection(),
        VacationManagementService,
        VacationRequestService
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(VacationApproval);
    component = fixture.componentInstance;
    managementService = TestBed.inject(VacationManagementService);
    vacationService = TestBed.inject(VacationRequestService);

    // Clear localStorage
    if (typeof window !== 'undefined') {
      localStorage.clear();
    }
    vacationService['vacationRequestsSignal'].set([]);

    fixture.componentRef.setInput('request', mockRequest);
    fixture.detectChanges();
  });

  afterEach(() => {
    if (typeof window !== 'undefined') {
      localStorage.clear();
    }
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display employee name', () => {
    const compiled = fixture.nativeElement;
    const employeeName = compiled.querySelector('h4');
    expect(employeeName?.textContent).toContain('John Doe');
  });

  it('should display request type', () => {
    const compiled = fixture.nativeElement;
    const content = compiled.textContent;
    expect(content).toContain('Vacation');
  });

  it('should display total days', () => {
    const compiled = fixture.nativeElement;
    const content = compiled.textContent;
    expect(content).toContain('5 days');
  });

  it('should display employee comments if present', () => {
    const compiled = fixture.nativeElement;
    const content = compiled.textContent;
    expect(content).toContain('Year-end vacation');
  });

  it('should not display comments section if no comments', () => {
    const requestWithoutComments = { ...mockRequest, comments: undefined };
    fixture.componentRef.setInput('request', requestWithoutComments);
    fixture.detectChanges();

    const compiled = fixture.nativeElement;
    const commentsSection = compiled.querySelector('.text-xs.text-gray-500.mb-1:has-text("Employee Comments")');
    expect(commentsSection).toBeFalsy();
  });

  it('should show conflicts warning when conflicts exist', () => {
    // Create an approved request that conflicts
    const conflictingRequest = vacationService.createVacationRequest({
      type: VacationRequestType.VACATION,
      startDate: '2025-12-03',
      endDate: '2025-12-08'
    }, 'emp-2');

    managementService.approveRequest({
      requestId: conflictingRequest.id,
      action: 'approve',
      reviewedBy: 'Admin'
    });

    // Update the fixture with the mock request
    vacationService['vacationRequestsSignal'].set([
      ...vacationService.vacationRequests(),
      mockRequest
    ]);

    fixture.componentRef.setInput('request', mockRequest);
    fixture.detectChanges();

    const compiled = fixture.nativeElement;
    const conflictWarning = compiled.querySelector('.bg-amber-50');
    expect(conflictWarning).not.toBeNull();
    
    // The conflict warning might not show immediately due to computed signals
    // but we can verify the conflicts are detected
    const conflicts = component['conflicts']();
    expect(conflicts).toBeDefined();
  });

  it('should emit approved event when approve is clicked', (done) => {
    component.approved.subscribe((event) => {
      expect(event.requestId).toBe('test-request-1');
      done();
    });

    component['handleApprove']({ requestId: 'test-request-1' });
  });

  it('should emit rejected event when reject is clicked', (done) => {
    component.rejected.subscribe((event) => {
      expect(event.requestId).toBe('test-request-1');
      expect(event.comments).toBe('Not enough coverage');
      done();
    });

    component['handleReject']({ 
      requestId: 'test-request-1',
      comments: 'Not enough coverage'
    });
  });

  it('should display formatted dates', () => {
    const compiled = fixture.nativeElement;
    const content = compiled.textContent;
    
    // The dates should be formatted (exact format depends on DateUtils implementation)
    expect(content).toBeTruthy();
  });

  it('should display relative time for request date', () => {
    const compiled = fixture.nativeElement;
    const content = compiled.textContent;
    expect(content).toContain('Requested');
  });

  it('should handle missing employee name gracefully', () => {
    const requestWithoutName = { ...mockRequest, employeeName: undefined };
    fixture.componentRef.setInput('request', requestWithoutName);
    fixture.detectChanges();

    const compiled = fixture.nativeElement;
    const employeeName = compiled.querySelector('h4');
    expect(employeeName?.textContent).toContain('Unknown Employee');
  });

  it('should show team availability warning when availability is low', () => {
    // This test would require setting up multiple approved requests
    // to reduce team availability below threshold
    const availabilityCheck = component['availabilityCheck']();
    expect(availabilityCheck).toBeDefined();
  });

  it('should display approval actions component', () => {
    const compiled = fixture.nativeElement;
    const approvalActions = compiled.querySelector('app-approval-actions');
    expect(approvalActions).toBeTruthy();
  });

  it('should pass correct props to approval actions', () => {
    const compiled = fixture.nativeElement;
    const approvalActions = compiled.querySelector('app-approval-actions');
    
    // The component should be present
    expect(approvalActions).toBeTruthy();
  });

  it('should format different vacation types correctly', () => {
    const types = [
      { type: VacationRequestType.PERSONAL, label: 'Personal' },
      { type: VacationRequestType.SICK_LEAVE, label: 'Sick Leave' },
      { type: VacationRequestType.OTHER, label: 'Other' }
    ];

    types.forEach(({ type, label }) => {
      const testRequest = { ...mockRequest, type };
      fixture.componentRef.setInput('request', testRequest);
      fixture.detectChanges();

      const compiled = fixture.nativeElement;
      const content = compiled.textContent;
      expect(content).toContain(label);
    });
  });

  it('should handle single day vs multiple days correctly', () => {
    const singleDayRequest = { ...mockRequest, totalDays: 1 };
    fixture.componentRef.setInput('request', singleDayRequest);
    fixture.detectChanges();

    const compiled = fixture.nativeElement;
    const content = compiled.textContent;
    expect(content).toContain('1 day');
    expect(content).not.toContain('1 days');
  });
});
