# Work Sessions API Migration Guide

## Overview
This document provides guidance for migrating from the old time-entries system to the new Work Sessions API.

## Breaking Changes

### 1. WorkStatus Enum Values
**Before:**
```typescript
export enum WorkStatus {
  CLOCKED_OUT = 'clocked_out',
  WORKING = 'working', 
  ON_BREAK = 'on_break'
}
```

**After:**
```typescript
export enum WorkStatus {
  CLOCKED_OUT = 'CLOCKED_OUT',
  WORKING = 'WORKING',
  ON_BREAK = 'ON_BREAK'
}
```

**Impact:** Any code that directly compares or sets WorkStatus values as strings needs to use UPPERCASE values.

### 2. Async Operations
All time tracking operations are now asynchronous and return Promises.

**Before:**
```typescript
timeTrackingService.clockIn();
timeTrackingService.clockOut();
timeTrackingService.startBreak();
timeTrackingService.endBreak();
```

**After:**
```typescript
await timeTrackingService.clockIn();
await timeTrackingService.clockOut();
await timeTrackingService.startBreak();
await timeTrackingService.endBreak();
```

**Impact:** All code calling these methods must be updated to handle async operations.

### 3. State Management
The service no longer uses localStorage for persistence. All state is now managed via API calls.

**Before:**
- State saved to localStorage on every change
- State loaded from localStorage on initialization

**After:**
- Active session loaded from API on initialization
- State updated via API calls
- Local signals maintained for reactive UI updates

### 4. Error Handling
The service now provides error and loading states.

**New Signals:**
```typescript
readonly error: Signal<string | null>
readonly isLoading: Signal<boolean>
```

**Usage:**
```typescript
// In components
@if (timeService.error()) {
  <div class="error">{{ timeService.error() }}</div>
}

<button [disabled]="timeService.isLoading()">
  @if (timeService.isLoading()) {
    Loading...
  } @else {
    Clock In
  }
</button>
```

## New Features

### 1. Work Session Model
The new WorkSession interface provides comprehensive session tracking:

```typescript
interface WorkSession {
  id: string;
  userId: string;
  companyId: string;
  date: Date;
  clockIn: Date;
  clockOut: Date | null;
  status: WorkStatus;
  totalHours: number | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  breaks?: Break[];
}
```

### 2. Enhanced Break Tracking
Breaks are now fully integrated with work sessions:

```typescript
interface Break {
  id: string;
  workSessionId: string;
  startTime: Date;
  endTime: Date | null;
  durationMinutes: number | null;
}
```

### 3. Time Reports
New report interfaces for daily, weekly, and monthly summaries:

```typescript
interface DailySummary {
  date: string;
  totalMinutes: number;
  totalHours: number;
  sessions: WorkSession[];
}

interface WeeklySummary {
  weekStart: string;
  weekEnd: string;
  totalMinutes: number;
  totalHours: number;
  dailySummaries: DailySummary[];
}

interface MonthlySummary {
  month: number;
  year: number;
  totalMinutes: number;
  totalHours: number;
  weeklySummaries: WeeklySummary[];
}
```

### 4. API Service
New TimeTrackingApiService provides direct access to all API endpoints:

```typescript
// Clock operations - IMPORTANT: Must provide ISO 8601 timestamps
const now = new Date().toISOString();
await apiService.clockIn({ clockIn: now, notes: 'Starting work' });
await apiService.clockOut(sessionId, { clockOut: now, notes: 'Done for the day' });

// Break operations
await apiService.startBreak(sessionId);
await apiService.endBreak(sessionId);

// Session queries
const activeSession = await apiService.getActiveSession();
const session = await apiService.getSession(sessionId);
const sessions = await apiService.listSessions({ startDate: '2024-01-01' });

// Reports
const dailyReport = await apiService.getDailyReport('2024-01-01');
const weeklyReport = await apiService.getWeeklyReport('2024-01-01');
const monthlyReport = await apiService.getMonthlyReport(2024, 1);
```

## Migration Steps

### For Components

1. **Update method calls to be async:**
   ```typescript
   // Before
   protected onClockIn(): void {
     this.timeService.clockIn();
   }
   
   // After
   protected async onClockIn(): Promise<void> {
     try {
       await this.timeService.clockIn();
     } catch (error) {
       console.error('Clock in failed:', error);
     }
   }
   ```

2. **Add loading state handling:**
   ```html
   <button 
     (click)="onClockIn()"
     [disabled]="timeService.isLoading()"
   >
     @if (timeService.isLoading()) {
       <spinner />
       Starting...
     } @else {
       Start Work Day
     }
   </button>
   ```

