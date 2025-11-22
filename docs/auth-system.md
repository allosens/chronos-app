# JWT Authentication System

This document describes the JWT authentication and authorization system implemented for the Chronos application.

## Overview

The authentication system provides:
- Real API integration with backend endpoints
- Automatic token refresh before expiration
- Session timeout with user warnings
- Idle timeout detection
- Multi-tenant company context
- Enhanced error handling with user-friendly messages
- SSR-compatible implementation

## Architecture

### Core Services

#### AuthService
Location: `src/app/features/auth/services/auth.service.ts`

Main authentication service that handles:
- User login/logout
- Token refresh
- Session state management
- HTTP API communication

**Key Methods:**
- `login(credentials)` - Authenticate user with email/password
- `logout()` - Sign out user and clear session
- `refreshToken()` - Refresh access token using refresh token
- `isAuthenticated()` - Check if user is logged in
- `currentUser()` - Get current user information

#### TokenService
Location: `src/app/core/services/token.service.ts`

Manages JWT token storage and validation:
- Stores access and refresh tokens in localStorage
- Validates token expiration
- Checks if token needs refresh
- Provides time until expiration

**Security Note:** Uses localStorage for demo purposes. Consider httpOnly cookies for production.

#### TokenRefreshService
Location: `src/app/core/services/token-refresh.service.ts`

Handles automatic token refresh:
- Monitors token expiration
- Schedules refresh before tokens expire
- Prevents duplicate refresh requests
- Configurable refresh threshold (default: 5 minutes)

#### SessionService
Location: `src/app/features/auth/services/session.service.ts`

Manages user session:
- Tracks user activity
- Detects idle timeout (default: 15 minutes)
- Monitors session duration (default: 30 minutes)
- Shows warnings before timeout

### HTTP Interceptor

#### AuthInterceptor
Location: `src/app/core/interceptors/auth.interceptor.ts`

Intercepts HTTP requests to:
- Add Authorization header with Bearer token
- Add X-Company-Id header for multi-tenant support
- Log authentication errors

### Guards

#### authGuard
Location: `src/app/features/auth/guards/auth.guard.ts`

Protects routes requiring authentication:
- Redirects to login if not authenticated
- Preserves attempted URL for post-login redirect
- SSR-compatible

#### Role Guards
Location: `src/app/features/auth/guards/role.guard.ts`

Role-based access control:
- `adminGuard` - Allows COMPANY_ADMIN and SUPER_ADMIN
- `superAdminGuard` - Allows only SUPER_ADMIN
- `createRoleGuard(roles)` - Factory for custom role guards

## Environment Configuration

Configure in `src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api',
  supabaseUrl: '',
  supabaseAnonKey: '',
  tokenRefreshThreshold: 5 * 60 * 1000,  // 5 minutes
  sessionTimeout: 30 * 60 * 1000,         // 30 minutes
  idleTimeout: 15 * 60 * 1000,            // 15 minutes
};
```

## API Endpoints

The system expects these backend endpoints:

### POST /api/auth/login
**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "User Name",
    "role": "super_admin|company_admin|employee",
    "companyId": "uuid" // Optional for super_admin
  },
  "accessToken": "jwt-access-token",
  "refreshToken": "jwt-refresh-token",
  "expiresIn": 3600 // seconds
}
```

### POST /api/auth/refresh
**Request:**
```json
{
  "refreshToken": "jwt-refresh-token"
}
```

**Response:**
```json
{
  "accessToken": "new-jwt-access-token",
  "refreshToken": "new-jwt-refresh-token",
  "expiresIn": 3600
}
```

### POST /api/auth/logout
**Request:**
```json
{
  "refreshToken": "jwt-refresh-token"
}
```

**Response:** 200 OK

## Multi-Tenant Support

The system automatically adds company context to API requests:

1. **User Model** includes `companyId` field
2. **HTTP Interceptor** adds `X-Company-Id` header to all authenticated requests
3. **Backend** uses this header to filter data by company

## Session Management

### Auto Token Refresh
- Tokens are automatically refreshed 5 minutes before expiration
- Refresh happens in the background
- Failed refresh triggers logout

### Session Timeout
- Maximum session duration: 30 minutes (configurable)
- Warning shown 2 minutes before timeout
- User can extend session by activity

### Idle Timeout
- User inactive for 15 minutes (configurable)
- Warning shown 1 minute before timeout
- Any user action resets idle timer

## Error Handling

User-friendly error messages for:
- **Network errors**: "No se puede conectar al servidor..."
- **401 Unauthorized**: "Credenciales inválidas..."
- **403 Forbidden**: "No tienes permiso..."
- **404 Not Found**: "El recurso solicitado no fue encontrado..."
- **500+ Server errors**: "Error del servidor..."

Errors are logged to console for debugging.

## Usage Examples

### Protecting Routes

```typescript
// In routes configuration
export const routes: Routes = [
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () => import('./dashboard/dashboard')
  },
  {
    path: 'admin',
    canActivate: [adminGuard],
    loadComponent: () => import('./admin/admin')
  }
];
```

### Using Auth State in Components

```typescript
export class MyComponent {
  private authService = inject(AuthService);

  isAuthenticated = this.authService.isAuthenticated;
  currentUser = this.authService.currentUser;
  isLoading = this.authService.isLoading;
  error = this.authService.error;

  async login() {
    try {
      await this.authService.login({
        email: 'user@example.com',
        password: 'password'
      });
    } catch (error) {
      // Error handled by service
    }
  }

  logout() {
    this.authService.logout();
  }
}
```

### Showing Session Warnings

```typescript
export class LayoutComponent {
  private sessionService = inject(SessionService);

  sessionWarning = this.sessionService.sessionWarning;

  extendSession() {
    this.sessionService.extendSession();
  }
}
```

## Testing

All services include comprehensive unit tests:
- `auth.service.spec.ts` - Authentication flows
- `token.service.spec.ts` - Token management
- `token-refresh.service.spec.ts` - Auto-refresh logic
- `session.service.spec.ts` - Session monitoring
- `auth.interceptor.spec.ts` - HTTP interception

Run tests with:
```bash
npm test
```

## SSR Compatibility

All services check for browser environment:
```typescript
if (typeof window !== 'undefined') {
  // Browser-only code
}
```

This prevents SSR errors when accessing localStorage or browser APIs.

## Security Considerations

1. **localStorage**: Currently used for tokens. Consider httpOnly cookies for production.
2. **XSS Protection**: Ensure proper input sanitization to prevent token theft.
3. **HTTPS**: Always use HTTPS in production to prevent token interception.
4. **Token Rotation**: Refresh tokens are rotated on each refresh to limit exposure.
5. **Logout**: Server-side logout invalidates refresh tokens.

## Future Enhancements

- Support for biometric authentication
- Remember me functionality
- Multi-factor authentication (MFA)
- Social login providers (Google, Microsoft, etc.)
- Device fingerprinting
- Session management dashboard
