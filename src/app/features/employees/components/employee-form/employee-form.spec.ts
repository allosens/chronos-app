import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { EmployeeForm } from './employee-form';
import { EmployeeService } from '../../services/employee.service';
import { AuthService } from '../../../auth/services/auth.service';
import { EmployeeStatus } from '../../models/employee.model';

describe('EmployeeForm', () => {
  let component: EmployeeForm;
  let fixture: ComponentFixture<EmployeeForm>;
  let employeeServiceSpy: jasmine.SpyObj<EmployeeService>;

  const mockEmployee = {
    id: '1',
    companyId: 'company-1',
    email: 'john.doe@chronos.com',
    firstName: 'John',
    lastName: 'Doe',
    position: 'Developer',
    department: 'Engineering',
    phoneNumber: '+1234567890',
    status: EmployeeStatus.ACTIVE,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  beforeEach(async () => {
    const spy = jasmine.createSpyObj('EmployeeService', ['createEmployee', 'updateEmployee']);
    const authServiceSpyObj = jasmine.createSpyObj('AuthService', [], {
      currentUser: jasmine.createSpy().and.returnValue(null)
    });

    await TestBed.configureTestingModule({
      imports: [EmployeeForm],
      providers: [
        provideZonelessChangeDetection(),
        { provide: EmployeeService, useValue: spy },
        { provide: AuthService, useValue: authServiceSpyObj }
      ]
    }).compileComponents();

    employeeServiceSpy = TestBed.inject(EmployeeService) as jasmine.SpyObj<EmployeeService>;
    
    fixture = TestBed.createComponent(EmployeeForm);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize empty form when no employee is provided', () => {
    fixture.detectChanges();

    expect(component['employeeForm']).toBeDefined();
    expect(component['employeeForm'].get('firstName')?.value).toBe('');
    expect(component['employeeForm'].get('email')?.value).toBe('');
  });

  it('should initialize form with employee data when employee is provided', () => {
    fixture.componentRef.setInput('employee', mockEmployee);
    fixture.detectChanges();

    expect(component['employeeForm'].get('firstName')?.value).toBe('John');
    expect(component['employeeForm'].get('lastName')?.value).toBe('Doe');
    expect(component['employeeForm'].get('email')?.value).toBe('john.doe@chronos.com');
    expect(component['employeeForm'].get('position')?.value).toBe('Developer');
  });

  it('should display "Create Employee" title when creating new employee', () => {
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Create Employee');
  });

  it('should display "Edit Employee" title when editing employee', () => {
    fixture.componentRef.setInput('employee', mockEmployee);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Edit Employee');
  });

  it('should validate required fields', () => {
    fixture.detectChanges();

    const form = component['employeeForm'];
    expect(form.valid).toBeFalsy();

    form.get('firstName')?.setValue('John');
    expect(form.valid).toBeFalsy();

    form.get('lastName')?.setValue('Doe');
    expect(form.valid).toBeFalsy();

    form.get('email')?.setValue('john@chronos.com');
    expect(form.valid).toBeTruthy();
  });

  it('should validate email format', () => {
    fixture.detectChanges();

    const emailControl = component['employeeForm'].get('email');
    
    emailControl?.setValue('invalid-email');
    expect(emailControl?.hasError('email')).toBeTruthy();

    emailControl?.setValue('valid@email.com');
    expect(emailControl?.hasError('email')).toBeFalsy();
  });

  it('should call createEmployee when submitting new employee', () => {
    fixture.detectChanges();

    const newEmployee = { ...mockEmployee, id: 'new-id' };
    employeeServiceSpy.createEmployee.and.returnValue(newEmployee);
    
    spyOn(component.saved, 'emit');

    const form = component['employeeForm'];
    form.patchValue({
      firstName: 'New',
      lastName: 'Employee',
      email: 'new@chronos.com',
      position: 'Tester',
      department: 'QA'
    });

    component['onSubmit']();

    expect(employeeServiceSpy.createEmployee).toHaveBeenCalledWith({
      firstName: 'New',
      lastName: 'Employee',
      email: 'new@chronos.com',
      position: 'Tester',
      department: 'QA',
      phoneNumber: ''
    });
    expect(component.saved.emit).toHaveBeenCalledWith(newEmployee);
  });

  it('should call updateEmployee when submitting existing employee', () => {
    fixture.componentRef.setInput('employee', mockEmployee);
    fixture.detectChanges();

    const updatedEmployee = { ...mockEmployee, firstName: 'Updated' };
    employeeServiceSpy.updateEmployee.and.returnValue(updatedEmployee);
    
    spyOn(component.saved, 'emit');

    const form = component['employeeForm'];
    form.patchValue({ firstName: 'Updated' });

    component['onSubmit']();

    expect(employeeServiceSpy.updateEmployee).toHaveBeenCalledWith(
      mockEmployee.id,
      jasmine.objectContaining({ firstName: 'Updated' })
    );
    expect(component.saved.emit).toHaveBeenCalledWith(updatedEmployee);
  });

  it('should not submit when form is invalid', () => {
    fixture.detectChanges();

    component['onSubmit']();

    expect(employeeServiceSpy.createEmployee).not.toHaveBeenCalled();
    expect(employeeServiceSpy.updateEmployee).not.toHaveBeenCalled();
  });

  it('should mark all fields as touched when submitting invalid form', () => {
    fixture.detectChanges();

    const form = component['employeeForm'];
    component['onSubmit']();

    expect(form.get('firstName')?.touched).toBeTruthy();
    expect(form.get('lastName')?.touched).toBeTruthy();
    expect(form.get('email')?.touched).toBeTruthy();
  });

  it('should display error message when save fails', () => {
    fixture.detectChanges();

    employeeServiceSpy.createEmployee.and.throwError('Email already exists');

    const form = component['employeeForm'];
    form.patchValue({
      firstName: 'Test',
      lastName: 'User',
      email: 'test@chronos.com'
    });

    component['onSubmit']();
    fixture.detectChanges();

    expect(component['errorMessage']()).toContain('Email already exists');

    const compiled = fixture.nativeElement as HTMLElement;
    const errorDiv = compiled.querySelector('[role="alert"]');
    expect(errorDiv?.textContent).toContain('Email already exists');
  });

  it('should emit cancel event when cancel button is clicked', () => {
    fixture.detectChanges();
    
    spyOn(component.cancel, 'emit');

    const compiled = fixture.nativeElement as HTMLElement;
    const cancelButton = compiled.querySelector('button[type="button"]') as HTMLButtonElement;
    cancelButton.click();

    expect(component.cancel.emit).toHaveBeenCalled();
  });

  it('should reset form when cancel is clicked', () => {
    fixture.detectChanges();

    const form = component['employeeForm'];
    form.patchValue({
      firstName: 'Test',
      lastName: 'User',
      email: 'test@chronos.com'
    });

    component['onCancel']();

    // After reset, values can be null or empty string depending on FormControl state
    const firstName = form.get('firstName')?.value;
    const email = form.get('email')?.value;
    
    expect(firstName === '' || firstName === null).toBeTruthy();
    expect(email === '' || email === null).toBeTruthy();
  });

  it('should disable submit button when form is invalid', () => {
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const submitButton = compiled.querySelector('button[type="submit"]') as HTMLButtonElement;

    expect(submitButton.disabled).toBeTruthy();
  });

  it('should enable submit button when form is valid', () => {
    fixture.detectChanges();

    const form = component['employeeForm'];
    form.patchValue({
      firstName: 'Test',
      lastName: 'User',
      email: 'test@chronos.com'
    });

    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const submitButton = compiled.querySelector('button[type="submit"]') as HTMLButtonElement;

    expect(submitButton.disabled).toBeFalsy();
  });

  it('should show validation errors when field is touched and invalid', () => {
    fixture.detectChanges();

    const form = component['employeeForm'];
    const firstNameControl = form.get('firstName');
    
    firstNameControl?.markAsTouched();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const errorMessage = compiled.querySelector('p[role="alert"]');
    
    expect(errorMessage?.textContent).toContain('First name is required');
  });

  it('should detect field as invalid correctly', () => {
    fixture.detectChanges();

    const form = component['employeeForm'];
    
    // Field is invalid but not touched
    expect(component['isFieldInvalid']('firstName')).toBeFalsy();

    // Touch the field
    form.get('firstName')?.markAsTouched();
    expect(component['isFieldInvalid']('firstName')).toBeTruthy();

    // Set valid value
    form.get('firstName')?.setValue('John');
    expect(component['isFieldInvalid']('firstName')).toBeFalsy();
  });

  it('should display correct button text based on mode', () => {
    // Create mode
    fixture.detectChanges();
    let compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Create Employee');

    // Edit mode
    fixture.componentRef.setInput('employee', mockEmployee);
    fixture.detectChanges();
    compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Update Employee');
  });

  it('should show submitting state', () => {
    fixture.detectChanges();

    component['isSubmitting'].set(true);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Saving...');
  });
});
