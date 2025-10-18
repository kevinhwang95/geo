import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useTranslation } from 'react-i18next';
import axiosClient from '@/api/axiosClient';
import { toast } from 'sonner';
import { 
  ClipboardList, 
  Users, 
  User, 
  MapPin, 
  Calendar, 
  AlertTriangle, 
  CheckCircle,
  MessageSquare,
  Clock,
  FileText,
} from 'lucide-react';
import WorkNotesList from './WorkNotesList';
import AddWorkNoteForm from './AddWorkNoteForm';
import EditWorkNoteForm from './EditWorkNoteForm';
import WorkCompletionForm from './WorkCompletionForm';

interface WorkAssignmentDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workAssignment: {
    id: number;
    title: string;
    description: string;
    landId: number | null;
    teamId: number | null;
    assignedToUserId: number | null;
    workTypeId: number | null;
    workStatusId?: number | null;
    priority: 'low' | 'medium' | 'high' | 'critical' | 'urgent';
    status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
    dueDate: string | null;
    createdAt: string;
    updatedAt: string;
  } | null;
  onWorkUpdated: () => void;
}

interface WorkNote {
  id: number;
  work_id: number;
  title: string;
  content: string;
  priority_level: 'critical' | 'high' | 'medium' | 'low';
  created_by_user_id: number;
  created_at: string;
  updated_at: string;
  created_by_name: string;
  photos?: Array<{
    id: number;
    filename: string;
    file_path: string;
    mime_type: string;
  }>;
}

interface WorkCompletion {
  id: number;
  workId: number;
  teamId: number;
  workerCount: number;
  completionNote: string;
  weightOfProduct: number | null;
  truckNumber: string | null;
  driverName: string | null;
  completedByUserId: number;
  completedAt: string;
  completedByName: string;
  workers?: Array<{
    userId: number;
    userName: string;
    teamName: string;
  }>;
  photos?: Array<{
    id: number;
    filename: string;
    file_path: string;
    mime_type: string;
  }>;
}

interface Land {
  id: number;
  land_name: string;
  land_code: string;
}

interface Team {
  id: number;
  name: string;
}

interface User {
  id: number;
  first_name: string;
  last_name: string;
  role: string;
}

interface WorkType {
  id: number;
  name: string;
  categoryName: string;
}

