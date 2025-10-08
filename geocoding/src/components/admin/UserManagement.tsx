import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Users, 
  UserPlus, 
  Edit, 
  Trash2, 
  Search,
  Shield,
  User,
  Crown,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useGenericCrud } from '@/hooks/useGenericCrud';
import { canManageUsers } from '@/stores/authStore';
import UserFormDialog from './UserFormDialog';
import TeamManagement from './TeamManagement';
import WorkAssignmentManagement from './WorkAssignmentManagement';
import { toast } from 'sonner';

interface UserData {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  role: 'admin' | 'contributor' | 'user' | 'team_lead';
  avatar_url?: string;
  is_active: boolean;
  last_login?: string;
  created_at: string;
}

const UserManagement: React.FC = () => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [isUserFormOpen, setIsUserFormOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const { 
    data: users, 
    loading: usersLoading, 
    error: usersError, 
    fetchData: refreshUsers,
    deleteItem: deleteUser 
  } = useGenericCrud<UserData>('users');

  // Check if user has admin permissions
  if (!canManageUsers()) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">{t('userManagement.accessDenied')}</h1>
          <p className="text-gray-600">{t('userManagement.noPermission')}</p>
        </div>
      </div>
    );
  }

  const handleCreateUser = () => {
    setSelectedUser(null);
    setIsEditing(false);
    setIsUserFormOpen(true);
  };

  const handleEditUser = (user: UserData) => {
    setSelectedUser(user);
    setIsEditing(true);
    setIsUserFormOpen(true);
  };

  const handleDeleteUser = async (userId: number) => {
    const userToDelete = users?.find(u => u.id === userId);
    const userName = userToDelete ? `${userToDelete.first_name} ${userToDelete.last_name}` : 'this user';
    
    toast.error('Delete User', {
      description: `Are you sure you want to delete ${userName}? This action cannot be undone.`,
      action: {
        label: 'Delete',
        onClick: async () => {
          try {
            await deleteUser(userId);
            await refreshUsers();
            toast.success('User deleted successfully', {
              description: `${userName} has been removed from the system.`,
            });
          } catch (error) {
            console.error('Failed to delete user:', error);
            toast.error('Failed to delete user', {
              description: 'An error occurred while deleting the user. Please try again.',
            });
          }
        },
      },
      cancel: {
        label: 'Cancel',
        onClick: () => {},
      },
    });
  };

  const handleUserFormClose = () => {
    setIsUserFormOpen(false);
    setSelectedUser(null);
    setIsEditing(false);
    refreshUsers();
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Shield className="h-4 w-4 text-red-500" />;
      case 'team_lead':
        return <Crown className="h-4 w-4 text-purple-500" />;
      case 'contributor':
        return <UserPlus className="h-4 w-4 text-blue-500" />;
      default:
        return <User className="h-4 w-4 text-gray-500" />;
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge variant="destructive">{t('userManagement.admin')}</Badge>;
      case 'team_lead':
        return <Badge variant="secondary">{t('userManagement.teamLead')}</Badge>;
      case 'contributor':
        return <Badge variant="outline">{t('userManagement.contributor')}</Badge>;
      default:
        return <Badge variant="outline">{t('userManagement.user')}</Badge>;
    }
  };

  const filteredUsers = (users || []).filter(user => 
    user.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('userManagement.title')}</h1>
        </div>

        <Tabs defaultValue="users" className="space-y-6">
          {/* <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="users" className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>Users</span>
            </TabsTrigger>
            <TabsTrigger value="teams" className="flex items-center space-x-2">
              <UserPlus className="h-4 w-4" />
              <span>Teams</span>
            </TabsTrigger>
            <TabsTrigger value="assignments" className="flex items-center space-x-2">
              <Edit className="h-4 w-4" />
              <span>Work Assignments</span>
            </TabsTrigger>
          </TabsList> */}

          <TabsContent value="users" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">{t('userManagement.allUsers')}</h2>
              <Button onClick={handleCreateUser}>
                <UserPlus className="h-4 w-4 mr-2" />
                {t('userManagement.addUser')}
              </Button>
            </div>

            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder={t('userManagement.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Loading State */}
            {usersLoading && (
              <div className="text-center py-8">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
                <div className="text-gray-500">{t('userManagement.loading')}</div>
              </div>
            )}

            {/* Error State */}
            {usersError && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Error loading users: {usersError.message}
                </AlertDescription>
              </Alert>
            )}

            {/* Results Count */}
            {!usersLoading && !usersError && (
              <div className="text-sm text-gray-600">
                Showing {filteredUsers.length} of {users?.length || 0} users
                {searchTerm && (
                  <span className="ml-2">
                    for "{searchTerm}"
                  </span>
                )}
              </div>
            )}

            {/* Users Grid */}
            {!usersLoading && !usersError && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredUsers.map((user) => (
                  <Card key={user.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">
                          {user.first_name} {user.last_name}
                        </CardTitle>
                        {getRoleIcon(user.role)}
                      </div>
                      <CardDescription>{user.email}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500">Phone:</span>
                          <span className="text-sm font-medium">{user.phone}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500">Role:</span>
                          {getRoleBadge(user.role)}
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500">Created:</span>
                          <span className="text-sm font-medium">
                            {new Date(user.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="mt-4 flex justify-between items-center">
                        <div className="flex space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleEditUser(user)}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleDeleteUser(user.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Empty State */}
            {!usersLoading && !usersError && filteredUsers.length === 0 && (
              <div className="text-center py-12">
                <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium mb-2">No users found</h3>
                <p className="text-sm text-gray-500 mb-4">
                  {searchTerm 
                    ? `No users match your search for "${searchTerm}"`
                    : "No users have been created yet"
                  }
                </p>
                {!searchTerm && (
                  <Button onClick={handleCreateUser}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Create First User
                  </Button>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="teams">
            <TeamManagement />
          </TabsContent>

          <TabsContent value="assignments">
            <WorkAssignmentManagement />
          </TabsContent>
        </Tabs>

        {/* User Form Dialog */}
        <UserFormDialog
          open={isUserFormOpen}
          onOpenChange={setIsUserFormOpen}
          user={selectedUser}
          isEditing={isEditing}
          onUserSaved={handleUserFormClose}
        />
      </div>
    </div>
  );
};

export default UserManagement;
