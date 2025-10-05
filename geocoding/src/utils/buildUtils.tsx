/**
 * Build utilities for production vs development environments
 */

export const isDevelopment = import.meta.env.DEV;
export const isProduction = import.meta.env.PROD;
export const isPreview = import.meta.env.MODE === 'preview';

/**
 * Only execute code in development mode
 * @param callback Function to execute only in development
 */
export const devOnly = (callback: () => void) => {
  if (isDevelopment) {
    callback();
  }
};

/**
 * Only execute code in production mode
 * @param callback Function to execute only in production
 */
export const prodOnly = (callback: () => void) => {
  if (isProduction) {
    callback();
  }
};

/**
 * Get environment-specific configuration
 */
export const getEnvironmentConfig = () => {
  return {
    isDevelopment,
    isProduction,
    isPreview,
    enableDebugTools: isDevelopment,
    enableConsoleLogs: isDevelopment,
    enablePerformanceMonitoring: isDevelopment,
    apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api',
    enableSourceMaps: isDevelopment,
  };
};

/**
 * Conditional rendering helper for debug components
 */
export const DebugOnly = ({ children }: { children: React.ReactNode }) => {
  if (!isDevelopment) {
    return null;
  }
  return <>{children}</>;
};

/**
 * Conditional logging helper
 */
export const debugLog = (...args: any[]) => {
  if (isDevelopment) {
    console.log('[DEBUG]', ...args);
  }
};

export const debugWarn = (...args: any[]) => {
  if (isDevelopment) {
    console.warn('[DEBUG WARNING]', ...args);
  }
};

export const debugError = (...args: any[]) => {
  if (isDevelopment) {
    console.error('[DEBUG ERROR]', ...args);
  }
};
