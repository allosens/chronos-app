import { Injectable, inject, DestroyRef, signal } from '@angular/core';
import { TokenService } from './token.service';
import { environment } from '../../../environments/environment';

/**
 * Service to handle automatic token refresh
 * Monitors token expiration and refreshes proactively
 */
@Injectable({
  providedIn: 'root',
})
export class TokenRefreshService {
  private readonly tokenService = inject(TokenService);
  private readonly destroyRef = inject(DestroyRef);

  private refreshTimer?: ReturnType<typeof setTimeout>;
  private onRefreshCallback?: () => Promise<void>;

  readonly isAutoRefreshEnabled = signal<boolean>(false);

  constructor() {
    this.destroyRef.onDestroy(() => {
      this.stopAutoRefresh();
    });
  }

  /**
   * Start automatic token refresh monitoring
   * @param refreshCallback - Function to call when token needs refresh
   */
  startAutoRefresh(refreshCallback: () => Promise<void>): void {
    this.onRefreshCallback = refreshCallback;
    this.isAutoRefreshEnabled.set(true);
    this.scheduleNextRefresh();
  }

  /**
   * Stop automatic token refresh
   */
  stopAutoRefresh(): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = undefined;
    }
    this.isAutoRefreshEnabled.set(false);
    this.onRefreshCallback = undefined;
  }

  /**
   * Schedule the next token refresh check
   */
  private scheduleNextRefresh(): void {
    if (!this.isAutoRefreshEnabled()) return;

    // Clear any existing timer
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
    }

    const timeUntilExpiry = this.tokenService.getTimeUntilExpiration();
    
    if (timeUntilExpiry <= 0) {
      // Token already expired, refresh immediately
      this.performRefresh();
      return;
    }

    // Calculate when to refresh (before expiration threshold)
    const refreshThreshold = environment.tokenRefreshThreshold;
    const timeUntilRefresh = Math.max(0, timeUntilExpiry - refreshThreshold);

    // Schedule refresh
    this.refreshTimer = setTimeout(() => {
      this.performRefresh();
    }, timeUntilRefresh);
  }

  /**
   * Perform token refresh
   */
  private async performRefresh(): Promise<void> {
    if (!this.onRefreshCallback || !this.isAutoRefreshEnabled()) return;

    try {
      await this.onRefreshCallback();
      // Schedule next refresh after successful refresh
      this.scheduleNextRefresh();
    } catch (error) {
      console.error('Auto token refresh failed:', error);
      // Don't schedule next refresh on failure
      this.stopAutoRefresh();
    }
  }

  /**
   * Force immediate refresh check
   */
  async checkAndRefresh(): Promise<void> {
    if (this.tokenService.needsRefresh() && this.onRefreshCallback) {
      await this.performRefresh();
    }
  }
}
