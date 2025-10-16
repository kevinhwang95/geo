import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  UserPlus, 
  AlertTriangle
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useGenericCrud } from '@/hooks/useGenericCrud';
import { canManageUsers } from '@/stores/authStore';
import UserFormDialog from './UserFormDialog';
import TeamManagement from './TeamManagement';
import WorkAssignmentManagement from './WorkAssignmentManagement';
import { DataTable } from '@/components/ui/data-table';
import { createColumns, type UserData } from '@/components/columnDef/userColumns';
import { toast } from 'sonner';

const UserManagement: React.FC = () => {
  const { t } = useTranslation();
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [isUserFormOpen, setIsUserFormOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [globalFilter, setGlobalFilter] = useState<string>("");

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

  const handleDeleteUser = async (user: UserData) => {
    const userName = `${user.first_name} ${user.last_name}`;
    
    toast.error('Delete User', {
      description: `Are you sure you want to delete ${userName}? This action cannot be undone.`,
      action: {
        label: 'Delete',
        onClick: async () => {
          try {
            await deleteUser(user.id);
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

  // Create columns for the data table
  const columns = createColumns({
    onEdit: handleEditUser,
    onDelete: handleDeleteUser,
    t,
  });

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

            {/* Loading State */}
            {usersLoading && (
              <div className="text-center py-8">
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

            {/* Data Table */}
            {!usersLoading && !usersError && (
              <DataTable
                columns={columns}
                data={users || []}
                searchPlaceholder={t('userManagement.searchPlaceholder')}
                globalFilter={globalFilter}
                onGlobalFilterChange={setGlobalFilter}
              />
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
