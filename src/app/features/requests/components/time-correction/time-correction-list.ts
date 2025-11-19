import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TimeCorrectionService } from '../../services/time-correction.service';
import { TimeCorrectionStatus } from '../../models/time-correction.model';
import { DateUtils } from '../../../../shared/utils/date.utils';

@Component({
  selector: 'app-time-correction-list',
  imports: [CommonModule],
  template: `
    <div class="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
      <div class="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <h2 class="text-2xl font-bold text-gray-900">My Correction Requests</h2>
        
        <!-- Filter Buttons -->
        <div class="flex gap-2 flex-wrap" role="group" aria-label="Filter requests by status">
          <button
            (click)="setFilter('all')"
            [class.bg-blue-600]="currentFilter() === 'all'"
            [class.text-white]="currentFilter() === 'all'"
            [class.bg-gray-200]="currentFilter() !== 'all'"
            [class.text-gray-700]="currentFilter() !== 'all'"
            class="px-4 py-2 rounded-lg font-medium text-sm transition-colors focus:ring-4 focus:ring-blue-200"
            [attr.aria-pressed]="currentFilter() === 'all'"
          >
            All ({{ allRequests().length }})
          </button>
          <button
            (click)="setFilter('pending')"
            [class.bg-yellow-600]="currentFilter() === 'pending'"
            [class.text-white]="currentFilter() === 'pending'"
            [class.bg-gray-200]="currentFilter() !== 'pending'"
            [class.text-gray-700]="currentFilter() !== 'pending'"
            class="px-4 py-2 rounded-lg font-medium text-sm transition-colors focus:ring-4 focus:ring-yellow-200"
            [attr.aria-pressed]="currentFilter() === 'pending'"
          >
            Pending ({{ pendingRequests().length }})
          </button>
          <button
            (click)="setFilter('approved')"
            [class.bg-green-600]="currentFilter() === 'approved'"
            [class.text-white]="currentFilter() === 'approved'"
            [class.bg-gray-200]="currentFilter() !== 'approved'"
            [class.text-gray-700]="currentFilter() !== 'approved'"
            class="px-4 py-2 rounded-lg font-medium text-sm transition-colors focus:ring-4 focus:ring-green-200"
            [attr.aria-pressed]="currentFilter() === 'approved'"
          >
            Approved ({{ approvedRequests().length }})
          </button>
          <button
            (click)="setFilter('rejected')"
            [class.bg-red-600]="currentFilter() === 'rejected'"
            [class.text-white]="currentFilter() === 'rejected'"
            [class.bg-gray-200]="currentFilter() !== 'rejected'"
            [class.text-gray-700]="currentFilter() !== 'rejected'"
            class="px-4 py-2 rounded-lg font-medium text-sm transition-colors focus:ring-4 focus:ring-red-200"
            [attr.aria-pressed]="currentFilter() === 'rejected'"
          >
            Rejected ({{ rejectedRequests().length }})
          </button>
        </div>
      </div>

      <!-- Empty State -->
      @if (filteredRequests().length === 0) {
        <div class="text-center py-12">
          <div class="text-6xl mb-4" aria-hidden="true">📝</div>
          <h3 class="text-lg font-medium text-gray-900 mb-2">No requests found</h3>
          <p class="text-gray-600">
            @if (currentFilter() === 'all') {
              You haven't submitted any correction requests yet.
            } @else {
              No {{ currentFilter() }} requests found.
            }
          </p>
        </div>
      }

      <!-- Request List -->
      @if (filteredRequests().length > 0) {
        <div class="space-y-4" role="list" aria-label="Correction requests">
          @for (request of filteredRequests(); track request.id) {
            <div 
              class="border rounded-lg p-4 hover:shadow-md transition-shadow"
              [class.border-yellow-200]="request.status === TimeCorrectionStatus.PENDING"
              [class.bg-yellow-50]="request.status === TimeCorrectionStatus.PENDING"
              [class.border-green-200]="request.status === TimeCorrectionStatus.APPROVED"
              [class.bg-green-50]="request.status === TimeCorrectionStatus.APPROVED"
              [class.border-red-200]="request.status === TimeCorrectionStatus.REJECTED"
              [class.bg-red-50]="request.status === TimeCorrectionStatus.REJECTED"
              role="listitem"
            >
              <!-- Header -->
              <div class="flex items-start justify-between mb-3">
                <div>
                  <div class="flex items-center gap-2 mb-1">
                    <h3 class="font-semibold text-gray-900">
                      {{ formatDate(request.originalDate) }}
                    </h3>
                    <span 
                      class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                      [class.bg-yellow-100]="request.status === TimeCorrectionStatus.PENDING"
                      [class.text-yellow-800]="request.status === TimeCorrectionStatus.PENDING"
                      [class.bg-green-100]="request.status === TimeCorrectionStatus.APPROVED"
                      [class.text-green-800]="request.status === TimeCorrectionStatus.APPROVED"
                      [class.bg-red-100]="request.status === TimeCorrectionStatus.REJECTED"
                      [class.text-red-800]="request.status === TimeCorrectionStatus.REJECTED"
                      [attr.aria-label]="'Status: ' + request.status"
                    >
                      {{ request.status }}
                    </span>
                  </div>
                  <p class="text-xs text-gray-500">
                    Requested {{ formatRelativeTime(request.createdAt) }}
                  </p>
                </div>
              </div>

              <!-- Changes Details -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                @if (request.requestedClockIn) {
                  <div class="bg-white rounded p-3 border border-gray-200">
                    <div class="text-xs text-gray-600 mb-1">Clock In</div>
                    <div class="flex items-center gap-2 text-sm">
                      @if (request.originalClockIn) {
                        <span class="line-through text-gray-500">
                          {{ formatTime(request.originalClockIn) }}
                        </span>
                        <span class="text-gray-400" aria-hidden="true">→</span>
                      }
                      <span class="font-medium text-blue-700">
                        {{ formatTime(request.requestedClockIn) }}
                      </span>
                    </div>
                  </div>
                }
                @if (request.requestedClockOut) {
                  <div class="bg-white rounded p-3 border border-gray-200">
                    <div class="text-xs text-gray-600 mb-1">Clock Out</div>
                    <div class="flex items-center gap-2 text-sm">
                      @if (request.originalClockOut) {
                        <span class="line-through text-gray-500">
                          {{ formatTime(request.originalClockOut) }}
                        </span>
                        <span class="text-gray-400" aria-hidden="true">→</span>
                      }
                      <span class="font-medium text-blue-700">
                        {{ formatTime(request.requestedClockOut) }}
                      </span>
                    </div>
                  </div>
                }
              </div>

              <!-- Reason -->
              <div class="bg-white rounded p-3 border border-gray-200 mb-3">
                <div class="text-xs text-gray-600 mb-1">Reason</div>
                <p class="text-sm text-gray-800">{{ request.reason }}</p>
              </div>

              <!-- Review Notes (if approved or rejected) -->
              @if (request.reviewNotes && request.reviewedAt) {
                <div class="bg-white rounded p-3 border border-gray-200">
                  <div class="text-xs text-gray-600 mb-1">
                    Review Notes 
                    @if (request.reviewedBy) {
                      <span>- by {{ request.reviewedBy }}</span>
                    }
                    ({{ formatRelativeTime(request.reviewedAt) }})
                  </div>
                  <p class="text-sm text-gray-800">{{ request.reviewNotes }}</p>
                </div>
              }
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
export class TimeCorrectionList {
  private correctionService = inject(TimeCorrectionService);

  protected currentFilter = signal<'all' | 'pending' | 'approved' | 'rejected'>('all');
  protected TimeCorrectionStatus = TimeCorrectionStatus;

  // Get requests from service
  protected allRequests = this.correctionService.requests;
  protected pendingRequests = this.correctionService.pendingRequests;
  protected approvedRequests = this.correctionService.approvedRequests;
  protected rejectedRequests = this.correctionService.rejectedRequests;

  // Filtered requests based on current filter
  protected filteredRequests = computed(() => {
    switch (this.currentFilter()) {
      case 'pending':
        return this.pendingRequests();
      case 'approved':
        return this.approvedRequests();
      case 'rejected':
        return this.rejectedRequests();
      default:
        return this.allRequests();
    }
  });

  protected setFilter(filter: 'all' | 'pending' | 'approved' | 'rejected'): void {
    this.currentFilter.set(filter);
  }

  protected formatDate(dateString: string): string {
    return DateUtils.formatDate(new Date(dateString), 'medium');
  }

  protected formatTime(date: Date): string {
    return DateUtils.formatTime12Hour(date);
  }

  protected formatRelativeTime(date: Date): string {
    return DateUtils.getRelativeTime(date);
  }
}
