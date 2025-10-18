import { create } from 'zustand';

// Define Land type that matches the actual API response from backend
interface Land {
  id: number;
  land_name: string;
  land_code: string;
  land_number: string;
  location: string;
  province: string;
  district: string;
  city: string;
  plant_type_id: number;
  category_id: number;
  plant_type_name: string;
  category_name: string;
  category_color: string;
  plant_date: string;
  harvest_cycle_days: number;
  next_harvest_date: string | null;
  coordinations: string;
  geometry: string;
  size: number;
  palm_area?: number;
  owner_name: string;
  notes: string;
  is_active: boolean;
  created_by: number;
  created_at: string;
  updated_at: string;
  harvest_status: 'overdue' | 'due_soon' | 'normal';
}

interface NotificationContext {
  id: number;
  title: string;
  message: string;
  type: string;
  priority: string;
  created_at: string;
}

interface MapState {
  selectedLand: Land | null;
  shouldCenterMap: boolean;
  showInfoWindow: boolean;
  notificationContext: NotificationContext | null;
}

interface MapActions {
  selectLand: (land: Land | null) => void;
  centerMapOnLand: (land: Land, notification?: NotificationContext) => void;
  clearSelection: () => void;
  setShowInfoWindow: (show: boolean) => void;
}

export const useMapStore = create<MapState & MapActions>((set) => ({
  // State
  selectedLand: null,
  shouldCenterMap: false,
  showInfoWindow: false,
  notificationContext: null,

  // Actions
  selectLand: (land) => set({ 
    selectedLand: land,
    showInfoWindow: land !== null,
    notificationContext: null // Clear notification context when selecting land normally
  }),

  centerMapOnLand: (land, notification) => {
    console.log('Map store: centerMapOnLand called with land:', land.land_name);
    if (notification) {
      console.log('Map store: Including notification context:', notification.title);
    }
    set({ 
      selectedLand: land,
      shouldCenterMap: true,
      showInfoWindow: true,
      notificationContext: notification || null
    });
    console.log('Map store: state updated, shouldCenterMap set to true');
  },

  clearSelection: () => {
    console.log('Map store: clearSelection called');
    set({ 
      selectedLand: null,
      shouldCenterMap: false,
      showInfoWindow: false,
      notificationContext: null
    });
    console.log('Map store: selection cleared');
  },

  setShowInfoWindow: (show) => set({ showInfoWindow: show }),
}));
