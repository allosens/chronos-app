import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { VacationManagementPage } from './vacation-management-page';
import { VacationManagementService } from '../../services/vacation-management.service';
import { VacationRequestService } from '../../services/vacation-request.service';
import { VacationRequestType, VacationRequestStatus } from '../../models/vacation-request.model';

describe('VacationManagementPage', () => {
  let component: VacationManagementPage;
  let fixture: ComponentFixture<VacationManagementPage>;
  let managementService: VacationManagementService;
  let vacationService: VacationRequestService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VacationManagementPage],
      providers: [
        provideZonelessChangeDetection(),
        VacationManagementService,
        VacationRequestService
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(VacationManagementPage);
    component = fixture.componentInstance;
    managementService = TestBed.inject(VacationManagementService);
    vacationService = TestBed.inject(VacationRequestService);

    // Clear localStorage
    if (typeof window !== 'undefined') {
      localStorage.clear();
    }
    vacationService['vacationRequestsSignal'].set([]);
    
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

  it('should display page title', () => {
    const compiled = fixture.nativeElement;
    const title = compiled.querySelector('h1');
    expect(title?.textContent).toContain('Vacation Management');
  });

  describe('Summary Cards', () => {
    beforeEach(() => {
      // Create test data
      const req1 = vacationService.createVacationRequest({
        type: VacationRequestType.VACATION,
        startDate: '2025-12-01',
        endDate: '2025-12-05'
      });

      vacationService.createVacationRequest({
        type: VacationRequestType.PERSONAL_DAY,
        startDate: '2025-12-10',
        endDate: '2025-12-10'
      });

      // Approve one
      managementService.approveRequest({
        requestId: req1.id,
        action: 'approve',
        reviewedBy: 'Admin'
      });

      fixture.detectChanges();
    });

    it('should display pending requests count', () => {
      expect(component['pendingCount']()).toBe(1);
    });

    it('should display approved requests count', () => {
      expect(component['approvedCount']()).toBe(1);
    });

    it('should display employee count', () => {
      const count = component['employeeCount']();
      expect(count).toBeGreaterThanOrEqual(0);
    });

    it('should display availability percentage', () => {
      const availability = component['availabilityPercentage']();
      expect(availability).toBeGreaterThanOrEqual(0);
      expect(availability).toBeLessThanOrEqual(100);
    });
  });

  describe('View Tabs', () => {
    it('should start with pending view by default', () => {
      expect(component['currentView']()).toBe('pending');
    });

    it('should switch to approved view', () => {
      component['setView']('approved');
      expect(component['currentView']()).toBe('approved');
    });

    it('should switch to calendar view', () => {
      component['setView']('calendar');
      expect(component['currentView']()).toBe('calendar');
    });

    it('should switch to employees view', () => {
      component['setView']('employees');
      expect(component['currentView']()).toBe('employees');
    });
  });

  describe('Filters', () => {
    beforeEach(() => {
      vacationService.createVacationRequest({
        type: VacationRequestType.VACATION,
        startDate: '2025-12-01',
        endDate: '2025-12-05'
      }, 'emp-1');

      vacationService.createVacationRequest({
        type: VacationRequestType.VACATION,
        startDate: '2025-12-10',
        endDate: '2025-12-15'
      }, 'emp-2');

      fixture.detectChanges();
    });

    it('should filter by employee', () => {
      component['employeeFilterControl'].setValue('emp-1');
      fixture.detectChanges();

      const filtered = component['displayedRequests']();
      expect(filtered.every(r => r.employeeId === 'emp-1')).toBe(true);
    });

    it('should show active filters indicator', () => {
      component['employeeFilterControl'].setValue('emp-1');
      expect(component['hasActiveFilters']()).toBe(true);
    });

    it('should clear filters', () => {
      component['employeeFilterControl'].setValue('emp-1');
      component['clearFilters']();

      expect(component['employeeFilterControl'].value).toBe('');
      expect(component['hasActiveFilters']()).toBe(false);
    });

    it('should get unique employees list', () => {
      const employees = component['uniqueEmployees']();
      expect(employees.length).toBeGreaterThan(0);
    });
  });

  describe('Approval Actions', () => {
    let requestId: string;

    beforeEach(() => {
      const request = vacationService.createVacationRequest({
        type: VacationRequestType.VACATION,
        startDate: '2025-12-01',
        endDate: '2025-12-05'
      });
      requestId = request.id;
      fixture.detectChanges();
    });

    it('should approve request when confirmed', () => {
      spyOn(window, 'confirm').and.returnValue(true);
      
      component['onApprove']({ requestId, comments: 'Approved' });
      
      const updated = vacationService.getRequestById(requestId);
      expect(updated?.status).toBe(VacationRequestStatus.APPROVED);
    });

    it('should not approve request when confirmation is cancelled', () => {
      spyOn(window, 'confirm').and.returnValue(false);
      
      component['onApprove']({ requestId, comments: 'Approved' });
      
      const updated = vacationService.getRequestById(requestId);
      expect(updated?.status).toBe(VacationRequestStatus.PENDING);
    });

    it('should reject request when confirmed', () => {
      spyOn(window, 'confirm').and.returnValue(true);
      
      component['onReject']({ requestId, comments: 'Rejected' });
      
      const updated = vacationService.getRequestById(requestId);
      expect(updated?.status).toBe(VacationRequestStatus.REJECTED);
    });

    it('should not reject request when confirmation is cancelled', () => {
      spyOn(window, 'confirm').and.returnValue(false);
      
      component['onReject']({ requestId, comments: 'Rejected' });
      
      const updated = vacationService.getRequestById(requestId);
      expect(updated?.status).toBe(VacationRequestStatus.PENDING);
    });

    it('should include comments in approval', () => {
      spyOn(window, 'confirm').and.returnValue(true);
      
      component['onApprove']({ requestId, comments: 'Good timing' });
      
      const updated = vacationService.getRequestById(requestId);
      expect(updated?.reviewComments).toBe('Good timing');
    });

    it('should include comments in rejection', () => {
      spyOn(window, 'confirm').and.returnValue(true);
      
      component['onReject']({ requestId, comments: 'Team capacity issue' });
      
      const updated = vacationService.getRequestById(requestId);
      expect(updated?.reviewComments).toBe('Team capacity issue');
    });
  });

  describe('Calendar View', () => {
    it('should generate calendar days', () => {
      const days = component['calendarDaysForView']();
      expect(days.length).toBeGreaterThan(0);
    });

    it('should generate approximately 30 days of calendar', () => {
      const days = component['calendarDaysForView']();
      // Should be around 30-42 days (30 days + padding to start from Sunday)
      expect(days.length).toBeGreaterThanOrEqual(30);
      expect(days.length).toBeLessThanOrEqual(42);
    });

    it('should mark weekends in calendar', () => {
      const days = component['calendarDaysForView']();
      const hasWeekends = days.some((day: any) => day.isWeekend);
      expect(hasWeekends).toBe(true);
    });
  });

  describe('Employee Summary View', () => {
    beforeEach(() => {
      const req = vacationService.createVacationRequest({
        type: VacationRequestType.VACATION,
        startDate: '2025-12-01',
        endDate: '2025-12-05'
      }, 'emp-1');

      managementService.approveRequest({
        requestId: req.id,
        action: 'approve',
        reviewedBy: 'Admin'
      });

      fixture.detectChanges();
    });

    it('should generate employee summaries', () => {
      const summaries = component['employeeSummaries']();
      expect(summaries.length).toBeGreaterThan(0);
    });

    it('should include vacation balances in summaries', () => {
      const summaries = component['employeeSummaries']();
      const emp = summaries[0];
      
      expect(emp.totalDaysAllowed).toBe(22);
      expect(emp.daysUsed).toBeGreaterThanOrEqual(0);
      expect(emp.daysRemaining).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Empty States', () => {
    it('should show empty state when no pending requests', () => {
      component['setView']('pending');
      fixture.detectChanges();

      const compiled = fixture.nativeElement;
      const content = compiled.textContent;
      expect(content).toContain('No pending requests');
    });

    it('should show empty state when no approved requests', () => {
      component['setView']('approved');
      fixture.detectChanges();

      const compiled = fixture.nativeElement;
      const content = compiled.textContent;
      expect(content).toContain('No approved requests');
    });
  });

  describe('Formatted Display', () => {
    it('should format dates correctly', () => {
      const date = new Date('2025-12-01');
      const formatted = component['formatDate'](date);
      expect(formatted).toBeTruthy();
    });

    it('should format vacation types correctly', () => {
      expect(component['getTypeLabel']('vacation')).toBe('Vacation');
      expect(component['getTypeLabel']('personal_day')).toBe('Personal Day');
      expect(component['getTypeLabel']('sick_leave')).toBe('Sick Leave');
    });
  });

  describe('Accessibility', () => {
    it('should have proper aria-labels on buttons', () => {
      const compiled = fixture.nativeElement;
      const buttons = compiled.querySelectorAll('button');
      
      buttons.forEach((button: HTMLButtonElement) => {
        const ariaLabel = button.getAttribute('aria-label');
        // Buttons should have either aria-label or descriptive text content
        expect(ariaLabel || button.textContent?.trim()).toBeTruthy();
      });
    });

    it('should have proper labels on form controls', () => {
      const compiled = fixture.nativeElement;
      const selects = compiled.querySelectorAll('select');
      
      selects.forEach((select: HTMLSelectElement) => {
        const id = select.id;
        if (id) {
          const label = compiled.querySelector(`label[for="${id}"]`);
          expect(label).toBeTruthy();
        }
      });
    });

    it('should have role and aria attributes on progress bars', () => {
      component['setView']('employees');
      fixture.detectChanges();

      const compiled = fixture.nativeElement;
      const progressBars = compiled.querySelectorAll('[role="progressbar"]');
      
      progressBars.forEach((bar: Element) => {
        expect(bar.getAttribute('aria-valuenow')).toBeTruthy();
        expect(bar.getAttribute('aria-valuemin')).toBeTruthy();
        expect(bar.getAttribute('aria-valuemax')).toBeTruthy();
      });
    });
  });
});
