import { useEffect, useRef, useCallback } from 'react';
import { useAuthStore } from '@/stores/authStore';
import axios from 'axios';

const ACTIVITY_TIMEOUT = 5 * 60 * 1000; // 5 minutes of inactivity
const TOKEN_REFRESH_BUFFER = 2 * 60 * 1000; // Refresh 2 minutes before expiry

export const useTokenRefresh = () => {
  const { tokens, isAuthenticated, setTokens, logout } = useAuthStore();
  const trackerRef = useRef({
    lastActivity: Date.now(),
    refreshTimer: null as NodeJS.Timeout | null,
  });

  const isUserActive = useCallback(() => {
    const timeSinceActivity = Date.now() - trackerRef.current.lastActivity;
    return timeSinceActivity <= ACTIVITY_TIMEOUT;
  }, []);

  const updateActivity = useCallback(() => {
    trackerRef.current.lastActivity = Date.now();
  }, []);

  const refreshToken = useCallback(async () => {
    if (!tokens?.refresh_token) {
      console.warn('No refresh token available');
      return false;
    }

    try {
      const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
      
      const response = await axios.post(`${BASE_URL}/auth/refresh`, {
        refresh_token: tokens.refresh_token,
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        timeout: 10000, // 10 second timeout
      });

      const newTokens = response.data.tokens;
      setTokens(newTokens);
      
      console.log('Token refreshed successfully');
      return true;
    } catch (error) {
      console.error('Token refresh failed:', error);
      logout();
      return false;
    }
  }, [tokens?.refresh_token, setTokens, logout]);

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

    // Cleanup
    return () => {
      activities.forEach(activity => {
        document.removeEventListener(activity, handleActivity, true);
      });
      
      if (trackerRef.current.refreshTimer) {
        clearTimeout(trackerRef.current.refreshTimer);
      }
    };
  }, [isAuthenticated, tokens, updateActivity]);

  return {
    refreshToken,
    isUserActive,
    updateActivity,
  };
};
