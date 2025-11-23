import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { BreakPolicyConfig } from '../../models/company-settings.model';

@Component({
  selector: 'app-break-policy-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
  template: `
    <div class="bg-white rounded-lg shadow p-6">
      <h3 class="text-lg font-semibold text-gray-900 mb-4">Break Policy Configuration</h3>
      
      <form [formGroup]="form" class="space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label for="minimumBreakMinutes" class="block text-sm font-medium text-gray-700 mb-1">
              Minimum Break (Minutes)
            </label>
            <input
              id="minimumBreakMinutes"
              type="number"
              formControlName="minimumBreakMinutes"
              min="0"
              max="480"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-describedby="minimumBreakMinutes-help"
            />
            <p id="minimumBreakMinutes-help" class="mt-1 text-xs text-gray-500">
              Minimum break duration in minutes (0-480)
            </p>
          </div>

          <div>
            <label for="maximumBreakMinutes" class="block text-sm font-medium text-gray-700 mb-1">
              Maximum Break (Minutes)
            </label>
            <input
              id="maximumBreakMinutes"
              type="number"
              formControlName="maximumBreakMinutes"
              min="0"
              max="480"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-describedby="maximumBreakMinutes-help"
            />
            <p id="maximumBreakMinutes-help" class="mt-1 text-xs text-gray-500">
              Maximum break duration in minutes (0-480)
            </p>
          </div>
        </div>

        <div class="space-y-3">
          <div>
            <label class="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                formControlName="paidBreak"
                class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span class="text-sm font-medium text-gray-700">Paid Break</span>
            </label>
            <p class="mt-1 text-xs text-gray-500 ml-6">
              Breaks are paid time
            </p>
          </div>

          <div>
            <label class="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                formControlName="automaticBreakDeduction"
                class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span class="text-sm font-medium text-gray-700">Automatic Break Deduction</span>
            </label>
            <p class="mt-1 text-xs text-gray-500 ml-6">
              Automatically deduct break time from work hours
            </p>
          </div>

          <div>
            <label class="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                formControlName="breakReminderEnabled"
                class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span class="text-sm font-medium text-gray-700">Break Reminder</span>
            </label>
            <p class="mt-1 text-xs text-gray-500 ml-6">
              Send reminders to employees to take breaks
            </p>
          </div>
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
export class BreakPolicyForm {
  readonly config = input.required<BreakPolicyConfig>();
  readonly configChange = output<BreakPolicyConfig>();

  protected form: FormGroup;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      minimumBreakMinutes: [30, [Validators.required, Validators.min(0), Validators.max(480)]],
      maximumBreakMinutes: [60, [Validators.required, Validators.min(0), Validators.max(480)]],
      paidBreak: [true],
      automaticBreakDeduction: [false],
      breakReminderEnabled: [true]
    });

    // Subscribe to form changes
    this.form.valueChanges.subscribe(() => {
      this.emitChanges();
    });
  }

  ngOnInit(): void {
    this.form.patchValue(this.config());
  }

  private emitChanges(): void {
    if (this.form.valid) {
      this.configChange.emit(this.form.value);
    }
  }

  getFormGroup(): FormGroup {
    return this.form;
  }

  isValid(): boolean {
    return this.form.valid;
  }
}
