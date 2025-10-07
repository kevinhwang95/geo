import { useEffect, useRef, useCallback } from 'react';
import { useAuthStore } from '@/stores/authStore';

const ACTIVITY_TIMEOUT = 20 * 60 * 1000; // 15 minutes of inactivity

/**
 * Hook to periodically check token expiry and logout users when tokens expire
 * This provides an additional safety net beyond the axios interceptors
 * Only logs out inactive users when tokens expire
 */
export const useTokenExpiryChecker = () => {
  const { isAuthenticated, tokens, checkTokenExpiryAndLogout } = useAuthStore();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  const isUserActive = useCallback(() => {
    const timeSinceActivity = Date.now() - lastActivityRef.current;
    return timeSinceActivity <= ACTIVITY_TIMEOUT;
  }, []);

  const updateActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
    // Also store in localStorage for axios interceptor access
    localStorage.setItem('lastActivity', Date.now().toString());
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !tokens) {
      // Clear any existing interval if user is not authenticated
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Set up activity tracking
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

    // Set up periodic token expiry check every 30 seconds
    intervalRef.current = setInterval(() => {
      console.log('[TokenExpiryChecker] Checking token expiry...');
      
      // Only logout inactive users when tokens expire
      if (!isUserActive()) {
        console.log('[TokenExpiryChecker] User is inactive, checking if tokens are expired');
        const wasLoggedOut = checkTokenExpiryAndLogout();
        if (wasLoggedOut) {
          console.log('[TokenExpiryChecker] Inactive user logged out due to expired tokens');
          // Clear the interval since user is now logged out
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
        }
      } else {
        console.log('[TokenExpiryChecker] User is active, not checking token expiry');
      }
    }, 30000); // Check every 30 seconds

    // Cleanup function
    return () => {
      activities.forEach(activity => {
        document.removeEventListener(activity, handleActivity, true);
      });
      
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isAuthenticated, tokens, checkTokenExpiryAndLogout, isUserActive, updateActivity]);

  // Also check immediately when tokens change (only for inactive users)
  useEffect(() => {
    if (isAuthenticated && tokens) {
      console.log('[TokenExpiryChecker] Tokens changed, checking expiry immediately...');
      // Only check expiry for inactive users
      if (!isUserActive()) {
        console.log('[TokenExpiryChecker] User is inactive, checking token expiry on token change');
        checkTokenExpiryAndLogout();
      } else {
        console.log('[TokenExpiryChecker] User is active, not checking token expiry on token change');
      }
    }
  }, [tokens, isAuthenticated, checkTokenExpiryAndLogout, isUserActive]);
};
