import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import NavigationMenu from '@/components/core/NavigationMenu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useTranslation } from 'react-i18next';
import { getTranslatedPlantType, getTranslatedCategory } from '@/utils/translationUtils';
import { formatLandSizeToThaiUnits } from '@/utils/areaCalculator';
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
  Search,
  Edit
} from 'lucide-react';
// Import logo image
import { useAuthStore, canManageLands, canManageUsers, canManageTeams, canManageWorkAssignments } from '@/stores/authStore';
import { useMapStore } from '@/stores/mapStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { notificationPollingService } from '@/services/NotificationPollingService';
import axiosClient from '@/api/axiosClient';
import TerraDrawingTools from '@/components/core/TerraDrawingTools';
import NotificationCenter from '@/components/core/NotificationCenter';
import CreateNotificationDialog from '@/components/core/CreateNotificationDialog';
import { MyFormDialogLoad } from '@/components/core/my-form-dialog-load';
import UserManagement from '@/components/admin/UserManagement';
import TeamManagement from '@/components/admin/TeamManagement';
import WorkAssignmentManagement from '@/components/admin/WorkAssignmentManagement';
import MenuManagement from '@/components/admin/MenuManagement';
import { Avatar } from '@/components/ui/avatar';
import { useGenericCrud } from '@/hooks/useGenericCrud';
import type LandRegistry from '@/types/landRegistry.type';
//import { TokenDebugger } from '@/components/debug/TokenDebugger';
// import { NotificationDebugger } from '@/components/debug/NotificationDebugger';
// import NotificationAPITester from '@/components/debug/NotificationAPITester';
//import CommunicationAnalyzer from '@/components/debug/CommunicationAnalyzer';

