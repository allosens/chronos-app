import { Injectable } from '@angular/core';

/**
 * Interface for stored auth tokens
 */
export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number; // Unix timestamp in milliseconds
}

/**
 * Service to manage authentication tokens (JWT)
 * Handles storage, retrieval, and validation of tokens
 */
@Injectable({
  providedIn: 'root'
})
export class TokenService {
  private readonly ACCESS_TOKEN_KEY = 'auth_access_token';
  private readonly REFRESH_TOKEN_KEY = 'auth_refresh_token';
  private readonly EXPIRES_AT_KEY = 'auth_expires_at';

  /**
   * Store authentication tokens in localStorage
   * 
   * ⚠️ SECURITY WARNING: localStorage is vulnerable to XSS attacks.
   * For production, consider using httpOnly cookies or a more secure storage mechanism.
   * This implementation is suitable for development/testing only.
   */
  setTokens(tokens: AuthTokens): void {
    if (typeof window === 'undefined') return;

    localStorage.setItem(this.ACCESS_TOKEN_KEY, tokens.accessToken);
    localStorage.setItem(this.EXPIRES_AT_KEY, tokens.expiresAt.toString());
    
    if (tokens.refreshToken) {
      localStorage.setItem(this.REFRESH_TOKEN_KEY, tokens.refreshToken);
    } else {
      // Clear refresh token if not provided
      localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    }
  }

  /**
   * Get the access token from storage
   */
  getAccessToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(this.ACCESS_TOKEN_KEY);
  }

  /**
   * Get the refresh token from storage
   */
  getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  /**
   * Get all stored tokens
   */
  getTokens(): AuthTokens | null {
    if (typeof window === 'undefined') return null;

    const accessToken = this.getAccessToken();
    const refreshToken = this.getRefreshToken();
    const expiresAtStr = localStorage.getItem(this.EXPIRES_AT_KEY);

    if (!accessToken || !expiresAtStr) {
      return null;
    }

    const expiresAt = parseInt(expiresAtStr, 10);
    if (isNaN(expiresAt)) {
      return null;
    }

    return {
      accessToken,
      refreshToken: refreshToken || undefined,
      expiresAt
    };
  }

  /**
   * Check if the current token is expired.
   * Uses a 5-minute buffer to consider tokens as expired before their actual expiration time.
   * This allows for early expiration detection and token refresh before the token actually expires.
   */
  isTokenExpired(): boolean {
    const tokens = this.getTokens();
    if (!tokens) return true;

    const now = Date.now();
    // Treat token as expired 5 minutes before actual expiration to allow for early refresh
    const bufferMs = 5 * 60 * 1000;
    return now >= (tokens.expiresAt - bufferMs);
  }

  /**
   * Check if a valid token exists (not expired)
   */
  hasValidToken(): boolean {
    return this.getAccessToken() !== null && !this.isTokenExpired();
  }

  /**
   * Clear all stored tokens
   */
  clearTokens(): void {
    if (typeof window === 'undefined') return;

    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.EXPIRES_AT_KEY);
  }

  /**
   * Get time remaining until token expiration (in milliseconds)
   * Returns 0 if token is expired or doesn't exist
   */
  getTimeUntilExpiration(): number {
    const tokens = this.getTokens();
    if (!tokens) return 0;

    const now = Date.now();
    const timeRemaining = tokens.expiresAt - now;
    return Math.max(0, timeRemaining);
  }
}
