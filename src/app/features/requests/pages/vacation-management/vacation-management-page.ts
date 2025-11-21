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
  employeeNames: string[]; // Names of employees with vacations this day
  vacationCount: number; // Total number of vacation requests
}

@Component({
  selector: 'app-vacation-management-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, VacationApproval],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './vacation-management-page.html',
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

    // Pre-process vacation dates into Maps for O(1) lookup with employee info
    const approvedDatesMap = new Map<string, string[]>();
    const pendingDatesMap = new Map<string, string[]>();
    
    this.vacationService.approvedRequests().forEach(req => {
      const current = new Date(req.startDate);
      const end = new Date(req.endDate);
      current.setHours(0, 0, 0, 0);
      end.setHours(0, 0, 0, 0);
      const employeeName = req.employeeName || 'Unknown';
      while (current <= end) {
        const dateKey = current.toISOString().split('T')[0];
        if (!approvedDatesMap.has(dateKey)) {
          approvedDatesMap.set(dateKey, []);
        }
        approvedDatesMap.get(dateKey)!.push(employeeName);
        current.setDate(current.getDate() + 1);
      }
    });
    
    this.vacationService.pendingRequests().forEach(req => {
      const current = new Date(req.startDate);
      const end = new Date(req.endDate);
      current.setHours(0, 0, 0, 0);
      end.setHours(0, 0, 0, 0);
      const employeeName = req.employeeName || 'Unknown';
      while (current <= end) {
        const dateKey = current.toISOString().split('T')[0];
        if (!pendingDatesMap.has(dateKey)) {
          pendingDatesMap.set(dateKey, []);
        }
        pendingDatesMap.get(dateKey)!.push(employeeName);
        current.setDate(current.getDate() + 1);
      }
    });

    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      date.setHours(0, 0, 0, 0);
      
      const dateKey = date.toISOString().split('T')[0];
      const approvedEmployees = approvedDatesMap.get(dateKey) || [];
      const pendingEmployees = pendingDatesMap.get(dateKey) || [];
      const allEmployees = [...approvedEmployees, ...pendingEmployees];

      days.push({
        date,
        dayNumber: date.getDate(),
        isCurrentMonth: date.getMonth() === month,
        isToday: date.getTime() === today.getTime(),
        isWeekend: date.getDay() === 0 || date.getDay() === 6,
        isVacation: approvedEmployees.length > 0,
        isPending: pendingEmployees.length > 0,
        employeeNames: allEmployees,
        vacationCount: allEmployees.length
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