// Notification interface is now imported from the store

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
  plant_type_translation_key?: string;
  category_translation_key?: string;
  plant_date: string;
  harvest_cycle_days: number;
  next_harvest_date: string;
  coordinations: string;
  geometry: string;
  size: number;
  palm_area?: number;
  owner_name: string;
  tree_count?: number;
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
  const { t } = useTranslation();
  // const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Use notification store instead of local state
  const { 
    unreadCount, 
    highPriorityCount
  } = useNotificationStore();
  const [activeSection, setActiveSection] = useState<string>('overview');
  const [landSearchTerm, setLandSearchTerm] = useState('');
  const [userNames, setUserNames] = useState<Record<number, string>>({});
  const [notificationDialogOpen, setNotificationDialogOpen] = useState(false);
  const [selectedLandForNotification, setSelectedLandForNotification] = useState<Land | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedLandForEdit, setSelectedLandForEdit] = useState<LandRegistry | null>(null);

  // Use the same hook that other components use successfully
  const { data: lands, loading: landsLoading, error: landsError, fetchData: refetchLands } = useGenericCrud<Land>('lands');

  useEffect(() => {
    loadDashboardData();
    
    // Cleanup notification polling on unmount
    return () => {
      notificationPollingService.stopPolling();
    };
  }, []);

  // Fetch user names when lands data is loaded
  useEffect(() => {
    if (lands && lands.length > 0) {
      const userIds = lands.map(land => land.created_by).filter(id => id);
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
        setError(t('dashboard.errors.userNotAuthenticated'));
        setIsLoading(false);
        return;
      }

      // Start notification polling service
      notificationPollingService.startPolling(30000); // Poll every 30 seconds

      // Lands are now loaded by the useGenericCrud hook automatically
      console.log('Lands loaded by hook:', lands?.length || 0, 'lands');

    } catch (error: any) {
      console.error('Dashboard data loading error:', error);
      console.error('Error response:', error.response);
      setError(error.response?.data?.message || t('dashboard.errors.failedToLoad'));
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

  const handleEditLand = (land: Land) => {
    console.log('🔍 handleEditLand called with land:', land);
    
    // Convert Land to LandRegistry format
    const landRegistry: LandRegistry = {
      id: land.id,
      land_name: land.land_name,
      land_code: land.land_code,
      land_number: land.land_number,
      size: land.size,
      palm_area: land.palm_area,
      location: land.location,
      province: land.province,
      district: land.district,
      city: land.city,
      owner: land.owner_name || '',
      coordinations: land.geometry || land.coordinations || '',
      planttypeid: land.plant_type_id,
      categoryid: land.category_id,
      category_name: land.category_name,
      category_color: land.category_color,
      plant_date: land.plant_date,
      harvest_cycle: land.harvest_cycle_days?.toString() || '',
      tree_count: land.tree_count,
      notes: land.notes || '',
      created: land.created_at,
      createdby: userNames[land.created_by] || 'Unknown',
      updated: land.updated_at,
      updatedby: userNames[land.created_by] || 'Unknown'
    };
    
    console.log('🔍 Converted landRegistry:', landRegistry);
    setSelectedLandForEdit(landRegistry);
    setEditDialogOpen(true);
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
    land.category_name.toLowerCase().includes(landSearchTerm.toLowerCase()) ||
    getTranslatedPlantType(t, land.plant_type_name, land.plant_type_translation_key).toLowerCase().includes(landSearchTerm.toLowerCase()) ||
    getTranslatedCategory(t, land.category_name, land.category_translation_key).toLowerCase().includes(landSearchTerm.toLowerCase())
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
        return <Badge variant="destructive">{t('badges.overdue')}</Badge>;
      case 'due_soon':
        return <Badge variant="secondary">{t('badges.dueSoon')}</Badge>;
      default:
        return <Badge variant="outline">{t('badges.normal')}</Badge>;
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
          <p className="text-gray-600">{t('dashboard.loading.dashboard')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex flex-col">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-lg border-b border-gray-200/50 mb-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo and Title */}
            <div className="flex items-center min-w-0 flex-1">
              <img 
                src="/logolong.PNG" 
                alt={t('dashboard.header.logoAlt')} 
                className="h-8 sm:h-10 lg:h-12 w-auto object-contain"
              />
            </div>
            
            {/* Mobile Menu Button */}
            <div className="flex items-center space-x-2 sm:space-x-4">
              {/* Notifications */}
              <div 
                className="flex items-center space-x-1 sm:space-x-2 cursor-pointer hover:bg-purple-50 p-1 sm:p-2 rounded-lg transition-all duration-200 hover:shadow-md"
                onClick={handleNotificationClick}
                title={t('dashboard.header.notificationsTooltip')}
              >
                <div className="relative">
                  <Bell className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500 hover:text-purple-600 transition-colors" />
                  {unreadCount > 0 && (
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  )}
                </div>
                {unreadCount > 0 && (
                  <Badge variant="destructive" className="text-xs font-bold shadow-sm hidden sm:inline-flex">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Badge>
                )}
              </div>
              
              {/* User Info - Hidden on mobile, shown on larger screens */}
              <div className="hidden md:flex items-center space-x-2">
                <Avatar
                  src={user?.avatar_url}
                  alt={user?.first_name}
                  className="h-8 w-8 rounded-full"
                />
                <span className="text-sm font-medium text-gray-700">
                  {user?.first_name} {user?.last_name}
                </span>
                <Badge variant="outline" className="text-xs">
                  {t(`userManagement.${user?.role}`)}
                </Badge>
              </div>
              
              {/* Logout Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-gray-600 hover:text-gray-900 p-2"
                title={t('dashboard.header.logoutTooltip')}
              >
                <LogOut className="h-4 w-4 sm:mr-1" />
                <span className="hidden sm:inline">{t('dashboard.header.logout')}</span>
              </Button>
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
            <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 sm:gap-6">
              <Card className="hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-br from-blue-50 to-blue-100/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-blue-700">{t('dashboard.stats.totalLands.title')}</CardTitle>
                  <MapPin className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-900">{lands?.length || 0}</div>
                  <p className="text-xs text-blue-600">
                    {t('dashboard.stats.totalLands.description')}
                  </p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-br from-orange-50 to-orange-100/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className='text-sm font-medium text-orange-700'>{t('dashboard.stats.harvestDue.title')}</CardTitle>
                  <Clock className="h-4 w-4 text-orange-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-900">
                    {lands?.filter(l => l.harvest_status === 'due_soon').length || 0}
                  </div>
                  <p className='text-xs text-orange-600'>
                    {t('dashboard.stats.harvestDue.description')}
                  </p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-br from-red-50 to-red-100/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className='text-sm font-medium text-red-700'>{t('dashboard.stats.overdue.title')}</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-900">
                    {lands?.filter(l => l.harvest_status === 'overdue').length || 0}
                  </div>
                  <p className='text-xs text-red-600'>
                    {t('dashboard.stats.overdue.description')}
                  </p>
                </CardContent>
              </Card>

              <Card 
                className="cursor-pointer hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-br from-purple-50 to-purple-100/50"
                onClick={handleNotificationClick}
                title={t('dashboard.stats.unreadNotifications.tooltip')}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className='text-sm font-medium text-purple-700'>{t('dashboard.stats.unreadNotifications.title')}</CardTitle>
                  <Bell className="h-4 w-4 text-purple-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-900">{unreadCount}</div>
                  <p className='text-xs text-purple-600'>
                    {t('dashboard.stats.unreadNotifications.description')}
                  </p>
                </CardContent>
              </Card>

              <Card 
                className="cursor-pointer hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-br from-red-50 to-red-100/50"
                onClick={() => setActiveSection('map')}
                title={t('dashboard.stats.highPriority.tooltip')}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className='text-sm font-medium text-red-700'>{t('dashboard.stats.highPriority.title')}</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-900">{highPriorityCount}</div>
                  <p className='text-xs text-red-600'>
                    {t('dashboard.stats.highPriority.description')}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Lands */}
            <Card className="flex flex-col min-h-0">
              <CardHeader className="flex-shrink-0">
                <CardTitle>{t('dashboard.recentLands.title')}</CardTitle>
                <CardDescription>
                  {t('dashboard.recentLands.description')}
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
                        title={t('dashboard.recentLands.viewTooltip')}
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
                              <p className='text-xs text-gray-400'>
                                📍 {land.location}, {land.city}, {land.district}, {land.province}
                              </p>
                              <p className='text-xs text-gray-400'>
                                📅 {t('dashboard.recentLands.created')}: {new Date(land.created_at).toLocaleDateString()} {t('dashboard.recentLands.by')} {userNames[land.created_by] || t('dashboard.recentLands.user', { id: land.created_by }) || t('dashboard.recentLands.unknown')}
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
                            <Eye className='h-4 w-4 mr-1' />
                            {t('buttons.view')}
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
            <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <h2 className='text-xl sm:text-2xl font-bold'>{t('dashboard.lands.title')}</h2>
              {canManageLands() && (
                <Button onClick={handleAddLand} className="w-full sm:w-auto">
                  <Plus className="h-4 w-4 mr-2" />
                  {t('buttons.addLand')}
                </Button>
              )}
            </div>

            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder={t('dashboard.lands.searchPlaceholder')}
                value={landSearchTerm}
                onChange={(e) => setLandSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Loading State */}
            {landsLoading && (
              <div className="text-center py-8">
                <div className='text-gray-500'>{t('dashboard.lands.loading')}</div>
              </div>
            )}

            {/* Error State */}
            {landsError && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {t('dashboard.lands.errorLoading', { message: landsError.message })}
                </AlertDescription>
              </Alert>
            )}

            {/* Results Count */}
            {!landsLoading && !landsError && (
              <div className="text-sm text-gray-600">
                {t('dashboard.lands.showing', { count: filteredLands.length, total: lands?.length || 0 })}
                {landSearchTerm && (
                  <span className="ml-2">
                    {t('dashboard.lands.for', { term: landSearchTerm })}
                  </span>
                )}
              </div>
            )}
            
            {!landsLoading && !landsError && (
              <div className="flex-1 min-h-0 flex flex-col">
                {filteredLands.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 flex-1">
                    {filteredLands.map((land) => (
                      <Card 
                        key={land.id} 
                        className="hover:shadow-lg transition-shadow cursor-pointer"
                        onClick={() => handleViewLandDetails(land.id)}
                        title={t('dashboard.lands.viewDetailsTooltip')}
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
                              <span className="text-sm text-gray-500">{t('labels.size')}</span>
                              <span className="text-sm font-medium">{formatLandSizeToThaiUnits(land.size, t)}</span>
                            </div>
                            {land.palm_area && (
                              <div className="flex justify-between">
                                <span className="text-sm text-gray-500">{t('labels.palmArea')}</span>
                                <span className="text-sm font-medium">{formatLandSizeToThaiUnits(land.palm_area, t)}</span>
                              </div>
                            )}
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-500">{t('labels.plantType')}</span>
                              <span className="text-sm font-medium">{getTranslatedPlantType(t, land.plant_type_name, land.plant_type_translation_key)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-500">{t('labels.category')}</span>
                              <div className="flex items-center space-x-2">
                                <div 
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: land.category_color }}
                                />
                                <span className="text-sm font-medium">{getTranslatedCategory(t, land.category_name, land.category_translation_key)}</span>
                              </div>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-500">{t('labels.nextHarvest')}</span>
                              <span className="text-sm font-medium">
                                {new Date(land.next_harvest_date).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <div className="mt-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                            {getHarvestStatusBadge(land.harvest_status)}
                            <div className="flex flex-wrap gap-2">
                              {canManageLands() && (
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditLand(land);
                                  }}
                                  className="flex-1 sm:flex-none"
                                >
                                  <Edit className="h-4 w-4 mr-1" />
                                  {t('buttons.edit')}
                                </Button>
                              )}
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCreateNotification(land.id);
                                }}
                                className="flex-1 sm:flex-none"
                              >
                                <Bell className="h-4 w-4 mr-1" />
                                <span className="hidden sm:inline">{t('buttons.createNotification')}</span>
                                <span className="sm:hidden">{t('buttons.notify')}</span>
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
                      <h3 className="text-lg font-medium mb-2">{t('dashboard.lands.noLands')}</h3>
                      <p className="text-sm">
                        {landSearchTerm 
                          ? t('dashboard.lands.for', { term: landSearchTerm })
                          : t('dashboard.lands.noLands')
                        }
                      </p>
                    </div>
                    {canManageLands() && (
                      <Button onClick={handleAddLand}>
                        <Plus className="h-4 w-4 mr-2" />
                        {t('buttons.addFirstLand')}
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
            <div className="space-y-4 p-4">
              <Card className="h-[min(70vh,600px)] flex flex-col">
              <CardHeader>
                <CardTitle>{t('dashboard.interactiveMap.title')}</CardTitle>
                <CardDescription>
                  {t('dashboard.interactiveMap.description')}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0 h-full">
                <TerraDrawingTools 
                  onNotificationDismissed={() => {
                    // Refresh notification counts when a notification is dismissed
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

          {canManageUsers() && activeSection === 'menu-management' && (
            <div className="space-y-6 p-6">
              <MenuManagement />
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
      {/* {import.meta.env.DEV && <TokenDebugger />} */}
      {/* Edit Land Dialog */}
      {selectedLandForEdit && (
        <MyFormDialogLoad
          key={selectedLandForEdit.id} // Force re-render when land changes
          open={editDialogOpen}
          setOpen={setEditDialogOpen}
          land={selectedLandForEdit}
          onUpdateSuccess={refetchLands}
        />
      )}

      
    </div>
  );
};

export default Dashboard;
