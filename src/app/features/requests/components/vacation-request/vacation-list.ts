import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VacationRequestService } from '../../services/vacation-request.service';
import { VacationRequestStatus } from '../../models/vacation-request.model';
import { DateUtils } from '../../../../shared/utils/date.utils';

@Component({
  selector: 'app-vacation-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-white p-6">
      <div class="flex items-center justify-between mb-6">
        <h3 class="text-xl font-semibold text-gray-900">My Time Off Requests</h3>
        <div class="flex gap-2">
          <button
            (click)="setFilter('all')"
            [class.bg-blue-600]="currentFilter() === 'all'"
            [class.text-white]="currentFilter() === 'all'"
            [class.bg-gray-100]="currentFilter() !== 'all'"
            [class.text-gray-700]="currentFilter() !== 'all'"
            class="px-4 py-2 rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            type="button"
            aria-label="Show all requests"
          >
            All ({{ allRequests().length }})
          </button>
          <button
            (click)="setFilter('pending')"
            [class.bg-amber-600]="currentFilter() === 'pending'"
            [class.text-white]="currentFilter() === 'pending'"
            [class.bg-gray-100]="currentFilter() !== 'pending'"
            [class.text-gray-700]="currentFilter() !== 'pending'"
            class="px-4 py-2 rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500"
            type="button"
            aria-label="Show pending requests"
          >
            Pending ({{ pendingRequests().length }})
          </button>
          <button
            (click)="setFilter('approved')"
            [class.bg-emerald-600]="currentFilter() === 'approved'"
            [class.text-white]="currentFilter() === 'approved'"
            [class.bg-gray-100]="currentFilter() !== 'approved'"
            [class.text-gray-700]="currentFilter() !== 'approved'"
            class="px-4 py-2 rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500"
            type="button"
            aria-label="Show approved requests"
          >
            Approved ({{ approvedRequests().length }})
          </button>
        </div>
      </div>

      @if (filteredRequests().length === 0) {
        <div class="text-center py-12">
          <svg class="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
          </svg>
          <p class="text-gray-500 font-medium">No {{ currentFilter() === 'all' ? '' : currentFilter() }} requests found</p>
          <p class="text-sm text-gray-400 mt-1">Your time off requests will appear here</p>
        </div>
      } @else {
        <div class="space-y-4">
          @for (request of filteredRequests(); track request.id) {
            <div class="border border-gray-200 rounded-lg p-5 hover:border-blue-300 transition-colors">
              <div class="flex items-start justify-between">
                <div class="flex-1">
                  <div class="flex items-center gap-3 mb-3">
                    <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold"
                          [class.bg-emerald-100]="request.status === 'approved'"
                          [class.text-emerald-800]="request.status === 'approved'"
                          [class.bg-amber-100]="request.status === 'pending'"
                          [class.text-amber-800]="request.status === 'pending'"
                          [class.bg-red-100]="request.status === 'rejected'"
                          [class.text-red-800]="request.status === 'rejected'"
                          [class.bg-gray-100]="request.status === 'cancelled'"
                          [class.text-gray-800]="request.status === 'cancelled'">
                      {{ getStatusLabel(request.status) }}
                    </span>
                    <span class="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
                      {{ getTypeLabel(request.type) }}
                    </span>
                  </div>

                  <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                    <div>
                      <p class="text-xs text-gray-500 mb-1">Start Date</p>
                      <p class="font-medium text-gray-900">{{ formatDate(request.startDate) }}</p>
                    </div>
                    <div>
                      <p class="text-xs text-gray-500 mb-1">End Date</p>
                      <p class="font-medium text-gray-900">{{ formatDate(request.endDate) }}</p>
                    </div>
                    <div>
                      <p class="text-xs text-gray-500 mb-1">Duration</p>
                      <p class="font-medium text-gray-900">{{ request.totalDays }} day{{ request.totalDays !== 1 ? 's' : '' }}</p>
                    </div>
                  </div>

                  @if (request.comments) {
                    <div class="mb-3">
                      <p class="text-xs text-gray-500 mb-1">Comments</p>
                      <p class="text-sm text-gray-700">{{ request.comments }}</p>
                    </div>
                  }

                  @if (request.reviewComments) {
                    <div class="bg-gray-50 rounded-lg p-3 mb-3">
                      <p class="text-xs text-gray-500 mb-1">Review Comments</p>
                      <p class="text-sm text-gray-700">{{ request.reviewComments }}</p>
                      @if (request.reviewedBy) {
                        <p class="text-xs text-gray-500 mt-1">— {{ request.reviewedBy }}</p>
                      }
                    </div>
                  }

                  <div class="flex items-center gap-4 text-xs text-gray-500">
                    <span>Requested {{ getRelativeTime(request.requestedAt) }}</span>
                    @if (request.reviewedAt) {
                      <span>• Reviewed {{ getRelativeTime(request.reviewedAt) }}</span>
                    }
                  </div>
                </div>

                @if (request.status === 'pending') {
                  <button
                    (click)="cancelRequest(request.id)"
                    class="ml-4 text-red-600 hover:text-red-700 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-red-500 rounded px-3 py-1"
                    type="button"
                    [attr.aria-label]="'Cancel request from ' + formatDate(request.startDate)"
                  >
                    Cancel
                  </button>
                }
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class VacationList {
  protected vacationService = inject(VacationRequestService);

  protected currentFilter = signal<'all' | 'pending' | 'approved'>('all');

  protected allRequests = this.vacationService.vacationRequests;
  protected pendingRequests = this.vacationService.pendingRequests;
  protected approvedRequests = this.vacationService.approvedRequests;

  protected filteredRequests = computed(() => {
    const filter = this.currentFilter();
    switch (filter) {
      case 'pending':
        return this.pendingRequests();
      case 'approved':
        return this.approvedRequests();
      default:
        return this.allRequests();
    }
  });

  protected setFilter(filter: 'all' | 'pending' | 'approved'): void {
    this.currentFilter.set(filter);
  }

  protected cancelRequest(requestId: string): void {
    if (confirm('Are you sure you want to cancel this request?')) {
      this.vacationService.cancelRequest(requestId);
    }
  }

  protected formatDate(date: Date): string {
    return DateUtils.formatDate(date, 'medium');
  }

  protected getRelativeTime(date: Date): string {
    return DateUtils.getRelativeTime(date);
  }

  protected getStatusLabel(status: VacationRequestStatus): string {
    const labels: Record<VacationRequestStatus, string> = {
      [VacationRequestStatus.PENDING]: 'Pending',
      [VacationRequestStatus.APPROVED]: 'Approved',
      [VacationRequestStatus.REJECTED]: 'Rejected',
      [VacationRequestStatus.CANCELLED]: 'Cancelled'
    };
    return labels[status] || status;
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
