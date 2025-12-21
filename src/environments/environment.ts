/**
 * Environment configuration for development
 */
export const environment = {
  production: false,
  apiUrl: '/api', // Relative path to work with Angular proxy (proxies to localhost:3001)
  supabaseUrl: '',
  supabaseAnonKey: '',
  tokenRefreshThreshold: 5 * 60 * 1000, // 5 minutes in ms
  sessionTimeout: 30 * 60 * 1000, // 30 minutes in ms
  idleTimeout: 15 * 60 * 1000, // 15 minutes in ms
  useMockData: true, // Use mock data for timesheet history in development
};
