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
import { Plus, Edit, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import axiosClient from '@/api/axiosClient';
import { toast } from 'sonner';

interface WorkCategory {
  id: number;
  name: string;
  color: string;
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
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface WorkTypeFormData {
  name: string;
  description: string;
  categoryId: number;
  icon: string;
  estimatedDurationHours: number | null;
  sortOrder: number;
}

const WorkTypeManagement: React.FC = () => {
  const { t } = useTranslation();

  // Helper function to get translated work type name
  const getTranslatedWorkTypeName = (name: string): string => {
    const translationKey = `workTypes.typeNames.${name}`;
    const translated = t(translationKey);
    // If translation key doesn't exist, return original name
    return translated !== translationKey ? translated : name;
  };

  // Helper function to get translated work type description
  const getTranslatedWorkTypeDescription = (description: string): string => {
    const translationKey = `workTypes.typeDescriptions.${description}`;
    const translated = t(translationKey);
    // If translation key doesn't exist, return original description
    return translated !== translationKey ? translated : description;
  };

  // Helper function to get translated category name
  const getTranslatedCategoryName = (name: string): string => {
    const translationKey = `workCategories.categoryNames.${name}`;
    const translated = t(translationKey);
    // If translation key doesn't exist, return original name
    return translated !== translationKey ? translated : name;
  };
  const [workTypes, setWorkTypes] = useState<WorkType[]>([]);
  const [categories, setCategories] = useState<WorkCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingWorkType, setEditingWorkType] = useState<WorkType | null>(null);
  const [formData, setFormData] = useState<WorkTypeFormData>({
    name: '',
    description: '',
    categoryId: 0,
    icon: '',
    estimatedDurationHours: null,
    sortOrder: 0,
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [workTypesResponse, categoriesResponse] = await Promise.all([
        axiosClient.get('/work-types'),
        axiosClient.get('/work-categories'),
      ]);
      
      setWorkTypes(workTypesResponse.data.data || []);
      setCategories(categoriesResponse.data.data || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to fetch work types and categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.categoryId) {
      toast.error('Please select a category');
      return;
    }
    
    try {
      if (editingWorkType) {
        await axiosClient.put(`/work-types/${editingWorkType.id}`, formData);
        toast.success('Work type updated successfully');
      } else {
        await axiosClient.post('/work-types', formData);
        toast.success('Work type created successfully');
      }
      
      setIsDialogOpen(false);
      setEditingWorkType(null);
      resetForm();
      fetchData();
    } catch (error: any) {
      console.error('Failed to save work type:', error);
      toast.error(error.response?.data?.error || 'Failed to save work type');
    }
  };

  const handleEdit = (workType: WorkType) => {
    setEditingWorkType(workType);
    setFormData({
      name: workType.name,
      description: workType.description,
      categoryId: workType.categoryId,
      icon: workType.icon,
      estimatedDurationHours: workType.estimatedDurationHours,
      sortOrder: workType.sortOrder,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this work type?')) {
      return;
    }

    try {
      await axiosClient.delete(`/work-types/${id}`);
      toast.success('Work type deleted successfully');
      fetchData();
    } catch (error: any) {
      console.error('Failed to delete work type:', error);
      toast.error(error.response?.data?.error || 'Failed to delete work type');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      categoryId: 0,
      icon: '',
      estimatedDurationHours: null,
      sortOrder: 0,
    });
  };

  const openCreateDialog = () => {
    setEditingWorkType(null);
    resetForm();
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">{t('workTypes.title')}</h2>
          <p className="text-gray-600">{t('workTypes.description')}</p>
        </div>
        <Button onClick={openCreateDialog} className="flex items-center space-x-2">
          <Plus className="h-4 w-4" />
          <span>{t('workTypes.createType')}</span>
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-8">{t('workTypes.loading')}</div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('workTypes.name')}</TableHead>
                <TableHead>{t('workTypes.category')}</TableHead>
                <TableHead>{t('workTypes.description')}</TableHead>
                <TableHead>{t('workTypes.duration')}</TableHead>
                <TableHead>{t('workTypes.icon')}</TableHead>
                <TableHead>{t('workTypes.sortOrder')}</TableHead>
                <TableHead>{t('workTypes.status')}</TableHead>
                <TableHead>{t('workTypes.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {workTypes.map((workType) => (
                <TableRow key={workType.id}>
                  <TableCell className="font-medium">{getTranslatedWorkTypeName(workType.name)}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: workType.categoryColor }}
                      />
                      <span>{getTranslatedCategoryName(workType.categoryName)}</span>
                    </div>
                  </TableCell>
                  <TableCell>{getTranslatedWorkTypeDescription(workType.description)}</TableCell>
                  <TableCell>
                    {workType.estimatedDurationHours ? `${workType.estimatedDurationHours}h` : '-'}
                  </TableCell>
                  <TableCell>{workType.icon}</TableCell>
                  <TableCell>{workType.sortOrder}</TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        workType.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {workType.isActive ? t('workTypes.active') : t('workTypes.inactive')}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(workType)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(workType.id)}
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
              {editingWorkType ? t('workTypes.editType') : t('workTypes.createType')}
            </DialogTitle>
            <DialogDescription>
              {editingWorkType
                ? t('workTypes.editDescription')
                : t('workTypes.createDescription')}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t('workTypes.name')} *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter work type name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">{t('workTypes.description')}</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter work type description"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">{t('workTypes.category')} *</Label>
              <Select
                value={formData.categoryId.toString()}
                onValueChange={(value) => setFormData({ ...formData, categoryId: parseInt(value) })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      <div className="flex items-center space-x-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: category.color }}
                        />
                        <span>{getTranslatedCategoryName(category.name)}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="duration">{t('workTypes.duration')} (hours)</Label>
                <Input
                  id="duration"
                  type="number"
                  value={formData.estimatedDurationHours || ''}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    estimatedDurationHours: e.target.value ? parseInt(e.target.value) : null 
                  })}
                  placeholder="e.g., 2"
                  min="0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sortOrder">{t('workTypes.sortOrder')}</Label>
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
              <Label htmlFor="icon">{t('workTypes.icon')}</Label>
              <Input
                id="icon"
                value={formData.icon}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                placeholder="Enter icon name (e.g., ClipboardList)"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                {t('workTypes.cancel')}
              </Button>
              <Button type="submit">
                {editingWorkType ? t('workTypes.update') : t('workTypes.create')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WorkTypeManagement;