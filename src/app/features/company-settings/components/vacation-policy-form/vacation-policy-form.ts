import { Component, ChangeDetectionStrategy, input, output, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { VacationPolicyConfig } from '../../models/company-settings.model';

@Component({
  selector: 'app-vacation-policy-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
  templateUrl: './vacation-policy-form.html',
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
