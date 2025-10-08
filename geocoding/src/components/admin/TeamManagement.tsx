import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Users, 
  Edit, 
  Trash2, 
  Search,
  Crown,
  RefreshCw,
  AlertTriangle,
  Plus
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useGenericCrud } from '@/hooks/useGenericCrud';
import { canManageTeams } from '@/stores/authStore';
import TeamFormDialog from './TeamFormDialog';

interface TeamData {
  id: number;
  name: string;
  description: string;
  teamLeadId: number | null;
  teamLeadName: string | null;
  createdBy: number;
  createdByName: string;
  memberCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const TeamManagement: React.FC = () => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTeam, setSelectedTeam] = useState<TeamData | null>(null);
  const [isTeamFormOpen, setIsTeamFormOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const { 
    data: teams, 
    loading: teamsLoading, 
    error: teamsError, 
    fetchData: refreshTeams,
    deleteItem: deleteTeam 
  } = useGenericCrud<TeamData>('teams');

  // Check if user has team management permissions
  if (!canManageTeams()) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">{t('teams.accessDenied')}</h1>
          <p className="text-gray-600">{t('teams.noPermission')}</p>
        </div>
      </div>
    );
  }

  const handleCreateTeam = () => {
    setSelectedTeam(null);
    setIsEditing(false);
    setIsTeamFormOpen(true);
  };

  const handleEditTeam = (team: TeamData) => {
    setSelectedTeam(team);
    setIsEditing(true);
    setIsTeamFormOpen(true);
  };

  const handleDeleteTeam = async (teamId: number) => {
    if (window.confirm(t('teams.deleteConfirm'))) {
      try {
        await deleteTeam(teamId);
        await refreshTeams();
      } catch (error) {
        console.error('Failed to delete team:', error);
      }
    }
  };

  const handleTeamFormClose = () => {
    setIsTeamFormOpen(false);
    setSelectedTeam(null);
    setIsEditing(false);
    refreshTeams();
  };

  const filteredTeams = (teams || []).filter(team => 
    team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    team.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (team.teamLeadName && team.teamLeadName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">{t('teams.title')}</h2>
        <Button onClick={handleCreateTeam}>
          <Plus className="h-4 w-4 mr-2" />
          {t('teams.createTeam')}
        </Button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder={t('teams.searchPlaceholder')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Loading State */}
      {teamsLoading && (
        <div className="text-center py-8">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <div className="text-gray-500">{t('teams.loading')}</div>
        </div>
      )}

      {/* Error State */}
      {teamsError && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
{t('teams.errorLoading')}: {teamsError.message}
          </AlertDescription>
        </Alert>
      )}

      {/* Results Count */}
      {!teamsLoading && !teamsError && (
        <div className="text-sm text-gray-600">
{t('teams.showing')} {filteredTeams.length} {t('teams.of')} {teams?.length || 0} {t('teams.teams')}
          {searchTerm && (
            <span className="ml-2">
              {t('teams.for')} "{searchTerm}"
            </span>
          )}
        </div>
      )}

      {/* Teams Grid */}
      {!teamsLoading && !teamsError && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTeams.map((team) => (
            <Card key={team.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{team.name}</CardTitle>
                  <Badge variant="outline">
                    {team.memberCount} {t('teams.members')}
                  </Badge>
                </div>
                <CardDescription>{team.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">{t('teams.teamLead')}</span>
                    <div className="flex items-center space-x-1">
                      {team.teamLeadName ? (
                        <>
                          <Crown className="h-3 w-3 text-purple-500" />
                          <span className="text-sm font-medium">{team.teamLeadName}</span>
                        </>
                      ) : (
                        <span className="text-sm text-gray-400">{t('teams.notAssigned')}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">{t('teams.createdBy')}</span>
                    <span className="text-sm font-medium">{team.createdByName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">{t('teams.created')}</span>
                    <span className="text-sm font-medium">
                      {new Date(team.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="mt-4 flex justify-between items-center">
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleEditTeam(team)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      {t('teams.edit')}
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDeleteTeam(team.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      {t('teams.delete')}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!teamsLoading && !teamsError && filteredTeams.length === 0 && (
        <div className="text-center py-12">
          <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium mb-2">{t('teams.noTeamsFound')}</h3>
          <p className="text-sm text-gray-500 mb-4">
            {searchTerm 
              ? `${t('teams.noTeamsMatchSearch')} "${searchTerm}"`
              : t('teams.noTeamsCreatedYet')
            }
          </p>
          {!searchTerm && (
            <Button onClick={handleCreateTeam}>
              <Plus className="h-4 w-4 mr-2" />
              {t('teams.createFirstTeam')}
            </Button>
          )}
        </div>
      )}

      {/* Team Form Dialog */}
      <TeamFormDialog
        open={isTeamFormOpen}
        onOpenChange={setIsTeamFormOpen}
        team={selectedTeam}
        isEditing={isEditing}
        onTeamSaved={handleTeamFormClose}
      />
    </div>
  );
};

export default TeamManagement;
