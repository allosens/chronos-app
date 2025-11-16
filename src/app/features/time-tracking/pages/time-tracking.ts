import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TimeClock } from '../components/clock-in-out/time-clock';
import { WorkControls } from '../components/clock-in-out/work-controls';
import { DailySummary } from '../components/history-viewer/daily-summary';

@Component({
  selector: 'app-time-tracking',
  imports: [CommonModule, TimeClock, WorkControls, DailySummary],
  templateUrl: './time-tracking.html'
})
export class TimeTracking {
  // Simplified component - logic moved to child components
}