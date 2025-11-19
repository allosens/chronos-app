import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VacationRequestService } from '../../services/vacation-request.service';
import { VacationRequestStatus } from '../../models/vacation-request.model';

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
        <h3 class="text-xl font-semibold text-gray-900">Vacation Calendar</h3>
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
      <div class="grid grid-cols-7 gap-1">
        <!-- Day Headers -->
        @for (day of weekDays; track day) {
          <div class="text-center font-semibold text-gray-600 text-sm py-2">
            {{ day }}
          </div>
        }

        <!-- Calendar Days -->
        @for (day of calendarDays(); track day.date.getTime()) {
          <div
            class="aspect-square p-1 rounded-lg border transition-colors"
            [class.bg-gray-50]="!day.isCurrentMonth"
            [class.bg-white]="day.isCurrentMonth"
            [class.border-gray-200]="!day.isToday && !day.isVacation && !day.isPending"
            [class.border-blue-400]="day.isToday"
            [class.bg-blue-50]="day.isToday"
            [class.bg-emerald-100]="day.isVacation"
            [class.border-emerald-300]="day.isVacation"
            [class.bg-amber-100]="day.isPending && !day.isVacation"
            [class.border-amber-300]="day.isPending && !day.isVacation"
          >
            <div class="flex flex-col h-full">
              <span
                class="text-sm font-medium text-center"
                [class.text-gray-400]="!day.isCurrentMonth"
                [class.text-gray-900]="day.isCurrentMonth && !day.isWeekend"
                [class.text-red-600]="day.isWeekend && day.isCurrentMonth"
                [class.text-blue-700]="day.isToday"
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
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - startDate.getDay());

    const days: CalendarDay[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const approvedRequests = this.vacationService.approvedRequests();
    const pendingRequests = this.vacationService.pendingRequests();

    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      date.setHours(0, 0, 0, 0);

      const isVacation = approvedRequests.some(req => {
        const start = new Date(req.startDate);
        const end = new Date(req.endDate);
        start.setHours(0, 0, 0, 0);
        end.setHours(0, 0, 0, 0);
        return date >= start && date <= end;
      });

      const isPending = pendingRequests.some(req => {
        const start = new Date(req.startDate);
        const end = new Date(req.endDate);
        start.setHours(0, 0, 0, 0);
        end.setHours(0, 0, 0, 0);
        return date >= start && date <= end;
      });

      days.push({
        date,
        dayNumber: date.getDate(),
        isCurrentMonth: date.getMonth() === month,
        isToday: date.getTime() === today.getTime(),
        isWeekend: date.getDay() === 0 || date.getDay() === 6,
        isVacation,
        isPending
      });
    }

    return days;
  });

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
