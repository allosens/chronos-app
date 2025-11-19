import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { VacationRequestForm } from './vacation-request-form';
import { VacationRequestService } from '../../services/vacation-request.service';
import { VacationRequestType } from '../../models/vacation-request.model';

describe('VacationRequestForm', () => {
  let component: VacationRequestForm;
  let fixture: ComponentFixture<VacationRequestForm>;
  let vacationService: jasmine.SpyObj<VacationRequestService>;

  beforeEach(() => {
    const serviceSpy = jasmine.createSpyObj('VacationRequestService', [
      'createVacationRequest',
      'calculateWorkingDays',
      'hasOverlappingRequests'
    ]);

    serviceSpy.vacationBalance = jasmine.createSpy().and.returnValue({
      totalVacationDays: 22,
      usedVacationDays: 5,
      remainingVacationDays: 17,
      pendingVacationDays: 0
    });

    TestBed.configureTestingModule({
      imports: [VacationRequestForm, ReactiveFormsModule],
      providers: [
        provideZonelessChangeDetection(),
        { provide: VacationRequestService, useValue: serviceSpy }
      ]
    });

    fixture = TestBed.createComponent(VacationRequestForm);
    component = fixture.componentInstance;
    vacationService = TestBed.inject(VacationRequestService) as jasmine.SpyObj<VacationRequestService>;
    
    // Clear localStorage
    if (typeof window !== 'undefined') {
      localStorage.clear();
    }

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form with empty values', () => {
    expect(component['vacationForm'].get('type')?.value).toBe('');
    expect(component['vacationForm'].get('startDate')?.value).toBe('');
    expect(component['vacationForm'].get('endDate')?.value).toBe('');
    expect(component['vacationForm'].get('comments')?.value).toBe('');
  });

  it('should mark form as invalid when required fields are empty', () => {
    expect(component['vacationForm'].valid).toBe(false);
  });

  it('should mark form as valid when all required fields are filled', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);

    component['vacationForm'].patchValue({
      type: VacationRequestType.VACATION,
      startDate: tomorrow.toISOString().split('T')[0],
      endDate: nextWeek.toISOString().split('T')[0]
    });

    expect(component['vacationForm'].valid).toBe(true);
  });

  it('should show error for past start date', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    component['vacationForm'].patchValue({
      type: VacationRequestType.VACATION,
      startDate: yesterday.toISOString().split('T')[0]
    });

    const startDateControl = component['vacationForm'].get('startDate');
    expect(startDateControl?.hasError('pastDate')).toBe(true);
  });

  it('should show error when end date is before start date', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    component['vacationForm'].patchValue({
      type: VacationRequestType.VACATION,
      startDate: tomorrow.toISOString().split('T')[0],
      endDate: yesterday.toISOString().split('T')[0]
    });

    const endDateControl = component['vacationForm'].get('endDate');
    endDateControl?.markAsTouched();
    
    // Trigger validation
    component['validateEndDate']();
    
    expect(endDateControl?.hasError('beforeStart')).toBe(true);
  });

  it('should validate comments max length', () => {
    const longComment = 'a'.repeat(501);
    
    component['vacationForm'].patchValue({
      comments: longComment
    });

    const commentsControl = component['vacationForm'].get('comments');
    expect(commentsControl?.hasError('maxlength')).toBe(true);
  });

  it('should call service.createVacationRequest on valid form submission', (done) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);

    component['vacationForm'].patchValue({
      type: VacationRequestType.VACATION,
      startDate: tomorrow.toISOString().split('T')[0],
      endDate: nextWeek.toISOString().split('T')[0],
      comments: 'Test vacation'
    });

    vacationService.createVacationRequest.and.returnValue({
      id: 'test-id',
      employeeId: 'user-1',
      type: VacationRequestType.VACATION,
      startDate: tomorrow,
      endDate: nextWeek,
      totalDays: 5,
      status: 'pending' as any,
      requestedAt: new Date()
    });

    component['submitRequest']();

    // Wait for the setTimeout in submitRequest
    setTimeout(() => {
      expect(vacationService.createVacationRequest).toHaveBeenCalled();
      expect(component['showSuccessMessage']()).toBe(true);
      done();
    }, 600);
  });

  it('should not submit invalid form', () => {
    component['vacationForm'].patchValue({
      type: '',
      startDate: '',
      endDate: ''
    });

    component['submitRequest']();

    expect(vacationService.createVacationRequest).not.toHaveBeenCalled();
    expect(component['vacationForm'].touched).toBe(true);
  });

  it('should reset form when resetForm is called', () => {
    component['vacationForm'].patchValue({
      type: VacationRequestType.VACATION,
      startDate: '2025-12-01',
      endDate: '2025-12-05',
      comments: 'Test'
    });

    component['resetForm']();

    expect(component['vacationForm'].get('type')?.value).toBeNull();
    expect(component['vacationForm'].get('startDate')?.value).toBeNull();
    expect(component['vacationForm'].get('endDate')?.value).toBeNull();
    expect(component['vacationForm'].get('comments')?.value).toBeNull();
  });

  it('should return correct field validity status', () => {
    const typeControl = component['vacationForm'].get('type');
    
    expect(component['isFieldInvalid']('type')).toBe(false);
    
    typeControl?.markAsTouched();
    expect(component['isFieldInvalid']('type')).toBe(true);
    
    typeControl?.setValue(VacationRequestType.VACATION);
    expect(component['isFieldInvalid']('type')).toBe(false);
  });

  it('should set isSubmitting signal during submission', (done) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);

    component['vacationForm'].patchValue({
      type: VacationRequestType.VACATION,
      startDate: tomorrow.toISOString().split('T')[0],
      endDate: nextWeek.toISOString().split('T')[0]
    });

    vacationService.createVacationRequest.and.returnValue({
      id: 'test-id',
      employeeId: 'user-1',
      type: VacationRequestType.VACATION,
      startDate: tomorrow,
      endDate: nextWeek,
      totalDays: 5,
      status: 'pending' as any,
      requestedAt: new Date()
    });

    component['submitRequest']();

    expect(component['isSubmitting']()).toBe(true);

    setTimeout(() => {
      expect(component['isSubmitting']()).toBe(false);
      done();
    }, 600);
  });

  it('should hide success message after timeout', (done) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);

    component['vacationForm'].patchValue({
      type: VacationRequestType.VACATION,
      startDate: tomorrow.toISOString().split('T')[0],
      endDate: nextWeek.toISOString().split('T')[0]
    });

    vacationService.createVacationRequest.and.returnValue({
      id: 'test-id',
      employeeId: 'user-1',
      type: VacationRequestType.VACATION,
      startDate: tomorrow,
      endDate: nextWeek,
      totalDays: 5,
      status: 'pending' as any,
      requestedAt: new Date()
    });

    component['submitRequest']();

    setTimeout(() => {
      expect(component['showSuccessMessage']()).toBe(true);

      setTimeout(() => {
        expect(component['showSuccessMessage']()).toBe(false);
        done();
      }, 5100);
    }, 600);
  });
});
