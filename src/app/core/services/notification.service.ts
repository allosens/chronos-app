import { Injectable, signal } from '@angular/core';

export interface Notification {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private notificationsSignal = signal<Notification[]>([]);
  readonly notifications = this.notificationsSignal.asReadonly();

  private readonly DEFAULT_DURATION = 3000;

  /**
   * Show a success notification
   */
  success(message: string, duration = this.DEFAULT_DURATION): void {
    this.showNotification(message, 'success', duration);
  }

  /**
   * Show an error notification
   */
  error(message: string, duration = this.DEFAULT_DURATION): void {
    this.showNotification(message, 'error', duration);
  }

  /**
   * Show an info notification
   */
  info(message: string, duration = this.DEFAULT_DURATION): void {
    this.showNotification(message, 'info', duration);
  }

  /**
   * Show a warning notification
   */
  warning(message: string, duration = this.DEFAULT_DURATION): void {
    this.showNotification(message, 'warning', duration);
  }

  /**
   * Remove a notification by ID
   */
  remove(id: string): void {
    const current = this.notificationsSignal();
    this.notificationsSignal.set(current.filter(n => n.id !== id));
  }

  /**
   * Clear all notifications
   */
  clearAll(): void {
    this.notificationsSignal.set([]);
  }

  private showNotification(message: string, type: Notification['type'], duration: number): void {
    const notification: Notification = {
      id: this.generateId(),
      message,
      type,
      duration
    };

    const current = this.notificationsSignal();
    this.notificationsSignal.set([...current, notification]);

    // Auto-remove after duration
    if (duration > 0) {
      setTimeout(() => {
        this.remove(notification.id);
      }, duration);
    }
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }
}
