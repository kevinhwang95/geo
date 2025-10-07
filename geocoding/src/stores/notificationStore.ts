import { create } from 'zustand';
import type { Notification, NotificationStats } from '@/types/notification';

interface NotificationState {
  // Data
  notifications: Notification[];
  stats: NotificationStats[];
  lastUpdate: Date | null;
  
  // Loading states
  loading: boolean;
  error: string | null;
  isPolling: boolean;
  
  // Computed values
  unreadCount: number;
  highPriorityCount: number;
  totalCount: number;
}

interface NotificationActions {
  // Data updates
  setNotifications: (notifications: Notification[]) => void;
  setStats: (stats: NotificationStats[]) => void;
  setLastUpdate: (date: Date) => void;
  
  // State updates
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setIsPolling: (isPolling: boolean) => void;
  
  // Notification actions
  markAsRead: (notificationId: number) => void;
  markAsDismissed: (notificationId: number) => void;
  addNotification: (notification: Notification) => void;
  updateNotification: (notificationId: number, updates: Partial<Notification>) => void;
  removeNotification: (notificationId: number) => void;
  
  // Computed getters
  getNotificationById: (id: number) => Notification | undefined;
  getNotificationsByPriority: (priority: 'low' | 'medium' | 'high') => Notification[];
  getUnreadNotifications: () => Notification[];
  getHighPriorityNotifications: () => Notification[];
  
  // Bulk operations
  clearNotifications: () => void;
  refreshCounts: () => void;
}

export const useNotificationStore = create<NotificationState & NotificationActions>()((set, get) => ({
  // Initial state
  notifications: [],
  stats: [],
  lastUpdate: null,
  loading: false,
  error: null,
  isPolling: false,
  unreadCount: 0,
  highPriorityCount: 0,
  totalCount: 0,

  // Data updates
  setNotifications: (notifications) => {
    set({ 
      notifications,
      totalCount: notifications.length,
      lastUpdate: new Date()
    });
    get().refreshCounts();
  },

  setStats: (stats) => set({ stats }),

  setLastUpdate: (date) => set({ lastUpdate: date }),

  // State updates
  setLoading: (loading) => set({ loading }),

  setError: (error) => set({ error }),

  setIsPolling: (isPolling) => set({ isPolling }),

  // Notification actions
  markAsRead: (notificationId) => {
    set((state) => ({
      notifications: state.notifications.map(notification =>
        notification.id === notificationId
          ? { ...notification, is_read: true }
          : notification
      )
    }));
    get().refreshCounts();
  },

  markAsDismissed: (notificationId) => {
    // Remove the notification from the list when dismissed
    set((state) => ({
      notifications: state.notifications.filter(notification => notification.id !== notificationId)
    }));
    get().refreshCounts();
  },

  addNotification: (notification) => {
    set((state) => ({
      notifications: [notification, ...state.notifications]
    }));
    get().refreshCounts();
  },

  updateNotification: (notificationId, updates) => {
    set((state) => ({
      notifications: state.notifications.map(notification =>
        notification.id === notificationId
          ? { ...notification, ...updates }
          : notification
      )
    }));
    get().refreshCounts();
  },

  removeNotification: (notificationId) => {
    set((state) => ({
      notifications: state.notifications.filter(notification => notification.id !== notificationId)
    }));
    get().refreshCounts();
  },

  // Computed getters
  getNotificationById: (id) => {
    const state = get();
    return state.notifications.find(notification => notification.id === id);
  },

  getNotificationsByPriority: (priority) => {
    const state = get();
    return state.notifications.filter(notification => notification.priority === priority);
  },

  getUnreadNotifications: () => {
    const state = get();
    return state.notifications.filter(notification => !notification.is_read);
  },

  getHighPriorityNotifications: () => {
    const state = get();
    return state.notifications.filter(notification => 
      notification.priority === 'high' && !notification.is_dismissed
    );
  },

  // Bulk operations
  clearNotifications: () => {
    set({
      notifications: [],
      stats: [],
      lastUpdate: null,
      unreadCount: 0,
      highPriorityCount: 0,
      totalCount: 0,
      error: null
    });
  },

  refreshCounts: () => {
    const state = get();
    const unreadCount = state.notifications.filter(n => !n.is_read).length;
    const highPriorityCount = state.notifications.filter(n => 
      n.priority === 'high' && !n.is_dismissed
    ).length;
    
    set({
      unreadCount,
      highPriorityCount,
      totalCount: state.notifications.length
    });
  },
}));
