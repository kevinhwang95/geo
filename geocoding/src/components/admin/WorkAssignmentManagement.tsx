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
import { useGenericCrud } from '@/hooks/useGenericCrud';
import { canManageUsers } from '@/stores/authStore';
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

  // Check if user has admin permissions
  if (!canManageUsers()) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to manage work assignments.</p>
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
    if (window.confirm('Are you sure you want to delete this work assignment? This action cannot be undone.')) {
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
        return <Badge variant="destructive">Urgent</Badge>;
      case 'high':
        return <Badge variant="destructive">High</Badge>;
      case 'medium':
        return <Badge variant="secondary">Medium</Badge>;
      default:
        return <Badge variant="outline">Low</Badge>;
    }
  };


  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-500">Completed</Badge>;
      case 'in_progress':
        return <Badge variant="default" className="bg-blue-500">In Progress</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="outline">Pending</Badge>;
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
        <h2 className="text-2xl font-bold">Work Assignment Management</h2>
        <Button onClick={handleCreateAssignment}>
          <Plus className="h-4 w-4 mr-2" />
          Create Assignment
        </Button>
      </div>

      {/* Search and Filter Bar */}
      <div className="flex space-x-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search assignments by title, description, land, team, or assignee..."
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
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Loading State */}
      {assignmentsLoading && (
        <div className="text-center py-8">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <div className="text-gray-500">Loading work assignments...</div>
        </div>
      )}

      {/* Error State */}
      {assignmentsError && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Error loading work assignments: {assignmentsError.message}
          </AlertDescription>
        </Alert>
      )}

      {/* Results Count */}
      {!assignmentsLoading && !assignmentsError && (
        <div className="text-sm text-gray-600">
          Showing {filteredAssignments.length} of {assignments?.length || 0} assignments
          {searchTerm && (
            <span className="ml-2">
              for "{searchTerm}"
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
                      <span className="text-sm text-gray-500">Land:</span>
                      <div className="flex items-center space-x-1">
                        <MapPin className="h-3 w-3 text-green-500" />
                        <span className="text-sm font-medium">{assignment.landName}</span>
                      </div>
                    </div>
                  )}
                  
                  {assignment.teamName ? (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Team:</span>
                      <div className="flex items-center space-x-1">
                        <Users className="h-3 w-3 text-blue-500" />
                        <span className="text-sm font-medium">{assignment.teamName}</span>
                      </div>
                    </div>
                  ) : assignment.assignedToUserName && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Assigned to:</span>
                      <div className="flex items-center space-x-1">
                        <User className="h-3 w-3 text-purple-500" />
                        <span className="text-sm font-medium">{assignment.assignedToUserName}</span>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Priority:</span>
                    {getPriorityBadge(assignment.priority)}
                  </div>

                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Status:</span>
                    {getStatusBadge(assignment.status)}
                  </div>

                  {assignment.dueDate && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Due Date:</span>
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3 text-gray-500" />
                        <span className="text-sm font-medium">
                          {new Date(assignment.dueDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Created by:</span>
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
                      Edit
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDeleteAssignment(assignment.id)}
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
      {!assignmentsLoading && !assignmentsError && filteredAssignments.length === 0 && (
        <div className="text-center py-12">
          <ClipboardList className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium mb-2">No work assignments found</h3>
          <p className="text-sm text-gray-500 mb-4">
            {searchTerm || statusFilter !== 'all'
              ? `No assignments match your current filters`
              : "No work assignments have been created yet"
            }
          </p>
          {!searchTerm && statusFilter === 'all' && (
            <Button onClick={handleCreateAssignment}>
              <Plus className="h-4 w-4 mr-2" />
              Create First Assignment
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
