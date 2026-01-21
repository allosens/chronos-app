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
                  {{ selectedEntry()!.clockIn ? formatDateTime(selectedEntry()!.clockIn!) : 'N/A' }}
                </span>
              </div>
              <div>
                <span class="text-gray-600">Clock Out:</span>
                <span class="ml-2 font-medium text-gray-900">
                  {{ selectedEntry()!.clockOut ? formatDateTime(selectedEntry()!.clockOut!) : 'N/A' }}
                </span>
              </div>
            </div>
          </div>
        }

        <!-- Requested Clock In -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Requested Clock In
          </label>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div class="relative">
              <label for="requestedClockInDate" class="block text-xs text-gray-600 mb-1">Date</label>
              <div class="relative">
                <span class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  📅
                </span>
                <input
                  type="date"
                  id="requestedClockInDate"
                  formControlName="requestedClockInDate"
                  class="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white hover:border-gray-400"
                  aria-describedby="requestedClockIn-help"
                />
              </div>
            </div>
            <div class="relative">
              <label class="block text-xs text-gray-600 mb-1">Time</label>
              <div class="flex gap-2">
                <div class="relative flex-1">
                  <span class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 text-sm">
                    H
                  </span>
                  <select
                    formControlName="requestedClockInHour"
                    class="w-full pl-8 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white hover:border-gray-400 appearance-none cursor-pointer"
                    [class.border-red-500]="isFieldInvalid('requestedClockIn')"
                    aria-label="Clock in hour"
                  >
                    <option value="">--</option>
                    @for (hour of hours; track hour) {
                      <option [value]="hour">{{ hour }}</option>
                    }
                  </select>
                  <span class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400">
                    ▾
                  </span>
                </div>
                <span class="flex items-center text-gray-400 font-medium">:</span>
                <div class="relative flex-1">
                  <span class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 text-sm">
                    M
                  </span>
                  <select
                    formControlName="requestedClockInMinute"
                    class="w-full pl-8 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white hover:border-gray-400 appearance-none cursor-pointer"
                    [class.border-red-500]="isFieldInvalid('requestedClockIn')"
                    aria-label="Clock in minute"
                  >
                    <option value="">--</option>
                    @for (minute of minutes; track minute) {
                      <option [value]="minute">{{ minute }}</option>
                    }
                  </select>
                  <span class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400">
                    ▾
                  </span>
                </div>
              </div>
            </div>
          </div>
          <p id="requestedClockIn-help" class="mt-1 text-xs text-gray-500">
            Leave empty if no change needed. Date auto-fills with session date.
          </p>
        </div>

        <!-- Requested Clock Out -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Requested Clock Out
          </label>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div class="relative">
              <label for="requestedClockOutDate" class="block text-xs text-gray-600 mb-1">Date</label>
              <div class="relative">
                <span class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  📅
                </span>
                <input
                  type="date"
                  id="requestedClockOutDate"
                  formControlName="requestedClockOutDate"
                  class="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white hover:border-gray-400"
                  aria-describedby="requestedClockOut-help"
                />
              </div>
            </div>
            <div class="relative">
              <label class="block text-xs text-gray-600 mb-1">Time</label>
              <div class="flex gap-2">
                <div class="relative flex-1">
                  <span class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 text-sm">
                    H
                  </span>
                  <select
                    formControlName="requestedClockOutHour"
                    class="w-full pl-8 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white hover:border-gray-400 appearance-none cursor-pointer"
                    [class.border-red-500]="isFieldInvalid('requestedClockOut')"
                    aria-label="Clock out hour"
                  >
                    <option value="">--</option>
                    @for (hour of hours; track hour) {
                      <option [value]="hour">{{ hour }}</option>
                    }
                  </select>
                  <span class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400">
                    ▾
                  </span>
                </div>
                <span class="flex items-center text-gray-400 font-medium">:</span>
                <div class="relative flex-1">
                  <span class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 text-sm">
                    M
                  </span>
                  <select
                    formControlName="requestedClockOutMinute"
                    class="w-full pl-8 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white hover:border-gray-400 appearance-none cursor-pointer"
                    [class.border-red-500]="isFieldInvalid('requestedClockOut')"
                    aria-label="Clock out minute"
                  >
                    <option value="">--</option>
                    @for (minute of minutes; track minute) {
                      <option [value]="minute">{{ minute }}</option>
                    }
                  </select>
                  <span class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400">
                    ▾
                  </span>
                </div>
              </div>
            </div>
          </div>
          <p id="requestedClockOut-help" class="mt-1 text-xs text-gray-500">
            Leave empty if no change needed. Date auto-fills with session date.
          </p>
          @if (isFieldInvalid('requestedClockOut')) {
            <p class="mt-1 text-sm text-red-600" role="alert">
              Clock out must be after clock in
            </p>
          }
        </div>

        <!-- Preview Changes -->
        @if (hasChanges()) {
          <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 class="text-sm font-medium text-blue-900 mb-3">Preview Changes</h3>
            <div class="space-y-2 text-sm">
              @if (correctionForm.value.requestedClockIn || correctionForm.value.requestedClockInDate) {
                <div class="flex items-center gap-2">
                  <span class="text-blue-700">Clock In:</span>
                  @if (selectedEntry()?.clockIn) {
                    <span class="line-through text-gray-500">
                      {{ formatDateTime(selectedEntry()!.clockIn!) }}
                    </span>
                    <span class="text-blue-700">→</span>
                  }
                  <span class="font-medium text-blue-900">
                    {{ getPreviewDateTime('clockIn') }}
                  </span>
                </div>
              }
              @if (correctionForm.value.requestedClockOut || correctionForm.value.requestedClockOutDate) {
                <div class="flex items-center gap-2">
                  <span class="text-blue-700">Clock Out:</span>
                  @if (selectedEntry()?.clockOut) {
                    <span class="line-through text-gray-500">
                      {{ formatDateTime(selectedEntry()!.clockOut!) }}
                    </span>
                    <span class="text-blue-700">→</span>
                  }
                  <span class="font-medium text-blue-900">
                    {{ getPreviewDateTime('clockOut') }}
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

  // Hour and minute options for dropdowns
  protected hours: string[] = [];
  protected minutes: string[] = [];

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
    const clockInHour = this.correctionForm.get('requestedClockInHour')?.value;
    const clockInMinute = this.correctionForm.get('requestedClockInMinute')?.value;
    const clockInDate = this.correctionForm.get('requestedClockInDate')?.value;
    const clockOutHour = this.correctionForm.get('requestedClockOutHour')?.value;
    const clockOutMinute = this.correctionForm.get('requestedClockOutMinute')?.value;
    const clockOutDate = this.correctionForm.get('requestedClockOutDate')?.value;
    return !!(clockInHour || clockInMinute || clockInDate || clockOutHour || clockOutMinute || clockOutDate);
  });

  constructor() {
    // Initialize hour and minute options
    this.hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
    this.minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));

    this.correctionForm = this.fb.group({
      workSessionId: ['', Validators.required],
      requestedClockInDate: [''],
      requestedClockInHour: [''],
      requestedClockInMinute: [''],
      requestedClockOutDate: [''],
      requestedClockOutHour: [''],
      requestedClockOutMinute: [''],
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

    // Auto-fill date fields with session date when work session is selected
    effect(() => {
      const selected = this.selectedEntry();
      if (selected) {
        const sessionDate = new Date(selected.date);
        const dateString = sessionDate.toISOString().split('T')[0];
        
        // Only set if the fields are empty (don't override user's manual selection)
        const currentClockInDate = this.correctionForm.get('requestedClockInDate')?.value;
        const currentClockOutDate = this.correctionForm.get('requestedClockOutDate')?.value;
        
        if (!currentClockInDate) {
          this.correctionForm.patchValue({ requestedClockInDate: dateString }, { emitEvent: false });
        }
        if (!currentClockOutDate) {
          this.correctionForm.patchValue({ requestedClockOutDate: dateString }, { emitEvent: false });
        }

        // Also populate time fields from session if available
        if (selected.clockIn) {
          const clockInTime = new Date(selected.clockIn);
          const currentClockInHour = this.correctionForm.get('requestedClockInHour')?.value;
          const currentClockInMinute = this.correctionForm.get('requestedClockInMinute')?.value;
          
          if (!currentClockInHour && !currentClockInMinute) {
            this.correctionForm.patchValue({
              requestedClockInHour: clockInTime.getHours().toString().padStart(2, '0'),
              requestedClockInMinute: clockInTime.getMinutes().toString().padStart(2, '0')
            }, { emitEvent: false });
          }
        }

        if (selected.clockOut) {
          const clockOutTime = new Date(selected.clockOut);
          const currentClockOutHour = this.correctionForm.get('requestedClockOutHour')?.value;
          const currentClockOutMinute = this.correctionForm.get('requestedClockOutMinute')?.value;
          
          if (!currentClockOutHour && !currentClockOutMinute) {
            this.correctionForm.patchValue({
              requestedClockOutHour: clockOutTime.getHours().toString().padStart(2, '0'),
              requestedClockOutMinute: clockOutTime.getMinutes().toString().padStart(2, '0')
            }, { emitEvent: false });
          }
        }
      }
    });

    // Add time validation when times change
    effect(() => {
      const clockInHour = this.correctionForm.get('requestedClockInHour')?.value;
      const clockInMinute = this.correctionForm.get('requestedClockInMinute')?.value;
      const clockInDate = this.correctionForm.get('requestedClockInDate')?.value;
      const clockOutHour = this.correctionForm.get('requestedClockOutHour')?.value;
      const clockOutMinute = this.correctionForm.get('requestedClockOutMinute')?.value;
      const clockOutDate = this.correctionForm.get('requestedClockOutDate')?.value;

      if (clockInHour && clockInMinute && clockOutHour && clockOutMinute) {
        // Use provided dates or fall back to session date
        const selected = this.selectedEntry();
        if (!selected) return;

        const sessionDate = new Date(selected.date);
        const clockInTime = `${clockInHour}:${clockInMinute}`;
        const clockOutTime = `${clockOutHour}:${clockOutMinute}`;
        
        // Build clock in datetime
        const clockInDateTime = this.buildDateTime(
          clockInDate || sessionDate.toISOString().split('T')[0],
          clockInTime
        );
        
        // Build clock out datetime
        const clockOutDateTime = this.buildDateTime(
          clockOutDate || sessionDate.toISOString().split('T')[0],
          clockOutTime
        );
        
        if (clockInDateTime && clockOutDateTime && clockInDateTime >= clockOutDateTime) {
          this.correctionForm.get('requestedClockOutHour')?.setErrors({ invalidTime: true });
          this.correctionForm.get('requestedClockOutMinute')?.setErrors({ invalidTime: true });
        } else {
          // Clear the error only if it was set by this validation
          const hourErrors = this.correctionForm.get('requestedClockOutHour')?.errors;
          const minuteErrors = this.correctionForm.get('requestedClockOutMinute')?.errors;
          
          if (hourErrors && hourErrors['invalidTime']) {
            this.correctionForm.get('requestedClockOutHour')?.setErrors(null);
          }
          if (minuteErrors && minuteErrors['invalidTime']) {
            this.correctionForm.get('requestedClockOutMinute')?.setErrors(null);
          }
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
    // Check both hour and minute fields for time validation
    if (fieldName === 'requestedClockIn') {
      const hour = this.correctionForm.get('requestedClockInHour');
      const minute = this.correctionForm.get('requestedClockInMinute');
      return !!(
        (hour && hour.invalid && hour.touched) ||
        (minute && minute.invalid && minute.touched)
      );
    }
    if (fieldName === 'requestedClockOut') {
      const hour = this.correctionForm.get('requestedClockOutHour');
      const minute = this.correctionForm.get('requestedClockOutMinute');
      return !!(
        (hour && hour.invalid && hour.touched) ||
        (minute && minute.invalid && minute.touched)
      );
    }
    
    const field = this.correctionForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  protected formatDate(dateString: string): string {
    return DateUtils.formatDate(new Date(dateString), 'medium');
  }

  protected formatTime(date: Date): string {
    return DateUtils.formatTime12Hour(date);
  }

  protected formatDateTime(date: Date): string {
    const dateObj = date instanceof Date ? date : new Date(date);
    return DateUtils.formatDate(dateObj, 'medium') + ' ' + DateUtils.formatTime12Hour(dateObj);
  }

  protected buildDateTime(dateString: string, timeString: string): Date | null {
    if (!dateString || !timeString) return null;
    
    const timeDate = DateUtils.createTodayAtTime(timeString);
    if (!timeDate) return null;
    
    const date = new Date(dateString);
    date.setHours(timeDate.getHours(), timeDate.getMinutes(), 0, 0);
    
    return date;
  }

  protected getPreviewDateTime(field: 'clockIn' | 'clockOut'): string {
    const selected = this.selectedEntry();
    if (!selected) return '';

    const hourField = field === 'clockIn' ? 'requestedClockInHour' : 'requestedClockOutHour';
    const minuteField = field === 'clockIn' ? 'requestedClockInMinute' : 'requestedClockOutMinute';
    const dateField = field === 'clockIn' ? 'requestedClockInDate' : 'requestedClockOutDate';
    
    const hour = this.correctionForm.get(hourField)?.value;
    const minute = this.correctionForm.get(minuteField)?.value;
    const date = this.correctionForm.get(dateField)?.value;
    
    if (!hour || !minute) {
      // Only date changed or no time set
      if (date) {
        const original = field === 'clockIn' ? selected.clockIn : selected.clockOut;
        if (original) {
          const originalDate = new Date(original);
          const newDate = new Date(date);
          newDate.setHours(originalDate.getHours(), originalDate.getMinutes(), 0, 0);
          return this.formatDateTime(newDate);
        }
      }
      return '';
    }
    
    const time = `${hour}:${minute}`;
    
    // Use provided date or fall back to session date
    const sessionDate = new Date(selected.date);
    const dateToUse = date || sessionDate.toISOString().split('T')[0];
    
    const dateTime = this.buildDateTime(dateToUse, time);
    return dateTime ? this.formatDateTime(dateTime) : time;
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
      const formData = this.correctionForm.value;
      
      // Build time strings from hour and minute values for the service
      const requestData = {
        workSessionId: formData.workSessionId,
        reason: formData.reason,
        requestedClockIn: (formData.requestedClockInHour && formData.requestedClockInMinute) 
          ? `${formData.requestedClockInHour}:${formData.requestedClockInMinute}`
          : null,
        requestedClockInDate: formData.requestedClockInDate,
        requestedClockOut: (formData.requestedClockOutHour && formData.requestedClockOutMinute)
          ? `${formData.requestedClockOutHour}:${formData.requestedClockOutMinute}`
          : null,
        requestedClockOutDate: formData.requestedClockOutDate
      };

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

      await this.correctionService.submitRequest(requestData, workSession);
      
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
