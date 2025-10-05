import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Bell, RefreshCw, Filter, CheckCircle, XCircle, AlertTriangle, Info, Camera, MessageSquare, MapPin } from 'lucide-react';
import axiosClient from '@/api/axiosClient';
import { useMapStore } from '@/stores/mapStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { notificationPollingService } from '@/services/NotificationPollingService';
import NotificationDetailDialog from './NotificationDetailDialog';

// Notification interfaces are now imported from the store

interface NotificationCenterProps {
  onNavigateToMap?: () => void;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ onNavigateToMap }) => {
  // Use notification store instead of local state
  const { 
    notifications, 
    stats, 
    loading, 
    error, 
    unreadCount
  } = useNotificationStore();
  
  const [filterType, setFilterType] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedNotificationId, setSelectedNotificationId] = useState<number | null>(null);

  // Get map store for land navigation
  const { centerMapOnLand } = useMapStore();

  const loadNotifications = async () => {
    // Use the polling service to refresh notifications silently
    notificationPollingService.refreshNow(true);
  };

  useEffect(() => {
    loadNotifications();
  }, [filterType, filterPriority]);

  const handleMarkAsRead = async (notificationId: number) => {
    try {
      await notificationPollingService.markAsRead(notificationId);
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const handleDismissNotification = async (notificationId: number) => {
    try {
      await notificationPollingService.markAsDismissed(notificationId);
    } catch (error) {
      console.error('Failed to dismiss notification:', error);
    }
  };

  // Function to navigate to land on map
  const handleViewLandOnMap = async (landId: number) => {
    console.log('handleViewLandOnMap called with landId:', landId);
    
    try {
      // First, switch to the Map tab
      if (onNavigateToMap) {
        console.log('Switching to Map tab...');
        onNavigateToMap();
      }
      
      // Fetch the specific land data
      console.log('Fetching land data from API...');
      const response = await axiosClient.get(`/lands/${landId}`);
      console.log('Land API response status:', response.status);
      console.log('Land API response data:', response.data);
      
      if (response.data && !response.data.error) {
        const land = response.data;
        console.log('Found land:', land);
        console.log('Land name:', land.land_name);
        console.log('Land coordinations:', land.coordinations);
        
        // Center map on the selected land and show InfoWindow
        console.log('Calling centerMapOnLand...');
        centerMapOnLand(land);
        console.log('centerMapOnLand function called successfully');
      } else {
        console.error('Land not found or error in response:', response.data);
      }
    } catch (error) {
      console.error('Error fetching land data:', error);
      // console.error('Error details:', {
      //   message: error.message,
      //   status: error.response?.status,
      //   data: error.response?.data
      // });
    }
  };

  const dismissAll = async () => {
    try {
      await axiosClient.post('/notifications/dismiss-all');
      // Refresh notifications from the store after dismissing all
      notificationPollingService.refreshNow(true);
    } catch (error) {
      console.error('Failed to dismiss all notifications:', error);
    }
  };

  const createHarvestNotifications = async () => {
    try {
      await axiosClient.post('/notifications/create-harvest');
      await loadNotifications();
    } catch (error) {
      console.error('Failed to create harvest notifications:', error);
    }
  };

  const handleNotificationClick = (notificationId: number) => {
    setSelectedNotificationId(notificationId);
    setDetailDialogOpen(true);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'harvest_due':
      case 'harvest_overdue':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'maintenance_due':
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      case 'comment_added':
        return <MessageSquare className="h-4 w-4 text-green-500" />;
      case 'photo_added':
        return <Camera className="h-4 w-4 text-purple-500" />;
      case 'weather_alert':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Info className="h-4 w-4 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'border-l-red-500 bg-red-50';
      case 'medium':
        return 'border-l-yellow-500 bg-yellow-50';
      case 'low':
        return 'border-l-green-500 bg-green-50';
      default:
        return 'border-l-gray-500 bg-gray-50';
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge variant="destructive" className="text-xs">High</Badge>;
      case 'medium':
        return <Badge variant="secondary" className="text-xs">Medium</Badge>;
      case 'low':
        return <Badge variant="outline" className="text-xs">Low</Badge>;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading notifications...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <XCircle className="h-8 w-8 text-red-500 mx-auto mb-4" />
          <p className="text-red-600">{error}</p>
          <Button onClick={loadNotifications} className="mt-4">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <h2 className="text-2xl font-bold">Notifications</h2>
          {unreadCount > 0 && (
            <Badge variant="destructive" className="text-sm">
              {unreadCount} unread
            </Badge>
          )}
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={createHarvestNotifications}>
            <AlertTriangle className="h-4 w-4 mr-2" />
            Check Harvest
          </Button>
          <Button variant="outline" onClick={loadNotifications}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          {notifications.length > 0 && (
            <Button variant="ghost" onClick={dismissAll}>
              Dismiss All
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Type</label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="harvest_due">Harvest Due</SelectItem>
                  <SelectItem value="harvest_overdue">Harvest Overdue</SelectItem>
                  <SelectItem value="maintenance_due">Maintenance Due</SelectItem>
                  <SelectItem value="comment_added">Comments</SelectItem>
                  <SelectItem value="photo_added">Photos</SelectItem>
                  <SelectItem value="weather_alert">Weather Alerts</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Priority</label>
              <Select value={filterPriority} onValueChange={setFilterPriority}>
                <SelectTrigger>
                  <SelectValue placeholder="All priorities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="high">High Priority</SelectItem>
                  <SelectItem value="medium">Medium Priority</SelectItem>
                  <SelectItem value="low">Low Priority</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      {stats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Notification Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {stats.map((stat) => (
                <div key={stat.type} className="text-center">
                  <div className="text-2xl font-bold">{stat.count}</div>
                  <div className="text-sm text-gray-600 capitalize">
                    {stat.type.replace('_', ' ')}
                  </div>
                  <div className="text-xs text-gray-500">
                    {stat.unread_count} unread
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notifications List */}
      <div className="space-y-4">
        {notifications.map((notification) => (
          <Card 
            key={notification.id} 
            className={`${!notification.is_read ? 'border-l-4 border-l-blue-500' : ''} ${getPriorityColor(notification.priority)} cursor-pointer hover:shadow-md transition-shadow`}
            onClick={() => handleNotificationClick(notification.id)}
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  {getNotificationIcon(notification.type)}
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h4 className="font-medium">{notification.title}</h4>
                      {!notification.is_read && (
                        <Badge variant="secondary" className="text-xs">New</Badge>
                      )}
                      {getPriorityBadge(notification.priority)}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      {notification.land_name && (
                        <span>Land: {notification.land_name} ({notification.land_code})</span>
                      )}
                      <span>{new Date(notification.created_at).toLocaleString()}</span>
                      {notification.harvest_status && (
                        <Badge 
                          variant={notification.harvest_status === 'overdue' ? 'destructive' : 'secondary'}
                          className="text-xs"
                        >
                          {notification.harvest_status.replace('_', ' ')}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  {notification.land_id && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewLandOnMap(notification.land_id);
                      }}
                      title="View land on map"
                    >
                      <MapPin className="h-4 w-4 mr-1" />
                      View on Map
                    </Button>
                  )}
                  {!notification.is_read && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMarkAsRead(notification.id);
                      }}
                    >
                      Mark Read
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDismissNotification(notification.id);
                    }}
                  >
                    Dismiss
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {notifications.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications</h3>
              <p className="text-gray-500">You're all caught up! No new notifications at the moment.</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Notification Detail Dialog */}
      <NotificationDetailDialog
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        notificationId={selectedNotificationId}
        onNavigateToMap={onNavigateToMap}
      />
    </div>
  );
};

export default NotificationCenter;
