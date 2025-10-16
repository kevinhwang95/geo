import { useState, useEffect, useRef, useCallback } from 'react';
import axiosClient from '@/api/axiosClient';
import { errorLogger } from '@/utils/errorLogger';

interface ErrorLogPollingOptions {
  interval?: number; // Polling interval in milliseconds
  enabled?: boolean; // Whether polling is enabled
  onBackendErrorsUpdate?: (errors: any[]) => void;
  onFrontendErrorsUpdate?: (errors: any[]) => void;
}

export const useErrorLogPolling = (options: ErrorLogPollingOptions = {}) => {
  const {
    interval = 30000, // 30 seconds default
    enabled = true,
    onBackendErrorsUpdate,
    onFrontendErrorsUpdate
  } = options;

  const [isPolling, setIsPolling] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [pollingEnabled, setPollingEnabled] = useState(enabled);
  const [isToggling, setIsToggling] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isPageVisibleRef = useRef(true);

  // Fetch backend errors
  const fetchBackendErrors = useCallback(async () => {
    try {
      const response = await axiosClient.get('/error-logs/recent?count=50');
      if (response.data.success) {
        onBackendErrorsUpdate?.(response.data.data);
        setLastUpdate(new Date());
      }
    } catch (error) {
      console.error('Failed to fetch backend errors during polling:', error);
      // Don't log polling errors to avoid infinite loops
    }
  }, [onBackendErrorsUpdate]);

  // Fetch frontend errors
  const fetchFrontendErrors = useCallback(() => {
    try {
      const errors = errorLogger.getRecentErrors(50);
      onFrontendErrorsUpdate?.(errors);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Failed to fetch frontend errors during polling:', error);
    }
  }, [onFrontendErrorsUpdate]);

  // Combined fetch function
  const fetchAllErrors = useCallback(async () => {
    await Promise.all([
      fetchBackendErrors(),
      fetchFrontendErrors()
    ]);
  }, [fetchBackendErrors, fetchFrontendErrors]);

  // Start polling
  const startPolling = useCallback(() => {
    // Clear any existing interval first
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Set up new interval
    intervalRef.current = setInterval(() => {
      if (isPageVisibleRef.current) {
        fetchAllErrors();
      }
    }, interval);

    // Update state after interval is set
    setIsPolling(true);
    
    // Fetch immediately when starting
    fetchAllErrors();
  }, [interval, fetchAllErrors]);

  // Stop polling
  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    // Update state after interval is cleared
    setIsPolling(false);
  }, []);

  // Toggle polling with improved state management
  const togglePolling = useCallback(() => {
    if (isToggling) return; // Prevent rapid clicking
    
    setIsToggling(true);
    
    // Use a more reliable check by looking at the actual interval
    const currentlyPolling = intervalRef.current !== null;
    
    if (currentlyPolling) {
      stopPolling();
      setPollingEnabled(false);
    } else {
      startPolling();
      setPollingEnabled(true);
    }
    
    // Reset toggling flag after a short delay
    setTimeout(() => setIsToggling(false), 100);
  }, [startPolling, stopPolling, isToggling]);

  // Manual refresh
  const manualRefresh = useCallback(() => {
    fetchAllErrors();
  }, [fetchAllErrors]);

  // Handle page visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      isPageVisibleRef.current = !document.hidden;
      
      if (!document.hidden && pollingEnabled && !isPolling) {
        // Page became visible and polling should be active
        startPolling();
      } else if (document.hidden && isPolling) {
        // Page became hidden, stop polling
        stopPolling();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [pollingEnabled, isPolling, startPolling, stopPolling]);

  // Handle polling enabled/disabled
  useEffect(() => {
    if (pollingEnabled && !isPolling) {
      startPolling();
    } else if (!pollingEnabled && isPolling) {
      stopPolling();
    }
  }, [pollingEnabled, isPolling, startPolling, stopPolling]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    isPolling,
    pollingEnabled,
    lastUpdate,
    startPolling,
    stopPolling,
    togglePolling,
    setPollingEnabled,
    manualRefresh,
    isToggling,
    fetchAllErrors
  };
};
