import { Component, ChangeDetectionStrategy, input, output, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { BreakPolicyConfig } from '../../models/company-settings.model';

@Component({
  selector: 'app-break-policy-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
  templateUrl: './break-policy-form.html',
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class BreakPolicyForm implements OnInit {
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
