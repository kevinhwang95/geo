import React, { useEffect, useState } from 'react';
import axiosClient from '@/api/axiosClient';
import { useNotificationStore } from '@/stores/notificationStore';
import { notificationPollingService } from '@/services/NotificationPollingService';
import type { Notification } from '@/types/notification';
import NotificationMarker from './NotificationMarker';

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
}

const NotificationMarkersManager: React.FC<NotificationMarkersManagerProps> = ({
  map,
  onNotificationClick,
  onNotificationDismissed
}) => {
  // Use notification store instead of local state
  const { notifications, loading: notificationsLoading } = useNotificationStore();
  const [lands, setLands] = useState<Land[]>([]);
  const [loading, setLoading] = useState(true);

  // Function to dismiss notification
  const dismissNotification = async (notificationId: number) => {
    try {
      await notificationPollingService.markAsDismissed(notificationId);
      console.log('Notification dismissed:', notificationId);
      
      // Notify parent component that notification was dismissed
      onNotificationDismissed?.();
    } catch (error) {
      console.error('Error dismissing notification:', error);
    }
  };

  // Fetch lands only (notifications are handled by the store)
  useEffect(() => {
    const fetchLands = async () => {
      try {
        setLoading(true);
        
        // Fetch lands
        const landsResponse = await axiosClient.get('/lands');
        const landsData = landsResponse.data;
        setLands(landsData);

      } catch (error) {
        console.error('Error fetching lands:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLands();
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
    if (!map || loading || notificationsLoading) return null;

    // Filter for high priority notifications that are not dismissed (show both read and unread)
    const highPriorityNotifications = notifications.filter(
      (notification: Notification) => 
        notification.priority === 'high' && 
        !notification.is_dismissed
    );

    console.log(`Creating markers for ${highPriorityNotifications.length} high priority notifications`);
    console.log('High priority notifications:', highPriorityNotifications);
    console.log('Lands:', lands);

    return highPriorityNotifications.map((notification) => {
      console.log(`Processing notification ${notification.id} for land ${notification.land_id}`);
      console.log(`Notification status - Read: ${notification.is_read}, Dismissed: ${notification.is_dismissed}, Priority: ${notification.priority}`);
      
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
