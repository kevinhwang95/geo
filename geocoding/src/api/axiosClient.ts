import axios from 'axios';
import { useAuthStore } from '@/stores/authStore';

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
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const { tokens, logout } = useAuthStore.getState();
        
        if (tokens?.refresh_token) {
          // Try to refresh the token
          const response = await axios.post(`${BASE_URL}/oauth/refresh`, {
            refresh_token: tokens.refresh_token
          });
          
          const newTokens = response.data.tokens;
          useAuthStore.getState().setTokens(newTokens);
          
          // Retry the original request with new token
          originalRequest.headers.Authorization = `Bearer ${newTokens.access_token}`;
          return axiosClient(originalRequest);
        } else {
          // No refresh token, logout user
          logout();
          window.location.href = '/login';
        }
      } catch (refreshError) {
        // Refresh failed, logout user
        useAuthStore.getState().logout();
        window.location.href = '/login';
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