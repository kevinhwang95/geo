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

// Request interceptor to add auth token
axiosClient.interceptors.request.use(
  (config) => {
    const { tokens } = useAuthStore.getState();
    if (tokens?.access_token) {
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
    
    // Prevent infinite loops by checking if this is already a refresh request
    if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url?.includes('/auth/refresh')) {
      originalRequest._retry = true;
      
      try {
        console.log('[AxiosInterceptor] Attempting token refresh for 401 response');
        const result = await attemptTokenRefresh('axios-interceptor');
        
        if (result.success && result.tokens?.access_token) {
          console.log('[AxiosInterceptor] Token refresh successful, retrying original request');
          // Retry the original request with new token
          originalRequest.headers.Authorization = `Bearer ${result.tokens.access_token}`;
          return axiosClient(originalRequest);
        } else {
          console.error('[AxiosInterceptor] Token refresh failed:', result.error);
          
          // Only logout for certain types of errors
          if (result.error === 'Max refresh attempts exceeded' || 
              result.error === 'No refresh token available' ||
              (result.error?.response?.status >= 400 && result.error?.response?.status < 500)) {
            const { logout } = useAuthStore.getState();
            logout();
            window.location.href = '/login';
          }
        }
      } catch (refreshError) {
        console.error('[AxiosInterceptor] Token refresh error:', refreshError);
        
        // Only logout for certain types of errors
        if (refreshError && typeof refreshError === 'object' && 'response' in refreshError) {
          const errorResponse = refreshError as any;
          if (errorResponse.response?.status >= 400 && errorResponse.response?.status < 500) {
            const { logout } = useAuthStore.getState();
            logout();
            window.location.href = '/login';
          }
        }
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