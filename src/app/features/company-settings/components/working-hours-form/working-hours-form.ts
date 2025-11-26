import { Component, ChangeDetectionStrategy, input, output, OnInit, inject, DestroyRef } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { WorkingHoursConfig, WorkDay } from '../../models/company-settings.model';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-working-hours-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
  templateUrl: './working-hours-form.html',
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class WorkingHoursForm implements OnInit {
  readonly config = input.required<WorkingHoursConfig>();
  readonly configChange = output<WorkingHoursConfig>();

  private fb = inject(FormBuilder);
  private destroyRef = inject(DestroyRef);

  protected form: FormGroup;
  protected readonly availableDays = Object.values(WorkDay);
  private selectedWorkDays: WorkDay[] = [];

  constructor() {
    this.form = this.fb.group({
      dailyHours: [8, [Validators.required, Validators.min(1), Validators.max(24)]],
      weeklyHours: [40, [Validators.required, Validators.min(1), Validators.max(168)]],
      startTime: ['09:00', Validators.required],
      endTime: ['17:00', Validators.required],
      timezone: ['America/New_York', Validators.required]
    });

    // Subscribe to form changes with automatic cleanup
    this.form.valueChanges.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => {
      this.emitChanges();
    });
  }

  ngOnInit(): void {
    const config = this.config();
    this.selectedWorkDays = [...config.workDays];
    this.form.patchValue({
      dailyHours: config.dailyHours,
      weeklyHours: config.weeklyHours,
      startTime: config.startTime,
      endTime: config.endTime,
      timezone: config.timezone
    });
  }

  protected isWorkDaySelected(day: WorkDay): boolean {
    return this.selectedWorkDays.includes(day);
  }

  protected onWorkDayChange(event: Event, day: WorkDay): void {
    const checkbox = event.target as HTMLInputElement;
    if (checkbox.checked) {
      if (!this.selectedWorkDays.includes(day)) {
        this.selectedWorkDays.push(day);
      }
    } else {
      this.selectedWorkDays = this.selectedWorkDays.filter(d => d !== day);
    }
    this.emitChanges();
  }

  private emitChanges(): void {
    if (this.form.valid && this.selectedWorkDays.length > 0) {
      const updatedConfig: WorkingHoursConfig = {
        ...this.form.value,
        workDays: this.selectedWorkDays
      };
      this.configChange.emit(updatedConfig);
    }
  }
}
