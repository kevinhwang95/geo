import { useEffect, useRef, useCallback } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { getTokenTimeRemaining } from '@/utils/jwt';
import { attemptTokenRefresh, isRefreshInProgress } from '@/utils/tokenRefreshManager';

const ACTIVITY_TIMEOUT = 20 * 60 * 1000; // 15 minutes of inactivity (more reasonable)
const TOKEN_REFRESH_BUFFER = 5 * 60 * 1000; // Refresh 2 minutes before expiry

export const useTokenRefresh = () => {
  //console.log('useTokenRefresh hook initialized');
  const { tokens, isAuthenticated, logout } = useAuthStore();
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
    // Also store in localStorage for axios interceptor access
    localStorage.setItem('lastActivity', Date.now().toString());
  }, []);

  const refreshToken = useCallback(async () => {
    // Check if refresh is already in progress globally
    if (isRefreshInProgress()) {
      console.log('[useTokenRefresh] Refresh already in progress globally, skipping...');
      return false;
    }

    // Use the centralized token expiry check
    const { checkTokenExpiryAndLogout } = useAuthStore.getState();
    const wasLoggedOut = checkTokenExpiryAndLogout();
    
    if (wasLoggedOut) {
      console.log('[useTokenRefresh] User logged out due to expired tokens');
      return false;
    }

    if (!tokens?.refresh_token) {
      console.warn('[useTokenRefresh] No refresh token available');
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
      trackerRef.current.refreshTimer = null;
    }

    if (!tokens?.access_token) {
      return;
    }

    // Prevent recursive scheduling
    if (trackerRef.current.refreshTimer) {
      console.log('[useTokenRefresh] Timer already exists, skipping scheduling');
      return;
    }

    // Get actual time remaining from JWT
    const timeRemaining = getTokenTimeRemaining(tokens.access_token);
    const refreshTime = (timeRemaining * 1000) - TOKEN_REFRESH_BUFFER;
    
    console.log(`[useTokenRefresh] Token expires in ${timeRemaining} seconds, scheduling refresh in ${Math.max(0, refreshTime / 1000)} seconds`);
    
    if (refreshTime > 0) {
      trackerRef.current.refreshTimer = setTimeout(async () => {
        // Clear the timer reference immediately
        trackerRef.current.refreshTimer = null;
        
        // Check user activity at the actual refresh time, not just when scheduling
        if (isUserActive() && !isRefreshInProgress()) {
          console.log('[useTokenRefresh] User is active, proceeding with token refresh');
          const success = await refreshToken();
          if (success) {
            // Only reschedule if we're still authenticated and have tokens
            const { tokens: currentTokens, isAuthenticated: stillAuthenticated } = useAuthStore.getState();
            if (stillAuthenticated && currentTokens?.access_token && !trackerRef.current.refreshTimer) {
              // Use a longer delay to prevent immediate rescheduling
              setTimeout(() => {
                scheduleTokenRefresh().catch(console.error);
              }, 5000);
            }
          }
        } else {
          console.log('[useTokenRefresh] User inactive or refresh in progress, skipping token refresh - user will be logged out when token expires');
          // Don't reschedule - let the token expire naturally for inactive users
        }
      }, refreshTime);
    } else {
      // Token is already close to expiry, refresh immediately if user is active
      if (isUserActive() && !isRefreshInProgress()) {
        console.log('[useTokenRefresh] Token close to expiry and user is active, refreshing immediately');
        const success = await refreshToken();
        if (success) {
          // Only reschedule if we're still authenticated and have tokens
          const { tokens: currentTokens, isAuthenticated: stillAuthenticated } = useAuthStore.getState();
          if (stillAuthenticated && currentTokens?.access_token && !trackerRef.current.refreshTimer) {
            // Use a longer delay to prevent immediate rescheduling
            setTimeout(() => {
              scheduleTokenRefresh().catch(console.error);
            }, 5000);
          }
        }
      } else {
        console.log('[useTokenRefresh] Token close to expiry but user is inactive, will be logged out when token expires');
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
          console.log('[useTokenRefresh] Page visible and user is active, updating activity and checking tokens');
          updateActivity();
          
          // Check if token is close to expiry and refresh if needed
          if (tokens?.access_token && !isRefreshInProgress() && !trackerRef.current.refreshTimer) {
            const timeRemaining = getTokenTimeRemaining(tokens.access_token);
            
            if (timeRemaining <= TOKEN_REFRESH_BUFFER / 1000) {
              console.log('[useTokenRefresh] Token close to expiry on page visibility, refreshing');
              const success = await refreshToken();
              if (success) {
                // Use a longer delay to prevent immediate rescheduling
                setTimeout(() => {
                  scheduleTokenRefresh().catch(console.error);
                }, 5000);
              }
            } else {
              // Only schedule if no timer exists
              if (!trackerRef.current.refreshTimer) {
                scheduleTokenRefresh().catch(console.error);
              }
            }
          }
        } else {
          console.log('[useTokenRefresh] Page visible but user is inactive, not refreshing tokens');
        }
      } else {
        // Page became hidden, stop automatic refresh
        console.log('[useTokenRefresh] Page hidden, stopping automatic refresh');
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
