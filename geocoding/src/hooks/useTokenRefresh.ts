import { useEffect, useRef, useCallback } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { getTokenTimeRemaining, isTokenExpired, decodeJWT } from '@/utils/jwt';
import { attemptTokenRefresh, isRefreshInProgress } from '@/utils/tokenRefreshManager';

const ACTIVITY_TIMEOUT = 15 * 60 * 1000; // 15 minutes of inactivity (more reasonable)
const TOKEN_REFRESH_BUFFER = 2 * 60 * 1000; // Refresh 2 minutes before expiry

export const useTokenRefresh = () => {
  console.log('useTokenRefresh hook initialized');
  const { tokens, isAuthenticated, setTokens, logout } = useAuthStore();
  const trackerRef = useRef({
    lastActivity: Date.now(),
    refreshTimer: null as NodeJS.Timeout | null,
    retryCount: 0,
    maxRetries: 3,
  });

  const isUserActive = useCallback(() => {
    const timeSinceActivity = Date.now() - trackerRef.current.lastActivity;
    return timeSinceActivity <= ACTIVITY_TIMEOUT;
  }, []);

  const updateActivity = useCallback(() => {
    trackerRef.current.lastActivity = Date.now();
  }, []);

  const refreshToken = useCallback(async () => {
    // Check if refresh is already in progress globally
    if (isRefreshInProgress()) {
      console.log('[useTokenRefresh] Refresh already in progress globally, skipping...');
      return false;
    }

    if (!tokens?.refresh_token) {
      console.warn('[useTokenRefresh] No refresh token available');
      return false;
    }

    // Check if refresh token is expired
    if (isTokenExpired(tokens.refresh_token, 0)) {
      console.warn('[useTokenRefresh] Refresh token is expired');
      logout();
      return false;
    }

    // Check retry limit
    if (trackerRef.current.retryCount >= trackerRef.current.maxRetries) {
      console.error('[useTokenRefresh] Max refresh retries reached, logging out');
      logout();
      return false;
    }

    trackerRef.current.retryCount++;

    try {
      console.log('[useTokenRefresh] Attempting proactive token refresh');
      const result = await attemptTokenRefresh('useTokenRefresh-hook');
      
      if (result.success) {
        // Reset retry count on success
        trackerRef.current.retryCount = 0;
        console.log('[useTokenRefresh] Token refreshed successfully');
        return true;
      } else {
        console.error('[useTokenRefresh] Token refresh failed:', result.error);
        
        // If it's a network error or server error, don't logout immediately
        if (result.error?.response?.status >= 500 || !result.error?.response) {
          console.log('[useTokenRefresh] Server error or network issue, will retry later');
          return false;
        }
        
        // For client errors (400-499), logout immediately
        logout();
        return false;
      }
    } catch (error) {
      console.error('[useTokenRefresh] Unexpected error during refresh:', error);
      logout();
      return false;
    }
  }, [tokens?.refresh_token, logout]);

  const scheduleTokenRefresh = useCallback(async () => {
    // Clear existing timer
    if (trackerRef.current.refreshTimer) {
      clearTimeout(trackerRef.current.refreshTimer);
    }

    if (!tokens?.access_token) {
      return;
    }

    // Get actual time remaining from JWT
    const timeRemaining = getTokenTimeRemaining(tokens.access_token);
    const refreshTime = (timeRemaining * 1000) - TOKEN_REFRESH_BUFFER;
    
    console.log(`[useTokenRefresh] Token expires in ${timeRemaining} seconds, scheduling refresh in ${Math.max(0, refreshTime / 1000)} seconds`);
    
    if (refreshTime > 0) {
      trackerRef.current.refreshTimer = setTimeout(async () => {
        if (isUserActive() && !isRefreshInProgress()) {
          const success = await refreshToken();
          if (success) {
            // Only reschedule if we're still authenticated and have tokens
            const { tokens: currentTokens, isAuthenticated: stillAuthenticated } = useAuthStore.getState();
            if (stillAuthenticated && currentTokens?.access_token) {
              // Use a small delay to prevent immediate rescheduling
              setTimeout(() => {
                scheduleTokenRefresh().catch(console.error);
              }, 1000);
            }
          }
        } else {
          console.log('[useTokenRefresh] User inactive or refresh in progress, skipping token refresh');
        }
      }, refreshTime);
    } else {
      // Token is already close to expiry, refresh immediately if user is active
      if (isUserActive() && !isRefreshInProgress()) {
        const success = await refreshToken();
        if (success) {
          // Only reschedule if we're still authenticated and have tokens
          const { tokens: currentTokens, isAuthenticated: stillAuthenticated } = useAuthStore.getState();
          if (stillAuthenticated && currentTokens?.access_token) {
            // Use a small delay to prevent immediate rescheduling
            setTimeout(() => {
              scheduleTokenRefresh().catch(console.error);
            }, 1000);
          }
        }
      }
    }
  }, [refreshToken, tokens?.access_token, isUserActive]);

  // Set up activity tracking
  useEffect(() => {
    if (!isAuthenticated || !tokens) return;

    const activities = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click',
      'focus',
    ];

    const handleActivity = () => {
      updateActivity();
    };

    // Add event listeners
    activities.forEach(activity => {
      document.addEventListener(activity, handleActivity, true);
    });

    // Initial activity update
    updateActivity();

    // Schedule initial token refresh
    scheduleTokenRefresh().catch(console.error);

    // Cleanup
    return () => {
      activities.forEach(activity => {
        document.removeEventListener(activity, handleActivity, true);
      });
      
      if (trackerRef.current.refreshTimer) {
        clearTimeout(trackerRef.current.refreshTimer);
      }
    };
  }, [isAuthenticated, tokens, updateActivity, scheduleTokenRefresh]);

  // Handle page visibility changes
  useEffect(() => {
    if (!isAuthenticated || !tokens) return;

    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        // Page became visible, check if user is still active and refresh if needed
        if (isUserActive()) {
          updateActivity();
          
          // Check if token is close to expiry and refresh if needed
          if (tokens?.access_token && !isRefreshInProgress()) {
            const timeRemaining = getTokenTimeRemaining(tokens.access_token);
            
            if (timeRemaining <= TOKEN_REFRESH_BUFFER / 1000) {
              const success = await refreshToken();
              if (success) {
                // Use a small delay to prevent immediate rescheduling
                setTimeout(() => {
                  scheduleTokenRefresh().catch(console.error);
                }, 1000);
              }
            } else {
              scheduleTokenRefresh().catch(console.error);
            }
          }
        }
      } else {
        // Page became hidden, stop automatic refresh
        if (trackerRef.current.refreshTimer) {
          clearTimeout(trackerRef.current.refreshTimer);
          trackerRef.current.refreshTimer = null;
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isAuthenticated, tokens, isUserActive, updateActivity, refreshToken, scheduleTokenRefresh]);

  return {
    refreshToken,
    isUserActive,
    updateActivity,
  };
};
