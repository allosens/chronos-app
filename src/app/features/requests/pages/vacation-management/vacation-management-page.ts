import { Component, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { VacationManagementService } from '../../services/vacation-management.service';
import { VacationRequestService } from '../../services/vacation-request.service';
import { VacationApproval } from '../../components/vacation-management/vacation-approval.component';
import { VacationRequestStatus } from '../../models/vacation-request.model';
import { DateUtils } from '../../../../shared/utils/date.utils';

interface CalendarDay {
  date: Date;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isWeekend: boolean;
  isVacation: boolean;
  isPending: boolean;
}

@Component({
  selector: 'app-vacation-management-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, VacationApproval],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen py-4 px-4">
      <!-- Summary Cards -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
        <div class="bg-white rounded-lg shadow p-4 border border-gray-200">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs font-medium text-gray-600">Pending Requests</p>
              <p class="text-2xl font-bold text-amber-600 mt-1">{{ pendingCount() }}</p>
            </div>
            <div class="bg-amber-100 p-2 rounded-full">
              <svg class="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow p-4 border border-gray-200">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs font-medium text-gray-600">Approved</p>
              <p class="text-2xl font-bold text-emerald-600 mt-1">{{ approvedCount() }}</p>
            </div>
            <div class="bg-emerald-100 p-2 rounded-full">
              <svg class="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow p-4 border border-gray-200">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs font-medium text-gray-600">Total Employees</p>
              <p class="text-2xl font-bold text-blue-600 mt-1">{{ employeeCount() }}</p>
            </div>
            <div class="bg-blue-100 p-2 rounded-full">
              <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
              </svg>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow p-4 border border-gray-200">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs font-medium text-gray-600">Team Available</p>
              <p class="text-2xl font-bold text-purple-600 mt-1">{{ availabilityPercentage() }}%</p>
            </div>
            <div class="bg-purple-100 p-2 rounded-full">
              <svg class="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
              </svg>
            </div>
          </div>
        </div>
      </div>

      <!-- Filters and View Tabs -->
      <div class="bg-white rounded-lg shadow mb-4">
        <div class="border-b border-gray-200">
          <nav class="flex -mb-px" aria-label="Tabs">
            <button
              (click)="setView('pending')"
              [class.border-blue-500]="currentView() === 'pending'"
              [class.text-blue-600]="currentView() === 'pending'"
              [class.border-transparent]="currentView() !== 'pending'"
              [class.text-gray-500]="currentView() !== 'pending'"
              class="group inline-flex items-center px-4 py-3 border-b-2 font-medium text-sm hover:text-gray-700 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              type="button"
              aria-label="View pending requests"
            >
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
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
              class="group inline-flex items-center px-4 py-3 border-b-2 font-medium text-sm hover:text-gray-700 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              type="button"
              aria-label="View approved requests"
            >
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
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
              class="group inline-flex items-center px-4 py-3 border-b-2 font-medium text-sm hover:text-gray-700 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              type="button"
              aria-label="View calendar"
            >
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
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
              class="group inline-flex items-center px-4 py-3 border-b-2 font-medium text-sm hover:text-gray-700 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              type="button"
              aria-label="View employee summaries"
            >
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
              </svg>
              By Employee
            </button>
          </nav>
        </div>

        <!-- Filters -->
        @if (currentView() !== 'calendar') {
          <div class="p-3 bg-gray-50 border-b border-gray-200">
            <div class="flex flex-wrap gap-3 items-end">
              <!-- Employee Filter -->
              <div class="flex-1 min-w-[200px]">
                <label for="employeeFilter" class="block text-xs font-medium text-gray-700 mb-1">
                  Filter by Employee
                </label>
                <select
                  id="employeeFilter"
                  [formControl]="employeeFilterControl"
                  class="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                  class="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
      <div class="space-y-4">
        <!-- Pending Requests View -->
        @if (currentView() === 'pending') {
          @if (displayedRequests().length === 0) {
            <div class="bg-white rounded-lg shadow p-8 text-center">
              <svg class="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <p class="text-gray-500 font-medium">No pending requests</p>
              <p class="text-sm text-gray-400 mt-1">All vacation requests have been reviewed</p>
            </div>
          } @else {
            <div class="space-y-3">
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
            <div class="bg-white rounded-lg shadow p-8 text-center">
              <svg class="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
              </svg>
              <p class="text-gray-500 font-medium">No approved requests</p>
              <p class="text-sm text-gray-400 mt-1">Approved vacation requests will appear here</p>
            </div>
          } @else {
            <div class="bg-white rounded-lg shadow overflow-hidden">
              <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                  <tr>
                    <th scope="col" class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                    <th scope="col" class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th scope="col" class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Date</th>
                    <th scope="col" class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">End Date</th>
                    <th scope="col" class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Days</th>
                    <th scope="col" class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reviewed By</th>
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                  @for (request of displayedRequests(); track request.id) {
                    <tr class="hover:bg-gray-50">
                      <td class="px-4 py-3 whitespace-nowrap">
                        <div class="text-sm font-medium text-gray-900">{{ request.employeeName || 'Unknown' }}</div>
                      </td>
                      <td class="px-4 py-3 whitespace-nowrap">
                        <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                          {{ getTypeLabel(request.type) }}
                        </span>
                      </td>
                      <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{{ formatDate(request.startDate) }}</td>
                      <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{{ formatDate(request.endDate) }}</td>
                      <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{{ request.totalDays }}</td>
                      <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{{ request.reviewedBy || '-' }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        }

        <!-- Calendar View -->
        @if (currentView() === 'calendar') {
          <div class="bg-white rounded-lg shadow p-4">
            <div class="mb-4">
              <div class="flex items-center justify-between mb-4">
                <h3 class="text-base font-semibold text-gray-900">Vacation Calendar</h3>
                <div class="flex items-center gap-3">
                  <button
                    (click)="previousMonth()"
                    class="p-2 hover:bg-gray-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                    type="button"
                    aria-label="Previous month"
                  >
                    <svg class="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
                    </svg>
                  </button>
                  <span class="text-base font-medium text-gray-900 min-w-[150px] text-center">
                    {{ currentMonthName() }} {{ currentYear() }}
                  </span>
                  <button
                    (click)="nextMonth()"
                    class="p-2 hover:bg-gray-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                    type="button"
                    aria-label="Next month"
                  >
                    <svg class="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                    </svg>
                  </button>
                </div>
              </div>

              <!-- Legend -->
              <div class="flex flex-wrap gap-3 mb-3 text-xs">
                <div class="flex items-center gap-1.5">
                  <div class="w-3 h-3 bg-emerald-200 border-2 border-emerald-500 rounded"></div>
                  <span class="text-gray-600">Approved Vacation</span>
                </div>
                <div class="flex items-center gap-1.5">
                  <div class="w-3 h-3 bg-amber-200 border-2 border-amber-500 rounded"></div>
                  <span class="text-gray-600">Pending Request</span>
                </div>
                <div class="flex items-center gap-1.5">
                  <div class="w-3 h-3 bg-blue-100 border border-blue-200 rounded"></div>
                  <span class="text-gray-600">Today</span>
                </div>
              </div>

              <!-- Calendar Grid -->
              <div class="grid grid-cols-7 gap-1">
                <!-- Day Headers -->
                @for (day of weekDays; track day) {
                  <div class="text-center font-semibold text-gray-600 text-xs py-1">
                    {{ day }}
                  </div>
                }

                <!-- Calendar Days -->
                @for (day of calendarDaysForView(); track day.date.getTime()) {
                  <div
                    class="aspect-square p-1 transition-all"
                    [class.opacity-50]="!day.isCurrentMonth"
                  >
                    <div 
                      class="flex flex-col h-full items-center justify-center rounded-lg transition-all"
                      [class.bg-gray-50]="!day.isCurrentMonth && !day.isVacation && !day.isPending"
                      [class.bg-white]="day.isCurrentMonth && !day.isToday && !day.isVacation && !day.isPending"
                      [class.bg-blue-100]="day.isToday && !day.isVacation && !day.isPending"
                      [class.ring-2]="day.isToday && !day.isVacation && !day.isPending"
                      [class.ring-blue-500]="day.isToday && !day.isVacation && !day.isPending"
                      [class.bg-emerald-200]="day.isVacation"
                      [class.shadow-md]="day.isVacation"
                      [class.border-2]="day.isVacation"
                      [class.border-emerald-500]="day.isVacation"
                      [class.bg-amber-200]="day.isPending && !day.isVacation"
                      [class.shadow-md]="day.isPending && !day.isVacation"
                      [class.border-2]="day.isPending && !day.isVacation"
                      [class.border-amber-500]="day.isPending && !day.isVacation"
                    >
                      <span
                        class="text-xs font-medium"
                        [class.text-gray-400]="!day.isCurrentMonth && !day.isVacation && !day.isPending"
                        [class.text-gray-900]="day.isCurrentMonth && !day.isWeekend && !day.isToday && !day.isVacation && !day.isPending"
                        [class.text-red-600]="day.isWeekend && day.isCurrentMonth && !day.isVacation && !day.isPending"
                        [class.text-blue-700]="day.isToday && !day.isVacation && !day.isPending"
                        [class.font-semibold]="day.isToday || day.isVacation || day.isPending"
                        [class.text-emerald-800]="day.isVacation"
                        [class.text-amber-800]="day.isPending && !day.isVacation"
                      >
                        {{ day.dayNumber }}
                      </span>
                    </div>
                  </div>
                }
              </div>
            </div>
          </div>
        }

        <!-- Employee Summary View -->
        @if (currentView() === 'employees') {
          @if (employeeSummaries().length === 0) {
            <div class="bg-white rounded-lg shadow p-8 text-center">
              <svg class="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
              </svg>
              <p class="text-gray-500 font-medium">No employee data</p>
            </div>
          } @else {
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              @for (emp of employeeSummaries(); track emp.employeeId) {
                <div class="bg-white rounded-lg shadow p-4 border border-gray-200">
                  <h4 class="text-base font-semibold text-gray-900 mb-3">{{ emp.employeeName }}</h4>
                  
                  <div class="space-y-2 mb-3">
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

                  <div class="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      class="bg-emerald-600 h-2 rounded-full"
                      [style.width.%]="(emp.daysUsed / emp.totalDaysAllowed) * 100"
                      role="progressbar"
                      [attr.aria-valuenow]="emp.daysUsed"
                      [attr.aria-valuemin]="0"
                      [attr.aria-valuemax]="emp.totalDaysAllowed"
                      [attr.aria-label]="'Vacation days used: ' + emp.daysUsed + ' of ' + emp.totalDaysAllowed"
                    ></div>
                  </div>
                  <p class="text-xs text-gray-500 mt-1.5 text-center">
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
export class VacationManagementPage {
  private managementService = inject(VacationManagementService);
  private vacationService = inject(VacationRequestService);

  // View state
  protected currentView = signal<'pending' | 'approved' | 'calendar' | 'employees'>('pending');
  protected employeeFilterControl = new FormControl('');

  // Calendar state
  protected currentMonth = signal(new Date().getMonth());
  protected currentYear = signal(new Date().getFullYear());
  protected readonly weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

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

  protected currentMonthName = computed(() => {
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return monthNames[this.currentMonth()];
  });

  protected calendarDaysForView = computed(() => {
    const month = this.currentMonth();
    const year = this.currentYear();
    const firstDay = new Date(year, month, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - startDate.getDay());

    const days: CalendarDay[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Pre-process vacation dates into Sets for O(1) lookup
    const approvedDates = new Set<string>();
    const pendingDates = new Set<string>();
    
    this.vacationService.approvedRequests().forEach(req => {
      const current = new Date(req.startDate);
      const end = new Date(req.endDate);
      current.setHours(0, 0, 0, 0);
      end.setHours(0, 0, 0, 0);
      while (current <= end) {
        approvedDates.add(current.toISOString().split('T')[0]);
        current.setDate(current.getDate() + 1);
      }
    });
    
    this.vacationService.pendingRequests().forEach(req => {
      const current = new Date(req.startDate);
      const end = new Date(req.endDate);
      current.setHours(0, 0, 0, 0);
      end.setHours(0, 0, 0, 0);
      while (current <= end) {
        pendingDates.add(current.toISOString().split('T')[0]);
        current.setDate(current.getDate() + 1);
      }
    });

    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      date.setHours(0, 0, 0, 0);
      
      const dateKey = date.toISOString().split('T')[0];

      days.push({
        date,
        dayNumber: date.getDate(),
        isCurrentMonth: date.getMonth() === month,
        isToday: date.getTime() === today.getTime(),
        isWeekend: date.getDay() === 0 || date.getDay() === 6,
        isVacation: approvedDates.has(dateKey),
        isPending: pendingDates.has(dateKey)
      });
    }

    return days;
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

  protected previousMonth(): void {
    const month = this.currentMonth();
    const year = this.currentYear();

    if (month === 0) {
      this.currentMonth.set(11);
      this.currentYear.set(year - 1);
    } else {
      this.currentMonth.set(month - 1);
    }
  }

  protected nextMonth(): void {
    const month = this.currentMonth();
    const year = this.currentYear();

    if (month === 11) {
      this.currentMonth.set(0);
      this.currentYear.set(year + 1);
    } else {
      this.currentMonth.set(month + 1);
    }
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
