/**
 * Environment configuration for development
 */
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3001/api', // Usar ruta relativa para que funcione con el proxy
  supabaseUrl: '',
  supabaseAnonKey: '',
  tokenRefreshThreshold: 5 * 60 * 1000, // 5 minutes in ms
  sessionTimeout: 30 * 60 * 1000, // 30 minutes in ms
  idleTimeout: 15 * 60 * 1000, // 15 minutes in ms
};