3. **Add error display:**
   ```html
   @if (timeService.error()) {
     <div class="error">
       {{ timeService.error() }}
       <button (click)="timeService.clearError()">Dismiss</button>
     </div>
   }
   ```

### For Services

1. **Inject TimeTrackingApiService if direct API access is needed:**
   ```typescript
   private apiService = inject(TimeTrackingApiService);
   ```

2. **Handle async operations:**
   ```typescript
   async loadData(): Promise<void> {
     try {
       const sessions = await this.apiService.listSessions({
         startDate: this.startDate,
         endDate: this.endDate
       });
       this.processData(sessions);
     } catch (error) {
       this.handleError(error);
     }
   }
   ```

### For Tests

1. **Mock TimeTrackingApiService:**
   ```typescript
   const mockApiService = {
     clockIn: jasmine.createSpy('clockIn').and.returnValue(Promise.resolve(mockSession)),
     clockOut: jasmine.createSpy('clockOut').and.returnValue(Promise.resolve(mockSession)),
     // ... other methods
   };
   
   TestBed.configureTestingModule({
     providers: [
       TimeTrackingService,
       { provide: TimeTrackingApiService, useValue: mockApiService }
     ]
   });
   ```

2. **Use async/await in tests:**
   ```typescript
   it('should clock in', async () => {
     await service.clockIn();
     expect(service.isWorking()).toBe(true);
   });
   ```

## API Requirements

The backend API must implement the following endpoints:

### Work Sessions
- `POST /api/v1/work-sessions/clock-in` - Start work session
  - **Request body:** `{ clockIn: string (ISO 8601), notes?: string }`
  - **Response:** WorkSession object
- `PATCH /api/v1/work-sessions/{id}/clock-out` - End work session
  - **Request body:** `{ clockOut: string (ISO 8601), notes?: string }`
  - **Response:** WorkSession object
- `POST /api/v1/work-sessions/{id}/breaks/start` - Start break (returns updated WorkSession)
- `PATCH /api/v1/work-sessions/{id}/breaks/end` - End break (returns updated WorkSession)
- `GET /api/v1/work-sessions/active` - Get current active session
- `GET /api/v1/work-sessions/{id}` - Get specific session
- `GET /api/v1/work-sessions` - List sessions with filters

### Time Reports
- `GET /api/v1/time-reports/daily?date={date}` - Daily summary
- `GET /api/v1/time-reports/weekly?weekStart={date}` - Weekly breakdown
- `GET /api/v1/time-reports/monthly?year={year}&month={month}` - Monthly breakdown

## Backward Compatibility

The system maintains backward compatibility through:

1. **Legacy Interfaces:** TimeEntry and BreakEntry interfaces are kept for internal use
2. **Automatic Conversion:** WorkSession objects from the API are automatically converted to TimeEntry
3. **Signal-based Reactivity:** UI components continue to work with signals, unaware of the underlying changes

## Troubleshooting

### Common Issues

**Issue:** "Cannot connect to the server"
- **Solution:** Ensure the backend API is running on localhost:3001 and the proxy is configured correctly

**Issue:** WorkStatus comparison not working
- **Solution:** Update status comparisons to use UPPERCASE values (e.g., `WorkStatus.CLOCKED_OUT` instead of checking for `'clocked_out'`)

**Issue:** Tests failing with "localStorage is not defined"
- **Solution:** These are SSR-related errors from other services, not related to time tracking changes

**Issue:** Methods not awaitable
- **Solution:** Ensure you're using `async/await` syntax when calling time tracking methods

## Performance Considerations

1. **API Calls:** Break operations now make a single API call (optimized from previous implementation that made two calls)
2. **Loading States:** UI provides feedback during API operations
3. **Error Handling:** Failed operations are gracefully handled with user-friendly error messages
4. **Timer Updates:** Local timer continues to update every second for real-time display without API calls

## Security

- All API calls include proper authentication headers (handled by HttpClient interceptors)
- Error messages don't expose sensitive information
- CodeQL security analysis passed with 0 vulnerabilities

## Next Steps

1. **Backend Implementation:** Ensure all API endpoints are implemented according to spec
2. **E2E Testing:** Add end-to-end tests for complete workflows
3. **Reports UI:** Implement UI components for daily/weekly/monthly reports
4. **Test Updates:** Update unit tests to mock the API service
5. **Data Migration:** If needed, create a migration script for existing localStorage data
