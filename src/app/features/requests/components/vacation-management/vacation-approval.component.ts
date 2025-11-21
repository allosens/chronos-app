import { Component, inject, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VacationManagementService } from '../../services/vacation-management.service';
import { VacationRequest } from '../../models/vacation-request.model';
import { ApprovalActions } from '../../../../shared/components/approval-actions.component';
import { DateUtils } from '../../../../shared/utils/date.utils';

@Component({
  selector: 'app-vacation-approval',
  standalone: true,
  imports: [CommonModule, ApprovalActions],
  template: `
    <div class="bg-white border border-gray-200 rounded-lg p-6 hover:border-blue-300 transition-colors">
      <!-- Request Header -->
      <div class="flex items-start justify-between mb-4">
        <div>
          <h4 class="text-lg font-semibold text-gray-900">
            {{ request().employeeName || 'Unknown Employee' }}
          </h4>
          <div class="flex items-center gap-2 mt-1">
            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
              {{ getTypeLabel(request().type) }}
            </span>
            <span class="text-sm text-gray-500">
              {{ request().totalDays }} day{{ request().totalDays !== 1 ? 's' : '' }}
            </span>
          </div>
        </div>
        <span class="text-xs text-gray-500">
          Requested {{ getRelativeTime(request().requestedAt) }}
        </span>
      </div>

      <!-- Date Information -->
      <div class="grid grid-cols-2 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
        <div>
          <p class="text-xs text-gray-500 mb-1">Start Date</p>
          <p class="font-medium text-gray-900">{{ formatDate(request().startDate) }}</p>
        </div>
        <div>
          <p class="text-xs text-gray-500 mb-1">End Date</p>
          <p class="font-medium text-gray-900">{{ formatDate(request().endDate) }}</p>
        </div>
      </div>

      <!-- Employee Comments -->
      @if (request().comments) {
        <div class="mb-4">
          <p class="text-xs text-gray-500 mb-1">Employee Comments</p>
          <p class="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">{{ request().comments }}</p>
        </div>
      }

      <!-- Conflicts Warning -->
      @if (conflicts().length > 0) {
        <div class="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <div class="flex items-start gap-3">
            <svg class="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
            </svg>
            <div class="flex-1">
              <p class="text-sm font-medium text-amber-900 mb-2">
                {{ conflicts().length }} Vacation Conflict{{ conflicts().length !== 1 ? 's' : '' }} Detected
              </p>
              <ul class="space-y-1">
                @for (conflict of conflicts(); track conflict.requestId) {
                  <li class="text-xs text-amber-800">
                    {{ conflict.employeeName }} ({{ formatDate(conflict.startDate) }} - {{ formatDate(conflict.endDate) }})
                    - {{ conflict.overlapDays }} day{{ conflict.overlapDays !== 1 ? 's' : '' }} overlap
                  </li>
                }
              </ul>
            </div>
          </div>
        </div>
      }

      <!-- Team Availability Warning -->
      @if (availabilityCheck() && !availabilityCheck()!.valid) {
        <div class="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div class="flex items-start gap-3">
            <svg class="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <div class="flex-1">
              <p class="text-sm font-medium text-red-900">Team Availability Issue</p>
              <p class="text-xs text-red-800 mt-1">{{ availabilityCheck()!.message }}</p>
            </div>
          </div>
        </div>
      }

      <!-- Approval Actions -->
      <app-approval-actions
        [requestId]="request().id"
        [itemLabel]="'vacation request for ' + (request().employeeName || 'employee')"
        [requireComments]="false"
        (approve)="handleApprove($event)"
        (reject)="handleReject($event)"
      />
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class VacationApproval {
  private managementService = inject(VacationManagementService);

  // Inputs
  request = input.required<VacationRequest>();
  
  // Outputs
  approved = output<{ requestId: string; comments?: string }>();
  rejected = output<{ requestId: string; comments?: string }>();

  // Computed values
  protected conflicts = computed(() => 
    this.managementService.getConflicts(this.request().id)
  );

  protected availabilityCheck = computed(() => 
    this.managementService.validateTeamAvailability(this.request().id)
  );

  protected handleApprove(event: { requestId: string; comments?: string }): void {
    this.approved.emit(event);
  }

  protected handleReject(event: { requestId: string; comments?: string }): void {
    this.rejected.emit(event);
  }

  protected formatDate(date: Date): string {
    return DateUtils.formatDate(date, 'medium');
  }

  protected getRelativeTime(date: Date): string {
    return DateUtils.getRelativeTime(date);
  }

  protected getTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      vacation: 'Vacation',
      personal_day: 'Personal Day',
      sick_leave: 'Sick Leave',
      compensatory_time: 'Compensatory Time',
      other: 'Other'
    };
    return labels[type] || type;
  }
}
