/**
 * Environment configuration for production
 */
export const environment = {
  production: true,
  apiUrl: '/api',
  supabaseUrl: '',
  supabaseAnonKey: '',
  tokenRefreshThreshold: 5 * 60 * 1000, // 5 minutes in ms
  sessionTimeout: 30 * 60 * 1000, // 30 minutes in ms
  idleTimeout: 15 * 60 * 1000, // 15 minutes in ms
  useMockData: false, // Use real API in production
};
