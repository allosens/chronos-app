import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { VacationRequestService } from '../../services/vacation-request.service';
import { VacationRequestType } from '../../models/vacation-request.model';

@Component({
  selector: 'app-vacation-request-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
      <div class="flex items-center justify-between mb-6">
        <h3 class="text-xl font-semibold text-gray-900">Request Time Off</h3>
        <div class="text-sm text-gray-600">
          <span class="font-medium text-emerald-600">{{ vacationBalance().remainingVacationDays }}</span>
          vacation days remaining
        </div>
      </div>

      @if (showSuccessMessage()) {
        <div class="mb-4 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
          <div class="flex items-start gap-3">
            <svg class="w-5 h-5 text-emerald-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <div>
              <p class="font-medium text-emerald-800">Request submitted successfully!</p>
              <p class="text-sm text-emerald-700">Your time off request is pending approval.</p>
            </div>
          </div>
        </div>
      }

      <form [formGroup]="vacationForm" (ngSubmit)="submitRequest()" class="space-y-5">
        <!-- Request Type -->
        <div>
          <label for="type" class="block text-sm font-medium text-gray-700 mb-2">
            Request Type <span class="text-red-500">*</span>
          </label>
          <select
            id="type"
            formControlName="type"
            class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            [class.border-red-300]="isFieldInvalid('type')"
            aria-required="true"
          >
            <option value="">Select a type</option>
            <option [value]="VacationRequestType.VACATION">Vacation</option>
            <option [value]="VacationRequestType.PERSONAL_DAY">Personal Day</option>
            <option [value]="VacationRequestType.SICK_LEAVE">Sick Leave</option>
            <option [value]="VacationRequestType.COMPENSATORY_TIME">Compensatory Time</option>
            <option [value]="VacationRequestType.OTHER">Other</option>
          </select>
          @if (isFieldInvalid('type')) {
            <p class="mt-1 text-sm text-red-600">Please select a request type</p>
          }
        </div>

        <!-- Date Range -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Start Date -->
          <div>
            <label for="startDate" class="block text-sm font-medium text-gray-700 mb-2">
              Start Date <span class="text-red-500">*</span>
            </label>
            <input
              type="date"
              id="startDate"
              formControlName="startDate"
              class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              [class.border-red-300]="isFieldInvalid('startDate')"
              [min]="minDate"
              aria-required="true"
            />
            @if (isFieldInvalid('startDate')) {
              <p class="mt-1 text-sm text-red-600">
                @if (vacationForm.get('startDate')?.hasError('required')) {
                  Start date is required
                }
                @if (vacationForm.get('startDate')?.hasError('pastDate')) {
                  Start date must be in the future
                }
              </p>
            }
          </div>

          <!-- End Date -->
          <div>
            <label for="endDate" class="block text-sm font-medium text-gray-700 mb-2">
              End Date <span class="text-red-500">*</span>
            </label>
            <input
              type="date"
              id="endDate"
              formControlName="endDate"
              class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              [class.border-red-300]="isFieldInvalid('endDate')"
              [min]="minDate"
              aria-required="true"
            />
            @if (isFieldInvalid('endDate')) {
              <p class="mt-1 text-sm text-red-600">
                @if (vacationForm.get('endDate')?.hasError('required')) {
                  End date is required
                }
                @if (vacationForm.get('endDate')?.hasError('beforeStart')) {
                  End date must be after start date
                }
                @if (vacationForm.get('endDate')?.hasError('pastDate')) {
                  End date must be in the future
                }
              </p>
            }
          </div>
        </div>

        <!-- Calculated Days -->
        @if (calculatedDays() > 0) {
          <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div class="flex items-center gap-3">
              <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
              </svg>
              <div>
                <p class="text-sm font-medium text-blue-900">
                  Total working days: <span class="text-lg">{{ calculatedDays() }}</span>
                </p>
                <p class="text-xs text-blue-700 mt-0.5">(Excluding weekends)</p>
              </div>
            </div>
          </div>
        }

        <!-- Overlapping Warning -->
        @if (hasOverlap()) {
          <div class="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div class="flex items-start gap-3">
              <svg class="w-5 h-5 text-amber-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
              </svg>
              <div>
                <p class="text-sm font-medium text-amber-900">Overlap detected</p>
                <p class="text-xs text-amber-700">These dates overlap with an existing approved request</p>
              </div>
            </div>
          </div>
        }

        <!-- Comments -->
        <div>
          <label for="comments" class="block text-sm font-medium text-gray-700 mb-2">
            Additional Comments
          </label>
          <textarea
            id="comments"
            formControlName="comments"
            rows="3"
            class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
            placeholder="Add any additional information about your request..."
            maxlength="500"
            aria-label="Additional comments for time off request"
          ></textarea>
          <div class="mt-1 text-xs text-gray-500 text-right">
            {{ vacationForm.get('comments')?.value?.length || 0 }}/500
          </div>
        </div>

        <!-- Form Actions -->
        <div class="flex gap-3 pt-4 border-t border-gray-200">
          <button
            type="submit"
            [disabled]="vacationForm.invalid || isSubmitting()"
            class="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            aria-label="Submit time off request"
          >
            @if (isSubmitting()) {
              <span class="flex items-center justify-center gap-2">
                <svg class="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Submitting...
              </span>
            } @else {
              Submit Request
            }
          </button>
          
          <button
            type="button"
            (click)="resetForm()"
            class="px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            aria-label="Reset form"
          >
            Reset
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
export class VacationRequestForm {
  private fb = inject(FormBuilder);
  protected vacationService = inject(VacationRequestService);

  // Expose enum for template
  protected readonly VacationRequestType = VacationRequestType;

  // Form state
  protected vacationForm: FormGroup;
  protected isSubmitting = signal(false);
  protected showSuccessMessage = signal(false);

  // Computed values
  protected vacationBalance = this.vacationService.vacationBalance;
  protected minDate = new Date().toISOString().split('T')[0]; // Today's date in YYYY-MM-DD

  protected calculatedDays = computed(() => {
    const startDate = this.vacationForm?.get('startDate')?.value;
    const endDate = this.vacationForm?.get('endDate')?.value;

    if (!startDate || !endDate) return 0;

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (end < start) return 0;

    return this.vacationService.calculateWorkingDays(start, end);
  });

  protected hasOverlap = computed(() => {
    const startDate = this.vacationForm?.get('startDate')?.value;
    const endDate = this.vacationForm?.get('endDate')?.value;

    if (!startDate || !endDate) return false;

    const start = new Date(startDate);
    const end = new Date(endDate);

    return this.vacationService.hasOverlappingRequests(start, end);
  });

  constructor() {
    this.vacationForm = this.fb.group({
      type: ['', Validators.required],
      startDate: ['', [Validators.required, this.futureDateValidator]],
      endDate: ['', [Validators.required, this.futureDateValidator]],
      comments: ['', Validators.maxLength(500)]
    });

    // Add end date validation when dates change
    this.vacationForm.get('startDate')?.valueChanges.subscribe(() => {
      this.vacationForm.get('endDate')?.updateValueAndValidity();
    });

    this.vacationForm.get('endDate')?.valueChanges.subscribe(() => {
      this.validateEndDate();
    });
  }

  protected submitRequest(): void {
    if (this.vacationForm.invalid) {
      this.vacationForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);

    // Simulate API delay
    setTimeout(() => {
      this.vacationService.createVacationRequest(this.vacationForm.value);
      this.showSuccessMessage.set(true);
      this.resetForm();
      this.isSubmitting.set(false);

      // Hide success message after 5 seconds
      setTimeout(() => {
        this.showSuccessMessage.set(false);
      }, 5000);
    }, 500);
  }

  protected resetForm(): void {
    this.vacationForm.reset();
    this.vacationForm.markAsUntouched();
  }

  protected isFieldInvalid(fieldName: string): boolean {
    const field = this.vacationForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  private futureDateValidator(control: any): { [key: string]: boolean } | null {
    if (!control.value) return null;

    const selectedDate = new Date(control.value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      return { pastDate: true };
    }

    return null;
  }

  private validateEndDate(): void {
    const startDate = this.vacationForm.get('startDate')?.value;
    const endDate = this.vacationForm.get('endDate')?.value;
    const endControl = this.vacationForm.get('endDate');

    if (!startDate || !endDate || !endControl) return;

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (end < start) {
      endControl.setErrors({ beforeStart: true });
    } else if (endControl.hasError('beforeStart')) {
      // Remove the error if dates are now valid
      const errors = endControl.errors;
      delete errors!['beforeStart'];
      endControl.setErrors(Object.keys(errors!).length ? errors : null);
    }
  }
}
