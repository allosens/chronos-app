import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TimeTrackingService } from '../../services/time-tracking.service';

@Component({
  selector: 'app-work-controls',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
      <h3 class="text-lg font-semibold text-gray-900 mb-4">Work Controls</h3>
      
      <div class="space-y-3">
        <!-- Clock In/Out Button -->
        @if (timeService.isClockedOut()) {
          <button 
            (click)="timeService.clockIn()"
            class="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-4 px-6 rounded-lg transition-all duration-200 flex items-center justify-center gap-3 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
            type="button"
            aria-label="Start work day"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Start Work Day</span>
          </button>
        } @else {
          <button 
            (click)="timeService.clockOut()"
            class="w-full bg-rose-600 hover:bg-rose-700 text-white font-semibold py-4 px-6 rounded-lg transition-all duration-200 flex items-center justify-center gap-3 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2"
            type="button"
            aria-label="End work day"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
            </svg>
            <span>End Work Day</span>
          </button>
        }

        <!-- Break Controls -->
        @if (timeService.isWorking()) {
          <button 
            (click)="timeService.startBreak()"
            class="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center gap-3 shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
            type="button"
            aria-label="Take a break"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Take a Break</span>
          </button>
        }

        @if (timeService.isOnBreak()) {
          <button 
            (click)="timeService.endBreak()"
            class="w-full bg-sky-600 hover:bg-sky-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center gap-3 shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2"
            type="button"
            aria-label="Resume work"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            <span>Resume Work</span>
          </button>
        }
      </div>

      <!-- Quick Actions Info -->
      @if (!timeService.isClockedOut()) {
        <div class="mt-5 pt-5 border-t border-gray-200">
          <div class="flex items-start gap-2">
            <svg class="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div class="text-sm text-gray-600">
              @if (timeService.isWorking()) {
                <p class="font-medium text-gray-700 mb-1">Working</p>
                <p class="text-xs">• Take regular breaks to stay productive</p>
                <p class="text-xs">• Your time is being tracked automatically</p>
              }
              @if (timeService.isOnBreak()) {
                <p class="font-medium text-gray-700 mb-1">On Break</p>
                <p class="text-xs">• Break time is not counted towards work hours</p>
                <p class="text-xs">• Click "Resume Work" when ready</p>
              }
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class WorkControls {
  protected timeService = inject(TimeTrackingService);
}