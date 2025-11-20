import { Component, inject, signal, input, output, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Employee } from '../../models/employee.model';
import { EmployeeService } from '../../services/employee.service';

@Component({
  selector: 'app-employee-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bg-white rounded-lg shadow-sm p-6">
      <div class="mb-6">
        <h2 class="text-2xl font-semibold text-gray-900">
          {{ employee() ? 'Edit Employee' : 'Create Employee' }}
        </h2>
        <p class="text-sm text-gray-600 mt-1">
          {{ employee() ? 'Update employee information' : 'Add a new employee to your company' }}
        </p>
      </div>

      <form [formGroup]="employeeForm" (ngSubmit)="onSubmit()" novalidate>
        <!-- Name Fields -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label for="firstName" class="block text-sm font-medium text-gray-700 mb-2">
              First Name <span class="text-red-500" aria-label="required">*</span>
            </label>
            <input
              id="firstName"
              type="text"
              formControlName="firstName"
              class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              [class.border-gray-300]="!isFieldInvalid('firstName')"
              [class.border-red-500]="isFieldInvalid('firstName')"
              placeholder="Enter first name"
            />
            @if (isFieldInvalid('firstName')) {
              <p class="mt-1 text-sm text-red-600" role="alert">
                First name is required
              </p>
            }
          </div>

          <div>
            <label for="lastName" class="block text-sm font-medium text-gray-700 mb-2">
              Last Name <span class="text-red-500" aria-label="required">*</span>
            </label>
            <input
              id="lastName"
              type="text"
              formControlName="lastName"
              class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              [class.border-gray-300]="!isFieldInvalid('lastName')"
              [class.border-red-500]="isFieldInvalid('lastName')"
              placeholder="Enter last name"
            />
            @if (isFieldInvalid('lastName')) {
              <p class="mt-1 text-sm text-red-600" role="alert">
                Last name is required
              </p>
            }
          </div>
        </div>

        <!-- Email -->
        <div class="mb-6">
          <label for="email" class="block text-sm font-medium text-gray-700 mb-2">
            Email <span class="text-red-500" aria-label="required">*</span>
          </label>
          <input
            id="email"
            type="email"
            formControlName="email"
            class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            [class.border-gray-300]="!isFieldInvalid('email')"
            [class.border-red-500]="isFieldInvalid('email')"
            placeholder="employee@company.com"
          />
          @if (isFieldInvalid('email')) {
            <p class="mt-1 text-sm text-red-600" role="alert">
              @if (employeeForm.get('email')?.hasError('required')) {
                Email is required
              } @else if (employeeForm.get('email')?.hasError('email')) {
                Please enter a valid email address
              }
            </p>
          }
        </div>

        <!-- Position and Department -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label for="position" class="block text-sm font-medium text-gray-700 mb-2">
              Position
            </label>
            <input
              id="position"
              type="text"
              formControlName="position"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Software Engineer"
            />
          </div>

          <div>
            <label for="department" class="block text-sm font-medium text-gray-700 mb-2">
              Department
            </label>
            <input
              id="department"
              type="text"
              formControlName="department"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Engineering"
            />
          </div>
        </div>

        <!-- Phone Number -->
        <div class="mb-6">
          <label for="phoneNumber" class="block text-sm font-medium text-gray-700 mb-2">
            Phone Number
          </label>
          <input
            id="phoneNumber"
            type="tel"
            formControlName="phoneNumber"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="+1 (555) 123-4567"
          />
        </div>

        <!-- Error Message -->
        @if (errorMessage()) {
          <div class="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg" role="alert">
            <p class="text-sm text-red-800">{{ errorMessage() }}</p>
          </div>
        }

        <!-- Action Buttons -->
        <div class="flex items-center justify-end gap-4">
          <button
            type="button"
            (click)="onCancel()"
            class="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            [disabled]="!employeeForm.valid || isSubmitting()"
            class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ isSubmitting() ? 'Saving...' : (employee() ? 'Update' : 'Create') }} Employee
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class EmployeeForm implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly employeeService = inject(EmployeeService);

  // Inputs
  readonly employee = input<Employee | null>(null);

  // Outputs
  readonly cancel = output<void>();
  readonly saved = output<Employee>();

  // Form state
  protected employeeForm!: FormGroup;
  protected isSubmitting = signal(false);
  protected errorMessage = signal<string | null>(null);

  ngOnInit(): void {
    this.initializeForm();
  }

  private initializeForm(): void {
    const currentEmployee = this.employee();
    
    this.employeeForm = this.fb.group({
      firstName: [currentEmployee?.firstName || '', [Validators.required]],
      lastName: [currentEmployee?.lastName || '', [Validators.required]],
      email: [
        currentEmployee?.email || '', 
        [Validators.required, Validators.email]
      ],
      position: [currentEmployee?.position || ''],
      department: [currentEmployee?.department || ''],
      phoneNumber: [currentEmployee?.phoneNumber || '']
    });
  }

  protected isFieldInvalid(fieldName: string): boolean {
    const field = this.employeeForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  protected onSubmit(): void {
    if (this.employeeForm.invalid) {
      // Mark all fields as touched to show validation errors
      Object.keys(this.employeeForm.controls).forEach(key => {
        this.employeeForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    try {
      const formValue = this.employeeForm.value;
      const currentEmployee = this.employee();

      let savedEmployee: Employee;

      if (currentEmployee) {
        // Update existing employee
        savedEmployee = this.employeeService.updateEmployee(currentEmployee.id, formValue);
      } else {
        // Create new employee
        savedEmployee = this.employeeService.createEmployee(formValue);
      }

      this.saved.emit(savedEmployee);
      this.employeeForm.reset();
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'An error occurred while saving the employee';
      this.errorMessage.set(errorMsg);
    } finally {
      this.isSubmitting.set(false);
    }
  }

  protected onCancel(): void {
    this.cancel.emit();
    this.employeeForm.reset();
  }
}
