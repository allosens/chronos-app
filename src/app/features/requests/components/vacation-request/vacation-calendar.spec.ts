import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { VacationCalendar } from './vacation-calendar';
import { VacationRequestService } from '../../services/vacation-request.service';
import { VacationRequest, VacationRequestType, VacationRequestStatus, VacationBalance } from '../../models/vacation-request.model';

describe('VacationCalendar', () => {
  let component: VacationCalendar;
  let fixture: ComponentFixture<VacationCalendar>;
  let vacationService: jasmine.SpyObj<VacationRequestService>;

  const mockApprovedRequests: VacationRequest[] = [
    {
      id: '1',
      employeeId: 'user-1',
      type: VacationRequestType.VACATION,
      startDate: new Date('2025-12-01'),
      endDate: new Date('2025-12-05'),
      totalDays: 5,
      status: VacationRequestStatus.APPROVED,
      requestedAt: new Date('2025-11-15'),
      comments: 'End of year vacation'
    }
  ];

  const mockPendingRequests: VacationRequest[] = [
    {
      id: '2',
      employeeId: 'user-1',
      type: VacationRequestType.PERSONAL_DAY,
      startDate: new Date('2025-12-10'),
      endDate: new Date('2025-12-10'),
      totalDays: 1,
      status: VacationRequestStatus.PENDING,
      requestedAt: new Date('2025-11-20'),
      comments: 'Personal matters'
    }
  ];

  const mockBalance: VacationBalance = {
    totalVacationDays: 22,
    usedVacationDays: 5,
    remainingVacationDays: 17,
    pendingVacationDays: 1
  };

  beforeEach(() => {
    const serviceSpy = jasmine.createSpyObj('VacationRequestService', ['getRequestById']);
    
    const approvedSignal = signal<VacationRequest[]>(mockApprovedRequests);
    const pendingSignal = signal<VacationRequest[]>(mockPendingRequests);
    const balanceSignal = signal<VacationBalance>(mockBalance);

    Object.defineProperty(serviceSpy, 'approvedRequests', {
      get: () => approvedSignal.asReadonly()
    });
    Object.defineProperty(serviceSpy, 'pendingRequests', {
      get: () => pendingSignal.asReadonly()
    });
    Object.defineProperty(serviceSpy, 'vacationBalance', {
      get: () => balanceSignal.asReadonly()
    });

    TestBed.configureTestingModule({
      imports: [VacationCalendar],
      providers: [
        provideZonelessChangeDetection(),
        { provide: VacationRequestService, useValue: serviceSpy }
      ]
    });

    fixture = TestBed.createComponent(VacationCalendar);
    component = fixture.componentInstance;
    vacationService = TestBed.inject(VacationRequestService) as jasmine.SpyObj<VacationRequestService>;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with current month and year', () => {
    const now = new Date();
    expect(component['currentMonth']()).toBe(now.getMonth());
    expect(component['currentYear']()).toBe(now.getFullYear());
  });

  it('should display correct month name', () => {
    component['currentMonth'].set(0);
    expect(component['currentMonthName']()).toBe('January');

    component['currentMonth'].set(11);
    expect(component['currentMonthName']()).toBe('December');
  });

  it('should generate 42 calendar days (6 weeks)', () => {
    const days = component['calendarDays']();
    expect(days.length).toBe(42);
  });

  it('should navigate to previous month', () => {
    component['currentMonth'].set(5); // June
    component['currentYear'].set(2025);

    component['previousMonth']();

    expect(component['currentMonth']()).toBe(4); // May
    expect(component['currentYear']()).toBe(2025);
  });

  it('should navigate to previous year when going back from January', () => {
    component['currentMonth'].set(0); // January
    component['currentYear'].set(2025);

    component['previousMonth']();

    expect(component['currentMonth']()).toBe(11); // December
    expect(component['currentYear']()).toBe(2024);
  });

  it('should navigate to next month', () => {
    component['currentMonth'].set(5); // June
    component['currentYear'].set(2025);

    component['nextMonth']();

    expect(component['currentMonth']()).toBe(6); // July
    expect(component['currentYear']()).toBe(2025);
  });

  it('should navigate to next year when going forward from December', () => {
    component['currentMonth'].set(11); // December
    component['currentYear'].set(2025);

    component['nextMonth']();

    expect(component['currentMonth']()).toBe(0); // January
    expect(component['currentYear']()).toBe(2026);
  });

  it('should mark approved vacation days correctly', () => {
    component['currentMonth'].set(11); // December
    component['currentYear'].set(2025);

    const days = component['calendarDays']();
    const dec1 = days.find(d => d.dayNumber === 1 && d.isCurrentMonth);
    
    expect(dec1?.isVacation).toBe(true);
    expect(dec1?.requests.length).toBeGreaterThan(0);
  });

  it('should mark pending request days correctly', () => {
    component['currentMonth'].set(11); // December
    component['currentYear'].set(2025);

    const days = component['calendarDays']();
    const dec10 = days.find(d => d.dayNumber === 10 && d.isCurrentMonth);
    
    expect(dec10?.isPending).toBe(true);
    expect(dec10?.requests.length).toBeGreaterThan(0);
  });

  it('should mark weekends correctly', () => {
    component['currentMonth'].set(11); // December 2025
    component['currentYear'].set(2025);

    const days = component['calendarDays']();
    
    // Find weekend days in December 2025
    const weekendDays = days.filter(d => d.isCurrentMonth && d.isWeekend);
    expect(weekendDays.length).toBeGreaterThan(0);
    
    weekendDays.forEach(day => {
      const dayOfWeek = day.date.getDay();
      expect(dayOfWeek === 0 || dayOfWeek === 6).toBe(true);
    });
  });

  it('should mark today correctly', () => {
    const now = new Date();
    component['currentMonth'].set(now.getMonth());
    component['currentYear'].set(now.getFullYear());

    const days = component['calendarDays']();
    const today = days.find(d => d.isToday);
    
    expect(today).toBeTruthy();
    expect(today?.dayNumber).toBe(now.getDate());
  });

  it('should display vacation balance', () => {
    const balance = component['vacationBalance']();
    
    expect(balance.totalVacationDays).toBe(22);
    expect(balance.usedVacationDays).toBe(5);
    expect(balance.remainingVacationDays).toBe(17);
  });

  it('should have days from previous month at the start', () => {
    component['currentMonth'].set(11); // December 2025
    component['currentYear'].set(2025);

    const days = component['calendarDays']();
    const firstDay = days[0];
    
    // First day should be from previous month if December doesn't start on Sunday
    const dec1 = new Date(2025, 11, 1);
    if (dec1.getDay() !== 0) {
      expect(firstDay.isCurrentMonth).toBe(false);
    }
  });

  it('should have days from next month at the end', () => {
    component['currentMonth'].set(11); // December 2025
    component['currentYear'].set(2025);

    const days = component['calendarDays']();
    const lastDay = days[41];
    
    // Last day in 42-day grid should be from next month if December doesn't end on Saturday
    const dec31 = new Date(2025, 11, 31);
    if (dec31.getDay() !== 6) {
      expect(lastDay.isCurrentMonth).toBe(false);
    }
  });

  it('should display 7 week day headers', () => {
    expect(component['weekDays'].length).toBe(7);
    expect(component['weekDays']).toContain('Sun');
    expect(component['weekDays']).toContain('Mon');
    expect(component['weekDays']).toContain('Sat');
  });

  it('should select a day when clicked', () => {
    component['currentMonth'].set(11); // December
    component['currentYear'].set(2025);

    const days = component['calendarDays']();
    const vacationDay = days.find(d => d.isVacation && d.isCurrentMonth);
    
    expect(vacationDay).toBeTruthy();
    if (vacationDay) {
      component['onDayClick'](vacationDay);
      expect(component['selectedDay']()).toEqual(vacationDay);
    }
  });

  it('should clear selected day', () => {
    component['currentMonth'].set(11);
    component['currentYear'].set(2025);

    const days = component['calendarDays']();
    const vacationDay = days.find(d => d.isVacation && d.isCurrentMonth);
    
    if (vacationDay) {
      component['onDayClick'](vacationDay);
      expect(component['selectedDay']()).toBeTruthy();
      
      component['clearSelectedDay']();
      expect(component['selectedDay']()).toBeNull();
    }
  });

  it('should clear selection when changing months', () => {
    component['currentMonth'].set(11);
    component['currentYear'].set(2025);

    const days = component['calendarDays']();
    const vacationDay = days.find(d => d.isVacation && d.isCurrentMonth);
    
    if (vacationDay) {
      component['onDayClick'](vacationDay);
      expect(component['selectedDay']()).toBeTruthy();
      
      component['nextMonth']();
      expect(component['selectedDay']()).toBeNull();
    }
  });

  it('should format date correctly', () => {
    const date = new Date('2025-12-25');
    const formatted = component['formatDate'](date);
    expect(formatted).toContain('December');
    expect(formatted).toContain('25');
    expect(formatted).toContain('2025');
  });

  it('should format date range correctly', () => {
    const start = new Date('2025-12-01');
    const end = new Date('2025-12-05');
    const formatted = component['formatDateRange'](start, end);
    expect(formatted).toContain('Dec');
    expect(formatted).toContain('1');
    expect(formatted).toContain('5');
  });

  it('should format single day range correctly', () => {
    const date = new Date('2025-12-10');
    const formatted = component['formatDateRange'](date, date);
    expect(formatted).toContain('Dec');
    expect(formatted).toContain('10');
    expect(formatted).not.toContain('-');
  });
});
