import { Component, inject, signal, computed, effect, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { TimeCorrectionService } from '../../services/time-correction.service';
import { TimesheetHistoryService } from '../../../time-tracking/services/timesheet-history.service';
import { TimesheetEntry } from '../../../time-tracking/models/timesheet-history.model';
import { DateUtils } from '../../../../shared/utils/date.utils';
import { WorkSession } from '../../../time-tracking/models/time-tracking.model';

@Component({
  selector: 'app-time-correction-form',
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
      <h2 class="text-2xl font-bold text-gray-900 mb-6">Request Time Correction</h2>

      @if (submitSuccess()) {
        <div class="bg-green-50 border border-green-200 rounded-lg p-4 mb-6" role="alert">
          <div class="flex items-start gap-3">
            <span class="text-green-600 text-xl" aria-hidden="true">✅</span>
            <div class="flex-1">
              <p class="text-sm font-medium text-green-800">Request Submitted Successfully</p>
              <p class="text-xs text-green-700 mt-1">
                Your correction request has been submitted and is pending approval.
              </p>
            </div>
          </div>
        </div>
      }

      @if (submitError()) {
        <div class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6" role="alert">
          <div class="flex items-start gap-3">
            <span class="text-red-600 text-xl" aria-hidden="true">❌</span>
            <div class="flex-1">
              <p class="text-sm font-medium text-red-800">Error Submitting Request</p>
              <p class="text-xs text-red-700 mt-1">
                {{ submitError() }}
              </p>
            </div>
            <button
              type="button"
              (click)="clearError()"
              class="text-red-600 hover:text-red-800"
              aria-label="Close error message"
            >
              ✕
            </button>
          </div>
        </div>
      }

      <form [formGroup]="correctionForm" (ngSubmit)="onSubmit()" class="space-y-6">
        <!-- Time Entry Selection -->
        <div>
          <label for="workSession" class="block text-sm font-medium text-gray-700 mb-2">
            Select Work Session to Correct *
          </label>
          <select
            id="workSession"
            formControlName="workSessionId"
            class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            [class.border-red-500]="isFieldInvalid('workSessionId')"
            aria-required="true"
            aria-describedby="workSession-error"
          >
            <option value="">-- Select a work session --</option>
            @for (entry of timeEntrySummaries(); track entry.id) {
              <option [value]="entry.id">{{ entry.displayText }}</option>
            }
          </select>
          @if (isFieldInvalid('workSessionId')) {
            <p id="workSession-error" class="mt-1 text-sm text-red-600" role="alert">
              Please select a work session to correct
            </p>
          }
        </div>

        <!-- Selected Entry Details -->
        @if (selectedEntry()) {
          <div class="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h3 class="text-sm font-medium text-gray-700 mb-3">Current Values</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span class="text-gray-600">Date:</span>
                <span class="ml-2 font-medium text-gray-900">
                  {{ formatDate(selectedEntry()!.date) }}
                </span>
              </div>
              <div>
                <span class="text-gray-600">Clock In:</span>
                <span class="ml-2 font-medium text-gray-900">
                  {{ selectedEntry()!.clockIn ? formatTime(selectedEntry()!.clockIn!) : 'N/A' }}
                </span>
              </div>
              <div>
                <span class="text-gray-600">Clock Out:</span>
                <span class="ml-2 font-medium text-gray-900">
                  {{ selectedEntry()!.clockOut ? formatTime(selectedEntry()!.clockOut!) : 'N/A' }}
                </span>
              </div>
            </div>
          </div>
        }

        <!-- Requested Clock In -->
        <div>
          <label for="requestedClockIn" class="block text-sm font-medium text-gray-700 mb-2">
            Requested Clock In Time
          </label>
          <input
            type="time"
            id="requestedClockIn"
            formControlName="requestedClockIn"
            class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            [class.border-red-500]="isFieldInvalid('requestedClockIn')"
            aria-describedby="requestedClockIn-help"
          />
          <p id="requestedClockIn-help" class="mt-1 text-xs text-gray-500">
            Leave empty if no change needed
          </p>
        </div>

        <!-- Requested Clock Out -->
        <div>
          <label for="requestedClockOut" class="block text-sm font-medium text-gray-700 mb-2">
            Requested Clock Out Time
          </label>
          <input
            type="time"
            id="requestedClockOut"
            formControlName="requestedClockOut"
            class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            [class.border-red-500]="isFieldInvalid('requestedClockOut')"
            aria-describedby="requestedClockOut-help"
          />
          <p id="requestedClockOut-help" class="mt-1 text-xs text-gray-500">
            Leave empty if no change needed
          </p>
          @if (isFieldInvalid('requestedClockOut')) {
            <p class="mt-1 text-sm text-red-600" role="alert">
              Clock out time must be after clock in time
            </p>
          }
        </div>

        <!-- Preview Changes -->
        @if (hasChanges()) {
          <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 class="text-sm font-medium text-blue-900 mb-3">Preview Changes</h3>
            <div class="space-y-2 text-sm">
              @if (correctionForm.value.requestedClockIn && selectedEntry()?.clockIn) {
                <div class="flex items-center gap-2">
                  <span class="text-blue-700">Clock In:</span>
                  <span class="line-through text-gray-500">
                    {{ formatTime(selectedEntry()!.clockIn!) }}
                  </span>
                  <span class="text-blue-700">→</span>
                  <span class="font-medium text-blue-900">
                    {{ correctionForm.value.requestedClockIn }}
                  </span>
                </div>
              }
              @if (correctionForm.value.requestedClockOut && selectedEntry()?.clockOut) {
                <div class="flex items-center gap-2">
                  <span class="text-blue-700">Clock Out:</span>
                  <span class="line-through text-gray-500">
                    {{ formatTime(selectedEntry()!.clockOut!) }}
                  </span>
                  <span class="text-blue-700">→</span>
                  <span class="font-medium text-blue-900">
                    {{ correctionForm.value.requestedClockOut }}
                  </span>
                </div>
              }
            </div>
          </div>
        }

        <!-- Reason -->
        <div>
          <label for="reason" class="block text-sm font-medium text-gray-700 mb-2">
            Reason for Correction *
          </label>
          <textarea
            id="reason"
            formControlName="reason"
            rows="4"
            class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            [class.border-red-500]="isFieldInvalid('reason')"
            placeholder="Please explain why this correction is needed..."
            aria-required="true"
            aria-describedby="reason-error reason-help"
          ></textarea>
          @if (isFieldInvalid('reason')) {
            <p id="reason-error" class="mt-1 text-sm text-red-600" role="alert">
              Reason is required (minimum 10 characters)
            </p>
          }
          <p id="reason-help" class="mt-1 text-xs text-gray-500">
            Minimum 10 characters
          </p>
        </div>

        <!-- Form Actions -->
        <div class="flex gap-4 pt-4">
          <button
            type="submit"
            [disabled]="!correctionForm.valid || isSubmitting() || !hasChanges()"
            class="flex-1 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            @if (isSubmitting()) {
              <span>Submitting...</span>
            } @else {
              <span>Submit Request</span>
            }
          </button>
          <button
            type="button"
            (click)="resetForm()"
            class="px-6 py-3 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 focus:ring-4 focus:ring-gray-200 transition-colors"
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
export class TimeCorrectionForm {
  private fb = inject(FormBuilder);
  private correctionService = inject(TimeCorrectionService);
  private timesheetService = inject(TimesheetHistoryService);
  private destroyRef = inject(DestroyRef);
  private route = inject(ActivatedRoute);

  protected correctionForm: FormGroup;
  protected isSubmitting = signal(false);
  protected submitSuccess = signal(false);
  protected submitError = signal<string | null>(null);
  private successTimeoutId?: number;
  
  // Signal to track form changes
  private formChangesSignal = signal(0);

  // Get available time entries
  protected timeEntrySummaries = computed(() => {
    const entries = this.timesheetService.entries();
    return this.correctionService.convertToTimeEntrySummaries(entries);
  });

  // Get selected time entry (work session)
  protected selectedEntry = computed((): TimesheetEntry | null => {
    // Force reactivity by reading formChangesSignal
    this.formChangesSignal();
    const sessionId = this.correctionForm.get('workSessionId')?.value;
    if (!sessionId) return null;

    const entries = this.timesheetService.entries();
    return entries.find((e: TimesheetEntry) => e.id === sessionId) || null;
  });

  // Check if there are any changes
  protected hasChanges = computed(() => {
    // Force reactivity by reading formChangesSignal
    this.formChangesSignal();
    const clockIn = this.correctionForm.get('requestedClockIn')?.value;
    const clockOut = this.correctionForm.get('requestedClockOut')?.value;
    return !!(clockIn || clockOut);
  });

  constructor() {
    this.correctionForm = this.fb.group({
      workSessionId: ['', Validators.required],
      requestedClockIn: [''],
      requestedClockOut: [''],
      reason: ['', [Validators.required, Validators.minLength(10)]]
    });

    // Subscribe to form value changes to update signal
    this.correctionForm.valueChanges.subscribe(() => {
      this.formChangesSignal.update(v => v + 1);
    });

    // Pre-select entry from query parameter if provided
    this.route.queryParams.subscribe(params => {
      if (params['sessionId']) {
        this.correctionForm.patchValue({ workSessionId: params['sessionId'] });
      } else if (params['entryId']) {
        // Support legacy parameter name
        this.correctionForm.patchValue({ workSessionId: params['entryId'] });
      }
    });

    // Add time validation when times change
    effect(() => {
      const clockIn = this.correctionForm.get('requestedClockIn')?.value;
      const clockOut = this.correctionForm.get('requestedClockOut')?.value;

      if (clockIn && clockOut) {
        const clockInDate = DateUtils.createTodayAtTime(clockIn);
        const clockOutDate = DateUtils.createTodayAtTime(clockOut);
        
        if (clockInDate && clockOutDate && clockInDate >= clockOutDate) {
          this.correctionForm.get('requestedClockOut')?.setErrors({ invalidTime: true });
        } else {
          this.correctionForm.get('requestedClockOut')?.setErrors(null);
        }
      }
    });

    // Cleanup timeouts on destroy
    this.destroyRef.onDestroy(() => {
      if (this.successTimeoutId) {
        clearTimeout(this.successTimeoutId);
      }
    });
  }

  protected isFieldInvalid(fieldName: string): boolean {
    const field = this.correctionForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  protected formatDate(dateString: string): string {
    return DateUtils.formatDate(new Date(dateString), 'medium');
  }

  protected formatTime(date: Date): string {
    return DateUtils.formatTime12Hour(date);
  }

  protected async onSubmit(): Promise<void> {
    if (this.correctionForm.invalid || !this.hasChanges()) {
      this.correctionForm.markAllAsTouched();
      return;
    }

    const selected = this.selectedEntry();
    if (!selected) return;

    this.isSubmitting.set(true);
    this.submitError.set(null);
    this.submitSuccess.set(false);

    try {
      // Convert TimesheetEntry to WorkSession format for API
      const workSession: WorkSession = {
        id: selected.id,
        userId: '', // Will be set by API from auth token
        companyId: '', // Will be set by API from auth token
        date: selected.date,
        clockIn: selected.clockIn || new Date(),
        clockOut: selected.clockOut || null,
        status: selected.status as any, // Status maps correctly
        totalHours: selected.totalHours,
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        breaks: selected.breaks.map(b => ({
          id: b.id,
          workSessionId: selected.id,
          startTime: b.startTime,
          endTime: b.endTime || null,
          durationMinutes: b.duration || null
        }))
      };

      await this.correctionService.submitRequest(this.correctionForm.value, workSession);
      
      this.submitSuccess.set(true);
      this.resetForm();

      // Hide success message after 5 seconds
      this.successTimeoutId = window.setTimeout(() => {
        this.submitSuccess.set(false);
      }, 5000);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to submit request';
      this.submitError.set(errorMessage);
    } finally {
      this.isSubmitting.set(false);
    }
  }

  protected resetForm(): void {
    this.correctionForm.reset();
    this.correctionForm.markAsUntouched();
  }

  protected clearError(): void {
    this.submitError.set(null);
  }
}
