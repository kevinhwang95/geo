import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import NavigationMenu from '@/components/core/NavigationMenu';
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
  LogOut,
  Search
} from 'lucide-react';
import { useAuthStore, canManageLands, canManageUsers, canManageTeams, canManageWorkAssignments } from '@/stores/authStore';
import { useMapStore } from '@/stores/mapStore';
import axiosClient from '@/api/axiosClient';
import TerraDrawingTools from '@/components/core/TerraDrawingTools';
import NotificationCenter from '@/components/core/NotificationCenter';
import CreateNotificationDialog from '@/components/core/CreateNotificationDialog';
import UserManagement from '@/components/admin/UserManagement';
import TeamManagement from '@/components/admin/TeamManagement';
import WorkAssignmentManagement from '@/components/admin/WorkAssignmentManagement';
import { Avatar } from '@/components/ui/avatar';
import { useGenericCrud } from '@/hooks/useGenericCrud';

interface Notification {
  id: number;
  land_id: number;
  user_id: number;
  type: 'harvest_due' | 'harvest_overdue' | 'maintenance_due' | 'comment_added' | 'photo_added';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high';
  is_read: boolean;
  is_dismissed: boolean;
  created_at: string;
  land_name?: string;
  land_code?: string;
  harvest_status?: 'overdue' | 'due_soon' | 'normal';
}

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
  next_harvest_date: string;
  coordinations: string;
  geometry: string;
  size: number;
  owner_name: string;
  notes: string;
  is_active: boolean;
  created_by: number;
  created_at: string;
  updated_at: string;
  harvest_status: 'overdue' | 'due_soon' | 'normal';
}

