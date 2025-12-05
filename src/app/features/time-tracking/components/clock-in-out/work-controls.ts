import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TimeTrackingService } from '../../services/time-tracking.service';

@Component({
  selector: 'app-work-controls',
  imports: [CommonModule],
  templateUrl: './work-controls.html',
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class WorkControls {
  protected timeService = inject(TimeTrackingService);

  protected async handleClockIn(): Promise<void> {
    try {
      await this.timeService.clockIn();
    } catch (error) {
      // Error is already set in the service
      console.error('Clock in failed:', error);
    }
  }

  protected async handleClockOut(): Promise<void> {
    try {
      await this.timeService.clockOut();
    } catch (error) {
      // Error is already set in the service
      console.error('Clock out failed:', error);
    }
  }

  protected async handleStartBreak(): Promise<void> {
    try {
      await this.timeService.startBreak();
    } catch (error) {
      // Error is already set in the service
      console.error('Start break failed:', error);
    }
  }

  protected async handleEndBreak(): Promise<void> {
    try {
      await this.timeService.endBreak();
    } catch (error) {
      // Error is already set in the service
      console.error('End break failed:', error);
    }
  }
}
