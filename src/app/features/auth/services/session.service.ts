import { Injectable, signal, effect, inject, DestroyRef } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from '../../../../environments/environment';

/**
 * Service to manage user session timeout and idle detection
 */
@Injectable({
  providedIn: 'root',
})
export class SessionService {
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  private lastActivityTime = signal<number>(Date.now());
  private sessionStartTime = signal<number | null>(null);
  private isWarningShown = signal<boolean>(false);

  private idleCheckInterval?: ReturnType<typeof setInterval>;
  private sessionCheckInterval?: ReturnType<typeof setInterval>;

  readonly sessionWarning = signal<string | null>(null);
  readonly isSessionActive = signal<boolean>(false);

  constructor() {
    // Set up cleanup when service is destroyed
    this.destroyRef.onDestroy(() => {
      this.stopMonitoring();
    });

    // Monitor activity in browser only
    if (typeof window !== 'undefined') {
      this.setupActivityListeners();
    }
  }

  /**
   * Start monitoring session and idle timeouts
   */
  startMonitoring(): void {
    if (typeof window === 'undefined') return;

    this.sessionStartTime.set(Date.now());
    this.lastActivityTime.set(Date.now());
    this.isSessionActive.set(true);
    this.isWarningShown.set(false);
    this.sessionWarning.set(null);

    // Check for idle timeout every 30 seconds
    this.idleCheckInterval = setInterval(() => {
      this.checkIdleTimeout();
    }, 30000);

    // Check for session timeout every minute
    this.sessionCheckInterval = setInterval(() => {
      this.checkSessionTimeout();
    }, 60000);
  }

  /**
   * Stop monitoring timeouts
   */
  stopMonitoring(): void {
    if (this.idleCheckInterval) {
      clearInterval(this.idleCheckInterval);
      this.idleCheckInterval = undefined;
    }
    if (this.sessionCheckInterval) {
      clearInterval(this.sessionCheckInterval);
      this.sessionCheckInterval = undefined;
    }

    this.isSessionActive.set(false);
    this.sessionStartTime.set(null);
    this.sessionWarning.set(null);
    this.isWarningShown.set(false);
  }

  /**
   * Update activity timestamp
   */
  recordActivity(): void {
    this.lastActivityTime.set(Date.now());
    
    // Clear warning if user becomes active again
    if (this.isWarningShown()) {
      this.isWarningShown.set(false);
      this.sessionWarning.set(null);
    }
  }

  /**
   * Check if user has been idle too long
   */
  private checkIdleTimeout(): void {
    const now = Date.now();
    const timeSinceActivity = now - this.lastActivityTime();
    const warningThreshold = environment.idleTimeout - 60000; // Warn 1 minute before

    if (timeSinceActivity >= environment.idleTimeout) {
      this.handleTimeout('idle');
    } else if (timeSinceActivity >= warningThreshold && !this.isWarningShown()) {
      this.showWarning('idle');
    }
  }

  /**
   * Check if session has lasted too long
   */
  private checkSessionTimeout(): void {
    const startTime = this.sessionStartTime();
    if (!startTime) return;

    const now = Date.now();
    const sessionDuration = now - startTime;
    const warningThreshold = environment.sessionTimeout - 120000; // Warn 2 minutes before

    if (sessionDuration >= environment.sessionTimeout) {
      this.handleTimeout('session');
    } else if (sessionDuration >= warningThreshold && !this.isWarningShown()) {
      this.showWarning('session');
    }
  }

  /**
   * Show warning to user
   */
  private showWarning(type: 'idle' | 'session'): void {
    this.isWarningShown.set(true);
    
    if (type === 'idle') {
      this.sessionWarning.set(
        'Tu sesión expirará pronto por inactividad. Haz clic en cualquier lugar para continuar.'
      );
    } else {
      this.sessionWarning.set(
        'Tu sesión expirará pronto. Por favor, guarda tu trabajo.'
      );
    }
  }

  /**
   * Handle session timeout
   */
  private handleTimeout(type: 'idle' | 'session'): void {
    this.stopMonitoring();
    // Emit event that can be caught by AuthService
    window.dispatchEvent(
      new CustomEvent('session-timeout', {
        detail: { type },
      })
    );
  }

  /**
   * Set up event listeners for user activity
   */
  private setupActivityListeners(): void {
    const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart'];

    activityEvents.forEach((event) => {
      window.addEventListener(event, () => this.recordActivity(), {
        passive: true,
      });
    });
  }

  /**
   * Clear session warning
   */
  clearWarning(): void {
    this.sessionWarning.set(null);
    this.isWarningShown.set(false);
  }

  /**
   * Extend session
   */
  extendSession(): void {
    this.recordActivity();
    this.clearWarning();
  }
}
