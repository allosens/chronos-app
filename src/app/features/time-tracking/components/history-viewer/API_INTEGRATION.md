# Timesheet History API Integration Guide

## Overview

The timesheet history component is ready to integrate with backend API endpoints. Currently, it uses mock data for demonstration purposes, but can be switched to use real API calls once the backend is available.

## Current Status

- ✅ Mock data implementation (default)
- ✅ API service methods ready
- ✅ Data conversion utilities implemented
- ⏳ Backend API endpoint pending

## Switching to API Mode

### Option 1: Application-wide (Recommended)

In your app initialization (e.g., `app.config.ts` or main component):

```typescript
import { TimesheetHistoryService } from './features/time-tracking/services/timesheet-history.service';

// In your initialization code
const historyService = inject(TimesheetHistoryService);
historyService.setUseMockData(false); // Enable API mode
```

### Option 2: Environment-based

Modify `timesheet-history.service.ts`:

```typescript
import { environment } from '../../../../environments/environment';

// In the service class
private useMockData = environment.production ? false : true;
```

Then in `environment.prod.ts`:
```typescript
export const environment = {
  production: true,
  // ... other config
};
```

### Option 3: Feature Flag

Add a feature flag to environment config:

```typescript
// environment.ts
export const environment = {
  features: {
    useRealTimesheetApi: false
  }
};

// timesheet-history.service.ts
private useMockData = !environment.features.useRealTimesheetApi;
```

## Backend API Requirements

### Endpoint

```
GET /api/v1/work-sessions
```

**Note:** The timesheet history uses the existing work sessions endpoint with query parameters for filtering. There is no separate `/history` endpoint.

### Query Parameters (Backend Supported)

The backend API accepts the following query parameters based on `FilterWorkSessionsDto`:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `userId` | string (UUID) | No | Filter by user ID |
| `startDate` | string (ISO 8601) | No | Filter by start date (YYYY-MM-DD) |
| `endDate` | string (ISO 8601) | No | Filter by end date (YYYY-MM-DD) |
| `status` | enum | No | Filter by status (CLOCKED_OUT, WORKING, ON_BREAK) |
| `limit` | number | No | Items per page (default: 20, max: 100) |
| `offset` | number | No | Offset for pagination (default: 0) |

### Server-Side Features

**Supported by Backend:**
- **Date range filtering** (startDate, endDate)
- **Status filtering** (CLOCKED_OUT, WORKING, ON_BREAK)
- **Pagination** (limit max: 100, offset-based)

**Pagination Strategy:**
- Uses lazy loading with server-side pagination
- Fetches one page at a time (default: 20 records, max: 100)
- Page changes trigger new API requests
- Efficient for large datasets

### Client-Side Features (Current Page Only)

The following filters are **NOT** supported by the backend API and are applied client-side to the current page results:

- **Duration filters** (< 4hrs, 4-8hrs, > 8hrs, custom range)
- **Break time filters** (min/max break minutes)
- **Notes search** (search in session notes)
- **Sorting** (by date, clockIn, clockOut, totalHours)

**Important Limitation:** Advanced filters and sorting only apply to the currently loaded page (up to 100 records). To search across all data, use the backend-supported filters (date range, status) to narrow down results first.

**Implementation Note:** The service implements proper lazy loading with server-side pagination. Backend handles date range, status, and pagination. Advanced filters and sorting are computed client-side on the current page data using Angular signals.

### Response Format

```typescript
{
  "sessions": [
    {
      "id": "string",
      "userId": "string",
      "companyId": "string",
      "date": "2024-01-15T00:00:00.000Z",
      "clockIn": "2024-01-15T08:00:00.000Z",
      "clockOut": "2024-01-15T17:00:00.000Z",
      "status": "CLOCKED_OUT",
      "totalHours": "8.5",
      "notes": "Worked on project tasks",
      "breaks": [
        {
          "id": "string",
          "workSessionId": "string",
          "startTime": "2024-01-15T12:00:00.000Z",
          "endTime": "2024-01-15T12:30:00.000Z",
          "durationMinutes": 30
        }
      ]
    }
  ],
  "total": 45,
  "limit": 10,
  "offset": 0
}
```

## Data Mapping

The service automatically handles conversion between API and UI formats:

### Status Mapping

| UI Status | API Status |
|-----------|------------|
| COMPLETE | CLOCKED_OUT |
| IN_PROGRESS | WORKING or ON_BREAK |
| INCOMPLETE | INCOMPLETE |
| ERROR | ERROR |

### Date Handling

- API returns ISO 8601 strings
- Service converts to JavaScript Date objects
- Dates are normalized to YYYY-MM-DD format for display

### Numeric Fields

- API returns totalHours as string (e.g., "8.50")
- Service converts to number using `parseFloat()`
- Break durations are calculated from break records

## Testing the Integration

### 1. Verify API Service

```typescript
import { TestBed } from '@angular/core/testing';
import { TimeTrackingApiService } from './time-tracking-api.service';

it('should fetch timesheet history', async () => {
  const apiService = TestBed.inject(TimeTrackingApiService);
  const result = await apiService.getTimesheetHistory({
    startDate: '2024-01-01',
    endDate: '2024-01-31'
  });
  expect(result.sessions).toBeDefined();
});
```

### 2. Test Data Conversion

```typescript
import { TimesheetHistoryService } from './timesheet-history.service';

it('should convert API response to timesheet entries', async () => {
  const service = TestBed.inject(TimesheetHistoryService);
  service.setUseMockData(false);
  
  await service.loadFromApi();
  
  const entries = service.entries();
  expect(entries.length).toBeGreaterThan(0);
  expect(entries[0].clockIn).toBeInstanceOf(Date);
});
```

### 3. End-to-End Testing

```typescript
// In your component test
it('should display API data when mock is disabled', async () => {
  const service = TestBed.inject(TimesheetHistoryService);
  service.setUseMockData(false);
  
  fixture.detectChanges();
  await fixture.whenStable();
  
  const table = fixture.nativeElement.querySelector('table');
  expect(table).toBeTruthy();
});
```

## Error Handling

The service includes comprehensive error handling:

- Network errors display user-friendly messages
- Loading states show skeleton loaders
- Failed requests can be retried via UI
- Errors are logged to console for debugging

## Performance Considerations

- Debounced search: 300ms delay on notes search (client-side)
- Server-side filtering: Date range and status filters applied on backend
- Server-side pagination: Only requested page loaded (max 100 records per page)
- Client-side sorting: Sorting applied in the frontend on current page data
- Client-side advanced filters: Duration, break time, and notes filters applied in the frontend on current page data

## Migration Checklist

When backend API is ready:

- [ ] Verify backend endpoint matches expected contract
- [ ] Test all filter combinations with real data
- [ ] Verify pagination works correctly
- [ ] Test sorting on all columns
- [ ] Validate date conversions
- [ ] Test error scenarios
- [ ] Update environment configuration
- [ ] Set `useMockData = false` in service
- [ ] Run E2E tests
- [ ] Update documentation

## Support

For questions or issues with API integration, refer to:
- Backend API docs: [chronos-api issue #25](https://github.com/allosens/chronos-api/issues/25)
- Frontend implementation: `timesheet-history.service.ts`
- API service: `time-tracking-api.service.ts`
