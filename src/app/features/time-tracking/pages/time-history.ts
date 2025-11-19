import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TimesheetHistory } from '../components/history-viewer/timesheet-history';

@Component({
  selector: 'app-time-history',
  imports: [CommonModule, TimesheetHistory],
  template: `
    <div class="container mx-auto px-4 py-8 max-w-7xl">
      <app-timesheet-history />
    </div>
  `
})
export class TimeHistory {}
