import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { EmployeeManagement } from './employee-management';
import { EmployeeService } from '../services/employee.service';
import { AuthService } from '../../auth/services/auth.service';
import { EmployeeStatus } from '../models/employee.model';
import { signal } from '@angular/core';

describe('EmployeeManagement', () => {
  let component: EmployeeManagement;
  let fixture: ComponentFixture<EmployeeManagement>;
  let employeeServiceSpy: jasmine.SpyObj<EmployeeService>;

  const mockEmployee = {
    id: '1',
    companyId: 'company-1',
    email: 'john.doe@chronos.com',
    firstName: 'John',
    lastName: 'Doe',
    position: 'Developer',
    department: 'Engineering',
    status: EmployeeStatus.ACTIVE,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  beforeEach(async () => {
    const employeeServiceSpyObj = jasmine.createSpyObj('EmployeeService', [
      'setFilters',
      'setPage',
      'deactivateEmployee',
      'reactivateEmployee',
      'createEmployee',
      'updateEmployee'
    ], {
      paginatedEmployees: signal([mockEmployee]),
      pagination: signal({ page: 1, pageSize: 10, totalItems: 1, totalPages: 1 }),
      departments: signal(['Engineering'])
    });

    const authServiceSpyObj = jasmine.createSpyObj('AuthService', [], {
      currentUser: jasmine.createSpy().and.returnValue(null)
    });

    await TestBed.configureTestingModule({
      imports: [EmployeeManagement],
      providers: [
        provideZonelessChangeDetection(),
        { provide: EmployeeService, useValue: employeeServiceSpyObj },
        { provide: AuthService, useValue: authServiceSpyObj }
      ]
    }).compileComponents();

    employeeServiceSpy = TestBed.inject(EmployeeService) as jasmine.SpyObj<EmployeeService>;
    
    fixture = TestBed.createComponent(EmployeeManagement);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display employee list by default', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const listComponent = compiled.querySelector('app-employee-list');
    expect(listComponent).toBeTruthy();
  });

  it('should not display form initially', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const formComponent = compiled.querySelector('app-employee-form');
    expect(formComponent).toBeFalsy();
  });

  it('should show form when creating new employee', () => {
    component['onCreateEmployee']();
    fixture.detectChanges();

    expect(component['showForm']()).toBeTruthy();
    expect(component['selectedEmployee']()).toBeNull();

    const compiled = fixture.nativeElement as HTMLElement;
    const formComponent = compiled.querySelector('app-employee-form');
    expect(formComponent).toBeTruthy();
  });

  it('should show form when editing employee', () => {
    component['onEditEmployee'](mockEmployee);
    fixture.detectChanges();

    expect(component['showForm']()).toBeTruthy();
    expect(component['selectedEmployee']()).toBe(mockEmployee);

    const compiled = fixture.nativeElement as HTMLElement;
    const formComponent = compiled.querySelector('app-employee-form');
    expect(formComponent).toBeTruthy();
  });

  it('should hide form when cancel is clicked', () => {
    component['onCreateEmployee']();
    fixture.detectChanges();

    component['onCancelForm']();
    fixture.detectChanges();

    expect(component['showForm']()).toBeFalsy();
    expect(component['selectedEmployee']()).toBeNull();

    const compiled = fixture.nativeElement as HTMLElement;
    const listComponent = compiled.querySelector('app-employee-list');
    expect(listComponent).toBeTruthy();
  });

  it('should hide form and reset state when employee is saved', () => {
    component['onEditEmployee'](mockEmployee);
    fixture.detectChanges();

    component['onEmployeeSaved'](mockEmployee);
    fixture.detectChanges();

    expect(component['showForm']()).toBeFalsy();
    expect(component['selectedEmployee']()).toBeNull();

    const compiled = fixture.nativeElement as HTMLElement;
    const listComponent = compiled.querySelector('app-employee-list');
    expect(listComponent).toBeTruthy();
  });

  it('should maintain form state when switching between create and edit', () => {
    // Start with create
    component['onCreateEmployee']();
    expect(component['selectedEmployee']()).toBeNull();

    // Switch to edit
    component['onEditEmployee'](mockEmployee);
    expect(component['selectedEmployee']()).toBe(mockEmployee);

    // Switch back to create
    component['onCreateEmployee']();
    expect(component['selectedEmployee']()).toBeNull();
  });
});
