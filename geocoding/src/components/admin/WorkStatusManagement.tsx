import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Edit, Trash2, CheckCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import axiosClient from '@/api/axiosClient';
import { toast } from 'sonner';

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

interface WorkStatusFormData {
  name: string;
  displayName: string;
  description: string;
  color: string;
  icon: string;
  sortOrder: number;
  isActive: boolean;
  isFinal: boolean;
}

const WorkStatusManagement: React.FC = () => {
  const { t } = useTranslation();

  // Helper function to get translated work status name
  const getTranslatedStatusName = (name: string): string => {
    const translationKey = `workStatuses.statusNames.${name}`;
    const translated = t(translationKey);
    // If translation key doesn't exist, return original name
    return translated !== translationKey ? translated : name;
  };

  // Helper function to get translated work status display name
  const getTranslatedStatusDisplayName = (displayName: string): string => {
    const translationKey = `workStatuses.statusDisplayNames.${displayName}`;
    const translated = t(translationKey);
    // If translation key doesn't exist, return original display name
    return translated !== translationKey ? translated : displayName;
  };

  // Helper function to get translated work status description
  const getTranslatedStatusDescription = (description: string): string => {
    const translationKey = `workStatuses.statusDescriptions.${description}`;
    const translated = t(translationKey);
    // If translation key doesn't exist, return original description
    return translated !== translationKey ? translated : description;
  };
  const [workStatuses, setWorkStatuses] = useState<WorkStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStatus, setEditingStatus] = useState<WorkStatus | null>(null);
  const [formData, setFormData] = useState<WorkStatusFormData>({
    name: '',
    displayName: '',
    description: '',
    color: '#6b7280',
    icon: '',
    sortOrder: 0,
    isActive: true,
    isFinal: false,
  });

  const fetchWorkStatuses = async () => {
    try {
      setLoading(true);
      const response = await axiosClient.get('/work-statuses');
      setWorkStatuses(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch work statuses:', error);
      toast.error('Failed to fetch work statuses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkStatuses();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingStatus) {
        await axiosClient.put(`/work-statuses/${editingStatus.id}`, formData);
        toast.success('Work status updated successfully');
      } else {
        await axiosClient.post('/work-statuses', formData);
        toast.success('Work status created successfully');
      }
      
      setIsDialogOpen(false);
      setEditingStatus(null);
      resetForm();
      fetchWorkStatuses();
    } catch (error: any) {
      console.error('Failed to save work status:', error);
      toast.error(error.response?.data?.error || 'Failed to save work status');
    }
  };

  const handleEdit = (status: WorkStatus) => {
    setEditingStatus(status);
    setFormData({
      name: status.name,
      displayName: status.displayName,
      description: status.description,
      color: status.color,
      icon: status.icon,
      sortOrder: status.sortOrder,
      isActive: status.isActive,
      isFinal: status.isFinal,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this work status?')) {
      return;
    }

    try {
      await axiosClient.delete(`/work-statuses/${id}`);
      toast.success('Work status deleted successfully');
      fetchWorkStatuses();
    } catch (error: any) {
      console.error('Failed to delete work status:', error);
      toast.error(error.response?.data?.error || 'Failed to delete work status');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      displayName: '',
      description: '',
      color: '#6b7280',
      icon: '',
      sortOrder: 0,
      isActive: true,
      isFinal: false,
    });
  };

  const openCreateDialog = () => {
    setEditingStatus(null);
    resetForm();
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">{t('workStatuses.title')}</h2>
          <p className="text-gray-600">{t('workStatuses.description')}</p>
        </div>
        <Button onClick={openCreateDialog} className="flex items-center space-x-2">
          <Plus className="h-4 w-4" />
          <span>{t('workStatuses.createStatus')}</span>
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-8">{t('workStatuses.loading')}</div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('workStatuses.name')}</TableHead>
                <TableHead>{t('workStatuses.displayName')}</TableHead>
                <TableHead>{t('workStatuses.description')}</TableHead>
                <TableHead>{t('workStatuses.color')}</TableHead>
                <TableHead>{t('workStatuses.icon')}</TableHead>
                <TableHead>{t('workStatuses.sortOrder')}</TableHead>
                <TableHead>{t('workStatuses.type')}</TableHead>
                <TableHead>{t('workStatuses.status')}</TableHead>
                <TableHead>{t('workStatuses.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {workStatuses.map((status) => (
                <TableRow key={status.id}>
                  <TableCell className="font-medium">{getTranslatedStatusName(status.name)}</TableCell>
                  <TableCell>{getTranslatedStatusDisplayName(status.displayName)}</TableCell>
                  <TableCell>{getTranslatedStatusDescription(status.description)}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: status.color }}
                      />
                      <span>{status.color}</span>
                    </div>
                  </TableCell>
                  <TableCell>{status.icon}</TableCell>
                  <TableCell>{status.sortOrder}</TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        status.isFinal
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {status.isFinal ? t('workStatuses.final') : t('workStatuses.intermediate')}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        status.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {status.isActive ? t('workStatuses.active') : t('workStatuses.inactive')}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(status)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(status.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingStatus ? t('workStatuses.editStatus') : t('workStatuses.createStatus')}
            </DialogTitle>
            <DialogDescription>
              {editingStatus
                ? t('workStatuses.editDescription')
                : t('workStatuses.createDescription')}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">{t('workStatuses.name')} *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., pending"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="displayName">{t('workStatuses.displayName')} *</Label>
                <Input
                  id="displayName"
                  value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                  placeholder="e.g., Pending"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">{t('workStatuses.descriptionLabel')}</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter status description"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="color">{t('workStatuses.color')}</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="color"
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-12 h-10 p-1"
                  />
                  <Input
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    placeholder="#6b7280"
                    className="flex-1"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sortOrder">{t('workStatuses.sortOrder')}</Label>
                <Input
                  id="sortOrder"
                  type="number"
                  value={formData.sortOrder}
                  onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="icon">{t('workStatuses.icon')}</Label>
              <Input
                id="icon"
                value={formData.icon}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                placeholder="Enter icon name (e.g., CheckCircle)"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="isActive">{t('workStatuses.status')}</Label>
                <Select
                  value={formData.isActive.toString()}
                  onValueChange={(value) => setFormData({ ...formData, isActive: value === 'true' })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">{t('workStatuses.active')}</SelectItem>
                    <SelectItem value="false">{t('workStatuses.inactive')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="isFinal">{t('workStatuses.type')}</Label>
                <Select
                  value={formData.isFinal.toString()}
                  onValueChange={(value) => setFormData({ ...formData, isFinal: value === 'true' })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="false">{t('workStatuses.intermediate')}</SelectItem>
                    <SelectItem value="true">{t('workStatuses.final')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                {t('workStatuses.cancel')}
              </Button>
              <Button type="submit">
                {editingStatus ? t('workStatuses.update') : t('workStatuses.create')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WorkStatusManagement;





