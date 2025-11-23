import { Component, ChangeDetectionStrategy, inject, signal, viewChild } from '@angular/core';
import { CompanySettingsService } from '../../services/company-settings.service';
import { WorkingHoursForm } from '../../components/working-hours-form/working-hours-form';
import { VacationPolicyForm } from '../../components/vacation-policy-form/vacation-policy-form';
import { BreakPolicyForm } from '../../components/break-policy-form/break-policy-form';
import { TimeTrackingForm } from '../../components/time-tracking-form/time-tracking-form';
import {
  CompanySettingsFormData,
  WorkingHoursConfig,
  VacationPolicyConfig,
  BreakPolicyConfig,
  TimeTrackingConfig
} from '../../models/company-settings.model';

@Component({
  selector: 'app-company-settings-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    WorkingHoursForm,
    VacationPolicyForm,
    BreakPolicyForm,
    TimeTrackingForm
  ],
  template: `
    <div class="container mx-auto px-4 py-6 max-w-7xl">
      <div class="mb-6">
        <h1 class="text-2xl font-bold text-gray-900">Company Settings</h1>
        <p class="mt-1 text-sm text-gray-600">
          Configure your company's working hours, vacation policies, break policies, and time tracking settings
        </p>
      </div>

      @if (settingsService.isLoading()) {
        <div class="flex justify-center items-center py-12" role="status">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span class="sr-only">Loading settings...</span>
        </div>
      } @else if (settingsService.error()) {
        <div class="bg-red-50 border border-red-200 rounded-lg p-4" role="alert">
          <div class="flex">
            <div class="flex-shrink-0">
              <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clip-rule="evenodd" />
              </svg>
            </div>
            <div class="ml-3">
              <h3 class="text-sm font-medium text-red-800">Error loading settings</h3>
              <p class="mt-1 text-sm text-red-700">{{ settingsService.error() }}</p>
            </div>
          </div>
        </div>
      } @else if (currentSettings()) {
        <div class="space-y-6">
          <app-working-hours-form 
            [config]="currentSettings()!.workingHours"
            (configChange)="onWorkingHoursChange($event)"
          />

          <app-vacation-policy-form 
            [config]="currentSettings()!.vacationPolicy"
            (configChange)="onVacationPolicyChange($event)"
          />

          <app-break-policy-form 
            [config]="currentSettings()!.breakPolicy"
            (configChange)="onBreakPolicyChange($event)"
          />

          <app-time-tracking-form 
            [config]="currentSettings()!.timeTracking"
            (configChange)="onTimeTrackingChange($event)"
          />

          <div class="flex justify-end space-x-4 pt-4">
            <button
              type="button"
              (click)="resetToDefaults()"
              [disabled]="isSaving()"
              class="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Reset to default settings"
            >
              Reset to Defaults
            </button>
            <button
              type="button"
              (click)="saveSettings()"
              [disabled]="!hasChanges() || isSaving()"
              class="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Save settings changes"
            >
              @if (isSaving()) {
                <span class="flex items-center">
                  <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </span>
              } @else {
                Save Changes
              }
            </button>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class CompanySettingsPage {
  protected settingsService = inject(CompanySettingsService);

  protected currentSettings = this.settingsService.settings;
  protected isSaving = signal(false);
  protected hasChanges = signal(false);

  private readonly SIMULATED_SAVE_DELAY_MS = 500; // Simulated delay for demo purposes
  private pendingChanges: Partial<CompanySettingsFormData> = {};

  protected onWorkingHoursChange(config: WorkingHoursConfig): void {
    this.pendingChanges.workingHours = config;
    this.hasChanges.set(true);
  }

  protected onVacationPolicyChange(config: VacationPolicyConfig): void {
    this.pendingChanges.vacationPolicy = config;
    this.hasChanges.set(true);
  }

  protected onBreakPolicyChange(config: BreakPolicyConfig): void {
    this.pendingChanges.breakPolicy = config;
    this.hasChanges.set(true);
  }

  protected onTimeTrackingChange(config: TimeTrackingConfig): void {
    this.pendingChanges.timeTracking = config;
    this.hasChanges.set(true);
  }

  protected saveSettings(): void {
    const current = this.currentSettings();
    if (!current) return;

    const formData: CompanySettingsFormData = {
      workingHours: this.pendingChanges.workingHours || current.workingHours,
      vacationPolicy: this.pendingChanges.vacationPolicy || current.vacationPolicy,
      breakPolicy: this.pendingChanges.breakPolicy || current.breakPolicy,
      timeTracking: this.pendingChanges.timeTracking || current.timeTracking
    };

    this.isSaving.set(true);
    
    // TODO: Replace with actual HTTP call when backend is ready
    // Simulating async save with timeout for demo purposes
    setTimeout(() => {
      const success = this.settingsService.updateSettings(formData);
      if (success) {
        this.pendingChanges = {};
        this.hasChanges.set(false);
      }
      this.isSaving.set(false);
    }, this.SIMULATED_SAVE_DELAY_MS);
  }

  protected resetToDefaults(): void {
    const current = this.currentSettings();
    if (!current) return;

    if (confirm('Are you sure you want to reset all settings to defaults? This cannot be undone.')) {
      this.settingsService.resetToDefaults(current.companyId);
      this.pendingChanges = {};
      this.hasChanges.set(false);
    }
  }
}
