/**
 * API request and response models for authentication
 */

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    companyId?: string;
  };
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // Seconds until expiration
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LogoutRequest {
  refreshToken?: string;
}

export interface ApiError {
  message: string;
  code?: string;
  statusCode?: number;
}
