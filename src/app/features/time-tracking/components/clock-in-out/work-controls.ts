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
      
      <div class="space-y-4">
        <!-- Clock In/Out Button -->
        @if (timeService.isClockedOut()) {
          <button 
            (click)="timeService.clockIn()"
            class="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-4 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-3"
          >
            <span class="text-xl">🚀</span>
            Start Work Day
          </button>
        } @else {
          <button 
            (click)="timeService.clockOut()"
            class="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-4 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-3"
          >
            <span class="text-xl">🏁</span>
            End Work Day
          </button>
        }

        <!-- Break Controls -->
        @if (timeService.isWorking()) {
          <button 
            (click)="timeService.startBreak()"
            class="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-3"
          >
            <span class="text-xl">☕</span>
            Take a Break
          </button>
        }

        @if (timeService.isOnBreak()) {
          <button 
            (click)="timeService.endBreak()"
            class="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-3"
          >
            <span class="text-xl">💼</span>
            Resume Work
          </button>
        }
      </div>

      <!-- Quick Actions Info -->
      @if (!timeService.isClockedOut()) {
        <div class="mt-6 pt-6 border-t border-gray-200">
          <div class="text-sm text-gray-600">
            <p class="mb-2"><strong>Quick tips:</strong></p>
            <ul class="space-y-1 text-xs">
              @if (timeService.isWorking()) {
                <li>• Take regular breaks to stay productive</li>
                <li>• Your time is being tracked automatically</li>
              }
              @if (timeService.isOnBreak()) {
                <li>• Break time is not counted towards work hours</li>
                <li>• Resume when you're ready to continue</li>
              }
            </ul>
          </div>
        </div>
      }
    </div>
  `
})
export class WorkControls {
  protected timeService = inject(TimeTrackingService);
}