import axios from 'axios';
import { useAuthStore } from '@/stores/authStore';
import { attemptTokenRefresh } from '@/utils/tokenRefreshManager';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

const axiosClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 30000, // 30 seconds
});

// Request interceptor to add auth token and check expiry
axiosClient.interceptors.request.use(
  (config) => {
    const { tokens, checkTokenExpiryAndLogout } = useAuthStore.getState();
    
    // Check if tokens are expired before making the request
    if (tokens?.access_token) {
      const wasLoggedOut = checkTokenExpiryAndLogout();
      if (wasLoggedOut) {
        // If user was logged out due to expired tokens, reject the request
        return Promise.reject(new Error('Token expired, user logged out'));
      }
      
      config.headers.Authorization = `Bearer ${tokens.access_token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
axiosClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Handle 401 Unauthorized responses
    if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url?.includes('/auth/refresh')) {
      originalRequest._retry = true;
      
      console.log('[AxiosInterceptor] 401 response received, checking token expiry');
      
      // First check if tokens are expired locally
      const { checkTokenExpiryAndLogout, tokens } = useAuthStore.getState();
      const wasLoggedOut = checkTokenExpiryAndLogout();
      
      if (wasLoggedOut) {
        console.log('[AxiosInterceptor] User logged out due to expired tokens');
        window.location.href = '/login';
        return Promise.reject(new Error('Token expired, user logged out'));
      }
      
      // If we have a refresh token, try to refresh (only for active users)
      if (tokens?.refresh_token) {
        // Check if user is active before attempting refresh
        const isUserActive = () => {
          // Simple activity check - if there's been recent activity
          const lastActivity = localStorage.getItem('lastActivity');
          if (!lastActivity) return false;
          const timeSinceActivity = Date.now() - parseInt(lastActivity);
          return timeSinceActivity <= 15 * 60 * 1000; // 15 minutes
        };

        if (isUserActive()) {
          try {
            console.log('[AxiosInterceptor] User is active, attempting token refresh for 401 response');
            const result = await attemptTokenRefresh('axios-interceptor');
          
            if (result.success && result.tokens?.access_token) {
              console.log('[AxiosInterceptor] Token refresh successful, retrying original request');
              // Retry the original request with new token
              originalRequest.headers.Authorization = `Bearer ${result.tokens.access_token}`;
              return axiosClient(originalRequest);
            } else {
              console.error('[AxiosInterceptor] Token refresh failed:', result.error);
              
              // Logout for any refresh failure
              const { logout } = useAuthStore.getState();
              logout();
              window.location.href = '/login';
              return Promise.reject(new Error('Token refresh failed, user logged out'));
            }
          } catch (refreshError) {
            console.error('[AxiosInterceptor] Token refresh error:', refreshError);
            
            // Logout for any refresh error
            const { logout } = useAuthStore.getState();
            logout();
            window.location.href = '/login';
            return Promise.reject(new Error('Token refresh error, user logged out'));
          }
        } else {
          console.log('[AxiosInterceptor] User is inactive, not attempting token refresh - logging out');
          // User is inactive, logout immediately
          const { logout } = useAuthStore.getState();
          logout();
          window.location.href = '/login';
          return Promise.reject(new Error('User inactive, token expired'));
        }
      } else {
        // No refresh token available, logout immediately
        console.log('[AxiosInterceptor] No refresh token available, logging out');
        const { logout } = useAuthStore.getState();
        logout();
        window.location.href = '/login';
        return Promise.reject(new Error('No refresh token available, user logged out'));
      }
    }
    
    return Promise.reject(error);
  }
);

// API utility functions
export const apiUtils = {
  isNetworkError: (error: any): boolean => {
    return !error.response && error.request;
  },
  
  isServerError: (error: any): boolean => {
    return error.response?.status >= 500;
  },
  
  isClientError: (error: any): boolean => {
    return error.response?.status >= 400 && error.response?.status < 500;
  },
  
  formatError: (error: any): string => {
    if (apiUtils.isNetworkError(error)) {
      return 'Network error. Please check your connection.';
    }
    
    if (error.response?.data?.message) {
      return error.response.data.message;
    }
    
    if (error.response?.data?.error) {
      return error.response.data.error;
    }
    
    return error.message || 'An unexpected error occurred';
  },
  
  safeParseJSON: (jsonString: string): any => {
    try {
      return JSON.parse(jsonString);
    } catch (error) {
      console.error('JSON parse error:', error);
      return null;
    }
  }
};

export default axiosClient;