import { Component, ChangeDetectionStrategy, input, output, OnInit, inject, DestroyRef } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TimeTrackingConfig } from '../../models/company-settings.model';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-time-tracking-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
  templateUrl: './time-tracking-form.html',
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class TimeTrackingForm implements OnInit {
  readonly config = input.required<TimeTrackingConfig>();
  readonly configChange = output<TimeTrackingConfig>();

  private fb = inject(FormBuilder);
  private destroyRef = inject(DestroyRef);

  protected form: FormGroup;

  constructor() {
    this.form = this.fb.group({
      requireGeoLocation: [false],
      allowManualEntry: [true],
      requirePhotos: [false],
      gracePeriodMinutes: [5, [Validators.required, Validators.min(0), Validators.max(60)]],
      autoClockOutHours: [12, [Validators.required, Validators.min(1), Validators.max(24)]],
      requireNotes: [false]
    });

    // Subscribe to form changes with automatic cleanup
    this.form.valueChanges.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => {
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
}
