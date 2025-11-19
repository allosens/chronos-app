import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BreakManagementService } from '../../services/break-management.service';
import { TimeTrackingService } from '../../services/time-tracking.service';

@Component({
  selector: 'app-break-controls',
  imports: [CommonModule],
  template: `
    <div class="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
      <h3 class="text-lg font-semibold text-gray-900 mb-4">Break Controls</h3>
      
      <div class="space-y-4">
        <!-- Start Break Button -->
        @if (breakService.canStartBreak()) {
          <button
            (click)="onStartBreak()"
            class="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium py-4 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-3 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
            type="button"
            aria-label="Start a break"
          >
            <span class="text-xl" aria-hidden="true">☕</span>
            <span>Take a Break</span>
          </button>
        }

        <!-- End Break Button -->
        @if (breakService.canEndBreak()) {
          <button
            (click)="onEndBreak()"
            class="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-4 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            type="button"
            aria-label="End break and resume work"
          >
            <span class="text-xl" aria-hidden="true">💼</span>
            <span>Resume Work</span>
          </button>
        }

        <!-- Info Messages -->
        @if (!timeService.isWorking() && !timeService.isOnBreak()) {
          <div class="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <p class="text-sm text-gray-600 text-center">
              Clock in to start your work day before taking breaks
            </p>
          </div>
        }

        <!-- Break Tips -->
        @if (breakService.canStartBreak() || breakService.canEndBreak()) {
          <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 class="text-sm font-medium text-blue-900 mb-2">💡 Break Tips</h4>
            <ul class="space-y-1 text-xs text-blue-700">
              @if (breakService.canStartBreak()) {
                <li>• Regular breaks help maintain productivity</li>
                <li>• Your timer will pause during breaks</li>
                <li>• Recommended: 5-15 minute breaks</li>
              }
              @if (breakService.canEndBreak()) {
                <li>• Break time is tracked separately</li>
                <li>• Click "Resume Work" when ready</li>
              }
            </ul>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class BreakControls {
  protected breakService = inject(BreakManagementService);
  protected timeService = inject(TimeTrackingService);

  protected onStartBreak(): void {
    this.breakService.startBreak();
  }

  protected onEndBreak(): void {
    this.breakService.endBreak();
  }
}
