import React, { useState, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DataTable } from '@/components/ui/data-table';
import { createColumns, type WorkAssignment } from '@/components/columnDef/workAssignmentColumns';
import { 
  ClipboardList, 
  Plus, 
  RefreshCw,
  AlertTriangle,
  Search
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useGenericCrud } from '@/hooks/useGenericCrud';
import { hasAnyRole } from '@/stores/authStore';
import WorkAssignmentFormDialog from './WorkAssignmentFormDialog';
import WorkAssignmentDetailsModal from './WorkAssignmentDetailsModal';



const WorkAssignmentManagement: React.FC = () => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedAssignment, setSelectedAssignment] = useState<WorkAssignment | null>(null);
  const [isAssignmentFormOpen, setIsAssignmentFormOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  const { 
    data: assignments, 
    loading: assignmentsLoading, 
    error: assignmentsError, 
    fetchData: refreshAssignments,
    deleteItem: deleteAssignment 
  } = useGenericCrud<WorkAssignment>('farm-works');

  // Handler functions - defined before useMemo to avoid hoisting issues
  const handleCreateAssignment = useCallback(() => {
    setSelectedAssignment(null);
    setIsEditing(false);
    setIsAssignmentFormOpen(true);
  }, []);

  const handleEditAssignment = useCallback((assignment: WorkAssignment) => {
    setSelectedAssignment(assignment);
    setIsEditing(true);
    setIsAssignmentFormOpen(true);
  }, []);

  const handleViewAssignment = useCallback((assignment: WorkAssignment) => {
    // Open the details modal for viewing
    setSelectedAssignment(assignment);
    setIsDetailsModalOpen(true);
  }, []);

  const handleDeleteAssignment = useCallback(async (assignment: WorkAssignment) => {
    if (window.confirm(t('workAssignments.confirmDelete', { title: assignment.title }))) {
      try {
        await deleteAssignment(assignment.id);
      } catch (error) {
        console.error('Failed to delete assignment:', error);
      }
    }
  }, [t, deleteAssignment]);

  // Create columns for the data table
  const columns = useMemo(() => createColumns({
    onView: handleViewAssignment,
    onEdit: handleEditAssignment,
    onDelete: handleDeleteAssignment,
    t,
  }), [handleViewAssignment, handleEditAssignment, handleDeleteAssignment, t]);

  // Filter assignments based on search term and status
  const filteredAssignments = useMemo(() => {
    if (!assignments) return [];
    
    return assignments.filter(assignment => {
      const matchesSearch = 
        assignment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assignment.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (assignment.landName && assignment.landName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (assignment.assignedTeamName && assignment.assignedTeamName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (assignment.assignedToUserName && assignment.assignedToUserName.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesStatus = statusFilter === 'all' || assignment.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [assignments, searchTerm, statusFilter]);

  const handleAssignmentFormClose = () => {
    setIsAssignmentFormOpen(false);
    setSelectedAssignment(null);
    setIsEditing(false);
    refreshAssignments();
  };

  // Convert WorkAssignment to the format expected by WorkAssignmentFormDialog
  const convertToFormAssignment = (assignment: WorkAssignment | null) => {
    if (!assignment) return null;
    
    return {
      id: assignment.id,
      title: assignment.title,
      description: assignment.description,
      landId: assignment.landId,
      teamId: assignment.assignedTeamId,
      assignedToUserId: assignment.assignedToUserId,
      workTypeId: assignment.workTypeId,
      priority: assignment.priorityLevel as 'low' | 'medium' | 'high' | 'urgent',
      status: assignment.status as 'pending' | 'in_progress' | 'completed' | 'cancelled',
      dueDate: assignment.dueDate,
    };
  };

  // Check if user has work assignment permissions
  if (!hasAnyRole(['admin', 'contributor'])) {
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
          <option value="created">{t('workAssignments.created')}</option>
          <option value="assigned">{t('workAssignments.assigned')}</option>
          <option value="in_progress">{t('workAssignments.inProgress')}</option>
          <option value="completed">{t('workAssignments.completed')}</option>
          <option value="canceled">{t('workAssignments.canceled')}</option>
          <option value="pending">{t('workAssignments.pending')}</option>
          <option value="postponed">{t('workAssignments.postponed')}</option>
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

      {/* Data Table */}
      {!assignmentsLoading && !assignmentsError && (
        <div className="space-y-4">
          {filteredAssignments.length > 0 ? (
            <>
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  {t('workAssignments.showing')} {filteredAssignments.length} {t('workAssignments.of')} {assignments?.length || 0} {t('workAssignments.assignments')}
                  {searchTerm && (
                    <span className="ml-2">
                      {t('workAssignments.for')} "{searchTerm}"
                    </span>
                  )}
                  {statusFilter !== 'all' && (
                    <span className="ml-2">
                      {t('workAssignments.withStatus')} "{t(`workAssignments.${statusFilter}`)}"
                    </span>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={refreshAssignments}
                  className="flex items-center space-x-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  <span>{t('workAssignments.refresh')}</span>
                </Button>
              </div>
              <DataTable columns={columns} data={filteredAssignments} />
            </>
          ) : (
            /* Empty State */
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
        </div>
      )}

      {/* Work Assignment Form Dialog */}
      <WorkAssignmentFormDialog
        open={isAssignmentFormOpen}
        onOpenChange={setIsAssignmentFormOpen}
        assignment={convertToFormAssignment(selectedAssignment)}
        isEditing={isEditing}
        onAssignmentSaved={handleAssignmentFormClose}
      />

      {/* Work Assignment Details Modal */}
      <WorkAssignmentDetailsModal
        open={isDetailsModalOpen}
        onOpenChange={setIsDetailsModalOpen}
        workAssignment={selectedAssignment ? {
          id: selectedAssignment.id,
          title: selectedAssignment.title,
          description: selectedAssignment.description,
          landId: selectedAssignment.landId,
          teamId: selectedAssignment.assignedTeamId,
          assignedToUserId: selectedAssignment.assignedToUserId,
          workTypeId: selectedAssignment.workTypeId,
          priority: selectedAssignment.priorityLevel as 'low' | 'medium' | 'high' | 'urgent',
          status: selectedAssignment.status as 'pending' | 'in_progress' | 'completed' | 'cancelled',
          dueDate: selectedAssignment.dueDate,
          createdAt: selectedAssignment.createdAt,
          updatedAt: selectedAssignment.updatedAt,
        } : null}
        onWorkUpdated={refreshAssignments}
      />
    </div>
  );
};

export default WorkAssignmentManagement;
