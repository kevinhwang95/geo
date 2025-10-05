/**
 * Global Token Refresh Manager
 * 
 * This utility coordinates token refresh between:
 * - Axios response interceptor (reactive refresh on 401)
 * - useTokenRefresh hook (proactive refresh before expiry)
 * 
 * Prevents infinite loops and concurrent refresh attempts
 */

import axios from 'axios';
import { useAuthStore } from '@/stores/authStore';

// Global state for token refresh coordination
let isRefreshing = false;
let refreshPromise: Promise<any> | null = null;
let refreshAttempts = 0;
const MAX_REFRESH_ATTEMPTS = 3;

export interface TokenRefreshResult {
  success: boolean;
  tokens?: any;
  error?: any;
}

/**
 * Attempts to refresh the access token
 * @param source - Source of the refresh request (for debugging)
 * @returns Promise with refresh result
 */
export const attemptTokenRefresh = async (source: string = 'unknown'): Promise<TokenRefreshResult> => {
  console.log(`[TokenRefreshManager] Refresh attempt from ${source}, attempt ${refreshAttempts + 1}`);
  
  // Check if we've exceeded max attempts
  if (refreshAttempts >= MAX_REFRESH_ATTEMPTS) {
    console.error('[TokenRefreshManager] Max refresh attempts exceeded, logging out');
    useAuthStore.getState().logout();
    return { success: false, error: 'Max refresh attempts exceeded' };
  }

  // If already refreshing, wait for the existing refresh
  if (isRefreshing && refreshPromise) {
    console.log(`[TokenRefreshManager] Refresh already in progress, waiting for ${source}`);
    try {
      const result = await refreshPromise;
      return result;
    } catch (error) {
      console.error(`[TokenRefreshManager] Error waiting for refresh from ${source}:`, error);
      return { success: false, error };
    }
  }

  // Start new refresh process
  if (!isRefreshing) {
    console.log(`[TokenRefreshManager] Starting new refresh process from ${source}`);
    isRefreshing = true;
    refreshAttempts++;

    const { tokens, logout } = useAuthStore.getState();
    
    if (!tokens?.refresh_token) {
      console.warn('[TokenRefreshManager] No refresh token available');
      isRefreshing = false;
      refreshPromise = null;
      logout();
      return { success: false, error: 'No refresh token available' };
    }

    refreshPromise = axios.post(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'}/auth/refresh`, {
      refresh_token: tokens.refresh_token
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      timeout: 10000, // 10 second timeout
    }).then(response => {
      const newTokens = response.data.tokens;
      useAuthStore.getState().setTokens(newTokens);
      
      // Reset attempt counter on success
      refreshAttempts = 0;
      
      console.log(`[TokenRefreshManager] Token refresh successful from ${source}`);
      return { success: true, tokens: newTokens };
    }).catch(error => {
      console.error(`[TokenRefreshManager] Token refresh failed from ${source}:`, error);
      
      // For client errors (400-499), logout immediately
      if (error.response?.status >= 400 && error.response?.status < 500) {
        logout();
        return { success: false, error };
      }
      
      // For server errors or network issues, allow retry
      return { success: false, error };
    }).finally(() => {
      // Always reset the refresh state
      isRefreshing = false;
      refreshPromise = null;
    });

    return refreshPromise;
  }

  return { success: false, error: 'Unexpected state' };
};

/**
 * Checks if a refresh is currently in progress
 */
export const isRefreshInProgress = (): boolean => {
  return isRefreshing;
};

/**
 * Resets the refresh state (useful for testing or manual recovery)
 */
export const resetRefreshState = (): void => {
  console.log('[TokenRefreshManager] Resetting refresh state');
  isRefreshing = false;
  refreshPromise = null;
  refreshAttempts = 0;
};

/**
 * Gets the current refresh attempt count
 */
export const getRefreshAttempts = (): number => {
  return refreshAttempts;
};
