import React, { useEffect, useState } from 'react';
import axiosClient from '@/api/axiosClient';
import NotificationMarker from './NotificationMarker';

interface Notification {
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

interface Land {
  id: number;
  land_name: string;
  land_code: string;
  coordinations: string;
  geometry?: string;
}

interface NotificationMarkersManagerProps {
  map: google.maps.Map | null;
  onNotificationClick?: (notification: Notification) => void;
  onNotificationDismissed?: () => void;
  onNotificationMarkedAsRead?: () => void;
}

const NotificationMarkersManager: React.FC<NotificationMarkersManagerProps> = ({
  map,
  onNotificationClick,
  onNotificationDismissed,
  onNotificationMarkedAsRead
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [lands, setLands] = useState<Land[]>([]);
  const [loading, setLoading] = useState(true);

  // Function to mark notification as read
  const markNotificationAsRead = async (notificationId: number) => {
    try {
      await axiosClient.post(`/notifications/mark-read/${notificationId}`);
      console.log('Notification marked as read:', notificationId);
      
      // Remove the notification from the local state immediately
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      
      // Notify parent component that notification was marked as read
      onNotificationMarkedAsRead?.();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Function to dismiss notification
  const dismissNotification = async (notificationId: number) => {
    try {
      await axiosClient.post(`/notifications/dismiss/${notificationId}`);
      console.log('Notification dismissed:', notificationId);
      
      // Remove the notification from the local state immediately
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      
      // Notify parent component that notification was dismissed
      onNotificationDismissed?.();
    } catch (error) {
      console.error('Error dismissing notification:', error);
    }
  };

  // Fetch notifications and lands
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch notifications
        const notificationsResponse = await axiosClient.get('/notifications');
        console.log('Notifications API response:', notificationsResponse.data);
        
        const notificationsData = notificationsResponse.data.success 
          ? notificationsResponse.data.data 
          : notificationsResponse.data;
        
        console.log('Notifications data:', notificationsData);
        
        // Filter for high priority notifications that are not dismissed (show both read and unread)
        const highPriorityNotifications = notificationsData.filter(
          (notification: Notification) => 
            notification.priority === 'high' && 
            !notification.is_dismissed
        );
        
        console.log(`Found ${highPriorityNotifications.length} high priority notifications (not dismissed):`, highPriorityNotifications);
        
        // Debug photos data
        highPriorityNotifications.forEach((notification: Notification, index: number) => {
          if (notification.photos && notification.photos.length > 0) {
            console.log(`Notification ${index + 1} (${notification.title}) has ${notification.photos.length} photos:`, notification.photos);
          }
        });
        console.log(`Total notifications: ${notificationsData.length}`);
        console.log(`High priority: ${notificationsData.filter((n: Notification) => n.priority === 'high').length}`);
        console.log(`Read: ${notificationsData.filter((n: Notification) => n.is_read).length}`);
        console.log(`Dismissed: ${notificationsData.filter((n: Notification) => n.is_dismissed).length}`);
        console.log(`Active (not read): ${highPriorityNotifications.filter((n: Notification) => !n.is_read).length}`);
        console.log(`Read but not dismissed: ${highPriorityNotifications.filter((n: Notification) => n.is_read).length}`);
        setNotifications(highPriorityNotifications);

        // Fetch lands
        const landsResponse = await axiosClient.get('/lands');
        const landsData = landsResponse.data;
        setLands(landsData);

      } catch (error) {
        console.error('Error fetching notifications and lands:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Refresh data every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Helper function to calculate the center point of a polygon using geometric centroid
  const calculatePolygonCenter = (coordinates: number[][][]): google.maps.LatLngLiteral => {
    // Use the first ring of the polygon (exterior ring)
    const ring = coordinates[0];
    
    // Remove the last point if it's the same as the first (closed polygon)
    const points = ring.length > 1 && 
      ring[0][0] === ring[ring.length - 1][0] && 
      ring[0][1] === ring[ring.length - 1][1] 
      ? ring.slice(0, -1) 
      : ring;

    let totalLat = 0;
    let totalLng = 0;
    let pointCount = 0;

    // Calculate the centroid by averaging all coordinates
    points.forEach(([lng, lat]) => {
      totalLat += lat;
      totalLng += lng;
      pointCount++;
    });

    const center = {
      lat: totalLat / pointCount,
      lng: totalLng / pointCount
    };

    console.log(`Calculated center for polygon with ${pointCount} points:`, center);
    return center;
  };

  // Helper function to get land coordinates from GeoJSON
  const getLandCoordinates = (land: Land): google.maps.LatLngLiteral | null => {
    try {
      const geometry = land.geometry || land.coordinations;
      if (!geometry) {
        console.log('No geometry found for land:', land.land_name);
        return null;
      }

      const geoJson = typeof geometry === 'string' ? JSON.parse(geometry) : geometry;
      console.log('Parsing geometry for land:', land.land_name, 'GeoJSON type:', geoJson.type);
      
      // Handle GeoJSON Feature format (most common case)
      if (geoJson.type === 'Feature' && geoJson.geometry) {
        const featureGeometry = geoJson.geometry;
        console.log('Feature geometry type:', featureGeometry.type);
        
        if (featureGeometry.type === 'Polygon' && featureGeometry.coordinates && featureGeometry.coordinates[0]) {
          // Calculate the center point of the polygon
          const center = calculatePolygonCenter(featureGeometry.coordinates);
          console.log(`Land ${land.land_name} center:`, center);
          return center;
        } else if (featureGeometry.type === 'Point' && featureGeometry.coordinates) {
          // Handle Point geometry - use as is
          const [lng, lat] = featureGeometry.coordinates;
          return { lat, lng };
        } else if (featureGeometry.type === 'MultiPolygon' && featureGeometry.coordinates && featureGeometry.coordinates[0] && featureGeometry.coordinates[0][0]) {
          // Handle MultiPolygon geometry - use the first polygon's center
          return calculatePolygonCenter(featureGeometry.coordinates[0]);
        }
      }
      // Handle direct geometry types (fallback)
      else if (geoJson.type === 'Polygon' && geoJson.coordinates && geoJson.coordinates[0]) {
        // Calculate the center point of the polygon
        return calculatePolygonCenter(geoJson.coordinates);
      } else if (geoJson.type === 'Point' && geoJson.coordinates) {
        // Handle Point geometry - use as is
        const [lng, lat] = geoJson.coordinates;
        return { lat, lng };
      } else if (geoJson.type === 'MultiPolygon' && geoJson.coordinates && geoJson.coordinates[0] && geoJson.coordinates[0][0]) {
        // Handle MultiPolygon geometry - use the first polygon's center
        return calculatePolygonCenter(geoJson.coordinates[0]);
      }
      
      console.log('Unsupported geometry type:', geoJson);
      return null;
    } catch (error) {
      console.error('Error parsing land coordinates:', error, 'Geometry:', land.geometry || land.coordinations);
      return null;
    }
  };

  // Create notification markers
  const createNotificationMarkers = () => {
    if (!map || loading) return null;

    console.log(`Creating markers for ${notifications.length} notifications`);
    console.log('Notifications:', notifications);
    console.log('Lands:', lands);

    return notifications.map((notification) => {
      console.log(`Processing notification ${notification.id} for land ${notification.land_id}`);
      console.log(`Notification status - Read: ${notification.is_read}, Dismissed: ${notification.is_dismissed}, Priority: ${notification.priority}`);
      
      // Skip dismissed notifications (they shouldn't reach here due to filtering, but just in case)
      if (notification.is_dismissed) {
        console.log(`Skipping dismissed notification ${notification.id}`);
        return null;
      }
      
      const land = lands.find(l => l.id === notification.land_id);
      if (!land) {
        console.log(`Land not found for notification ${notification.id}, land_id: ${notification.land_id}`);
        return null;
      }

      console.log(`Found land: ${land.land_name} (${land.land_code})`);
      
      const coordinates = getLandCoordinates(land);
      if (!coordinates) {
        console.log(`No coordinates found for land ${land.land_name}`);
        return null;
      }

      const statusText = notification.is_read ? 'READ' : 'UNREAD';
      console.log(`Creating marker for ${statusText} notification ${notification.id} at coordinates:`, coordinates);

      return (
        <NotificationMarker
          key={notification.id}
          map={map}
          position={coordinates}
          notification={notification}
          onClick={() => {
            // Mark as read when clicked
            //markNotificationAsRead(notification.id);
            // Call the original click handler if provided
            onNotificationClick?.(notification);
          }}
          onDismiss={() => {
            // Dismiss notification
            dismissNotification(notification.id);
          }}
        />
      );
    }).filter(Boolean);
  };

  if (loading) {
    return null;
  }

  return (
    <>
      {createNotificationMarkers()}
    </>
  );
};

export default NotificationMarkersManager;
