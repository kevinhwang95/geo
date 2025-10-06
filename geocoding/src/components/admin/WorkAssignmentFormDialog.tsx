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
import axiosClient from '@/api/axiosClient';
import { ClipboardList, Users, User, MapPin, Calendar, AlertTriangle } from 'lucide-react';

const workAssignmentSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  landId: z.union([z.number(), z.literal("none")]).optional(),
  teamId: z.number().optional(),
  assignedToUserId: z.number().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']).optional(),
  dueDate: z.string().optional(),
}).refine(
  (data) => data.teamId || data.assignedToUserId,
  {
    message: "Either team or individual user must be assigned",
    path: ["teamId"],
  }
).refine(
  (data) => !(data.teamId && data.assignedToUserId),
  {
    message: "Cannot assign to both team and individual user",
    path: ["assignedToUserId"],
  }
);

type WorkAssignmentFormData = z.infer<typeof workAssignmentSchema>;

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

const WorkAssignmentFormDialog: React.FC<WorkAssignmentFormDialogProps> = ({
  open,
  onOpenChange,
  assignment,
  isEditing,
  onAssignmentSaved,
}) => {
  const [lands, setLands] = useState<Land[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [assignmentType, setAssignmentType] = useState<'team' | 'individual'>('team');

  const form = useForm<WorkAssignmentFormData>({
    resolver: zodResolver(workAssignmentSchema),
    defaultValues: {
      title: assignment?.title || '',
      description: assignment?.description || '',
      landId: assignment?.landId || "none",
      teamId: assignment?.teamId || undefined,
      assignedToUserId: assignment?.assignedToUserId || undefined,
      priority: assignment?.priority || 'medium',
      status: assignment?.status || 'pending',
      dueDate: assignment?.dueDate || '',
    },
  });

  // Fetch data when dialog opens
  useEffect(() => {
    if (open) {
      fetchData();
    }
  }, [open]);

  // Update form values when assignment prop changes
  useEffect(() => {
    if (assignment) {
      form.reset({
        title: assignment.title,
        description: assignment.description,
        landId: assignment.landId || "none",
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
        teamId: undefined,
        assignedToUserId: undefined,
        priority: 'medium',
        status: 'pending',
        dueDate: '',
      });
      setAssignmentType('team');
    }
  }, [assignment, form]);

  const fetchData = async () => {
    try {
      setLoadingData(true);
      const [landsResponse, teamsResponse, usersResponse] = await Promise.all([
        axiosClient.get('/lands'),
        axiosClient.get('/teams'),
        axiosClient.get('/users'),
      ]);
      
      setLands(landsResponse.data);
      setTeams(teamsResponse.data);
      setUsers(usersResponse.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const onSubmit = async (values: WorkAssignmentFormData) => {
    try {
      const payload = {
        title: values.title,
        description: values.description,
        landId: values.landId === "none" ? null : values.landId || null,
        teamId: assignmentType === 'team' ? values.teamId : null,
        assignedToUserId: assignmentType === 'individual' ? values.assignedToUserId : null,
        priority: values.priority,
        status: values.status,
        dueDate: values.dueDate || null,
      };

      if (isEditing && assignment) {
        // Update existing assignment
        await axiosClient.put(`/work-assignments/${assignment.id}`, payload);
      } else {
        // Create new assignment
        await axiosClient.post('/work-assignments', payload);
      }
      
      onAssignmentSaved();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Failed to save work assignment:', error);
      alert(error.response?.data?.error || 'Failed to save work assignment');
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
            <span>{isEditing ? 'Edit Work Assignment' : 'Create New Work Assignment'}</span>
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Update work assignment details and assignment target.'
              : 'Create a new work assignment and assign it to a team or individual user.'
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
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter assignment title" {...field} />
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
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Enter assignment description (optional)" 
                      {...field} 
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="landId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4" />
                    <span>Land (Optional)</span>
                  </FormLabel>
                  <Select 
                    onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)} 
                    value={field.value?.toString() || ''}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a land (optional)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">
                        <div className="flex flex-col">
                          <span>No specific land</span>
                          <span className="text-xs text-gray-500">
                            General assignment
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

            {/* Assignment Type Selection */}
            <div className="space-y-2">
              <FormLabel>Assignment Type</FormLabel>
              <div className="flex space-x-4">
                <Button
                  type="button"
                  variant={assignmentType === 'team' ? 'default' : 'outline'}
                  onClick={() => handleAssignmentTypeChange('team')}
                  className="flex items-center space-x-2"
                >
                  <Users className="h-4 w-4" />
                  <span>Assign to Team</span>
                </Button>
                <Button
                  type="button"
                  variant={assignmentType === 'individual' ? 'default' : 'outline'}
                  onClick={() => handleAssignmentTypeChange('individual')}
                  className="flex items-center space-x-2"
                >
                  <User className="h-4 w-4" />
                  <span>Assign to Individual</span>
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
                      <span>Team</span>
                    </FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)} 
                      value={field.value?.toString() || ''}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a team" />
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
                      <span>Assigned User</span>
                    </FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)} 
                      value={field.value?.toString() || ''}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a user" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {users.map((user) => (
                          <SelectItem key={user.id} value={user.id.toString()}>
                            <div className="flex flex-col">
                              <span>{user.first_name} {user.last_name}</span>
                              <span className="text-xs text-gray-500">
                                {user.role}
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
                      <span>Priority</span>
                    </FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
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
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
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
                    <span>Due Date (Optional)</span>
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
                Cancel
              </Button>
              <Button type="submit" disabled={loadingData}>
                {isEditing ? 'Update Assignment' : 'Create Assignment'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default WorkAssignmentFormDialog;
