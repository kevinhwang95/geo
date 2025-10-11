import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import axiosClient from '@/api/axiosClient';
import { toast } from 'sonner';
import { ClipboardList, Users, User, MapPin, Calendar, AlertTriangle, CheckCircle } from 'lucide-react';

interface WorkAssignmentFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assignment?: {
    id: number;
    title: string;
    description: string;
    landId: number | null;
    teamId: number | null;
    assignedToUserId: number | null;
    workTypeId: number | null;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
    dueDate: string | null;
  } | null;
  isEditing: boolean;
  onAssignmentSaved: () => void;
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

interface WorkCategory {
  id: number;
  name: string;
  description: string;
  color: string;
  icon: string;
}

interface WorkType {
  id: number;
  name: string;
  description: string;
  categoryId: number;
  categoryName: string;
  categoryColor: string;
  icon: string;
  estimatedDurationHours: number | null;
}

interface WorkStatus {
  id: number;
  name: string;
  displayName: string;
  description: string;
  color: string;
  icon: string;
  sortOrder: number;
  isActive: boolean;
  isFinal: boolean;
  createdAt: string;
  updatedAt: string;
}

const WorkAssignmentFormDialog: React.FC<WorkAssignmentFormDialogProps> = ({
  open,
  onOpenChange,
  assignment,
  isEditing,
  onAssignmentSaved,
}) => {
  const { t } = useTranslation();
  
  const workAssignmentSchema = z.object({
    title: z.string().min(1, t('createWorkAssignment.titleRequired')),
    description: z.string().optional(),
    landId: z.union([z.number(), z.literal("none")]).optional(),
    workTypeId: z.number().min(1, t('createWorkAssignment.workTypeRequired')),
    workStatusId: z.number().optional(),
    teamId: z.number().optional(),
    assignedToUserId: z.number().optional(),
    priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
    status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']).optional(),
    dueDate: z.string().optional(),
  }).refine(
    (data) => data.teamId || data.assignedToUserId,
    {
      message: t('createWorkAssignment.eitherTeamOrUserMustBeAssigned'),
      path: ["teamId"],
    }
  ).refine(
    (data) => !(data.teamId && data.assignedToUserId),
    {
      message: t('createWorkAssignment.cannotAssignToBothTeamAndUser'),
      path: ["assignedToUserId"],
    }
  );

  type WorkAssignmentFormData = z.infer<typeof workAssignmentSchema>;
  const [lands, setLands] = useState<Land[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [workCategories, setWorkCategories] = useState<WorkCategory[]>([]);
  const [workTypes, setWorkTypes] = useState<WorkType[]>([]);
  const [workStatuses, setWorkStatuses] = useState<WorkStatus[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [loadingData, setLoadingData] = useState(false);
  const [assignmentType, setAssignmentType] = useState<'team' | 'individual'>('team');

  const form = useForm<WorkAssignmentFormData>({
    resolver: zodResolver(workAssignmentSchema),
    defaultValues: {
      title: assignment?.title || '',
      description: assignment?.description || '',
      landId: assignment?.landId || "none",
      workTypeId: assignment?.workTypeId || undefined,
      workStatusId: assignment?.workStatusId || undefined,
      teamId: assignment?.teamId || undefined,
      assignedToUserId: assignment?.assignedToUserId || undefined,
      priority: assignment?.priority || 'medium',
      status: assignment?.status || 'pending',
      dueDate: assignment?.dueDate || '',
    },
  });

  // Fetch data when dialog opens
  useEffect(() => {
    console.log('useEffect triggered, open:', open);
    if (open) {
      console.log('Dialog is open, calling fetchData...');
      fetchData();
    } else {
      console.log('Dialog is closed');
    }
  }, [open]);

  // Update form values when assignment prop changes
  useEffect(() => {
    if (assignment) {
      // Find the category for the work type
      const workType = workTypes.find(wt => wt.id === assignment.workTypeId);
      if (workType) {
        setSelectedCategoryId(workType.categoryId);
      }
      
      form.reset({
        title: assignment.title,
        description: assignment.description,
        landId: assignment.landId || "none",
        workTypeId: assignment.workTypeId || undefined,
        teamId: assignment.teamId || undefined,
        assignedToUserId: assignment.assignedToUserId || undefined,
        priority: assignment.priority,
        status: assignment.status,
        dueDate: assignment.dueDate || '',
      });
      setAssignmentType(assignment.teamId ? 'team' : 'individual');
    } else {
      form.reset({
        title: '',
        description: '',
        landId: "none",
        workTypeId: undefined,
        teamId: undefined,
        assignedToUserId: undefined,
        priority: 'medium',
        status: 'pending',
        dueDate: '',
      });
      setSelectedCategoryId(null);
      setAssignmentType('team');
    }
  }, [assignment, form, workTypes]);

  const fetchData = async () => {
    try {
      console.log('=== fetchData function called ===');
      setLoadingData(true);
      
      console.log('Fetching data...');
      
      // Fetch all data including work categories, types, and statuses
      const [landsResponse, teamsResponse, usersResponse, categoriesResponse, workTypesResponse, statusesResponse] = await Promise.all([
        axiosClient.get('/lands'),
        axiosClient.get('/teams'),
        axiosClient.get('/users'),
        axiosClient.get('/farm-works/categories').catch((error) => {
          console.error('Categories API error:', error);
          console.error('Categories API error details:', error.response?.data);
          console.error('Categories API status:', error.response?.status);
          return { data: { success: false, data: [], error: error.message } };
        }),
        axiosClient.get('/farm-works/work-types').catch((error) => {
          console.error('Work types API error:', error);
          console.error('Work types API error details:', error.response?.data);
          console.error('Work types API status:', error.response?.status);
          return { data: { success: false, data: [], error: error.message } };
        }),
        axiosClient.get('/work-statuses').catch((error) => {
          console.error('Work statuses API error:', error);
          console.error('Work statuses API error details:', error.response?.data);
          console.error('Work statuses API status:', error.response?.status);
          return { data: { success: false, data: [], error: error.message } };
        }),
      ]);
      
      setLands(landsResponse.data || []);
      setTeams(teamsResponse.data || []);
      setUsers(usersResponse.data || []);
      
      // Process work categories data
      const categoriesData = Array.isArray(categoriesResponse.data?.data) ? categoriesResponse.data.data : [];
      const workTypesData = Array.isArray(workTypesResponse.data?.data) ? workTypesResponse.data.data : [];
      const statusesData = Array.isArray(statusesResponse.data?.data) ? statusesResponse.data.data : [];
      
      setWorkCategories(categoriesData);
      setWorkTypes(workTypesData);
      setWorkStatuses(statusesData);
      
      console.log('=== API Response Analysis ===');
      console.log('Categories API response:', categoriesResponse.data);
      console.log('Work types API response:', workTypesResponse.data);
      console.log('Work statuses API response:', statusesResponse.data);
      console.log('=== Processed Data ===');
      console.log('Work categories count:', categoriesData.length);
      console.log('Work types count:', workTypesData.length);
      console.log('Work statuses count:', statusesData.length);
      console.log('Categories data:', categoriesData);
      console.log('Work types data:', workTypesData);
      console.log('Work statuses data:', statusesData);
      
      // Check for API errors and show user-friendly messages
      if (categoriesResponse.data?.success === false) {
        console.error('Categories API failed:', categoriesResponse.data.error);
        toast.error(`Failed to load work categories: ${categoriesResponse.data.error}`);
      }
      if (workTypesResponse.data?.success === false) {
        console.error('Work types API failed:', workTypesResponse.data.error);
        toast.error(`Failed to load work types: ${workTypesResponse.data.error}`);
      }
      if (statusesResponse.data?.success === false) {
        console.error('Work statuses API failed:', statusesResponse.data.error);
        toast.error(`Failed to load work statuses: ${statusesResponse.data.error}`);
      }
      
    } catch (error) {
      console.error('Failed to fetch data:', error);
      // Set empty arrays as fallback
      setLands([]);
      setTeams([]);
      setUsers([]);
      setWorkCategories([]);
      setWorkTypes([]);
    } finally {
      setLoadingData(false);
    }
  };

  const onSubmit = async (values: WorkAssignmentFormData) => {
    try {
        const payload = {
          title: values.title,
          description: values.description,
          land_id: values.landId === "none" ? null : values.landId || null,
          work_type_id: values.workTypeId, // Required field
          work_status_id: values.workStatusId || null,
          assigned_team_id: assignmentType === 'team' ? values.teamId : null,
          assigned_to_user_id: assignmentType === 'individual' ? values.assignedToUserId : null,
          priority_level: values.priority,
          status: values.status,
          due_date: values.dueDate || null,
        };

      if (isEditing && assignment) {
        // Update existing assignment
        await axiosClient.put(`/farm-works/${assignment.id}`, payload);
      } else {
        // Create new assignment
        await axiosClient.post('/farm-works', payload);
      }
      
      toast.success(isEditing ? t('createWorkAssignment.workAssignmentUpdated') : t('createWorkAssignment.workAssignmentCreated'));
      onAssignmentSaved();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Failed to save work assignment:', error);
      toast.error(error.response?.data?.error || t('createWorkAssignment.failedToSaveAssignment'));
    }
  };

  const handleAssignmentTypeChange = (type: 'team' | 'individual') => {
    setAssignmentType(type);
    // Clear the opposite field when switching types
    if (type === 'team') {
      form.setValue('assignedToUserId', undefined);
    } else {
      form.setValue('teamId', undefined);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <ClipboardList className="h-5 w-5" />
            <span>{isEditing ? t('createWorkAssignment.editWorkAssignment') : t('createWorkAssignment.createNewWorkAssignment')}</span>
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? t('createWorkAssignment.editWorkAssignmentDescription')
              : t('createWorkAssignment.createWorkAssignmentDescription')
            }
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('createWorkAssignment.title')}</FormLabel>
                  <FormControl>
                    <Input placeholder={t('createWorkAssignment.enterAssignmentTitle')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('createWorkAssignment.description')}</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder={t('createWorkAssignment.enterAssignmentDescription')} 
                      {...field} 
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Two Column Layout for Dropdowns */}
            <div className="grid grid-cols-2 gap-4">
              {/* Left Column */}
              <div className="space-y-4">
                {/* Work Category Selection */}
                <div className="space-y-2">
                  <FormLabel className="flex items-center space-x-2">
                    <ClipboardList className="h-4 w-4" />
                    <span>{t('createWorkAssignment.workCategory')}</span>
                  </FormLabel>
                  <Select 
                    onValueChange={(value) => {
                      const categoryId = value ? parseInt(value) : null;
                      setSelectedCategoryId(categoryId);
                      // Reset work type when category changes
                      form.setValue('workTypeId', undefined);
                    }}
                    value={selectedCategoryId?.toString() || ''}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('createWorkAssignment.selectWorkCategory')} />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.isArray(workCategories) && workCategories.length > 0 ? (
                        workCategories.map((category) => (
                          <SelectItem key={category.id} value={category.id.toString()}>
                            <div className="flex items-center space-x-2">
                              <div 
                                className="w-3 h-3 rounded-full" 
                                style={{ backgroundColor: category.color }}
                              />
                              <span>{category.name}</span>
                            </div>
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no-categories" disabled>
                          <span className="text-gray-500">No categories available</span>
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {/* Work Status Selection */}
                <FormField
                  control={form.control}
                  name="workStatusId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4" />
                        <span>{t('createWorkAssignment.workStatus')}</span>
                      </FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)} 
                        value={field.value?.toString() || ''}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t('createWorkAssignment.selectWorkStatus')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Array.isArray(workStatuses) ? (
                            workStatuses
                              .sort((a, b) => a.sortOrder - b.sortOrder)
                              .map((status) => (
                                <SelectItem key={status.id} value={status.id.toString()}>
                                  <div className="flex items-center space-x-2">
                                    <div 
                                      className="w-3 h-3 rounded-full" 
                                      style={{ backgroundColor: status.color }}
                                    />
                                    <span>{status.displayName}</span>
                                  </div>
                                </SelectItem>
                              ))
                          ) : (
                            <SelectItem value="no-statuses" disabled>
                              <span className="text-gray-500">No statuses available</span>
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                {/* Work Type Selection */}
                <FormField
                  control={form.control}
                  name="workTypeId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center space-x-2">
                        <ClipboardList className="h-4 w-4" />
                        <span>{t('createWorkAssignment.workType')}</span>
                      </FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)} 
                        value={field.value?.toString() || ''}
                        disabled={!selectedCategoryId}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={
                              selectedCategoryId 
                                ? t('createWorkAssignment.selectWorkType') 
                                : t('createWorkAssignment.selectCategoryFirst')
                            } />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Array.isArray(workTypes) ? (
                            workTypes
                              .filter(workType => workType.categoryId === selectedCategoryId)
                              .map((workType) => (
                                <SelectItem key={workType.id} value={workType.id.toString()}>
                                  <div className="flex flex-col">
                                    <div className="flex items-center space-x-2">
                                      <div 
                                        className="w-2 h-2 rounded-full" 
                                        style={{ backgroundColor: workType.categoryColor }}
                                      />
                                      <span>{workType.name}</span>
                                    </div>
                                    {workType.estimatedDurationHours && (
                                      <span className="text-xs text-gray-500">
                                        {t('createWorkAssignment.estimatedDuration')}: {workType.estimatedDurationHours}h
                                      </span>
                                    )}
                                  </div>
                                </SelectItem>
                              ))
                          ) : (
                            <SelectItem value="no-work-types" disabled>
                              <span className="text-gray-500">No work types available</span>
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Land Selection */}
                <FormField
                  control={form.control}
                  name="landId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4" />
                        <span>{t('createWorkAssignment.landOptional')}</span>
                      </FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)} 
                        value={field.value?.toString() || ''}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t('createWorkAssignment.selectLandOptional')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">
                            <div className="flex flex-col">
                              <span>{t('createWorkAssignment.noSpecificLand')}</span>
                              <span className="text-xs text-gray-500">
                                {t('createWorkAssignment.generalAssignment')}
                              </span>
                            </div>
                          </SelectItem>
                          {lands.map((land) => (
                            <SelectItem key={land.id} value={land.id.toString()}>
                              <div className="flex flex-col">
                                <span>{land.land_name}</span>
                                <span className="text-xs text-gray-500">
                                  {land.land_code}
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Assignment Type Selection */}
            <div className="space-y-2">
              <FormLabel>{t('createWorkAssignment.assignmentType')}</FormLabel>
              <div className="flex space-x-4">
                <Button
                  type="button"
                  variant={assignmentType === 'team' ? 'default' : 'outline'}
                  onClick={() => handleAssignmentTypeChange('team')}
                  className="flex items-center space-x-2"
                >
                  <Users className="h-4 w-4" />
                  <span>{t('createWorkAssignment.assignToTeam')}</span>
                </Button>
                <Button
                  type="button"
                  variant={assignmentType === 'individual' ? 'default' : 'outline'}
                  onClick={() => handleAssignmentTypeChange('individual')}
                  className="flex items-center space-x-2"
                >
                  <User className="h-4 w-4" />
                  <span>{t('createWorkAssignment.assignToIndividual')}</span>
                </Button>
              </div>
            </div>

            {assignmentType === 'team' && (
              <FormField
                control={form.control}
                name="teamId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center space-x-2">
                      <Users className="h-4 w-4" />
                      <span>{t('createWorkAssignment.team')}</span>
                    </FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)} 
                      value={field.value?.toString() || ''}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('createWorkAssignment.selectTeam')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {teams.map((team) => (
                          <SelectItem key={team.id} value={team.id.toString()}>
                            {team.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {assignmentType === 'individual' && (
              <FormField
                control={form.control}
                name="assignedToUserId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center space-x-2">
                      <User className="h-4 w-4" />
                      <span>{t('createWorkAssignment.assignedUser')}</span>
                    </FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)} 
                      value={field.value?.toString() || ''}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('createWorkAssignment.selectUser')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {users.map((user) => (
                          <SelectItem key={user.id} value={user.id.toString()}>
                            <div className="flex flex-col">
                              <span>{user.first_name} {user.last_name}</span>
                              <span className="text-xs text-gray-500">
                                {t(`userManagement.${user.role}`)}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center space-x-2">
                      <AlertTriangle className="h-4 w-4" />
                      <span>{t('createWorkAssignment.priority')}</span>
                    </FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('createWorkAssignment.selectPriority')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="low">{t('createWorkAssignment.low')}</SelectItem>
                        <SelectItem value="medium">{t('createWorkAssignment.medium')}</SelectItem>
                        <SelectItem value="high">{t('createWorkAssignment.high')}</SelectItem>
                        <SelectItem value="urgent">{t('createWorkAssignment.urgent')}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('createWorkAssignment.status')}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('createWorkAssignment.selectStatus')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pending">{t('createWorkAssignment.pending')}</SelectItem>
                        <SelectItem value="in_progress">{t('createWorkAssignment.inProgress')}</SelectItem>
                        <SelectItem value="completed">{t('createWorkAssignment.completed')}</SelectItem>
                        <SelectItem value="cancelled">{t('createWorkAssignment.cancelled')}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="dueDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4" />
                    <span>{t('createWorkAssignment.dueDateOptional')}</span>
                  </FormLabel>
                  <FormControl>
                    <Input 
                      type="date" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
              >
                {t('createWorkAssignment.cancel')}
              </Button>
              <Button type="submit" disabled={loadingData}>
                {isEditing ? t('createWorkAssignment.updateAssignment') : t('createWorkAssignment.createAssignment')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default WorkAssignmentFormDialog;
