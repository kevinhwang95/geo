interface ErrorLog {
  timestamp: string;
  level: 'ERROR' | 'CRITICAL';
  message: string;
  component?: string;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
  context?: Record<string, any>;
  userAgent: string;
  url: string;
}

class ErrorLogger {
  private static instance: ErrorLogger;
  private maxLogs = 100; // Keep only last 100 errors in memory
  private logs: ErrorLog[] = [];

  private constructor() {
    // Listen for unhandled errors
    window.addEventListener('error', (event) => {
      this.logError('Unhandled Error', new Error(event.message), {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        type: 'unhandled'
      });
    });

    // Listen for unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.logError('Unhandled Promise Rejection', new Error(String(event.reason)), {
        type: 'unhandled_promise'
      });
    });
  }

  public static getInstance(): ErrorLogger {
    if (!ErrorLogger.instance) {
      ErrorLogger.instance = new ErrorLogger();
    }
    return ErrorLogger.instance;
  }

  public logError(message: string, error?: Error, context?: Record<string, any>, component?: string): void {
    const errorLog: ErrorLog = {
      timestamp: new Date().toISOString(),
      level: 'ERROR',
      message,
      component,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : undefined,
      context,
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    this.logs.unshift(errorLog); // Add to beginning
    
    // Keep only last maxLogs entries
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error(`[ERROR] ${message}`, { error, context, component });
    }

    // Store in localStorage for persistence across page reloads
    try {
      localStorage.setItem('error_logs', JSON.stringify(this.logs.slice(0, 50))); // Keep only 50 in localStorage
    } catch (e) {
      // localStorage might be full, ignore
    }
  }

  public getRecentErrors(count: number = 50): ErrorLog[] {
    return this.logs.slice(0, count);
  }

  public clearLogs(): void {
    this.logs = [];
    localStorage.removeItem('error_logs');
  }

  // Load logs from localStorage on initialization
  public loadFromStorage(): void {
    try {
      const stored = localStorage.getItem('error_logs');
      if (stored) {
        this.logs = JSON.parse(stored);
      }
    } catch (e) {
      // Ignore parsing errors
    }
  }
}

// Initialize and load from storage
const errorLogger = ErrorLogger.getInstance();
errorLogger.loadFromStorage();

export { errorLogger, type ErrorLog };

