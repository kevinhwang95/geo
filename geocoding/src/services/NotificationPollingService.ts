import axiosClient from '@/api/axiosClient';
import { useNotificationStore } from '@/stores/notificationStore';
import { useAuthStore } from '@/stores/authStore';
import type { Notification, NotificationStats } from '@/types/notification';

class NotificationPollingService {
  private static instance: NotificationPollingService;
  private pollingInterval: NodeJS.Timeout | null = null;
  private isPolling = false;
  private pollInterval = 30000; // 30 seconds
  private abortController: AbortController | null = null;

  private constructor() {}

  public static getInstance(): NotificationPollingService {
    if (!NotificationPollingService.instance) {
      NotificationPollingService.instance = new NotificationPollingService();
    }
    return NotificationPollingService.instance;
  }

  public startPolling(interval: number = 30000): void {
    if (this.isPolling) {
      console.log('Notification polling already active');
      return;
    }

    this.pollInterval = interval;
    this.isPolling = true;
    
    console.log(`🔄 Starting notification polling service every ${interval / 1000} seconds`);
    
    // Initial fetch (silent)
    this.fetchNotifications(true);
    
    // Set up polling interval (silent)
    this.pollingInterval = setInterval(() => {
      this.fetchNotifications(true);
    }, this.pollInterval);
  }

  public stopPolling(): void {
    if (!this.isPolling) {
      return;
    }

    console.log('🛑 Stopping notification polling service');
    this.isPolling = false;

    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }

    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }

  public async fetchNotifications(silent: boolean = true): Promise<void> {
    const store = useNotificationStore.getState();
    
    // Check if user is authenticated
    const { isAuthenticated } = useAuthStore.getState();
    if (!isAuthenticated) {
      console.log('Skipping notification fetch - user not authenticated');
      return;
    }

    try {
      // Only show loading if not silent (for manual refreshes)
      if (!silent) {
        store.setLoading(true);
        store.setError(null);
      }

      // Create abort controller for this request
      this.abortController = new AbortController();

      // Fetch notifications
      const notificationsResponse = await axiosClient.get('/notifications?limit=50', {
        signal: this.abortController.signal
      });

      const notifications: Notification[] = notificationsResponse.data.data || [];
      
      // Update store silently
      store.setNotifications(notifications);

      // Fetch stats
      try {
        const statsResponse = await axiosClient.get('/notifications/stats', {
          signal: this.abortController.signal
        });
        const stats: NotificationStats[] = statsResponse.data.data || [];
        store.setStats(stats);
      } catch (statsError) {
        console.warn('Failed to fetch notification stats:', statsError);
      }

      console.log(`📬 Polling: Fetched ${notifications.length} notifications (silent: ${silent})`);

    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('Notification fetch aborted');
        return;
      }
      
      const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch notifications';
      
      // Only show errors if not silent
      if (!silent) {
        store.setError(errorMessage);
      }
      
      console.error('Notification polling error:', error);
    } finally {
      // Only hide loading if not silent
      if (!silent) {
        store.setLoading(false);
      }
    }
  }

  public async markAsRead(notificationId: number): Promise<void> {
    try {
      await axiosClient.post(`/notifications/mark-read/${notificationId}`);
      
      const store = useNotificationStore.getState();
      store.markAsRead(notificationId);
      
      console.log(`✅ Marked notification ${notificationId} as read`);
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      throw error;
    }
  }

  public async markAsDismissed(notificationId: number): Promise<void> {
    try {
      await axiosClient.post(`/notifications/dismiss/${notificationId}`);
      
      const store = useNotificationStore.getState();
      store.markAsDismissed(notificationId);
      
      console.log(`✅ Marked notification ${notificationId} as dismissed`);
    } catch (error) {
      console.error('Failed to dismiss notification:', error);
      throw error;
    }
  }

  public refreshNow(silent: boolean = false): void {
    console.log('🔄 Manual notification refresh requested');
    this.fetchNotifications(silent);
  }

  public getPollingStatus(): { isPolling: boolean; interval: number } {
    return {
      isPolling: this.isPolling,
      interval: this.pollInterval
    };
  }

  // Handle page visibility changes
  public handleVisibilityChange(): void {
    if (document.visibilityState === 'visible') {
      // Page became visible, resume polling if it was active
      if (this.isPolling) {
        this.startPolling(this.pollInterval);
      }
    } else {
      // Page became hidden, stop polling
      this.stopPolling();
    }
  }
}

// Export singleton instance
export const notificationPollingService = NotificationPollingService.getInstance();

// Set up page visibility handling
if (typeof window !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    notificationPollingService.handleVisibilityChange();
  });
}
