/**
 * Debug Logger Utility
 * 
 * Conditional console logging based on environment variable.
 * Set VITE_ENABLE_DEBUG_LOGS=true to enable debug logs.
 * Default is false (no logs).
 */

// Get the debug flag from environment variable
const ENABLE_DEBUG_LOGS = import.meta.env.VITE_ENABLE_DEBUG_LOGS === 'true';

/**
 * Logs a message to console if debugging is enabled
 * @param args - Arguments to log (same as console.log)
 */
export const debugLog = (...args: any[]): void => {
  if (ENABLE_DEBUG_LOGS) {
    console.log(...args);
  }
};

/**
 * Logs an error to console if debugging is enabled
 * @param args - Arguments to log (same as console.error)
 */
export const debugError = (...args: any[]): void => {
  if (ENABLE_DEBUG_LOGS) {
    console.error(...args);
  }
};

/**
 * Logs a warning to console if debugging is enabled
 * @param args - Arguments to log (same as console.warn)
 */
export const debugWarn = (...args: any[]): void => {
  if (ENABLE_DEBUG_LOGS) {
    console.warn(...args);
  }
};

/**
 * Logs an info message to console if debugging is enabled
 * @param args - Arguments to log (same as console.info)
 */
export const debugInfo = (...args: any[]): void => {
  if (ENABLE_DEBUG_LOGS) {
    console.info(...args);
  }
};

/**
 * Creates a debug log with a prefix
 * @param prefix - Prefix to add to each log message
 * @returns Object with log methods
 */
export const createDebugLogger = (prefix: string) => ({
  log: (...args: any[]) => debugLog(`[${prefix}]`, ...args),
  error: (...args: any[]) => debugError(`[${prefix}]`, ...args),
  warn: (...args: any[]) => debugWarn(`[${prefix}]`, ...args),
  info: (...args: any[]) => debugInfo(`[${prefix}]`, ...args),
});

// Export the flag if needed
export { ENABLE_DEBUG_LOGS };



