import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Bell, RefreshCw, Filter, CheckCircle, XCircle, AlertTriangle, Info, Camera, MessageSquare, MapPin, X, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  
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

  // Client-side filtering as fallback
  const filteredNotifications = notifications.filter(notification => {
    const typeMatch = filterType === 'all' || notification.type === filterType;
    const priorityMatch = filterPriority === 'all' || notification.priority === filterPriority;
    return typeMatch && priorityMatch;
  });

  const loadNotifications = async () => {
    // Use the polling service to refresh notifications with current filters
    await notificationPollingService.fetchNotifications(true, {
      type: filterType,
      priority: filterPriority
    });
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
      console.log(`[NotificationCenter] Attempting to dismiss notification ${notificationId}`);
      await notificationPollingService.markAsDismissed(notificationId);
      console.log(`[NotificationCenter] Successfully dismissed notification ${notificationId}`);
      
      // Optionally refresh the notifications to ensure UI is updated
      // This is redundant since the store should update automatically, but helps with debugging
      setTimeout(() => {
        notificationPollingService.refreshNow(true);
      }, 100);
    } catch (error) {
      console.error(`[NotificationCenter] Failed to dismiss notification ${notificationId}:`, error);
      // You could add a toast notification here to inform the user
    }
  };

  // Function to navigate to land on map with notification context
  const handleViewLandOnMap = async (landId: number, notificationData?: any) => {
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
        
        // Center map on the selected land and show InfoWindow with notification context
        console.log('Calling centerMapOnLand...');
        if (notificationData) {
          console.log('Including notification context:', notificationData.title);
          centerMapOnLand(land, {
            id: notificationData.id,
            title: notificationData.title,
            message: notificationData.message,
            type: notificationData.type,
            priority: notificationData.priority,
            created_at: notificationData.created_at
          });
        } else {
          centerMapOnLand(land);
        }
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
      const response = await axiosClient.post('/notifications/create-harvest');
      console.log('Harvest notifications created:', response.data);
      
      // Show success message
      if (response.data.success) {
        const count = response.data.count || 0;
        const totalChecked = response.data.total_lands_checked || 0;
        console.log(`Created ${count} harvest notifications from ${totalChecked} lands checked`);
      }
      
      // Refresh notifications to show new ones
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
        return <Badge variant="destructive" className="text-xs">{t('badges.high')}</Badge>;
      case 'medium':
        return <Badge variant="secondary" className="text-xs">{t('badges.medium')}</Badge>;
      case 'low':
        return <Badge variant="outline" className="text-xs">{t('badges.low')}</Badge>;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>{t('notifications.loading')}</p>
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
            {t('notifications.retry')}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div className="flex items-center space-x-4">
          <h2 className="text-2xl font-bold">{t('notifications.title')}</h2>
          {unreadCount > 0 && (
            <Badge variant="destructive" className="text-sm">
              {unreadCount} {t('notifications.unread')}
            </Badge>
          )}
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:space-x-2">
          <Button variant="outline" onClick={createHarvestNotifications} className="w-full sm:w-auto">
            <AlertTriangle className="h-4 w-4 mr-2" />
            {t('notifications.generateHarvestAlerts')}
          </Button>
          <Button variant="outline" onClick={loadNotifications} className="w-full sm:w-auto">
            <RefreshCw className="h-4 w-4 mr-2" />
            {t('notifications.refresh')}
          </Button>
          {filteredNotifications.length > 0 && (
            <Button 
              variant="outline" 
              onClick={dismissAll}
              className="text-gray-600 hover:text-red-600 hover:border-red-300 hover:bg-red-50 transition-colors duration-200 w-full sm:w-auto"
              title={t('notifications.dismissAllTooltip')}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {t('notifications.dismissAll')}
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="h-4 w-4 mr-2" />
            {t('notifications.filters')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 sm:space-x-4">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">{t('notifications.type')}</label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue placeholder={t('notifications.allTypes')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('notifications.allTypesOption')}</SelectItem>
                  <SelectItem value="harvest_due">{t('notifications.harvestDue')}</SelectItem>
                  <SelectItem value="harvest_overdue">{t('notifications.harvestOverdue')}</SelectItem>
                  <SelectItem value="maintenance_due">{t('notifications.maintenanceDue')}</SelectItem>
                  <SelectItem value="comment_added">{t('notifications.comments')}</SelectItem>
                  <SelectItem value="photo_added">{t('notifications.photos')}</SelectItem>
                  <SelectItem value="weather_alert">{t('notifications.weatherAlerts')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">{t('notifications.priority')}</label>
              <Select value={filterPriority} onValueChange={setFilterPriority}>
                <SelectTrigger>
                  <SelectValue placeholder={t('notifications.allPriorities')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('notifications.allPrioritiesOption')}</SelectItem>
                  <SelectItem value="high">{t('notifications.highPriority')}</SelectItem>
                  <SelectItem value="medium">{t('notifications.mediumPriority')}</SelectItem>
                  <SelectItem value="low">{t('notifications.lowPriority')}</SelectItem>
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
            <CardTitle>{t('notifications.statistics')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {stats.map((stat) => (
                <div key={stat.type} className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">{stat.count}</div>
                  <div className="text-sm text-gray-600 capitalize">
                    {stat.type.replace('_', ' ')}
                  </div>
                  <div className="text-xs text-gray-500">
                    {stat.unread_count} {t('notifications.unread')}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notifications List */}
      <div className="space-y-4">
        {filteredNotifications.map((notification) => (
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
                        <Badge variant="secondary" className="text-xs">{t('notifications.new')}</Badge>
                      )}
                      {getPriorityBadge(notification.priority)}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      {notification.land_name && (
                        <span>{t('notifications.land')}: {notification.land_name} ({notification.land_code})</span>
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
                {/* Mobile-friendly button layout */}
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-2 sm:ml-4 mt-3 sm:mt-0">
                  {notification.land_id && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewLandOnMap(notification.land_id, notification);
                      }}
                      className="text-gray-600 hover:text-green-600 hover:border-green-300 hover:bg-green-50 transition-colors duration-200 w-full sm:w-auto"
                      title={t('notifications.viewOnMapTooltip')}
                    >
                      <MapPin className="h-4 w-4 sm:mr-1" />
                      <span className="sm:inline">{t('notifications.viewOnMap')}</span>
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
                      className="text-gray-600 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50 transition-colors duration-200 w-full sm:w-auto"
                      title={t('notifications.markReadTooltip')}
                    >
                      <CheckCircle className="h-4 w-4 sm:mr-1" />
                      <span className="sm:inline">{t('notifications.markRead')}</span>
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDismissNotification(notification.id);
                    }}
                    className="text-gray-600 hover:text-red-600 hover:border-red-300 hover:bg-red-50 transition-colors duration-200 w-full sm:w-auto"
                    title={t('notifications.dismissTooltip')}
                  >
                    <X className="h-4 w-4 sm:mr-1" />
                    <span className="sm:inline">{t('notifications.dismiss')}</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {filteredNotifications.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">{t('notifications.noNotifications')}</h3>
              <p className="text-gray-500">{t('notifications.noNotificationsMessage')}</p>
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
