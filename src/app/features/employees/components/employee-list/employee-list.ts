import { Component, inject, signal, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EmployeeService } from '../../services/employee.service';
import { Employee, EmployeeStatus } from '../../models/employee.model';
import { DateUtils } from '../../../../shared/utils/date.utils';

@Component({
  selector: 'app-employee-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="bg-white rounded-lg shadow-sm">
      <!-- Header with filters and actions -->
      <div class="p-6 border-b border-gray-200">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <h2 class="text-2xl font-semibold text-gray-900">Employees</h2>
          <button
            (click)="onCreateEmployee()"
            class="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            type="button"
            aria-label="Create new employee"
          >
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
            </svg>
            Add Employee
          </button>
        </div>

        <!-- Filters -->
        <div class="flex flex-col sm:flex-row gap-4">
          <!-- Search -->
          <div class="flex-1">
            <label for="search" class="sr-only">Search employees</label>
            <input
              id="search"
              type="text"
              [(ngModel)]="searchTerm"
              (ngModelChange)="onSearchChange()"
              placeholder="Search by name, email, position..."
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              aria-label="Search employees by name, email, or position"
            />
          </div>

          <!-- Status Filter -->
          <div class="sm:w-48">
            <label for="status-filter" class="sr-only">Filter by status</label>
            <select
              id="status-filter"
              [(ngModel)]="selectedStatus"
              (ngModelChange)="onStatusChange()"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              aria-label="Filter employees by status"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <!-- Department Filter -->
          @if (departments().length > 0) {
            <div class="sm:w-48">
              <label for="department-filter" class="sr-only">Filter by department</label>
              <select
                id="department-filter"
                [(ngModel)]="selectedDepartment"
                (ngModelChange)="onDepartmentChange()"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                aria-label="Filter employees by department"
              >
                <option value="">All Departments</option>
                @for (dept of departments(); track dept) {
                  <option [value]="dept">{{ dept }}</option>
                }
              </select>
            </div>
          }
        </div>
      </div>

      <!-- Employee List -->
      <div class="p-6">
        @if (paginatedEmployees().length === 0) {
          <div class="text-center py-12">
            <svg class="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
            </svg>
            <p class="text-gray-500 font-medium">No employees found</p>
            <p class="text-sm text-gray-400 mt-1">Try adjusting your search or filters</p>
          </div>
        } @else {
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Employee
                  </th>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Position
                  </th>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Department
                  </th>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                @for (employee of paginatedEmployees(); track employee.id) {
                  <tr class="hover:bg-gray-50 transition-colors">
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="flex items-center">
                        <div class="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span class="text-blue-600 font-semibold text-sm">
                            {{ getInitials(employee) }}
                          </span>
                        </div>
                        <div class="ml-4">
                          <div class="text-sm font-medium text-gray-900">
                            {{ employee.firstName }} {{ employee.lastName }}
                          </div>
                          <div class="text-sm text-gray-500">
                            {{ employee.email }}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="text-sm text-gray-900">{{ employee.position || '—' }}</div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="text-sm text-gray-900">{{ employee.department || '—' }}</div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <span
                        class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                        [class.bg-green-100]="employee.status === 'active'"
                        [class.text-green-800]="employee.status === 'active'"
                        [class.bg-red-100]="employee.status === 'inactive'"
                        [class.text-red-800]="employee.status === 'inactive'"
                      >
                        {{ getStatusLabel(employee.status) }}
                      </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {{ formatDate(employee.createdAt) }}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div class="flex items-center justify-end gap-2">
                        <button
                          (click)="onEditEmployee(employee)"
                          class="text-blue-600 hover:text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
                          type="button"
                          [attr.aria-label]="'Edit ' + employee.firstName + ' ' + employee.lastName"
                        >
                          Edit
                        </button>
                        @if (employee.status === 'active') {
                          <button
                            (click)="onDeactivateEmployee(employee)"
                            class="text-red-600 hover:text-red-900 focus:outline-none focus:ring-2 focus:ring-red-500 rounded px-2 py-1"
                            type="button"
                            [attr.aria-label]="'Deactivate ' + employee.firstName + ' ' + employee.lastName"
                          >
                            Deactivate
                          </button>
                        } @else {
                          <button
                            (click)="onReactivateEmployee(employee)"
                            class="text-green-600 hover:text-green-900 focus:outline-none focus:ring-2 focus:ring-green-500 rounded px-2 py-1"
                            type="button"
                            [attr.aria-label]="'Reactivate ' + employee.firstName + ' ' + employee.lastName"
                          >
                            Reactivate
                          </button>
                        }
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
          @if (pagination().totalPages > 1) {
            <div class="mt-6 flex items-center justify-between">
              <div class="text-sm text-gray-700">
                Showing {{ (pagination().page - 1) * pagination().pageSize + 1 }} to 
                {{ Math.min(pagination().page * pagination().pageSize, pagination().totalItems) }} of 
                {{ pagination().totalItems }} employees
              </div>
              <div class="flex items-center gap-2">
                <button
                  (click)="onPreviousPage()"
                  [disabled]="pagination().page === 1"
                  class="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500"
                  type="button"
                  aria-label="Previous page"
                >
                  Previous
                </button>
                <span class="text-sm text-gray-700">
                  Page {{ pagination().page }} of {{ pagination().totalPages }}
                </span>
                <button
                  (click)="onNextPage()"
                  [disabled]="pagination().page === pagination().totalPages"
                  class="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500"
                  type="button"
                  aria-label="Next page"
                >
                  Next
                </button>
              </div>
            </div>
          }
        }
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class EmployeeList {
  protected employeeService = inject(EmployeeService);
  
  // Expose Math for template
  protected Math = Math;

  // Local filter state
  protected searchTerm = signal('');
  protected selectedStatus = signal('');
  protected selectedDepartment = signal('');

  // Computed signals from service
  protected paginatedEmployees = this.employeeService.paginatedEmployees;
  protected pagination = this.employeeService.pagination;
  protected departments = this.employeeService.departments;

  // Outputs
  readonly createEmployee = output<void>();
  readonly editEmployee = output<Employee>();

  protected onSearchChange(): void {
    this.updateFilters();
  }

  protected onStatusChange(): void {
    this.updateFilters();
  }

  protected onDepartmentChange(): void {
    this.updateFilters();
  }

  private updateFilters(): void {
    this.employeeService.setFilters({
      searchTerm: this.searchTerm() || undefined,
      status: this.selectedStatus() ? (this.selectedStatus() as EmployeeStatus) : undefined,
      department: this.selectedDepartment() || undefined
    });
  }

  protected onCreateEmployee(): void {
    this.createEmployee.emit();
  }

  protected onEditEmployee(employee: Employee): void {
    this.editEmployee.emit(employee);
  }

  protected onDeactivateEmployee(employee: Employee): void {
    if (confirm(`Are you sure you want to deactivate ${employee.firstName} ${employee.lastName}? This will mark them as inactive.`)) {
      this.employeeService.deactivateEmployee(employee.id);
    }
  }

  protected onReactivateEmployee(employee: Employee): void {
    if (confirm(`Are you sure you want to reactivate ${employee.firstName} ${employee.lastName}?`)) {
      this.employeeService.reactivateEmployee(employee.id);
    }
  }

  protected onPreviousPage(): void {
    const currentPage = this.pagination().page;
    if (currentPage > 1) {
      this.employeeService.setPage(currentPage - 1);
    }
  }

  protected onNextPage(): void {
    const currentPage = this.pagination().page;
    const totalPages = this.pagination().totalPages;
    if (currentPage < totalPages) {
      this.employeeService.setPage(currentPage + 1);
    }
  }

  protected getInitials(employee: Employee): string {
    return `${employee.firstName.charAt(0)}${employee.lastName.charAt(0)}`.toUpperCase();
  }

  protected getStatusLabel(status: EmployeeStatus): string {
    return status === EmployeeStatus.ACTIVE ? 'Active' : 'Inactive';
  }

  protected formatDate(date: Date): string {
    return DateUtils.formatDate(date, 'short');
  }
}
