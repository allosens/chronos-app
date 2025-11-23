import { Component, ChangeDetectionStrategy, input, output, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { VacationPolicyConfig } from '../../models/company-settings.model';

@Component({
  selector: 'app-vacation-policy-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
  template: `
    <div class="bg-white rounded-lg shadow p-6">
      <h3 class="text-lg font-semibold text-gray-900 mb-4">Vacation Policy Configuration</h3>
      
      <form [formGroup]="form" class="space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label for="annualDaysAllowed" class="block text-sm font-medium text-gray-700 mb-1">
              Annual Days Allowed
            </label>
            <input
              id="annualDaysAllowed"
              type="number"
              formControlName="annualDaysAllowed"
              min="0"
              max="365"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-describedby="annualDaysAllowed-help"
            />
            <p id="annualDaysAllowed-help" class="mt-1 text-xs text-gray-500">
              Total vacation days per year (0-365)
            </p>
          </div>

          <div>
            <label for="carryOverDays" class="block text-sm font-medium text-gray-700 mb-1">
              Carry Over Days
            </label>
            <input
              id="carryOverDays"
              type="number"
              formControlName="carryOverDays"
              min="0"
              max="365"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-describedby="carryOverDays-help"
            />
            <p id="carryOverDays-help" class="mt-1 text-xs text-gray-500">
              Days that can be carried to next year (0-365)
            </p>
          </div>

          <div>
            <label for="minAdvanceNoticeDays" class="block text-sm font-medium text-gray-700 mb-1">
              Minimum Advance Notice (Days)
            </label>
            <input
              id="minAdvanceNoticeDays"
              type="number"
              formControlName="minAdvanceNoticeDays"
              min="0"
              max="365"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-describedby="minAdvanceNoticeDays-help"
            />
            <p id="minAdvanceNoticeDays-help" class="mt-1 text-xs text-gray-500">
              Days of notice required before vacation (0-365)
            </p>
          </div>

          <div>
            <label for="maxConsecutiveDays" class="block text-sm font-medium text-gray-700 mb-1">
              Maximum Consecutive Days
            </label>
            <input
              id="maxConsecutiveDays"
              type="number"
              formControlName="maxConsecutiveDays"
              min="1"
              max="365"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-describedby="maxConsecutiveDays-help"
            />
            <p id="maxConsecutiveDays-help" class="mt-1 text-xs text-gray-500">
              Maximum consecutive vacation days allowed (1-365)
            </p>
          </div>
        </div>

        <div>
          <label class="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              formControlName="requiresApproval"
              class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span class="text-sm font-medium text-gray-700">Requires Approval</span>
          </label>
          <p class="mt-1 text-xs text-gray-500 ml-6">
            Vacation requests must be approved by a manager
          </p>
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
export class VacationPolicyForm implements OnInit {
  readonly config = input.required<VacationPolicyConfig>();
  readonly configChange = output<VacationPolicyConfig>();

  protected form: FormGroup;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      annualDaysAllowed: [15, [Validators.required, Validators.min(0), Validators.max(365)]],
      carryOverDays: [5, [Validators.required, Validators.min(0), Validators.max(365)]],
      requiresApproval: [true],
      minAdvanceNoticeDays: [7, [Validators.required, Validators.min(0), Validators.max(365)]],
      maxConsecutiveDays: [10, [Validators.required, Validators.min(1), Validators.max(365)]]
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