const Dashboard: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuthStore();
  const { centerMapOnLand } = useMapStore();
  // const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [highPriorityCount, setHighPriorityCount] = useState(0);
  const [activeSection, setActiveSection] = useState<string>('overview');
  const [landSearchTerm, setLandSearchTerm] = useState('');
  const [userNames, setUserNames] = useState<Record<number, string>>({});
  const [notificationDialogOpen, setNotificationDialogOpen] = useState(false);
  const [selectedLandForNotification, setSelectedLandForNotification] = useState<Land | null>(null);

  // Use the same hook that other components use successfully
  const { data: lands, loading: landsLoading, error: landsError } = useGenericCrud<Land>('lands');

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Fetch user names when lands data is loaded
  useEffect(() => {
    if (lands && lands.length > 0) {
      console.log('Lands data:', lands);
      const userIds = lands.map(land => land.created_by).filter(id => id);
      console.log('Extracted user IDs:', userIds);
      if (userIds.length > 0) {
        fetchUserNames(userIds);
      }
    }
  }, [lands]);

  // Function to fetch user names
  const fetchUserNames = async (userIds: number[]) => {
    try {
      const uniqueUserIds = [...new Set(userIds)];
      const userNamesMap: Record<number, string> = {};
      
      console.log('Fetching user names for IDs:', uniqueUserIds);
      
      for (const userId of uniqueUserIds) {
        try {
          console.log(`Fetching user ${userId}...`);
          const response = await axiosClient.get(`/users/${userId}`);
          console.log(`User ${userId} response:`, response.data);
          
          if (response.data.first_name) {
            // Handle direct response format (API returns snake_case)
            const userData = response.data;
            const fullName = `${userData.first_name} ${userData.last_name}`.trim();
            userNamesMap[userId] = fullName;
            console.log(`User ${userId} name: ${fullName}`);
          } else {
            console.warn(`No user data found for ${userId}`);
            userNamesMap[userId] = `User #${userId}`;
          }
        } catch (error) {
          console.warn(`Failed to fetch user ${userId}:`, error);
          userNamesMap[userId] = `User #${userId}`;
        }
      }
      
      console.log('Final user names map:', userNamesMap);
      setUserNames(userNamesMap);
    } catch (error) {
      console.error('Error fetching user names:', error);
    }
  };

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Check if user is authenticated
      console.log('User from auth store:', user);
      console.log('Auth tokens:', useAuthStore.getState().tokens);
      
      if (!user) {
        setError('User not authenticated');
        setIsLoading(false);
        return;
      }

      // Load notifications
      const notificationsResponse = await axiosClient.get('/notifications?limit=10');
      // setNotifications(notificationsResponse.data.data || []);
      const notifications = notificationsResponse.data.data || [];
      setUnreadCount(notifications.filter((n: Notification) => !n.is_read).length || 0);
      setHighPriorityCount(notifications.filter((n: Notification) => n.priority === 'high' && !n.is_dismissed).length || 0);

      // Lands are now loaded by the useGenericCrud hook automatically
      console.log('Lands loaded by hook:', lands?.length || 0, 'lands');

    } catch (error: any) {
      console.error('Dashboard data loading error:', error);
      console.error('Error response:', error.response);
      setError(error.response?.data?.message || 'Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  // const markNotificationAsRead = async (notificationId: number) => {
  //   try {
  //     await axiosClient.post(`/notifications/mark-read/${notificationId}`);
  //     setNotifications(prev => 
  //       prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
  //     );
  //     setUnreadCount(prev => Math.max(0, prev - 1));
  //   } catch (error) {
  //     console.error('Failed to mark notification as read:', error);
  //   }
  // };

  // const dismissNotification = async (notificationId: number) => {
  //   try {
  //     await axiosClient.post(`/notifications/dismiss/${notificationId}`);
  //     setNotifications(prev => prev.filter(n => n.id !== notificationId));
  //     setUnreadCount(prev => Math.max(0, prev - 1));
  //   } catch (error) {
  //     console.error('Failed to dismiss notification:', error);
  //   }
  // };

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

  const handleNotificationClick = () => {
    setActiveSection('notifications');
  };

  const handleAddLand = () => {
    // For now, switch to map tab where users can draw new lands
    setActiveSection('map');
  };

  const handleViewLandDetails = (landId: number) => {
    console.log('handleViewLandDetails called with landId:', landId);
    console.log('Available lands:', lands?.map(l => ({ id: l.id, name: l.land_name })));
    
    // Find the land by ID
    const land = lands?.find(l => l.id === landId);
    console.log('Found land:', land);
    
    if (land) {
      console.log('Switching to map tab and centering on land:', land.land_name);
      // Switch to map tab
      setActiveSection('map');
      // Center map on the selected land and show InfoWindow
      centerMapOnLand(land);
      console.log('centerMapOnLand function called');
    } else {
      console.error('Land not found with ID:', landId);
    }
  };

  const handleCreateNotification = (landId: number) => {
    const land = lands?.find(l => l.id === landId);
    if (land) {
      setSelectedLandForNotification(land);
      setNotificationDialogOpen(true);
    }
  };

  const handleNotificationCreated = () => {
    // Refresh notifications data
    loadDashboardData();
  };

  // Test function to verify map store
  // const testMapStore = () => {
  //   console.log('Testing map store...');
  //   const testLand = lands?.[0];
  //   if (testLand) {
  //     console.log('Testing with land:', testLand.land_name);
  //     centerMapOnLand(testLand);
  //   }
  // };

  // Test function specifically for InfoWindow
  // const testInfoWindow = () => {
  //   console.log('Testing InfoWindow specifically...');
  //   const testLand = lands?.[0];
  //   if (testLand) {
  //     console.log('Testing InfoWindow with land:', testLand.land_name);

  //     setActiveSection('map');
  //     // Use a small delay to ensure map is ready
  //     setTimeout(() => {
  //       centerMapOnLand(testLand);
  //     }, 500);
  //   }
  // };

  // const testSimpleInfoWindow = () => {
  //   console.log('Testing simple InfoWindow...');
  //   setActiveTab('map');
  //   setTimeout(() => {
  //     // This will trigger the map centering which should show InfoWindow
  //     const testLand = lands?.[0];
  //     if (testLand) {
  //       console.log('Testing simple InfoWindow with land:', testLand.land_name);
  //       centerMapOnLand(testLand);
  //     }
  //   }, 1000);
  // };

  // Filter lands based on search term
  const filteredLands = (lands || []).filter(land => 
    land.land_name.toLowerCase().includes(landSearchTerm.toLowerCase()) ||
    land.land_code.toLowerCase().includes(landSearchTerm.toLowerCase()) ||
    land.location.toLowerCase().includes(landSearchTerm.toLowerCase()) ||
    land.plant_type_name.toLowerCase().includes(landSearchTerm.toLowerCase()) ||
    land.category_name.toLowerCase().includes(landSearchTerm.toLowerCase())
  );

  // Debug logging
  console.log('Dashboard - Authentication state:', { isAuthenticated, user: user?.first_name });
  console.log('Total lands from hook:', lands?.length || 0);
  console.log('Filtered lands:', filteredLands.length);
  console.log('Search term:', landSearchTerm);
  console.log('Lands loading:', landsLoading);

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

  // Don't render if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Authentication Required</h1>
          <p className="text-gray-600">Please log in to access the dashboard.</p>
        </div>
      </div>
    );
  }

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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex flex-col">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-lg border-b border-gray-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="relative">
                <MapPin className="h-8 w-8 text-green-600 mr-3 drop-shadow-sm" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Land Management Dashboard
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <div 
                className="flex items-center space-x-2 cursor-pointer hover:bg-purple-50 p-2 rounded-lg transition-all duration-200 hover:shadow-md"
                onClick={handleNotificationClick}
                title="Click to view notifications"
              >
                <div className="relative">
                  <Bell className="h-5 w-5 text-gray-500 hover:text-purple-600 transition-colors" />
                  {unreadCount > 0 && (
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  )}
                </div>
                {unreadCount > 0 && (
                  <Badge variant="destructive" className="text-xs font-bold shadow-sm">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Badge>
                )}
              </div>
              <div className="flex items-center space-x-2">
                {/* <Button variant="outline" size="sm" onClick={testMapStore}>
                  Test Map Store
                </Button>
                <Button variant="outline" size="sm" onClick={testInfoWindow}>
                  Test InfoWindow
                </Button>
                <Button variant="outline" size="sm" onClick={testSimpleInfoWindow}>
                  Simple Test
                </Button> */}
                <Avatar
                  src={user?.avatar_url}
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

      <div className="flex-1 flex flex-col">
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <NavigationMenu 
          activeSection={activeSection} 
          onSectionChange={setActiveSection} 
          unreadCount={unreadCount}
          highPriorityCount={highPriorityCount}
        />

        {/* Main Content Area */}
        <div className="flex-1 overflow-auto">
          {activeSection === 'overview' && (
            <div className="space-y-6 p-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              <Card className="hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-br from-blue-50 to-blue-100/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-blue-700">Total Lands</CardTitle>
                  <MapPin className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-900">{lands?.length || 0}</div>
                  <p className="text-xs text-blue-600">
                    Active land parcels
                  </p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-br from-orange-50 to-orange-100/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-orange-700">Harvest Due</CardTitle>
                  <Clock className="h-4 w-4 text-orange-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-900">
                    {lands?.filter(l => l.harvest_status === 'due_soon').length || 0}
                  </div>
                  <p className="text-xs text-orange-600">
                    Within 7 days
                  </p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-br from-red-50 to-red-100/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-red-700">Overdue</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-900">
                    {lands?.filter(l => l.harvest_status === 'overdue').length || 0}
                  </div>
                  <p className="text-xs text-red-600">
                    Past harvest date
                  </p>
                </CardContent>
              </Card>

              <Card 
                className="cursor-pointer hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-br from-purple-50 to-purple-100/50"
                onClick={handleNotificationClick}
                title="Click to view notifications"
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-purple-700">Unread Notifications</CardTitle>
                  <Bell className="h-4 w-4 text-purple-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-900">{unreadCount}</div>
                  <p className="text-xs text-purple-600">
                    New notifications
                  </p>
                </CardContent>
              </Card>

              <Card 
                className="cursor-pointer hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-br from-red-50 to-red-100/50"
                onClick={() => setActiveSection('map')}
                title="Click to view map with notification markers"
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-red-700">High Priority</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-900">{highPriorityCount}</div>
                  <p className="text-xs text-red-600">
                    Urgent notifications
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Lands */}
            <Card className="flex flex-col min-h-0">
              <CardHeader className="flex-shrink-0">
                <CardTitle>Recent Lands</CardTitle>
                <CardDescription>
                  Latest land registrations and updates
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 min-h-0">
                <ScrollArea className="h-[min(64vh,400px)]">
                  <div className="space-y-4">
                    {(lands || []).slice(0, 5).map((land) => (
                      <div 
                        key={land.id} 
                        className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={() => handleViewLandDetails(land.id)}
                        title="Click to view land details on map"
                      >
                        <div className="flex items-center space-x-4">
                          <div 
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: land.category_color }}
                          />
                          <div className="flex-1">
                            <h4 className="font-medium">{land.land_name}</h4>
                            <p className="text-sm text-gray-500">{land.land_code}</p>
                            <div className="mt-1 space-y-1">
                              <p className="text-xs text-gray-400">
                                📍 {land.location}, {land.city}, {land.district}, {land.province}
                              </p>
                              <p className="text-xs text-gray-400">
                                📅 Created: {new Date(land.created_at).toLocaleDateString()} by {userNames[land.created_by] || `User #${land.created_by}` || 'Unknown'}
                                {/* Debug: {JSON.stringify({userId: land.created_by, userName: userNames[land.created_by], allNames: userNames})} */}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {getHarvestStatusIcon(land.harvest_status)}
                          {getHarvestStatusBadge(land.harvest_status)}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewLandDetails(land.id);
                            }}
                            className="ml-2"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
            </div>
          )}

          {activeSection === 'lands' && (
            <div className="space-y-6 p-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">All Lands</h2>
              {canManageLands() && (
                <Button onClick={handleAddLand}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Land
                </Button>
              )}
            </div>

            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search lands by name, code, location, plant type, or category..."
                value={landSearchTerm}
                onChange={(e) => setLandSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Loading State */}
            {landsLoading && (
              <div className="text-center py-8">
                <div className="text-gray-500">Loading lands...</div>
              </div>
            )}

            {/* Error State */}
            {landsError && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Error loading lands: {landsError.message}
                </AlertDescription>
              </Alert>
            )}

            {/* Results Count */}
            {!landsLoading && !landsError && (
              <div className="text-sm text-gray-600">
                Showing {filteredLands.length} of {lands?.length || 0} lands
                {landSearchTerm && (
                  <span className="ml-2">
                    for "{landSearchTerm}"
                  </span>
                )}
              </div>
            )}
            
            {!landsLoading && !landsError && (
              <div className="flex-1 min-h-0 flex flex-col">
                {filteredLands.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 flex-1">
                    {filteredLands.map((land) => (
                      <Card 
                        key={land.id} 
                        className="hover:shadow-lg transition-shadow cursor-pointer"
                        onClick={() => handleViewLandDetails(land.id)}
                        title="Click to view land details"
                      >
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
                          <div className="mt-4 flex justify-between items-center">
                            {getHarvestStatusBadge(land.harvest_status)}
                            <div className="flex space-x-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCreateNotification(land.id);
                                }}
                              >
                                <Bell className="h-4 w-4 mr-1" />
                                Create Notification
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleViewLandDetails(land.id);
                                }}
                              >
                                View Details
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="text-gray-500 mb-4">
                      <MapPin className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <h3 className="text-lg font-medium mb-2">No lands found</h3>
                      <p className="text-sm">
                        {landSearchTerm 
                          ? `No lands match your search for "${landSearchTerm}"`
                          : "No lands have been registered yet"
                        }
                      </p>
                    </div>
                    {canManageLands() && (
                      <Button onClick={handleAddLand}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Your First Land
                      </Button>
                    )}
                  </div>
                )}
              </div>
            )}
            </div>
          )}

          {activeSection === 'notifications' && (
            <div className="space-y-6 p-6">
              <NotificationCenter onNavigateToMap={() => setActiveSection('map')} />
            </div>
          )}

          {activeSection === 'map' && (
            <div className="space-y-6 p-6">
              <Card className="h-[min(70vh,600px)] flex flex-col">
              <CardHeader>
                <CardTitle>Interactive Map</CardTitle>
                <CardDescription>
                  View and manage land boundaries on the map
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0 h-full">
                <TerraDrawingTools 
                  onNotificationDismissed={() => {
                    // Refresh notification counts when a notification is dismissed
                    loadDashboardData();
                  }}
                  onNotificationMarkedAsRead={() => {
                    // Refresh notification counts when a notification is marked as read
                    loadDashboardData();
                  }}
                />
              </CardContent>
            </Card>
            </div>
          )}

          {canManageTeams() && activeSection === 'teams' && (
            <div className="space-y-6 p-6">
              <TeamManagement />
            </div>
          )}

          {canManageWorkAssignments() && activeSection === 'work-assignments' && (
            <div className="space-y-6 p-6">
              <WorkAssignmentManagement />
            </div>
          )}

          {canManageUsers() && activeSection === 'admin' && (
            <div className="space-y-6 p-6">
              <UserManagement />
            </div>
          )}
        </div>
      </div>

      {/* Create Notification Dialog */}
      <CreateNotificationDialog
        open={notificationDialogOpen}
        onOpenChange={setNotificationDialogOpen}
        selectedLand={selectedLandForNotification}
        onNotificationCreated={handleNotificationCreated}
      />
    </div>
  );
};

export default Dashboard;
