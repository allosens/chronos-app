import { Injectable, signal, computed, inject } from '@angular/core';
import { 
  Employee, 
  EmployeeFormData, 
  EmployeeStatus,
  EmployeeFilters,
  EmployeePagination
} from '../models/employee.model';
import { AuthService } from '../../auth/services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class EmployeeService {
  private readonly authService = inject(AuthService);
  
  // Constants
  private readonly DEFAULT_PAGE_SIZE = 10;
  private readonly STORAGE_KEY = 'chronos-employees';

  // Signal for all employees
  private employeesSignal = signal<Employee[]>([]);
  
  // Filters and pagination signals
  private filtersSignal = signal<EmployeeFilters>({ status: EmployeeStatus.ACTIVE });
  private paginationSignal = signal<EmployeePagination>({
    page: 1,
    pageSize: this.DEFAULT_PAGE_SIZE,
    totalItems: 0,
    totalPages: 0
  });

  // Public readonly signals
  readonly employees = this.employeesSignal.asReadonly();
  readonly filters = this.filtersSignal.asReadonly();
  readonly pagination = this.paginationSignal.asReadonly();

  // Computed signals
  readonly activeEmployees = computed(() => 
    this.employees().filter(emp => emp.status === EmployeeStatus.ACTIVE)
  );

  readonly inactiveEmployees = computed(() => 
    this.employees().filter(emp => emp.status === EmployeeStatus.INACTIVE)
  );

  readonly filteredEmployees = computed(() => {
    const currentFilters = this.filters();
    let filtered = this.employees();

    // Filter by status
    if (currentFilters.status) {
      filtered = filtered.filter(emp => emp.status === currentFilters.status);
    }

    // Filter by search term (searches in name, email, position, department)
    if (currentFilters.searchTerm) {
      const searchLower = currentFilters.searchTerm.toLowerCase();
      filtered = filtered.filter(emp => 
        emp.firstName.toLowerCase().includes(searchLower) ||
        emp.lastName.toLowerCase().includes(searchLower) ||
        emp.email.toLowerCase().includes(searchLower) ||
        emp.position?.toLowerCase().includes(searchLower) ||
        emp.department?.toLowerCase().includes(searchLower)
      );
    }

    // Filter by department
    if (currentFilters.department) {
      filtered = filtered.filter(emp => emp.department === currentFilters.department);
    }

    return filtered;
  });

  readonly paginatedEmployees = computed(() => {
    const filtered = this.filteredEmployees();
    const currentPagination = this.pagination();
    const startIndex = (currentPagination.page - 1) * currentPagination.pageSize;
    const endIndex = startIndex + currentPagination.pageSize;

    return filtered.slice(startIndex, endIndex);
  });

  readonly departments = computed(() => {
    const depts = new Set<string>();
    this.employees().forEach(emp => {
      if (emp.department) {
        depts.add(emp.department);
      }
    });
    return Array.from(depts).sort();
  });

  constructor() {
    this.loadEmployees();
    
    // Update pagination when filtered results change
    this.updatePaginationInfo();
  }

  /**
   * Creates a new employee
   */
  createEmployee(formData: EmployeeFormData): Employee {
    const currentUser = this.authService.currentUser();
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    // Validate unique email for the company
    if (this.isEmailTaken(formData.email)) {
      throw new Error('Email already exists for this company');
    }

    const newEmployee: Employee = {
      id: this.generateId(),
      companyId: this.getCurrentCompanyId(),
      email: formData.email,
      firstName: formData.firstName,
      lastName: formData.lastName,
      position: formData.position,
      department: formData.department,
      phoneNumber: formData.phoneNumber,
      status: EmployeeStatus.ACTIVE,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const currentEmployees = this.employeesSignal();
    this.employeesSignal.set([...currentEmployees, newEmployee]);
    this.saveToLocalStorage();
    this.updatePaginationInfo();

    return newEmployee;
  }

  /**
   * Updates an existing employee
   */
  updateEmployee(id: string, formData: EmployeeFormData): Employee {
    const currentEmployees = this.employeesSignal();
    const employeeIndex = currentEmployees.findIndex(emp => emp.id === id);

    if (employeeIndex === -1) {
      throw new Error('Employee not found');
    }

    const existingEmployee = currentEmployees[employeeIndex];

    // Validate unique email (excluding current employee)
    if (formData.email !== existingEmployee.email && this.isEmailTaken(formData.email)) {
      throw new Error('Email already exists for this company');
    }

    const updatedEmployee: Employee = {
      ...existingEmployee,
      email: formData.email,
      firstName: formData.firstName,
      lastName: formData.lastName,
      position: formData.position,
      department: formData.department,
      phoneNumber: formData.phoneNumber,
      updatedAt: new Date()
    };

    const updatedEmployees = [...currentEmployees];
    updatedEmployees[employeeIndex] = updatedEmployee;
    this.employeesSignal.set(updatedEmployees);
    this.saveToLocalStorage();

    return updatedEmployee;
  }

  /**
   * Soft delete: Deactivates an employee
   */
  deactivateEmployee(id: string): void {
    const currentUser = this.authService.currentUser();
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    const currentEmployees = this.employeesSignal();
    const updatedEmployees = currentEmployees.map(emp => {
      if (emp.id === id && emp.status === EmployeeStatus.ACTIVE) {
        return {
          ...emp,
          status: EmployeeStatus.INACTIVE,
          deactivatedAt: new Date(),
          deactivatedBy: currentUser.name,
          updatedAt: new Date()
        };
      }
      return emp;
    });

    this.employeesSignal.set(updatedEmployees);
    this.saveToLocalStorage();
    this.updatePaginationInfo();
  }

  /**
   * Reactivates an inactive employee
   */
  reactivateEmployee(id: string): void {
    const currentEmployees = this.employeesSignal();
    const updatedEmployees = currentEmployees.map(emp => {
      if (emp.id === id && emp.status === EmployeeStatus.INACTIVE) {
        return {
          ...emp,
          status: EmployeeStatus.ACTIVE,
          deactivatedAt: undefined,
          deactivatedBy: undefined,
          updatedAt: new Date()
        };
      }
      return emp;
    });

    this.employeesSignal.set(updatedEmployees);
    this.saveToLocalStorage();
    this.updatePaginationInfo();
  }

  /**
   * Gets employee by ID
   */
  getEmployeeById(id: string): Employee | undefined {
    return this.employees().find(emp => emp.id === id);
  }

  /**
   * Sets filters for employee list
   */
  setFilters(filters: EmployeeFilters): void {
    this.filtersSignal.set(filters);
    // Reset to first page when filters change
    this.setPage(1);
    this.updatePaginationInfo();
  }

  /**
   * Sets current page
   */
  setPage(page: number): void {
    const currentPagination = this.paginationSignal();
    if (page < 1 || (currentPagination.totalPages > 0 && page > currentPagination.totalPages)) {
      return;
    }
    this.paginationSignal.update(p => ({ ...p, page }));
  }

  /**
   * Sets page size
   */
  setPageSize(pageSize: number): void {
    this.paginationSignal.update(p => ({ ...p, pageSize, page: 1 }));
    this.updatePaginationInfo();
  }

  /**
   * Checks if email is already taken in the current company
   */
  private isEmailTaken(email: string): boolean {
    const companyId = this.getCurrentCompanyId();
    return this.employees().some(
      emp => emp.email.toLowerCase() === email.toLowerCase() && 
             emp.companyId === companyId
    );
  }

  /**
   * Gets current company ID from authenticated user
   * In a real app, this would come from the user's company association
   */
  private getCurrentCompanyId(): string {
    // For now, return a mock company ID
    // In production, this would be retrieved from the authenticated user
    return 'company-1';
  }

  /**
   * Updates pagination information based on filtered results
   */
  private updatePaginationInfo(): void {
    const totalItems = this.filteredEmployees().length;
    const currentPagination = this.paginationSignal();
    const totalPages = Math.ceil(totalItems / currentPagination.pageSize);

    this.paginationSignal.update(p => ({
      ...p,
      totalItems,
      totalPages
    }));
  }

  private generateId(): string {
    return `emp-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }

  private loadEmployees(): void {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const employees: Employee[] = parsed.map((emp: any) => ({
          ...emp,
          createdAt: new Date(emp.createdAt),
          updatedAt: new Date(emp.updatedAt),
          deactivatedAt: emp.deactivatedAt ? new Date(emp.deactivatedAt) : undefined
        }));
        this.employeesSignal.set(employees);
      } catch (error) {
        console.error('Error loading employees:', error);
        this.initializeSampleData();
      }
    } else {
      this.initializeSampleData();
    }
  }

  private saveToLocalStorage(): void {
    const employees = this.employees().map(emp => ({
      ...emp,
      createdAt: emp.createdAt.toISOString(),
      updatedAt: emp.updatedAt.toISOString(),
      deactivatedAt: emp.deactivatedAt?.toISOString()
    }));
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(employees));
  }

  private initializeSampleData(): void {
    const now = new Date();
    const sampleEmployees: Employee[] = [
      {
        id: this.generateId(),
        companyId: 'company-1',
        email: 'john.doe@chronos.com',
        firstName: 'John',
        lastName: 'Doe',
        position: 'Software Engineer',
        department: 'Engineering',
        phoneNumber: '+1234567890',
        status: EmployeeStatus.ACTIVE,
        createdAt: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      },
      {
        id: this.generateId(),
        companyId: 'company-1',
        email: 'jane.smith@chronos.com',
        firstName: 'Jane',
        lastName: 'Smith',
        position: 'Product Manager',
        department: 'Product',
        phoneNumber: '+1234567891',
        status: EmployeeStatus.ACTIVE,
        createdAt: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000)
      },
      {
        id: this.generateId(),
        companyId: 'company-1',
        email: 'bob.johnson@chronos.com',
        firstName: 'Bob',
        lastName: 'Johnson',
        position: 'Designer',
        department: 'Design',
        status: EmployeeStatus.INACTIVE,
        createdAt: new Date(now.getTime() - 120 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
        deactivatedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
        deactivatedBy: 'Admin User'
      }
    ];

    this.employeesSignal.set(sampleEmployees);
    this.saveToLocalStorage();
  }
}
