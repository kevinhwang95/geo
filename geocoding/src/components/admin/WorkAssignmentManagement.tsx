import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  ClipboardList, 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  Calendar,
  Users,
  User,
  MapPin,
  RefreshCw,
  AlertTriangle,
  Clock
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useGenericCrud } from '@/hooks/useGenericCrud';
import { canManageWorkAssignments } from '@/stores/authStore';
import WorkAssignmentFormDialog from './WorkAssignmentFormDialog';

interface WorkAssignmentData {
  id: number;
  title: string;
  description: string;
  landId: number | null;
  landName: string | null;
  landCode: string | null;
  teamId: number | null;
  teamName: string | null;
  assignedToUserId: number | null;
  assignedToUserName: string | null;
  assignedByUserId: number;
  assignedByUserName: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  dueDate: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

const WorkAssignmentManagement: React.FC = () => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedAssignment, setSelectedAssignment] = useState<WorkAssignmentData | null>(null);
  const [isAssignmentFormOpen, setIsAssignmentFormOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const { 
    data: assignments, 
    loading: assignmentsLoading, 
    error: assignmentsError, 
    fetchData: refreshAssignments,
    deleteItem: deleteAssignment 
  } = useGenericCrud<WorkAssignmentData>('work-assignments');

  // Check if user has work assignment permissions
  if (!canManageWorkAssignments()) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">{t('workAssignments.accessDenied')}</h1>
          <p className="text-gray-600">{t('workAssignments.noPermission')}</p>
        </div>
      </div>
    );
  }

  const handleCreateAssignment = () => {
    setSelectedAssignment(null);
    setIsEditing(false);
    setIsAssignmentFormOpen(true);
  };

  const handleEditAssignment = (assignment: WorkAssignmentData) => {
    setSelectedAssignment(assignment);
    setIsEditing(true);
    setIsAssignmentFormOpen(true);
  };

  const handleDeleteAssignment = async (assignmentId: number) => {
    if (window.confirm(t('workAssignments.deleteConfirm'))) {
      try {
        await deleteAssignment(assignmentId);
        await refreshAssignments();
      } catch (error) {
        console.error('Failed to delete work assignment:', error);
      }
    }
  };

  const handleAssignmentFormClose = () => {
    setIsAssignmentFormOpen(false);
    setSelectedAssignment(null);
    setIsEditing(false);
    refreshAssignments();
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'high':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'medium':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <Badge variant="destructive">{t('workAssignments.urgent')}</Badge>;
      case 'high':
        return <Badge variant="destructive">{t('workAssignments.high')}</Badge>;
      case 'medium':
        return <Badge variant="secondary">{t('workAssignments.medium')}</Badge>;
      default:
        return <Badge variant="outline">{t('workAssignments.low')}</Badge>;
    }
  };


  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-500">{t('workAssignments.completed')}</Badge>;
      case 'in_progress':
        return <Badge variant="default" className="bg-blue-500">{t('workAssignments.inProgress')}</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">{t('workAssignments.cancelled')}</Badge>;
      default:
        return <Badge variant="outline">{t('workAssignments.pending')}</Badge>;
    }
  };

  const filteredAssignments = (assignments || []).filter(assignment => {
    const matchesSearch = 
      assignment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assignment.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (assignment.landName && assignment.landName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (assignment.teamName && assignment.teamName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (assignment.assignedToUserName && assignment.assignedToUserName.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || assignment.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">{t('workAssignments.title')}</h2>
        <Button onClick={handleCreateAssignment}>
          <Plus className="h-4 w-4 mr-2" />
          {t('workAssignments.createAssignment')}
        </Button>
      </div>

      {/* Search and Filter Bar */}
      <div className="flex space-x-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder={t('workAssignments.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">{t('workAssignments.allStatus')}</option>
          <option value="pending">{t('workAssignments.pending')}</option>
          <option value="in_progress">{t('workAssignments.inProgress')}</option>
          <option value="completed">{t('workAssignments.completed')}</option>
          <option value="cancelled">{t('workAssignments.cancelled')}</option>
        </select>
      </div>

      {/* Loading State */}
      {assignmentsLoading && (
        <div className="text-center py-8">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <div className="text-gray-500">{t('workAssignments.loading')}</div>
        </div>
      )}

      {/* Error State */}
      {assignmentsError && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
{t('workAssignments.errorLoading')}: {assignmentsError.message}
          </AlertDescription>
        </Alert>
      )}

      {/* Results Count */}
      {!assignmentsLoading && !assignmentsError && (
        <div className="text-sm text-gray-600">
{t('workAssignments.showing')} {filteredAssignments.length} {t('workAssignments.of')} {assignments?.length || 0} {t('workAssignments.assignments')}
          {searchTerm && (
            <span className="ml-2">
              {t('workAssignments.for')} "{searchTerm}"
            </span>
          )}
          {statusFilter !== 'all' && (
            <span className="ml-2">
              with status "{statusFilter}"
            </span>
          )}
        </div>
      )}

      {/* Assignments Grid */}
      {!assignmentsLoading && !assignmentsError && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAssignments.map((assignment) => (
            <Card key={assignment.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{assignment.title}</CardTitle>
                  {getPriorityIcon(assignment.priority)}
                </div>
                <CardDescription className="line-clamp-2">
                  {assignment.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {assignment.landName && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">{t('workAssignments.land')}:</span>
                      <div className="flex items-center space-x-1">
                        <MapPin className="h-3 w-3 text-green-500" />
                        <span className="text-sm font-medium">{assignment.landName}</span>
                      </div>
                    </div>
                  )}
                  
                  {assignment.teamName ? (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">{t('workAssignments.team')}:</span>
                      <div className="flex items-center space-x-1">
                        <Users className="h-3 w-3 text-blue-500" />
                        <span className="text-sm font-medium">{assignment.teamName}</span>
                      </div>
                    </div>
                  ) : assignment.assignedToUserName && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">{t('workAssignments.assignedTo')}:</span>
                      <div className="flex items-center space-x-1">
                        <User className="h-3 w-3 text-purple-500" />
                        <span className="text-sm font-medium">{assignment.assignedToUserName}</span>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">{t('workAssignments.priority')}:</span>
                    {getPriorityBadge(assignment.priority)}
                  </div>

                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">{t('workAssignments.status')}:</span>
                    {getStatusBadge(assignment.status)}
                  </div>

                  {assignment.dueDate && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">{t('workAssignments.dueDate')}:</span>
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3 text-gray-500" />
                        <span className="text-sm font-medium">
                          {new Date(assignment.dueDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">{t('workAssignments.assignedBy')}:</span>
                    <span className="text-sm font-medium">{assignment.assignedByUserName}</span>
                  </div>
                </div>
                <div className="mt-4 flex justify-between items-center">
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleEditAssignment(assignment)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      {t('workAssignments.edit')}
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDeleteAssignment(assignment.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      {t('workAssignments.delete')}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!assignmentsLoading && !assignmentsError && filteredAssignments.length === 0 && (
        <div className="text-center py-12">
          <ClipboardList className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium mb-2">{t('workAssignments.noAssignmentsFound')}</h3>
          <p className="text-sm text-gray-500 mb-4">
            {searchTerm || statusFilter !== 'all'
              ? `${t('workAssignments.noAssignmentsMatchSearch')} "${searchTerm || statusFilter}"`
              : t('workAssignments.noAssignmentsCreatedYet')
            }
          </p>
          {!searchTerm && statusFilter === 'all' && (
            <Button onClick={handleCreateAssignment}>
              <Plus className="h-4 w-4 mr-2" />
              {t('workAssignments.createFirstAssignment')}
            </Button>
          )}
        </div>
      )}

      {/* Work Assignment Form Dialog */}
      <WorkAssignmentFormDialog
        open={isAssignmentFormOpen}
        onOpenChange={setIsAssignmentFormOpen}
        assignment={selectedAssignment}
        isEditing={isEditing}
        onAssignmentSaved={handleAssignmentFormClose}
      />
    </div>
  );
};

export default WorkAssignmentManagement;
