import { Component, inject, computed, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VacationRequestService } from '../../services/vacation-request.service';
import { VacationRequest, VacationRequestStatus, VacationRequestType } from '../../models/vacation-request.model';

interface CalendarDay {
  date: Date;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isWeekend: boolean;
  isVacation: boolean;
  isPending: boolean;
  requests: VacationRequest[];
}

@Component({
  selector: 'app-vacation-calendar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <div class="bg-white rounded-xl shadow-lg p-3 md:p-4 border border-gray-100 max-w-4xl mx-auto">
      <div class="flex flex-col sm:flex-row items-center justify-between mb-2 md:mb-3 gap-2">
        <h3 id="calendar-title" class="text-base md:text-lg font-semibold text-gray-900">Vacation Calendar</h3>
        <div class="flex items-center gap-1.5 md:gap-2">
          <button
            (click)="previousMonth()"
            class="p-1.5 hover:bg-gray-100 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            type="button"
            aria-label="Previous month"
          >
            <svg class="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
            </svg>
          </button>
          <span class="text-sm md:text-base font-medium text-gray-900 min-w-[140px] md:min-w-[160px] text-center calendar-month-transition">
            {{ currentMonthName() }} {{ currentYear() }}
          </span>
          <button
            (click)="nextMonth()"
            class="p-1.5 hover:bg-gray-100 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
      <div class="flex flex-wrap gap-2 md:gap-3 mb-2 text-xs">
        <div class="flex items-center gap-1.5">
          <div class="w-3 h-3 bg-emerald-200 border-2 border-emerald-500 rounded"></div>
          <span class="text-gray-600">Approved</span>
        </div>
        <div class="flex items-center gap-1.5">
          <div class="w-3 h-3 bg-amber-200 border-2 border-amber-500 rounded"></div>
          <span class="text-gray-600">Pending</span>
        </div>
        <div class="flex items-center gap-1.5">
          <div class="w-3 h-3 bg-blue-100 border border-blue-200 rounded"></div>
          <span class="text-gray-600">Today</span>
        </div>
      </div>

      <!-- Calendar Grid -->
      <div role="grid" aria-labelledby="calendar-title" class="grid grid-cols-7 gap-0.5 calendar-grid-transition">
        <!-- Day Headers -->
        @for (day of weekDays; track day) {
          <div role="columnheader" class="text-center font-semibold text-gray-600 text-xs py-1">
            <span class="hidden sm:inline">{{ day }}</span>
            <span class="sm:hidden">{{ day.substring(0, 1) }}</span>
          </div>
        }

        <!-- Calendar Days -->
        @for (day of calendarDays(); track day.date.getTime()) {
          <div
            role="gridcell"
            [attr.aria-label]="getDayAriaLabel(day)"
            [attr.aria-selected]="day.isVacation || day.isPending"
            [attr.tabindex]="(day.isVacation || day.isPending) && day.isCurrentMonth ? 0 : -1"
            class="h-16 md:h-20 p-0.5 transition-all duration-200 relative group"
            [class.opacity-50]="!day.isCurrentMonth"
            (click)="onDayClick(day)"
            (keydown.enter)="onDayClick(day)"
            (keydown.space)="onDayClick($event, day); $event.preventDefault()"
          >
            <div 
              class="flex flex-col h-full items-center justify-center rounded-lg transition-all duration-200"
              [class.bg-gray-50]="!day.isCurrentMonth && !day.isVacation && !day.isPending"
              [class.bg-white]="day.isCurrentMonth && !day.isToday && !day.isVacation && !day.isPending"
              [class.bg-blue-100]="day.isToday && !day.isVacation && !day.isPending"
              [class.ring-2]="day.isToday && !day.isVacation && !day.isPending"
              [class.ring-blue-500]="day.isToday && !day.isVacation && !day.isPending"
              [class.bg-emerald-200]="day.isVacation"
              [class.shadow-md]="day.isVacation || day.isPending"
              [class.vacation-day]="day.isVacation"
              [class.bg-amber-200]="day.isPending && !day.isVacation"
              [class.pending-day]="day.isPending && !day.isVacation"
              [class.cursor-pointer]="(day.isVacation || day.isPending) && day.isCurrentMonth"
              [class.hover:shadow-lg]="(day.isVacation || day.isPending) && day.isCurrentMonth"
              [class.hover:scale-105]="(day.isVacation || day.isPending) && day.isCurrentMonth"
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
            
            <!-- Tooltip -->
            @if ((day.isVacation || day.isPending) && day.isCurrentMonth) {
              <div class="absolute z-10 invisible group-hover:visible group-focus-within:visible 
                          bottom-full left-1/2 -translate-x-1/2 mb-2 
                          bg-gray-900 text-white text-xs rounded-lg py-2 px-3 
                          shadow-xl w-48 pointer-events-none
                          opacity-0 group-hover:opacity-100 group-focus-within:opacity-100
                          transition-opacity duration-200">
                <div class="font-semibold mb-1">{{ formatDate(day.date) }}</div>
                @for (req of day.requests; track req.id) {
                  <div class="text-xs mb-1">
                    <span [class.text-emerald-300]="req.status === VacationRequestStatus.APPROVED" 
                          [class.text-amber-300]="req.status === VacationRequestStatus.PENDING">
                      {{ req.type === VacationRequestType.VACATION ? '🏖️ Vacation' : 
                         req.type === VacationRequestType.PERSONAL_DAY ? '📅 Personal Day' :
                         req.type === VacationRequestType.SICK_LEAVE ? '🤒 Sick Leave' : '📝 Other' }}
                    </span>
                    <div class="text-gray-300 text-[10px]">
                      {{ formatDateRange(req.startDate, req.endDate) }} ({{ req.totalDays }} days)
                    </div>
                  </div>
                }
                <div class="absolute top-full left-1/2 -translate-x-1/2 -mt-1 
                            border-4 border-transparent border-t-gray-900"></div>
              </div>
            }
          </div>
        }
      </div>

      <!-- Summary -->
      <div class="mt-3 pt-3 border-t border-gray-200">
        <div class="grid grid-cols-3 gap-2 text-center">
          <div>
            <p class="text-lg md:text-xl font-bold text-emerald-600">{{ vacationBalance().totalVacationDays }}</p>
            <p class="text-xs text-gray-600">Total</p>
          </div>
          <div>
            <p class="text-lg md:text-xl font-bold text-blue-600">{{ vacationBalance().usedVacationDays }}</p>
            <p class="text-xs text-gray-600">Used</p>
          </div>
          <div>
            <p class="text-lg md:text-xl font-bold text-amber-600">{{ vacationBalance().remainingVacationDays }}</p>
            <p class="text-xs text-gray-600">Remaining</p>
          </div>
        </div>
      </div>

      <!-- Selected Day Details -->
      @if (selectedDay()) {
        <div class="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200 animate-fadeIn">
          <div class="flex justify-between items-start mb-2">
            <h4 class="text-sm font-semibold text-gray-900">{{ formatDate(selectedDay()!.date) }}</h4>
            <button 
              (click)="clearSelectedDay()"
              class="text-gray-500 hover:text-gray-700 transition-colors"
              type="button"
              aria-label="Close details"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
          @for (req of selectedDay()!.requests; track req.id) {
            <div class="mb-2 last:mb-0 p-2 bg-white rounded border text-sm"
                 [class.border-emerald-300]="req.status === VacationRequestStatus.APPROVED"
                 [class.border-amber-300]="req.status === VacationRequestStatus.PENDING">
              <div class="flex items-center gap-2 mb-1">
                <span class="text-base">
                  {{ req.type === VacationRequestType.VACATION ? '🏖️' : 
                     req.type === VacationRequestType.PERSONAL_DAY ? '📅' :
                     req.type === VacationRequestType.SICK_LEAVE ? '🤒' : '📝' }}
                </span>
                <span class="font-semibold text-gray-900 text-sm">
                  {{ req.type === VacationRequestType.VACATION ? 'Vacation' : 
                     req.type === VacationRequestType.PERSONAL_DAY ? 'Personal Day' :
                     req.type === VacationRequestType.SICK_LEAVE ? 'Sick Leave' :
                     req.type === VacationRequestType.COMPENSATORY_TIME ? 'Compensatory Time' : 'Other' }}
                </span>
                <span class="ml-auto px-2 py-0.5 text-xs font-medium rounded-full"
                      [class.bg-emerald-100]="req.status === VacationRequestStatus.APPROVED"
                      [class.text-emerald-800]="req.status === VacationRequestStatus.APPROVED"
                      [class.bg-amber-100]="req.status === VacationRequestStatus.PENDING"
                      [class.text-amber-800]="req.status === VacationRequestStatus.PENDING">
                  {{ req.status === VacationRequestStatus.APPROVED ? 'Approved' : 'Pending' }}
                </span>
              </div>
              <div class="text-xs text-gray-600">
                <div>{{ formatDateRange(req.startDate, req.endDate) }}</div>
                <div class="font-medium text-gray-900 mt-0.5">{{ req.totalDays }} working days</div>
                @if (req.comments) {
                  <div class="mt-1 text-gray-600 italic">"{{ req.comments }}"</div>
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
    
    .vacation-day {
      border: 2px solid #10b981 !important;
    }
    
    .pending-day {
      border: 2px solid #f59e0b !important;
    }

    .calendar-month-transition {
      transition: opacity 0.3s ease-in-out;
    }

    .calendar-grid-transition {
      animation: fadeIn 0.3s ease-in-out;
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: translateY(-4px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .animate-fadeIn {
      animation: fadeIn 0.2s ease-in-out;
    }
  `]
})
export class VacationCalendar {
  protected vacationService = inject(VacationRequestService);

  protected currentMonth = signal(new Date().getMonth());
  protected currentYear = signal(new Date().getFullYear());
  protected selectedDay = signal<CalendarDay | null>(null);

  protected readonly weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  // Expose enums to template
  protected readonly VacationRequestStatus = VacationRequestStatus;
  protected readonly VacationRequestType = VacationRequestType;

  protected vacationBalance = this.vacationService.vacationBalance;

  protected currentMonthName = computed(() => {
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return monthNames[this.currentMonth()];
  });

  protected calendarDays = computed(() => {
    const month = this.currentMonth();
    const year = this.currentYear();
    const firstDay = new Date(year, month, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - startDate.getDay());

    const days: CalendarDay[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Pre-process vacation dates into Maps for O(1) lookup with request details
    const requestsByDate = new Map<string, VacationRequest[]>();
    
    [...this.vacationService.approvedRequests(), ...this.vacationService.pendingRequests()].forEach(req => {
      const current = new Date(req.startDate);
      const end = new Date(req.endDate);
      current.setHours(0, 0, 0, 0);
      end.setHours(0, 0, 0, 0);
      while (current <= end) {
        const dateKey = current.toISOString().split('T')[0];
        if (!requestsByDate.has(dateKey)) {
          requestsByDate.set(dateKey, []);
        }
        requestsByDate.get(dateKey)!.push(req);
        current.setDate(current.getDate() + 1);
      }
    });

    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      date.setHours(0, 0, 0, 0);
      
      const dateKey = date.toISOString().split('T')[0];
      const dayRequests = requestsByDate.get(dateKey) || [];

      days.push({
        date,
        dayNumber: date.getDate(),
        isCurrentMonth: date.getMonth() === month,
        isToday: date.getTime() === today.getTime(),
        isWeekend: date.getDay() === 0 || date.getDay() === 6,
        isVacation: dayRequests.some(req => req.status === 'approved'),
        isPending: dayRequests.some(req => req.status === 'pending'),
        requests: dayRequests
      });
    }

    return days;
  });

  protected getDayAriaLabel(day: CalendarDay): string {
    const dateStr = day.date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    const status = day.isVacation ? 'Approved vacation' : 
                   day.isPending ? 'Pending request' : 
                   day.isWeekend ? 'Weekend' : 
                   day.isToday ? 'Today' : '';
    return `${dateStr}${status ? ', ' + status : ''}`;
  }

  protected previousMonth(): void {
    this.selectedDay.set(null); // Clear selection when changing months
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
    this.selectedDay.set(null); // Clear selection when changing months
    const month = this.currentMonth();
    const year = this.currentYear();

    if (month === 11) {
      this.currentMonth.set(0);
      this.currentYear.set(year + 1);
    } else {
      this.currentMonth.set(month + 1);
    }
  }

  protected onDayClick(dayOrEvent: CalendarDay | Event, day?: CalendarDay): void {
    // Handle both direct day clicks and keyboard events
    const targetDay = day || (dayOrEvent as CalendarDay);
    
    if ((targetDay.isVacation || targetDay.isPending) && targetDay.isCurrentMonth) {
      this.selectedDay.set(targetDay);
    }
  }

  protected clearSelectedDay(): void {
    this.selectedDay.set(null);
  }

  protected formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    });
  }

  protected formatDateRange(startDate: Date, endDate: Date): string {
    const start = startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const end = endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    
    // Compare only year, month, and day
    const isSameDay = startDate.getFullYear() === endDate.getFullYear() &&
                      startDate.getMonth() === endDate.getMonth() &&
                      startDate.getDate() === endDate.getDate();
    
    if (isSameDay) {
      return end;
    }
    return `${start} - ${end}`;
  }
}
