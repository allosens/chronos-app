import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TimeClock } from '../components/clock-in-out/time-clock';
import { WorkControls } from '../components/clock-in-out/work-controls';
import { DailySummary } from '../components/history-viewer/daily-summary';
import { BreakControls } from '../components/break-management/break-controls';
import { BreakTimer } from '../components/break-management/break-timer';
import { BreakHistory } from '../components/break-management/break-history';

@Component({
  selector: 'app-time-tracking',
  imports: [
    CommonModule, 
    TimeClock, 
    WorkControls, 
    DailySummary,
    BreakControls,
    BreakTimer,
    BreakHistory
  ],
  templateUrl: './time-tracking.html'
})
export class TimeTracking {
  // Simplified component - logic moved to child components
}