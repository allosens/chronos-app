# Session Persistence Fix - Testing Guide

## Overview
This document explains how to manually test the session persistence fix for issue US-ELE-18.

## What Was Fixed

### Problem
- Users were being redirected to login on every page refresh
- Session was not persisting between page reloads
- No JWT token management or validation
- **SSR Issue**: Auth guard was running on the server during SSR, causing redirects

### Solution
1. **Created TokenService** - Manages JWT tokens in localStorage with expiration tracking
2. **Updated AuthService** - Now generates, stores, and validates JWT tokens on login
3. **Added HTTP Interceptor** - Automatically attaches Bearer token to API requests
4. **Enhanced Session Validation** - Checks both user data AND token expiration on app initialization
5. **Fixed SSR Compatibility** - Auth guard now skips authentication checks during server-side rendering

## SSR (Server-Side Rendering) Fix

The application uses Angular SSR. The auth guard was running on the server side where `localStorage` is not available, causing all users to be redirected to login during SSR.

**Solution**: The auth guard now detects the platform and:
- **During SSR (server)**: Always allows access to prevent redirect loops
- **On client (browser)**: Performs normal authentication checks after hydration

This ensures:
- No SSR redirect loops
- Proper authentication on the client side
- Session persistence works correctly after page refresh

## Manual Testing Steps

### Test 1: Session Persists on Page Refresh
1. Start the development server: `npm start`
2. Navigate to `http://localhost:4200`
3. Login with any of these test accounts:
   - Employee: `employee@chronos.com` / any password
   - Company Admin: `company@chronos.com` / any password
   - Super Admin: `admin@chronos.com` / any password
4. After successful login, you should be redirected to the appropriate page
5. **Refresh the page (F5 or Ctrl+R)**
6. ✅ **Expected**: You should remain logged in and see the same page
7. ❌ **Before fix**: You would be redirected to login page

### Test 2: Session Expires After Token Expiration
1. Login with any test account
2. Open browser DevTools (F12) → Application/Storage → Local Storage
3. Find the `auth_expires_at` key
4. Change its value to a past timestamp (e.g., `1000000`)
5. Refresh the page
6. ✅ **Expected**: You should be redirected to login (session expired)

### Test 3: Session Clears on Logout
1. Login with any test account
2. Open browser DevTools → Application → Local Storage
3. Verify these keys exist:
   - `auth_user`
   - `auth_access_token`
   - `auth_expires_at`
4. Click logout
5. ✅ **Expected**: All auth-related localStorage keys should be cleared
6. ✅ **Expected**: You should be redirected to login page

### Test 4: Token Attached to HTTP Requests
1. Login with any test account
2. Open browser DevTools → Network tab
3. Make any API request (e.g., navigate to a page that loads data)
4. Check the request headers
5. ✅ **Expected**: You should see an `Authorization: Bearer <token>` header

## Technical Details

### Token Storage
Tokens are stored in localStorage with the following keys:
- `auth_access_token` - The JWT access token
- `auth_refresh_token` - The refresh token (optional)
- `auth_expires_at` - Unix timestamp (ms) when token expires
- `auth_user` - User profile information

### Token Expiration
- Tokens are set to expire in 24 hours (mock implementation)
- A 5-minute buffer is used for token refresh (token considered expired 5 mins before actual expiration)
- On app initialization, expired sessions are automatically cleared

### Security Considerations
- In production, tokens should come from the backend API
- The mock token generation should be replaced with real API calls
- Implement proper token refresh mechanism before deployment
- Consider using httpOnly cookies for enhanced security

## Automated Tests
All session persistence scenarios are covered by automated tests:
- Session restoration with valid tokens
- Session invalidation with expired tokens
- Session clearing on logout
- Multiple refresh scenarios
- Token storage on login
- HTTP interceptor token attachment

Run tests with: `npm test`
