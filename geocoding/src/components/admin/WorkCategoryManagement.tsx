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
  description: string;
  color: string;
  icon: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface WorkCategoryFormData {
  name: string;
  description: string;
  color: string;
  icon: string;
  sortOrder: number;
}

const WorkCategoryManagement: React.FC = () => {
  const { t } = useTranslation();

  // Helper function to get translated category name
  const getTranslatedCategoryName = (name: string): string => {
    const translationKey = `workCategories.categoryNames.${name}`;
    const translated = t(translationKey);
    // If translation key doesn't exist, return original name
    return translated !== translationKey ? translated : name;
  };

  // Helper function to get translated category description
  const getTranslatedCategoryDescription = (description: string): string => {
    const translationKey = `workCategories.categoryDescriptions.${description}`;
    const translated = t(translationKey);
    // If translation key doesn't exist, return original description
    return translated !== translationKey ? translated : description;
  };
  const [categories, setCategories] = useState<WorkCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<WorkCategory | null>(null);
  const [formData, setFormData] = useState<WorkCategoryFormData>({
    name: '',
    description: '',
    color: '#6b7280',
    icon: '',
    sortOrder: 0,
  });

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await axiosClient.get('/work-categories');
      setCategories(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch work categories:', error);
      toast.error('Failed to fetch work categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingCategory) {
        await axiosClient.put(`/work-categories/${editingCategory.id}`, formData);
        toast.success('Work category updated successfully');
      } else {
        await axiosClient.post('/work-categories', formData);
        toast.success('Work category created successfully');
      }
      
      setIsDialogOpen(false);
      setEditingCategory(null);
      resetForm();
      fetchCategories();
    } catch (error: any) {
      console.error('Failed to save work category:', error);
      toast.error(error.response?.data?.error || 'Failed to save work category');
    }
  };

  const handleEdit = (category: WorkCategory) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description,
      color: category.color,
      icon: category.icon,
      sortOrder: category.sortOrder,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this work category?')) {
      return;
    }

    try {
      await axiosClient.delete(`/work-categories/${id}`);
      toast.success('Work category deleted successfully');
      fetchCategories();
    } catch (error: any) {
      console.error('Failed to delete work category:', error);
      toast.error(error.response?.data?.error || 'Failed to delete work category');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      color: '#6b7280',
      icon: '',
      sortOrder: 0,
    });
  };

  const openCreateDialog = () => {
    setEditingCategory(null);
    resetForm();
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">{t('workCategories.title')}</h2>
          <p className="text-gray-600">{t('workCategories.description')}</p>
        </div>
        <Button onClick={openCreateDialog} className="flex items-center space-x-2">
          <Plus className="h-4 w-4" />
          <span>{t('workCategories.createCategory')}</span>
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-8">{t('workCategories.loading')}</div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('workCategories.name')}</TableHead>
                <TableHead>{t('workCategories.description')}</TableHead>
                <TableHead>{t('workCategories.color')}</TableHead>
                <TableHead>{t('workCategories.icon')}</TableHead>
                <TableHead>{t('workCategories.sortOrder')}</TableHead>
                <TableHead>{t('workCategories.status')}</TableHead>
                <TableHead>{t('workCategories.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell className="font-medium">{getTranslatedCategoryName(category.name)}</TableCell>
                  <TableCell>{getTranslatedCategoryDescription(category.description)}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: category.color }}
                      />
                      <span>{category.color}</span>
                    </div>
                  </TableCell>
                  <TableCell>{category.icon}</TableCell>
                  <TableCell>{category.sortOrder}</TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        category.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {category.isActive ? t('workCategories.active') : t('workCategories.inactive')}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(category)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(category.id)}
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
              {editingCategory ? t('workCategories.editCategory') : t('workCategories.createCategory')}
            </DialogTitle>
            <DialogDescription>
              {editingCategory
                ? t('workCategories.editDescription')
                : t('workCategories.createDescription')}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t('workCategories.name')} *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter category name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">{t('workCategories.description')}</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter category description"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="color">{t('workCategories.color')}</Label>
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
                <Label htmlFor="sortOrder">{t('workCategories.sortOrder')}</Label>
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
              <Label htmlFor="icon">{t('workCategories.icon')}</Label>
              <Input
                id="icon"
                value={formData.icon}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                placeholder="Enter icon name (e.g., ClipboardList)"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                {t('workCategories.cancel')}
              </Button>
              <Button type="submit">
                {editingCategory ? t('workCategories.update') : t('workCategories.create')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WorkCategoryManagement;