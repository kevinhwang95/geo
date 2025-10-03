import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  MapPin, 
  Bell, 
  Eye,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
  Plus,
  LogOut
} from 'lucide-react';
import { useAuthStore, canManageLands } from '@/stores/authStore';
import axiosClient from '@/api/axiosClient';
import TerraDrawingTools from '@/components/core/TerraDrawingTools';

interface Notification {
  id: number;
  land_id: number;
  type: 'harvest_due' | 'harvest_overdue' | 'maintenance_due' | 'comment_added' | 'photo_added';
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  land_name: string;
  land_code: string;
  harvest_status?: 'overdue' | 'due_soon' | 'normal';
}

interface Land {
  id: number;
  land_name: string;
  land_code: string;
  size: number;
  plant_type_name: string;
  category_name: string;
  category_color: string;
  harvest_status: 'overdue' | 'due_soon' | 'normal';
  next_harvest_date: string;
  created_at: string;
}

const Dashboard: React.FC = () => {
  const { user, logout } = useAuthStore();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [lands, setLands] = useState<Land[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Check if user is authenticated
      if (!user) {
        setError('User not authenticated');
        setIsLoading(false);
        return;
      }

      // Load notifications
      const notificationsResponse = await axiosClient.get('/notifications?limit=10');
      setNotifications(notificationsResponse.data.data || []);
      setUnreadCount(notificationsResponse.data.data?.filter((n: Notification) => !n.is_read).length || 0);

      // Load lands
      const landsResponse = await axiosClient.get('/lands');
      setLands(landsResponse.data.data || []);

    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const markNotificationAsRead = async (notificationId: number) => {
    try {
      await axiosClient.post(`/notifications/mark-read/${notificationId}`);
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const dismissNotification = async (notificationId: number) => {
    try {
      await axiosClient.post(`/notifications/dismiss/${notificationId}`);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to dismiss notification:', error);
    }
  };

  const handleLogout = async () => {
    try {
      // Call the backend logout endpoint to invalidate tokens
      await axiosClient.post('/oauth/logout');
    } catch (error) {
      // Even if the backend call fails, we should still logout locally
      console.error('Logout API call failed:', error);
    } finally {
      // Always logout locally
      logout();
      // Redirect to login page
      window.location.href = '/login';
    }
  };

  const getHarvestStatusIcon = (status: string) => {
    switch (status) {
      case 'overdue':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'due_soon':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
  };

  const getHarvestStatusBadge = (status: string) => {
    switch (status) {
      case 'overdue':
        return <Badge variant="destructive">Overdue</Badge>;
      case 'due_soon':
        return <Badge variant="secondary">Due Soon</Badge>;
      default:
        return <Badge variant="outline">Normal</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <MapPin className="h-8 w-8 text-green-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">
                Land Management Dashboard
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Bell className="h-5 w-5 text-gray-500" />
                {unreadCount > 0 && (
                  <Badge variant="destructive" className="text-xs">
                    {unreadCount}
                  </Badge>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <img
                  src={user?.avatar_url || '/default-avatar.png'}
                  alt={user?.first_name}
                  className="h-8 w-8 rounded-full"
                />
                <span className="text-sm font-medium text-gray-700">
                  {user?.first_name} {user?.last_name}
                </span>
                <Badge variant="outline" className="text-xs">
                  {user?.role}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="text-gray-600 hover:text-gray-900"
                >
                  <LogOut className="h-4 w-4 mr-1" />
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="map" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="lands">Lands</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="map">
              <Eye className="h-4 w-4 mr-2" />
              Map
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Lands</CardTitle>
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{lands.length}</div>
                  <p className="text-xs text-muted-foreground">
                    Active land parcels
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Harvest Due</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {lands.filter(l => l.harvest_status === 'due_soon').length}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Within 7 days
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Overdue</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">
                    {lands.filter(l => l.harvest_status === 'overdue').length}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Past harvest date
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Unread Notifications</CardTitle>
                  <Bell className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{unreadCount}</div>
                  <p className="text-xs text-muted-foreground">
                    New notifications
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Lands */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Lands</CardTitle>
                <CardDescription>
                  Latest land registrations and updates
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  <div className="space-y-4">
                    {lands.slice(0, 5).map((land) => (
                      <div key={land.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div 
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: land.category_color }}
                          />
                          <div>
                            <h4 className="font-medium">{land.land_name}</h4>
                            <p className="text-sm text-gray-500">{land.land_code}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {getHarvestStatusIcon(land.harvest_status)}
                          {getHarvestStatusBadge(land.harvest_status)}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="lands" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">All Lands</h2>
              {canManageLands() && (
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Land
                </Button>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {lands.map((land) => (
                <Card key={land.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{land.land_name}</CardTitle>
                      {getHarvestStatusIcon(land.harvest_status)}
                    </div>
                    <CardDescription>{land.land_code}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Size:</span>
                        <span className="text-sm font-medium">{land.size} m²</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Plant Type:</span>
                        <span className="text-sm font-medium">{land.plant_type_name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Category:</span>
                        <div className="flex items-center space-x-2">
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: land.category_color }}
                          />
                          <span className="text-sm font-medium">{land.category_name}</span>
                        </div>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Next Harvest:</span>
                        <span className="text-sm font-medium">
                          {new Date(land.next_harvest_date).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="mt-4 flex justify-between">
                      {getHarvestStatusBadge(land.harvest_status)}
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Notifications</h2>
              <Button variant="outline" onClick={loadDashboardData}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>

            <div className="space-y-4">
              {notifications.map((notification) => (
                <Card key={notification.id} className={!notification.is_read ? 'border-l-4 border-l-blue-500' : ''}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h4 className="font-medium">{notification.title}</h4>
                          {!notification.is_read && (
                            <Badge variant="secondary" className="text-xs">New</Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <span>Land: {notification.land_name} ({notification.land_code})</span>
                          <span>{new Date(notification.created_at).toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        {!notification.is_read && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => markNotificationAsRead(notification.id)}
                          >
                            Mark Read
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => dismissNotification(notification.id)}
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
          </TabsContent>

          <TabsContent value="map" className="space-y-6">
              <Card className="h-[500px]">
              <CardHeader>
                <CardTitle>Interactive Map</CardTitle>
                <CardDescription>
                  View and manage land boundaries on the map
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0 h-full">
                <TerraDrawingTools />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;
