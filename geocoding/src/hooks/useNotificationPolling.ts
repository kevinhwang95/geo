import { useState, useEffect, useRef, useCallback } from 'react';
import axiosClient from '@/api/axiosClient';
import { useAuthStore } from '@/stores/authStore';
import type { Notification, NotificationStats } from '@/types/notification';

interface UseNotificationPollingOptions {
  pollInterval?: number; // milliseconds between polls
  enablePolling?: boolean;
  filterHighPriority?: boolean;
  onNotificationsUpdate?: (notifications: Notification[]) => void;
  onStatsUpdate?: (stats: NotificationStats[]) => void;
  onError?: (error: string) => void;
}

export const useNotificationPolling = (options: UseNotificationPollingOptions = {}) => {
  const {
    pollInterval = 30000, // 30 seconds default
    enablePolling = true,
    filterHighPriority = false,
    onNotificationsUpdate,
    onStatsUpdate,
    onError
  } = options;

  const { isAuthenticated } = useAuthStore();
  
  // State
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [stats, setStats] = useState<NotificationStats[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Refs for polling control
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isPollingRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Calculate counts
  const unreadCount = notifications.filter(n => !n.is_read).length;
  const highPriorityCount = notifications.filter(n => n.priority === 'high' && !n.is_dismissed).length;
  const totalCount = notifications.length;

  // Fetch notifications function
  const fetchNotifications = useCallback(async (signal?: AbortSignal) => {
    if (!isAuthenticated) {
      console.log('Skipping notification fetch - user not authenticated');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Build query parameters
      const params = new URLSearchParams();
      if (filterHighPriority) {
        params.append('priority', 'high');
      }
      params.append('limit', '50'); // Get more notifications for better polling

      // Fetch notifications
      const notificationsResponse = await axiosClient.get(`/notifications?${params.toString()}`, {
        signal
      });

      const newNotifications = notificationsResponse.data.data || [];
      
      // Update notifications state
      setNotifications(newNotifications);
      setLastUpdate(new Date());
      
      // Notify parent component
      onNotificationsUpdate?.(newNotifications);

      // Fetch stats if needed
      if (onStatsUpdate) {
        try {
          const statsResponse = await axiosClient.get('/notifications/stats', {
            signal
          });
          const newStats = statsResponse.data.data || [];
          setStats(newStats);
          onStatsUpdate(newStats);
        } catch (statsError) {
          console.warn('Failed to fetch notification stats:', statsError);
        }
      }

      console.log(`📬 Fetched ${newNotifications.length} notifications (${unreadCount} unread, ${highPriorityCount} high priority)`);

    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('Notification fetch aborted');
        return;
      }
      
      const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch notifications';
      setError(errorMessage);
      onError?.(errorMessage);
      console.error('Notification fetch error:', error);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, filterHighPriority, onNotificationsUpdate, onStatsUpdate, onError, unreadCount, highPriorityCount]);

  // Start polling
  const startPolling = useCallback(() => {
    if (isPollingRef.current || !enablePolling || !isAuthenticated) {
      return;
    }

    console.log(`🔄 Starting notification polling every ${pollInterval / 1000} seconds`);
    isPollingRef.current = true;

    // Initial fetch
    fetchNotifications();

    // Set up polling interval
    pollingIntervalRef.current = setInterval(() => {
      if (isAuthenticated && !abortControllerRef.current) {
        fetchNotifications();
      }
    }, pollInterval);

  }, [fetchNotifications, pollInterval, enablePolling, isAuthenticated]);

  // Stop polling
  const stopPolling = useCallback(() => {
    console.log('🛑 Stopping notification polling');
    isPollingRef.current = false;

    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  // Manual refresh
  const refreshNotifications = useCallback(() => {
    console.log('🔄 Manual notification refresh requested');
    fetchNotifications();
  }, [fetchNotifications]);

  // Set up polling on mount and auth changes
  useEffect(() => {
    if (enablePolling && isAuthenticated) {
      startPolling();
    } else {
      stopPolling();
    }

    return () => {
      stopPolling();
    };
  }, [enablePolling, isAuthenticated, startPolling, stopPolling]);

  // Handle page visibility changes (pause polling when tab is hidden)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Page became visible, resume polling
        if (enablePolling && isAuthenticated && !isPollingRef.current) {
          startPolling();
        }
      } else {
        // Page became hidden, pause polling
        stopPolling();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enablePolling, isAuthenticated, startPolling, stopPolling]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  return {
    // Data
    notifications,
    stats,
    unreadCount,
    highPriorityCount,
    totalCount,
    
    // State
    loading,
    error,
    lastUpdate,
    isPolling: isPollingRef.current,
    
    // Actions
    refreshNotifications,
    startPolling,
    stopPolling,
    
    // Utils
    getNotificationById: (id: number) => notifications.find(n => n.id === id),
    getNotificationsByPriority: (priority: 'low' | 'medium' | 'high') => 
      notifications.filter(n => n.priority === priority),
    getUnreadNotifications: () => notifications.filter(n => !n.is_read),
    getHighPriorityNotifications: () => notifications.filter(n => n.priority === 'high' && !n.is_dismissed),
  };
};
