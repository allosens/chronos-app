import { TimesheetStatus } from '../models/timesheet-history.model';

/**
 * Utility functions for timesheet operations
 */
export class TimesheetUtils {
  /**
   * Formats a timesheet status enum value to a user-friendly label
   */
  static formatStatus(status: TimesheetStatus | string): string {
    switch (status) {
      case TimesheetStatus.COMPLETE:
        return 'Complete';
      case TimesheetStatus.INCOMPLETE:
        return 'Incomplete';
      case TimesheetStatus.IN_PROGRESS:
        return 'In Progress';
      case TimesheetStatus.ERROR:
        return 'Error';
      default:
        return status;
    }
  }
}
