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
          <h2 className="text-2xl font-bold">Work Statuses</h2>
          <p className="text-gray-600">Manage work statuses for farm assignments</p>
        </div>
        <Button onClick={openCreateDialog} className="flex items-center space-x-2">
          <Plus className="h-4 w-4" />
          <span>Add Status</span>
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-8">Loading work statuses...</div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Display Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Color</TableHead>
                <TableHead>Icon</TableHead>
                <TableHead>Sort Order</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {workStatuses.map((status) => (
                <TableRow key={status.id}>
                  <TableCell className="font-medium">{status.name}</TableCell>
                  <TableCell>{status.displayName}</TableCell>
                  <TableCell>{status.description}</TableCell>
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
                      {status.isFinal ? 'Final' : 'Progress'}
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
                      {status.isActive ? 'Active' : 'Inactive'}
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
              {editingStatus ? 'Edit Work Status' : 'Create Work Status'}
            </DialogTitle>
            <DialogDescription>
              {editingStatus
                ? 'Update the work status information.'
                : 'Add a new work status for farm assignments.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., pending"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="displayName">Display Name *</Label>
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
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter status description"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="color">Color</Label>
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
                <Label htmlFor="sortOrder">Sort Order</Label>
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
              <Label htmlFor="icon">Icon</Label>
              <Input
                id="icon"
                value={formData.icon}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                placeholder="Enter icon name (e.g., CheckCircle)"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="isActive">Status</Label>
                <Select
                  value={formData.isActive.toString()}
                  onValueChange={(value) => setFormData({ ...formData, isActive: value === 'true' })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Active</SelectItem>
                    <SelectItem value="false">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="isFinal">Type</Label>
                <Select
                  value={formData.isFinal.toString()}
                  onValueChange={(value) => setFormData({ ...formData, isFinal: value === 'true' })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="false">Progress Status</SelectItem>
                    <SelectItem value="true">Final Status</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {editingStatus ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WorkStatusManagement;



