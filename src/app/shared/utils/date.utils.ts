/**
 * Utility class for date and time formatting operations
 * Centralized date/time utilities to avoid code duplication
 */
export class DateUtils {
  
  /**
   * Formats time duration in seconds to HH:MM:SS or MM:SS format
   * @param seconds Total seconds
   * @param forceHours Whether to always show hours (even if 0)
   * @returns Formatted time string
   */
  static formatDuration(seconds: number, forceHours = false): string {
    // Ensure we work with integers only
    const totalSeconds = Math.floor(seconds);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;

    if (hours > 0 || forceHours) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * Formats time duration in minutes to hours and minutes display
   * @param minutes Total minutes
   * @returns Formatted time string like "2h 30m" or "45m"
   */
  static formatMinutesToHoursAndMinutes(minutes: number): string {
    const totalMinutes = Math.floor(minutes); // Ensure integer minutes
    
    if (totalMinutes < 60) {
      return `${totalMinutes}m`;
    }
    
    const hours = Math.floor(totalMinutes / 60);
    const remainingMinutes = totalMinutes % 60;
    
    if (remainingMinutes === 0) {
      return `${hours}h`;
    }
    
    return `${hours}h ${remainingMinutes}m`;
  }

  /**
   * Formats a Date object to time string (HH:MM format)
   * @param date Date object
   * @returns Time string in HH:MM format
   */
  static formatTime(date: Date): string {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  }

  /**
   * Formats a Date object to time string with AM/PM
   * @param date Date object
   * @returns Time string in h:MM AM/PM format
   */
  static formatTime12Hour(date: Date): string {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  }

  /**
   * Formats a Date object to date string
   * @param date Date object
   * @param format Format type: 'short' | 'medium' | 'long' | 'full'
   * @returns Formatted date string
   */
  static formatDate(date: Date, format: 'short' | 'medium' | 'long' | 'full' = 'medium'): string {
    return date.toLocaleDateString('en-US', {
      year: format === 'short' ? '2-digit' : 'numeric',
      month: format === 'short' ? 'numeric' : format === 'medium' ? 'short' : 'long',
      day: 'numeric'
    });
  }

  /**
   * Gets today's date in YYYY-MM-DD format
   * @returns Today's date string
   */
  static getTodayString(): string {
    return new Date().toISOString().split('T')[0];
  }

  /**
   * Checks if a date string is today
   * @param dateString Date string in YYYY-MM-DD format
   * @returns True if the date is today
   */
  static isToday(dateString: string): boolean {
    return dateString === this.getTodayString();
  }

  /**
   * Formats relative time (e.g., "2 hours ago", "in 30 minutes")
   * @param date Date to compare
   * @param baseDate Optional base date to compare against (defaults to now)
   * @returns Relative time string
   */
  static getRelativeTime(date: Date, baseDate: Date = new Date()): string {
    const diffMs = baseDate.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (Math.abs(diffMinutes) < 1) {
      return 'just now';
    }
    
    if (Math.abs(diffMinutes) < 60) {
      return diffMinutes > 0 ? `${diffMinutes} minutes ago` : `in ${Math.abs(diffMinutes)} minutes`;
    }
    
    if (Math.abs(diffHours) < 24) {
      return diffHours > 0 ? `${diffHours} hours ago` : `in ${Math.abs(diffHours)} hours`;
    }
    
    return diffDays > 0 ? `${diffDays} days ago` : `in ${Math.abs(diffDays)} days`;
  }

  /**
   * Calculates the duration between two dates in milliseconds
   * @param startDate Start date
   * @param endDate End date (defaults to now)
   * @returns Duration in milliseconds
   */
  static getDurationMs(startDate: Date, endDate: Date = new Date()): number {
    return endDate.getTime() - startDate.getTime();
  }

  /**
   * Calculates the duration between two dates in minutes
   * @param startDate Start date
   * @param endDate End date (defaults to now)
   * @returns Duration in minutes
   */
  static getDurationMinutes(startDate: Date, endDate: Date = new Date()): number {
    return Math.floor(this.getDurationMs(startDate, endDate) / (1000 * 60));
  }

  /**
   * Calculates the duration between two dates in seconds
   * @param startDate Start date
   * @param endDate End date (defaults to now)
   * @returns Duration in seconds
   */
  static getDurationSeconds(startDate: Date, endDate: Date = new Date()): number {
    return Math.floor(this.getDurationMs(startDate, endDate) / 1000);
  }

  /**
   * Validates if a time string is in valid HH:MM format
   * @param timeString Time string to validate
   * @returns True if valid
   */
  static isValidTimeFormat(timeString: string): boolean {
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(timeString);
  }

  /**
   * Creates a Date object for today at a specific time
   * @param timeString Time in HH:MM format
   * @returns Date object for today at the specified time
   */
  static createTodayAtTime(timeString: string): Date | null {
    if (!this.isValidTimeFormat(timeString)) {
      return null;
    }

    const [hours, minutes] = timeString.split(':').map(Number);
    const today = new Date();
    today.setHours(hours, minutes, 0, 0);
    return today;
  }

  /**
   * Gets the start of day (00:00:00) for a given date
   * @param date Date object (defaults to today)
   * @returns Date object at start of day
   */
  static getStartOfDay(date: Date = new Date()): Date {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    return startOfDay;
  }

  /**
   * Gets the end of day (23:59:59.999) for a given date
   * @param date Date object (defaults to today)
   * @returns Date object at end of day
   */
  static getEndOfDay(date: Date = new Date()): Date {
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    return endOfDay;
  }

  /**
   * Gets the start of the week (Monday) for a given date
   * @param date Date object (defaults to today)
   * @returns Date object at start of week (Monday)
   */
  static getWeekStart(date: Date = new Date()): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    return d;
  }

  /**
   * Gets the end of the week (Sunday) for a given date
   * @param date Date object (defaults to today)
   * @returns Date object at end of week (Sunday)
   */
  static getWeekEnd(date: Date = new Date()): Date {
    const start = DateUtils.getWeekStart(date);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return end;
  }

  /**
   * Gets the number of working days in a month (excluding weekends)
   * @param month Month (1-12)
   * @param year Year
   * @returns Number of working days
   */
  static getWorkingDays(month: number, year: number): number {
    const date = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0).getDate();
    let workingDays = 0;

    for (let day = 1; day <= lastDay; day++) {
      date.setDate(day);
      const dayOfWeek = date.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        workingDays++;
      }
    }

    return workingDays;
  }
}