const WorkAssignmentDetailsModal: React.FC<WorkAssignmentDetailsModalProps> = ({
  open,
  onOpenChange,
  workAssignment,
  onWorkUpdated,
}) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('details');
  const [notes, setNotes] = useState<WorkNote[]>([]);
  const [completion, setCompletion] = useState<WorkCompletion | null>(null);
  const [land, setLand] = useState<Land | null>(null);
  const [team, setTeam] = useState<Team | null>(null);
  const [assignedUser, setAssignedUser] = useState<User | null>(null);
  const [workType, setWorkType] = useState<WorkType | null>(null);
  const [_loading, setLoading] = useState(false);
  const [editingNote, setEditingNote] = useState<WorkNote | null>(null);

  // Fetch work details when modal opens
  useEffect(() => {
    if (open && workAssignment) {
      fetchWorkDetails();
    }
  }, [open, workAssignment]);

  const fetchWorkDetails = async () => {
    if (!workAssignment) return;

    try {
      setLoading(true);
      
      // Fetch work details (includes completions), notes, and related data
      const [workDetailsResponse, notesResponse, landResponse, teamResponse, userResponse, workTypeResponse] = await Promise.all([
        axiosClient.get(`/farm-works/${workAssignment.id}`),
        axiosClient.get(`/work-notes?work_id=${workAssignment.id}`).catch(() => ({ data: { success: true, data: [] } })),
        workAssignment.landId ? axiosClient.get(`/lands/${workAssignment.landId}`) : Promise.resolve({ data: null }),
        workAssignment.teamId ? axiosClient.get(`/teams/${workAssignment.teamId}`) : Promise.resolve({ data: null }),
        workAssignment.assignedToUserId ? axiosClient.get(`/users/${workAssignment.assignedToUserId}`) : Promise.resolve({ data: null }),
        workAssignment.workTypeId ? axiosClient.get(`/farm-works/work-types/${workAssignment.workTypeId}`) : Promise.resolve({ data: null }),
      ]);

      // Extract completions from work details (there should be only one completion per work)
      const completions = workDetailsResponse.data?.completions || [];
      setCompletion(completions.length > 0 ? completions[0] : null);
      
      setNotes(notesResponse.data?.data || []);
      setLand(landResponse.data || null);
      setTeam(teamResponse.data || null);
      setAssignedUser(userResponse.data || null);
      setWorkType(workTypeResponse.data?.data || null);

    } catch (error) {
      console.error('Failed to fetch work details:', error);
      toast.error('Failed to load work details');
    } finally {
      setLoading(false);
    }
  };

  const handleNoteAdded = () => {
    fetchWorkDetails();
    onWorkUpdated();
  };

  const handleWorkCompleted = () => {
    fetchWorkDetails();
    onWorkUpdated();
  };

  const handleEditNote = (note: WorkNote) => {
    setEditingNote(note);
  };

  const handleNoteUpdated = () => {
    setEditingNote(null);
    fetchWorkDetails(); // Refresh notes
    onWorkUpdated();
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'destructive';
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'default';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'default';
      case 'in_progress': return 'default';
      case 'pending': return 'secondary';
      case 'cancelled': return 'destructive';
      default: return 'secondary';
    }
  };

  if (!workAssignment) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <ClipboardList className="h-5 w-5" />
            <span>{workAssignment.title}</span>
          </DialogTitle>
          <DialogDescription>
            {t('workAssignmentDetails.viewWorkDetailsDescription')}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details" className="flex items-center space-x-2">
              <FileText className="h-4 w-4" />
              <span>{t('workAssignmentDetails.details')}</span>
            </TabsTrigger>
            <TabsTrigger value="notes" className="flex items-center space-x-2">
              <MessageSquare className="h-4 w-4" />
              <span>{t('workAssignmentDetails.notes')}</span>
              {notes.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {notes.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="completion" className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4" />
              <span>{t('workAssignmentDetails.completion')}</span>
              {completion && (
                <Badge variant="default" className="ml-1">
                  {t('workAssignmentDetails.completed')}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <ClipboardList className="h-4 w-4" />
                  <span>{t('workAssignmentDetails.assignmentInfo')}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Title and Description */}
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">{workAssignment.title}</h3>
                  {workAssignment.description && (
                    <p className="text-gray-600">{workAssignment.description}</p>
                  )}
                </div>

                <Separator />

                {/* Status and Priority */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center space-x-2">
                      <AlertTriangle className="h-4 w-4" />
                      <span>{t('workAssignmentDetails.priority')}</span>
                    </label>
                    <Badge variant={getPriorityColor(workAssignment.priority)}>
                      {t(`createWorkAssignment.${workAssignment.priority}`)}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4" />
                      <span>{t('workAssignmentDetails.status')}</span>
                    </label>
                    <Badge variant={getStatusColor(workAssignment.status)}>
                      {t(`createWorkAssignment.${workAssignment.status}`)}
                    </Badge>
                  </div>
                </div>

                <Separator />

                {/* Assignment Details */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center space-x-2">
                      <Users className="h-4 w-4" />
                      <span>{t('workAssignmentDetails.assignedTo')}</span>
                    </label>
                    {team ? (
                      <div className="flex items-center space-x-2">
                        <Users className="h-4 w-4 text-gray-500" />
                        <span>{team.name}</span>
                      </div>
                    ) : assignedUser ? (
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4 text-gray-500" />
                        <span>{assignedUser.first_name} {assignedUser.last_name}</span>
                      </div>
                    ) : (
                      <span className="text-gray-500">{t('workAssignmentDetails.notAssigned')}</span>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center space-x-2">
                      <ClipboardList className="h-4 w-4" />
                      <span>{t('workAssignmentDetails.workType')}</span>
                    </label>
                    {workType ? (
                      <span>{workType.name}</span>
                    ) : (
                      <span className="text-gray-500">{t('workAssignmentDetails.noWorkType')}</span>
                    )}
                  </div>
                </div>

                {/* Land and Due Date */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center space-x-2">
                      <MapPin className="h-4 w-4" />
                      <span>{t('workAssignmentDetails.land')}</span>
                    </label>
                    {land ? (
                      <div>
                        <div className="font-medium">{land.land_name}</div>
                        <div className="text-sm text-gray-500">{land.land_code}</div>
                      </div>
                    ) : (
                      <span className="text-gray-500">{t('workAssignmentDetails.noLandAssigned')}</span>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center space-x-2">
                      <Calendar className="h-4 w-4" />
                      <span>{t('workAssignmentDetails.dueDate')}</span>
                    </label>
                    {workAssignment.dueDate ? (
                      <span>{new Date(workAssignment.dueDate).toLocaleDateString()}</span>
                    ) : (
                      <span className="text-gray-500">{t('workAssignmentDetails.noDueDate')}</span>
                    )}
                  </div>
                </div>

                {/* Timeline */}
                <Separator />
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center space-x-2">
                    <Clock className="h-4 w-4" />
                    <span>{t('workAssignmentDetails.timeline')}</span>
                  </label>
                  <div className="text-sm text-gray-600">
                    <div>{t('workAssignmentDetails.createdAt')}: {new Date(workAssignment.createdAt).toLocaleString()}</div>
                    <div>{t('workAssignmentDetails.updatedAt')}: {new Date(workAssignment.updatedAt).toLocaleString()}</div>
                    {completion && (
                      <div>{t('workAssignmentDetails.completedAt')}: {new Date(completion.completedAt).toLocaleString()}</div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notes" className="space-y-4">
            <WorkNotesList 
              notes={notes}
              workId={workAssignment.id}
              onNotesUpdated={handleNoteAdded}
              onEditNote={handleEditNote}
            />
            <AddWorkNoteForm 
              workId={workAssignment.id}
              onNoteAdded={handleNoteAdded}
            />
          </TabsContent>

          <TabsContent value="completion" className="space-y-4">
            <WorkCompletionForm 
              workAssignment={workAssignment}
              completion={completion ? {
                id: completion.id,
                completionNote: completion.completionNote,
                workerCount: completion.workerCount,
                weightOfProduct: completion.weightOfProduct,
                truckNumber: completion.truckNumber,
                driverName: completion.driverName,
                completedByName: completion.completedByName,
                completedAt: completion.completedAt,
                workers: completion.workers,
                photos: completion.photos
              } : null}
              onWorkCompleted={handleWorkCompleted}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>

      {/* Edit Work Note Dialog */}
      <EditWorkNoteForm
        note={editingNote}
        open={!!editingNote}
        onClose={() => setEditingNote(null)}
        onNoteUpdated={handleNoteUpdated}
      />
    </Dialog>
  );
};

export default WorkAssignmentDetailsModal;
