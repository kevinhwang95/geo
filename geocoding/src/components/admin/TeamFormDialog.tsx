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
import { Users, Crown, FileText, UserPlus, UserMinus, User } from 'lucide-react';

interface TeamFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  team?: {
    id: number;
    name: string;
    description: string;
    teamLeadId: number | null;
    teamLeadName: string | null;
  } | null;
  isEditing: boolean;
  onTeamSaved: () => void;
}

interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
}

const TeamFormDialog: React.FC<TeamFormDialogProps> = ({
  open,
  onOpenChange,
  team,
  isEditing,
  onTeamSaved,
}) => {
  const { t } = useTranslation();
  
  const teamSchema = z.object({
    name: z.string().min(1, t('createTeam.teamNameRequired')),
    description: z.string().optional(),
    teamLeadId: z.union([z.number(), z.literal("none")]).optional(),
  });

  type TeamFormData = z.infer<typeof teamSchema>;
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [teamMembers, setTeamMembers] = useState<User[]>([]);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  const form = useForm<TeamFormData>({
    resolver: zodResolver(teamSchema),
    defaultValues: {
      name: team?.name || '',
      description: team?.description || '',
      teamLeadId: team?.teamLeadId || "none",
    },
  });

  // Fetch users for team lead selection and team members
  useEffect(() => {
    if (open) {
      fetchUsers();
      if (isEditing && team) {
        fetchTeamMembers();
      }
    }
  }, [open, isEditing, team]);

  // Update form values when team prop changes
  useEffect(() => {
    if (team) {
      form.reset({
        name: team.name,
        description: team.description,
        teamLeadId: team.teamLeadId || "none",
      });
    } else {
      form.reset({
        name: '',
        description: '',
        teamLeadId: "none",
      });
    }
  }, [team, form]);

  const fetchTeamMembers = async () => {
    if (!team) return;
    
    try {
      setLoadingMembers(true);
      const response = await axiosClient.get(`/teams/${team.id}/members`);
      
      // Handle different response structures
      let members = [];
      if (Array.isArray(response.data)) {
        members = response.data;
      } else if (response.data && Array.isArray(response.data.data)) {
        members = response.data.data;
      } else if (response.data && response.data.members) {
        members = response.data.members;
      } else {
        console.warn('Unexpected team members response structure:', response.data);
        members = [];
      }
      
      setTeamMembers(members);
      
      // Update available users (exclude current team members)
      const memberIds = members.map((member: User) => member.id);
      setAvailableUsers(users.filter(user => !memberIds.includes(user.id)));
    } catch (error) {
      console.error('Error fetching team members:', error);
      setTeamMembers([]);
    } finally {
      setLoadingMembers(false);
    }
  };

  const addTeamMember = async (userId: number) => {
    if (!team) return;
    
    try {
      await axiosClient.post(`/teams/add-member/${team.id}`, { userId: userId });
      
      // Update local state
      const userToAdd = users.find(user => user.id === userId);
      if (userToAdd) {
        setTeamMembers(prev => [...prev, userToAdd]);
        setAvailableUsers(prev => prev.filter(user => user.id !== userId));
      }
    } catch (error) {
      console.error('Error adding team member:', error);
    }
  };

  const removeTeamMember = async (userId: number) => {
    if (!team) return;
    
    try {
      await axiosClient.post(`/teams/remove-member/${team.id}`, { userId: userId });
      
      // Update local state
      const userToRemove = teamMembers.find(user => user.id === userId);
      if (userToRemove) {
        setTeamMembers(prev => prev.filter(user => user.id !== userId));
        setAvailableUsers(prev => [...prev, userToRemove]);
      }
    } catch (error) {
      console.error('Error removing team member:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const response = await axiosClient.get('/users');
      setUsers(response.data);
      
      // If not editing, all users are available
      if (!isEditing || !team) {
        setAvailableUsers(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  const onSubmit = async (values: TeamFormData) => {
    try {
      const payload = {
        name: values.name,
        description: values.description,
        teamLeadId: values.teamLeadId === "none" ? null : values.teamLeadId || null,
      };

      if (isEditing && team) {
        // Update existing team
        await axiosClient.put(`/teams/${team.id}`, payload);
      } else {
        // Create new team
        await axiosClient.post('/teams', payload);
      }
      
      onTeamSaved();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Failed to save team:', error);
      alert(error.response?.data?.error || t('createTeam.failedToSaveTeam'));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>{isEditing ? t('createTeam.editTeam') : t('createTeam.createNewTeam')}</span>
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? t('createTeam.editTeamDescription')
              : t('createTeam.createTeamDescription')
            }
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center space-x-2">
                    <Users className="h-4 w-4" />
                    <span>{t('createTeam.teamName')}</span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder={t('createTeam.enterTeamName')} {...field} />
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
                  <FormLabel className="flex items-center space-x-2">
                    <FileText className="h-4 w-4" />
                    <span>{t('createTeam.description')}</span>
                  </FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder={t('createTeam.enterTeamDescription')} 
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
              name="teamLeadId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center space-x-2">
                    <Crown className="h-4 w-4" />
                    <span>{t('createTeam.teamLead')}</span>
                  </FormLabel>
                  <Select 
                    onValueChange={(value) => field.onChange(value === "none" ? "none" : (value ? parseInt(value) : undefined))} 
                    value={field.value?.toString() || 'none'}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('createTeam.selectTeamLead')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="max-h-60 overflow-y-auto" style={{scrollbarWidth: 'thin', scrollbarColor: '#d1d5db #f3f4f6'}}>
                      <SelectItem value="none">
                        <div className="flex flex-col">
                          <span>{t('createTeam.noTeamLead')}</span>
                          <span className="text-xs text-gray-500">
                            {t('createTeam.teamManagedByAdmin')}
                          </span>
                        </div>
                      </SelectItem>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id.toString()}>
                          <div className="flex flex-col">
                            <span>{user.first_name} {user.last_name}</span>
                            <span className="text-xs text-gray-500">
                              {t(`userManagement.${user.role}`)} • {user.email}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                  <p className="text-xs text-gray-500">
                    {t('createTeam.teamLeadCanManage')}
                  </p>
                </FormItem>
              )}
            />

            {/* Team Members Management - Only show when editing */}
            {isEditing && team && (
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4" />
                  <span className="text-sm font-medium">{t('createTeam.teamMembers')}</span>
                </div>
                
                {/* Current Team Members */}
                <div className="space-y-2">
                  <div className="text-xs text-gray-500">{t('createTeam.currentMembers')} ({Array.isArray(teamMembers) ? teamMembers.length : 0})</div>
                  {loadingMembers ? (
                    <div className="text-sm text-gray-500">{t('createTeam.loadingMembers')}</div>
                  ) : !Array.isArray(teamMembers) || teamMembers.length === 0 ? (
                    <div className="text-sm text-gray-500">{t('createTeam.noTeamMembersYet')}</div>
                  ) : (
                    <div className="max-h-48 overflow-y-auto space-y-2 pr-2" style={{scrollbarWidth: 'thin', scrollbarColor: '#d1d5db #f3f4f6'}}>
                      {teamMembers.map((member) => (
                        <div key={member.id} className="flex items-center justify-between p-2 border rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                              <User className="h-4 w-4 text-gray-600" />
                            </div>
                            <div>
                              <div className="text-sm font-medium">
                                {member.first_name} {member.last_name}
                              </div>
                              <div className="text-xs text-gray-500">
                                {member.role} • {member.email}
                              </div>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeTeamMember(member.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <UserMinus className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Add Team Members */}
                {Array.isArray(availableUsers) && availableUsers.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-xs text-gray-500">{t('createTeam.addMembers')}</div>
                    <div className="max-h-48 overflow-y-auto space-y-1 pr-2" style={{scrollbarWidth: 'thin', scrollbarColor: '#d1d5db #f3f4f6'}}>
                      {availableUsers.map((user) => (
                        <div key={user.id} className="flex items-center justify-between p-2 border rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                              <User className="h-4 w-4 text-gray-600" />
                            </div>
                            <div>
                              <div className="text-sm font-medium">
                                {user.first_name} {user.last_name}
                              </div>
                              <div className="text-xs text-gray-500">
                                {t(`userManagement.${user.role}`)} • {user.email}
                              </div>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => addTeamMember(user.id)}
                            className="text-green-600 hover:text-green-700"
                          >
                            <UserPlus className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
              >
                {t('createTeam.cancel')}
              </Button>
              <Button type="submit" disabled={loadingUsers}>
                {isEditing ? t('createTeam.updateTeam') : t('createTeam.createTeam')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default TeamFormDialog;
