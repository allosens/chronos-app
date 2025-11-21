import { Component, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { VacationManagementService } from '../../services/vacation-management.service';
import { VacationApproval } from './vacation-approval.component';
import { VacationRequestStatus } from '../../models/vacation-request.model';
import { DateUtils } from '../../../../shared/utils/date.utils';

@Component({
  selector: 'app-vacation-management',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, VacationApproval],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="max-w-7xl mx-auto p-6">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 mb-2">Vacation Management</h1>
        <p class="text-gray-600">Review and manage employee vacation requests</p>
      </div>

      <!-- Summary Cards -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div class="bg-white rounded-lg shadow p-6 border border-gray-200">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600">Pending Requests</p>
              <p class="text-3xl font-bold text-amber-600 mt-2">{{ pendingCount() }}</p>
            </div>
            <div class="bg-amber-100 p-3 rounded-full">
              <svg class="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow p-6 border border-gray-200">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600">Approved</p>
              <p class="text-3xl font-bold text-emerald-600 mt-2">{{ approvedCount() }}</p>
            </div>
            <div class="bg-emerald-100 p-3 rounded-full">
              <svg class="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow p-6 border border-gray-200">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600">Total Employees</p>
              <p class="text-3xl font-bold text-blue-600 mt-2">{{ employeeCount() }}</p>
            </div>
            <div class="bg-blue-100 p-3 rounded-full">
              <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
              </svg>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow p-6 border border-gray-200">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600">Team Available</p>
              <p class="text-3xl font-bold text-purple-600 mt-2">{{ availabilityPercentage() }}%</p>
            </div>
            <div class="bg-purple-100 p-3 rounded-full">
              <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
              </svg>
            </div>
          </div>
        </div>
      </div>

      <!-- Filters and View Tabs -->
      <div class="bg-white rounded-lg shadow mb-6">
        <div class="border-b border-gray-200">
          <nav class="flex -mb-px" aria-label="Tabs">
            <button
              (click)="setView('pending')"
              [class.border-blue-500]="currentView() === 'pending'"
              [class.text-blue-600]="currentView() === 'pending'"
              [class.border-transparent]="currentView() !== 'pending'"
              [class.text-gray-500]="currentView() !== 'pending'"
              class="group inline-flex items-center px-6 py-4 border-b-2 font-medium text-sm hover:text-gray-700 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              type="button"
              aria-label="View pending requests"
            >
              <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              Pending Approval ({{ pendingCount() }})
            </button>
            <button
              (click)="setView('approved')"
              [class.border-blue-500]="currentView() === 'approved'"
              [class.text-blue-600]="currentView() === 'approved'"
              [class.border-transparent]="currentView() !== 'approved'"
              [class.text-gray-500]="currentView() !== 'approved'"
              class="group inline-flex items-center px-6 py-4 border-b-2 font-medium text-sm hover:text-gray-700 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              type="button"
              aria-label="View approved requests"
            >
              <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              Approved ({{ approvedCount() }})
            </button>
            <button
              (click)="setView('calendar')"
              [class.border-blue-500]="currentView() === 'calendar'"
              [class.text-blue-600]="currentView() === 'calendar'"
              [class.border-transparent]="currentView() !== 'calendar'"
              [class.text-gray-500]="currentView() !== 'calendar'"
              class="group inline-flex items-center px-6 py-4 border-b-2 font-medium text-sm hover:text-gray-700 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              type="button"
              aria-label="View calendar"
            >
              <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
              </svg>
              Calendar View
            </button>
            <button
              (click)="setView('employees')"
              [class.border-blue-500]="currentView() === 'employees'"
              [class.text-blue-600]="currentView() === 'employees'"
              [class.border-transparent]="currentView() !== 'employees'"
              [class.text-gray-500]="currentView() !== 'employees'"
              class="group inline-flex items-center px-6 py-4 border-b-2 font-medium text-sm hover:text-gray-700 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              type="button"
              aria-label="View employee summaries"
            >
              <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
              </svg>
              By Employee
            </button>
          </nav>
        </div>

        <!-- Filters -->
        @if (currentView() !== 'calendar') {
          <div class="p-4 bg-gray-50 border-b border-gray-200">
            <div class="flex flex-wrap gap-4 items-end">
              <!-- Employee Filter -->
              <div class="flex-1 min-w-[200px]">
                <label for="employeeFilter" class="block text-sm font-medium text-gray-700 mb-1">
                  Filter by Employee
                </label>
                <select
                  id="employeeFilter"
                  [formControl]="employeeFilterControl"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  aria-label="Filter by employee"
                >
                  <option value="">All Employees</option>
                  @for (emp of uniqueEmployees(); track emp.id) {
                    <option [value]="emp.id">{{ emp.name }}</option>
                  }
                </select>
              </div>

              <!-- Clear Filters -->
              @if (hasActiveFilters()) {
                <button
                  type="button"
                  (click)="clearFilters()"
                  class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-label="Clear all filters"
                >
                  Clear Filters
                </button>
              }
            </div>
          </div>
        }
      </div>

      <!-- Content Area -->
      <div class="space-y-6">
        <!-- Pending Requests View -->
        @if (currentView() === 'pending') {
          @if (displayedRequests().length === 0) {
            <div class="bg-white rounded-lg shadow p-12 text-center">
              <svg class="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <p class="text-gray-500 font-medium text-lg">No pending requests</p>
              <p class="text-sm text-gray-400 mt-1">All vacation requests have been reviewed</p>
            </div>
          } @else {
            <div class="space-y-4">
              @for (request of displayedRequests(); track request.id) {
                <app-vacation-approval
                  [request]="request"
                  (approved)="onApprove($event)"
                  (rejected)="onReject($event)"
                />
              }
            </div>
          }
        }

        <!-- Approved Requests View -->
        @if (currentView() === 'approved') {
          @if (displayedRequests().length === 0) {
            <div class="bg-white rounded-lg shadow p-12 text-center">
              <svg class="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
              </svg>
              <p class="text-gray-500 font-medium text-lg">No approved requests</p>
              <p class="text-sm text-gray-400 mt-1">Approved vacation requests will appear here</p>
            </div>
          } @else {
            <div class="bg-white rounded-lg shadow overflow-hidden">
              <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                  <tr>
                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Date</th>
                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">End Date</th>
                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Days</th>
                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reviewed By</th>
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                  @for (request of displayedRequests(); track request.id) {
                    <tr class="hover:bg-gray-50">
                      <td class="px-6 py-4 whitespace-nowrap">
                        <div class="text-sm font-medium text-gray-900">{{ request.employeeName || 'Unknown' }}</div>
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap">
                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                          {{ getTypeLabel(request.type) }}
                        </span>
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ formatDate(request.startDate) }}</td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ formatDate(request.endDate) }}</td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ request.totalDays }}</td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ request.reviewedBy || '-' }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        }

        <!-- Calendar View -->
        @if (currentView() === 'calendar') {
          <div class="bg-white rounded-lg shadow p-6">
            <div class="mb-6">
              <h3 class="text-lg font-semibold text-gray-900 mb-4">Vacation Calendar (Next 30 Days)</h3>
              <div class="grid grid-cols-7 gap-2">
                <!-- Day Headers -->
                @for (day of ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']; track day) {
                  <div class="text-center text-xs font-semibold text-gray-600 py-2">{{ day }}</div>
                }
                
                <!-- Calendar Days -->
                @for (calDay of calendarDays(); track calDay.date.getTime()) {
                  <div
                    class="aspect-square p-2 border rounded-lg transition-colors"
                    [class.bg-gray-100]="calDay.isWeekend"
                    [class.border-gray-200]="calDay.isWeekend"
                    [class.bg-white]="!calDay.isWeekend && calDay.vacations.length === 0"
                    [class.border-gray-300]="!calDay.isWeekend && calDay.vacations.length === 0"
                    [class.bg-amber-50]="!calDay.isWeekend && calDay.vacations.length > 0 && calDay.availability >= 0.7"
                    [class.border-amber-200]="!calDay.isWeekend && calDay.vacations.length > 0 && calDay.availability >= 0.7"
                    [class.bg-red-50]="!calDay.isWeekend && calDay.availability < 0.7"
                    [class.border-red-300]="!calDay.isWeekend && calDay.availability < 0.7"
                  >
                    <div class="text-xs font-medium text-gray-900 mb-1">{{ calDay.date.getDate() }}</div>
                    @if (!calDay.isWeekend && calDay.vacations.length > 0) {
                      <div class="text-xs text-gray-600">
                        {{ calDay.vacations.length }} away
                      </div>
                    }
                  </div>
                }
              </div>
              
              <div class="mt-6 flex items-center gap-6 text-sm">
                <div class="flex items-center gap-2">
                  <div class="w-4 h-4 bg-gray-100 border border-gray-200 rounded"></div>
                  <span class="text-gray-600">Weekend</span>
                </div>
                <div class="flex items-center gap-2">
                  <div class="w-4 h-4 bg-amber-50 border border-amber-200 rounded"></div>
                  <span class="text-gray-600">Vacations (Good availability)</span>
                </div>
                <div class="flex items-center gap-2">
                  <div class="w-4 h-4 bg-red-50 border border-red-300 rounded"></div>
                  <span class="text-gray-600">Low availability (&lt;70%)</span>
                </div>
              </div>
            </div>
          </div>
        }

        <!-- Employee Summary View -->
        @if (currentView() === 'employees') {
          @if (employeeSummaries().length === 0) {
            <div class="bg-white rounded-lg shadow p-12 text-center">
              <svg class="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
              </svg>
              <p class="text-gray-500 font-medium text-lg">No employee data</p>
            </div>
          } @else {
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              @for (emp of employeeSummaries(); track emp.employeeId) {
                <div class="bg-white rounded-lg shadow p-6 border border-gray-200">
                  <h4 class="text-lg font-semibold text-gray-900 mb-4">{{ emp.employeeName }}</h4>
                  
                  <div class="space-y-3 mb-4">
                    <div class="flex justify-between text-sm">
                      <span class="text-gray-600">Total Days</span>
                      <span class="font-medium text-gray-900">{{ emp.totalDaysAllowed }}</span>
                    </div>
                    <div class="flex justify-between text-sm">
                      <span class="text-gray-600">Days Used</span>
                      <span class="font-medium text-emerald-600">{{ emp.daysUsed }}</span>
                    </div>
                    <div class="flex justify-between text-sm">
                      <span class="text-gray-600">Days Pending</span>
                      <span class="font-medium text-amber-600">{{ emp.daysPending }}</span>
                    </div>
                    <div class="flex justify-between text-sm border-t pt-2">
                      <span class="text-gray-600 font-medium">Remaining</span>
                      <span class="font-bold text-blue-600">{{ emp.daysRemaining }}</span>
                    </div>
                  </div>

                  <div class="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      class="bg-emerald-600 h-2.5 rounded-full"
                      [style.width.%]="(emp.daysUsed / emp.totalDaysAllowed) * 100"
                      role="progressbar"
                      [attr.aria-valuenow]="emp.daysUsed"
                      [attr.aria-valuemin]="0"
                      [attr.aria-valuemax]="emp.totalDaysAllowed"
                      [attr.aria-label]="'Vacation days used: ' + emp.daysUsed + ' of ' + emp.totalDaysAllowed"
                    ></div>
                  </div>
                  <p class="text-xs text-gray-500 mt-2 text-center">
                    {{ ((emp.daysUsed / emp.totalDaysAllowed) * 100).toFixed(0) }}% used
                  </p>
                </div>
              }
            </div>
          }
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
export class VacationManagement {
  private managementService = inject(VacationManagementService);

  // View state
  protected currentView = signal<'pending' | 'approved' | 'calendar' | 'employees'>('pending');
  protected employeeFilterControl = new FormControl('');

  // Data signals
  protected pendingRequests = this.managementService.pendingRequestsForApproval;
  protected approvedRequests = this.managementService.approvedRequestsFiltered;
  protected employeeSummaries = computed(() => this.managementService.getEmployeeSummaries());

  // Computed values
  protected pendingCount = computed(() => this.pendingRequests().length);
  protected approvedCount = computed(() => this.approvedRequests().length);
  protected employeeCount = computed(() => this.employeeSummaries().length);
  
  protected availabilityPercentage = computed(() => {
    const today = new Date();
    const availability = this.managementService.checkTeamAvailability(today, today);
    if (availability.length === 0) return 100;
    return Math.round(availability[0].availabilityPercentage * 100);
  });

  protected displayedRequests = computed(() => {
    const view = this.currentView();
    return view === 'pending' ? this.pendingRequests() : this.approvedRequests();
  });

  protected uniqueEmployees = computed(() => {
    const all = this.managementService.allRequests();
    const uniqueMap = new Map();
    all.forEach(req => {
      if (!uniqueMap.has(req.employeeId)) {
        uniqueMap.set(req.employeeId, {
          id: req.employeeId,
          name: req.employeeName || `Employee ${req.employeeId}`
        });
      }
    });
    return Array.from(uniqueMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  });

  protected calendarDays = computed(() => {
    const today = new Date();
    const endDate = new Date(today);
    endDate.setDate(today.getDate() + 30);
    
    // Adjust to start from Sunday
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - today.getDay());
    
    return this.managementService.generateCalendar(startDate, endDate);
  });

  protected hasActiveFilters = computed(() => {
    return !!this.employeeFilterControl.value;
  });

  constructor() {
    // Subscribe to filter changes
    this.employeeFilterControl.valueChanges.subscribe(employeeId => {
      this.managementService.setFilters({
        employeeId: employeeId || undefined
      });
    });
  }

  protected setView(view: 'pending' | 'approved' | 'calendar' | 'employees'): void {
    this.currentView.set(view);
  }

  protected clearFilters(): void {
    this.employeeFilterControl.setValue('');
    this.managementService.clearFilters();
  }

  protected onApprove(event: { requestId: string; comments?: string }): void {
    if (confirm('Are you sure you want to approve this vacation request?')) {
      this.managementService.approveRequest({
        requestId: event.requestId,
        action: 'approve',
        reviewComments: event.comments,
        reviewedBy: 'Admin' // In a real app, this would be the current user
      });
    }
  }

  protected onReject(event: { requestId: string; comments?: string }): void {
    if (confirm('Are you sure you want to reject this vacation request?')) {
      this.managementService.rejectRequest({
        requestId: event.requestId,
        action: 'reject',
        reviewComments: event.comments,
        reviewedBy: 'Admin' // In a real app, this would be the current user
      });
    }
  }

  protected formatDate(date: Date): string {
    return DateUtils.formatDate(date, 'medium');
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
