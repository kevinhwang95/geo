import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNotificationStore } from '@/stores/notificationStore';
import { notificationPollingService } from '@/services/NotificationPollingService';
import { Bell, RefreshCw, Clock, AlertTriangle } from 'lucide-react';

export const NotificationDebugger: React.FC = () => {
  const { 
    notifications, 
    unreadCount, 
    highPriorityCount, 
    totalCount,
    loading,
    error,
    lastUpdate,
    isPolling
  } = useNotificationStore();

  const handleRefresh = () => {
    notificationPollingService.refreshNow();
  };

  const formatLastUpdate = (date: Date | null) => {
    if (!date) return 'Never';
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  const getStatusColor = (isPolling: boolean, error: string | null) => {
    if (error) return 'destructive';
    if (isPolling) return 'default';
    return 'secondary';
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notification Polling
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status */}
        <div className="flex items-center justify-between">
          <span className="text-sm">Status:</span>
          <Badge variant={getStatusColor(isPolling, error)}>
            {error ? 'Error' : isPolling ? 'Polling' : 'Stopped'}
          </Badge>
        </div>

        {/* Counts */}
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex items-center justify-between">
            <span>Total:</span>
            <Badge variant="outline">{totalCount}</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span>Unread:</span>
            <Badge variant="outline">{unreadCount}</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span>High Priority:</span>
            <Badge variant="destructive">{highPriorityCount}</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span>Loading:</span>
            <Badge variant={loading ? 'default' : 'secondary'}>
              {loading ? 'Yes' : 'No'}
            </Badge>
          </div>
        </div>

        {/* Last Update */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span className="text-sm">Last Update:</span>
          </div>
          <span className="text-xs text-gray-600">
            {formatLastUpdate(lastUpdate)}
          </span>
        </div>

        {/* Error Display */}
        {error && (
          <div className="flex items-center gap-2 p-2 bg-red-50 rounded text-red-700 text-sm">
            <AlertTriangle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Button 
            size="sm" 
            variant="outline" 
            onClick={handleRefresh}
            disabled={loading}
            className="flex-1"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Recent Notifications */}
        <details className="text-xs">
          <summary className="cursor-pointer text-gray-600 hover:text-gray-800">
            Recent Notifications ({Math.min(notifications.length, 5)})
          </summary>
          <div className="mt-2 space-y-1 max-h-32 overflow-y-auto">
            {notifications.slice(0, 5).map((notification) => (
              <div key={notification.id} className="p-2 bg-gray-50 rounded text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{notification.title}</span>
                  <Badge variant={notification.priority === 'high' ? 'destructive' : 'outline'}>
                    {notification.priority}
                  </Badge>
                </div>
                <div className="text-gray-600 truncate">
                  {notification.message}
                </div>
                <div className="text-gray-500">
                  {notification.land_name || 'No land'}
                </div>
              </div>
            ))}
            {notifications.length === 0 && (
              <div className="text-gray-500 text-center py-2">No notifications</div>
            )}
          </div>
        </details>
      </CardContent>
    </Card>
  );
};
