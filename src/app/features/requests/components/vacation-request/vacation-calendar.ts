import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VacationRequestService } from '../../services/vacation-request.service';

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
  selector: 'app-vacation-calendar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
      <div class="flex items-center justify-between mb-6">
        <h3 id="calendar-title" class="text-xl font-semibold text-gray-900">Vacation Calendar</h3>
        <div class="flex items-center gap-3">
          <button
            (click)="previousMonth()"
            class="p-2 hover:bg-gray-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            type="button"
            aria-label="Previous month"
          >
            <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
            </svg>
          </button>
          <span class="text-lg font-medium text-gray-900 min-w-[200px] text-center">
            {{ currentMonthName() }} {{ currentYear() }}
          </span>
          <button
            (click)="nextMonth()"
            class="p-2 hover:bg-gray-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            type="button"
            aria-label="Next month"
          >
            <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
            </svg>
          </button>
        </div>
      </div>

      <!-- Legend -->
      <div class="flex flex-wrap gap-4 mb-4 text-xs">
        <div class="flex items-center gap-2">
          <div class="w-4 h-4 bg-emerald-200 border border-emerald-300 rounded"></div>
          <span class="text-gray-600">Approved Vacation</span>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-4 h-4 bg-amber-200 border border-amber-300 rounded"></div>
          <span class="text-gray-600">Pending Request</span>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-4 h-4 bg-blue-100 border border-blue-200 rounded"></div>
          <span class="text-gray-600">Today</span>
        </div>
      </div>

      <!-- Calendar Grid -->
      <div role="grid" aria-labelledby="calendar-title" class="grid grid-cols-7 gap-1">
        <!-- Day Headers -->
        @for (day of weekDays; track day) {
          <div role="columnheader" class="text-center font-semibold text-gray-600 text-sm py-2">
            {{ day }}
          </div>
        }

        <!-- Calendar Days -->
        @for (day of calendarDays(); track day.date.getTime()) {
          <div
            role="gridcell"
            [attr.aria-label]="getDayAriaLabel(day)"
            [attr.aria-selected]="day.isVacation || day.isPending"
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
              [class.bg-emerald-500]="day.isVacation"
              [class.text-white]="day.isVacation"
              [class.shadow-md]="day.isVacation"
              [class.bg-amber-400]="day.isPending && !day.isVacation"
              [class.text-white]="day.isPending && !day.isVacation"
              [class.shadow-md]="day.isPending && !day.isVacation"
            >
              <span
                class="text-sm font-medium"
                [class.text-gray-400]="!day.isCurrentMonth && !day.isVacation && !day.isPending"
                [class.text-gray-900]="day.isCurrentMonth && !day.isWeekend && !day.isToday && !day.isVacation && !day.isPending"
                [class.text-red-600]="day.isWeekend && day.isCurrentMonth && !day.isVacation && !day.isPending"
                [class.text-blue-700]="day.isToday && !day.isVacation && !day.isPending"
                [class.font-semibold]="day.isToday || day.isVacation || day.isPending"
              >
                {{ day.dayNumber }}
              </span>
            </div>
          </div>
        }
      </div>

      <!-- Summary -->
      <div class="mt-6 pt-6 border-t border-gray-200">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div>
            <p class="text-2xl font-bold text-emerald-600">{{ vacationBalance().totalVacationDays }}</p>
            <p class="text-sm text-gray-600">Total Days</p>
          </div>
          <div>
            <p class="text-2xl font-bold text-blue-600">{{ vacationBalance().usedVacationDays }}</p>
            <p class="text-sm text-gray-600">Used Days</p>
          </div>
          <div>
            <p class="text-2xl font-bold text-amber-600">{{ vacationBalance().remainingVacationDays }}</p>
            <p class="text-sm text-gray-600">Remaining Days</p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class VacationCalendar {
  protected vacationService = inject(VacationRequestService);

  protected currentMonth = signal(new Date().getMonth());
  protected currentYear = signal(new Date().getFullYear());

  protected readonly weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

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

  protected getDayAriaLabel(day: CalendarDay): string {
    const dateStr = day.date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    const status = day.isVacation ? 'Approved vacation' : 
                   day.isPending ? 'Pending request' : 
                   day.isWeekend ? 'Weekend' : 
                   day.isToday ? 'Today' : '';
    return `${dateStr}${status ? ', ' + status : ''}`;
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
}
