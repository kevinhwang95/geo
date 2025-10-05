export interface Notification {
  id: number;
  land_id: number;
  user_id: number;
  type: string;
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high';
  is_read: boolean;
  is_dismissed: boolean;
  created_at: string;
  land_name?: string;
  land_code?: string;
  harvest_status?: string;
  creator_first_name?: string;
  creator_last_name?: string;
  photos?: Array<{
    id: number;
    file_path: string;
    file_name: string;
    file_size: number;
    mime_type: string;
    uploaded_at: string;
  }>;
}

export interface NotificationStats {
  type: string;
  count: number;
  unread_count: number;
  active_count: number;
}
