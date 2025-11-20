# Vacation Request Feature - User Guide

## Overview

The Vacation Request feature allows employees to request time off, view their vacation balance, and manage their time-off requests through an intuitive interface.

## Features

### 1. Request Time Off
- **Multiple Request Types:**
  - Vacation
  - Personal Day
  - Sick Leave
  - Compensatory Time
  - Other

- **Smart Date Selection:**
  - Future dates only validation
  - End date must be after start date
  - Automatic working days calculation (excludes weekends)
  - Overlap detection with approved requests

- **Additional Details:**
  - Optional comments field (up to 500 characters)
  - Real-time validation feedback
  - Success/error messaging

### 2. View Your Requests
- **Filter Options:**
  - All requests
  - Pending requests
  - Approved requests

- **Request Details:**
  - Request type and status
  - Date range
  - Number of days
  - Comments
  - Review feedback (when available)
  - Timestamps (requested date, review date)

- **Actions:**
  - Cancel pending requests

### 3. Visual Calendar
- **Monthly View:**
  - Navigate between months
  - See approved vacation days highlighted
  - See pending requests marked
  - Current day indicator
  - Weekend highlighting

- **Vacation Balance:**
  - Total vacation days
  - Used days
  - Remaining days

## How to Use

### Accessing the Feature

**For Employees:**
Navigate to `/my-requests` in the application.

**For Administrators:**
Navigate to `/vacations` in the application.

### Submitting a Vacation Request

1. **Select Request Type**
   - Choose from the dropdown: Vacation, Personal Day, Sick Leave, etc.

2. **Select Dates**
   - Choose start date (must be in the future)
   - Choose end date (must be same or after start date)
   - See automatic calculation of working days

3. **Add Comments (Optional)**
   - Provide any additional context or information
   - Maximum 500 characters

4. **Review & Submit**
   - Check for overlap warnings
   - Verify the calculated number of days
   - Click "Submit Request"

5. **Confirmation**
   - Success message appears
   - Request appears in the list with "Pending" status

### Managing Your Requests

**View Requests:**
- Use the filter buttons to see All, Pending, or Approved requests
- Each request shows full details including dates, duration, and status

**Cancel a Request:**
- Locate the pending request in the list
- Click the "Cancel" button
- Confirm the cancellation

**Check Vacation Balance:**
- View the calendar section to see:
  - Total annual vacation days (22 by default)
  - Days already used
  - Days remaining

### Understanding Request Status

- **Pending** (Yellow): Waiting for manager approval
- **Approved** (Green): Request has been approved
- **Rejected** (Red): Request was not approved
- **Cancelled** (Gray): Request was cancelled by employee

## Technical Details

### Approval Workflow & Permissions

**Admin Approval Process:**
- Administrators access the `/vacations` view to see vacation requests submitted by employees.
- Each request displays full details (employee name, type, dates, comments, etc.).
- Admins can approve or reject requests using action buttons next to each request.
- Upon approval or rejection, the request status is updated and the employee is notified.

**Admin vs Employee Views:**
- **Employee View (`/my-requests`):** Employees see only their own requests, with options to submit new requests and cancel pending ones.
- **Admin View (`/vacations`):** Admins see all requests submitted by employees. Depending on configuration, admins may see all company requests or only those from their team/department.
- Admins have additional controls to filter requests by status, employee, or team.

**Visibility Scope:**
- By default, admins see all employee requests. In production, this can be restricted so admins only see requests from their assigned teams.

### Data Storage
Currently uses browser localStorage for demonstration. In production, this would be replaced with an API backend.

### Working Days Calculation
- Automatically excludes weekends (Saturday and Sunday)
- Only counts Monday through Friday
- Example: Requesting Monday to Friday = 5 working days

### Overlap Detection
- System checks for overlaps with approved vacation requests
- Warning displayed if dates overlap
- Does not prevent submission (manager can review)

### Validation Rules

**Date Validation:**
- Start date must be today or in the future
- End date must be same as or after start date
- Both dates are required

**Comments Validation:**
- Maximum 500 characters
- Optional field

## Accessibility Features

- **Keyboard Navigation:** All interactive elements are keyboard accessible
- **Screen Reader Support:** All elements have appropriate ARIA labels
- **Visual Feedback:** Clear color coding and status indicators
- **Focus Management:** Proper focus handling for form inputs

## Browser Compatibility

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Mobile Support

The interface is fully responsive and works on:
- Mobile phones (320px+)
- Tablets (768px+)
- Desktop (1024px+)

## FAQ

**Q: Can I edit a submitted request?**
A: No, but you can cancel a pending request and submit a new one.

**Q: How many vacation days do I have?**
A: Check the calendar section which shows your total, used, and remaining days.

**Q: What happens if I request dates that overlap?**
A: The system will show a warning, but you can still submit. Your manager will review it.

**Q: Can I request non-consecutive days?**
A: Currently, each request covers a continuous date range. For non-consecutive days, submit multiple requests.

**Q: How long does approval take?**
A: Approval timing depends on your manager. The request will show as "Pending" until reviewed.

## Support

For technical issues or questions, please contact your system administrator.

---

**Version:** 1.0  
**Last Updated:** November 2025  
**Author:** Chronos Development Team
