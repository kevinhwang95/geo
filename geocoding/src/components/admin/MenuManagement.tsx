import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Plus, 
  Edit, 
  Trash2, 
  GripVertical, 
  Save,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import axiosClient from '@/api/axiosClient';

interface NavigationMenu {
  id: number;
  menu_key: string;
  label: string;
  icon: string;
  route: string;
  order_index: number;
  is_active: boolean;
  permissions: {
    admin: boolean;
    contributor: boolean;
    team_lead: boolean;
    user: boolean;
  };
}

const MenuManagement: React.FC = () => {
  const [menus, setMenus] = useState<NavigationMenu[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editingMenu, setEditingMenu] = useState<NavigationMenu | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    menu_key: '',
    label: '',
    icon: '',
    route: '',
    order_index: 0,
    is_active: true,
    permissions: {
      admin: false,
      contributor: false,
      team_lead: false,
      user: false
    }
  });

  // Available icons
  const availableIcons = [
    'Home', 'Layers', 'Bell', 'Eye', 'UserCheck', 'ClipboardList', 
    'Users', 'Settings', 'MapPin', 'BarChart3', 'FileText', 'Calendar',
    'Mail', 'Phone', 'Camera', 'Search', 'Filter', 'Download', 'Upload'
  ];

  // Available roles
  const roles = [
    { key: 'admin', label: 'Admin', color: 'bg-red-100 text-red-800' },
    { key: 'contributor', label: 'Contributor', color: 'bg-blue-100 text-blue-800' },
    { key: 'team_lead', label: 'Team Lead', color: 'bg-green-100 text-green-800' },
    { key: 'user', label: 'User', color: 'bg-gray-100 text-gray-800' }
  ];

  useEffect(() => {
    fetchMenus();
  }, []);

  const fetchMenus = async () => {
    try {
      setLoading(true);
      const response = await axiosClient.get('/navigation-menus');
      if (response.data.success) {
        setMenus(response.data.data);
        console.log('Fetched menus:', response.data.data);
        // Debug permissions structure
        response.data.data.forEach((menu: any) => {
          console.log(`Menu ${menu.label} permissions:`, menu.permissions);
        });
      } else {
        setError(response.data.error || 'Failed to fetch menus');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch menus');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMenu = async () => {
    try {
      const response = await axiosClient.post('/navigation-menus', formData);
      if (response.data.success) {
        setSuccess('Menu created successfully');
        setIsCreateDialogOpen(false);
        resetForm();
        fetchMenus();
      } else {
        setError(response.data.error || 'Failed to create menu');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create menu');
    }
  };

  const handleUpdateMenu = async () => {
    if (!editingMenu) return;

    try {
      const response = await axiosClient.put(`/navigation-menus/${editingMenu.id}`, formData);
      if (response.data.success) {
        setSuccess('Menu updated successfully');
        setIsEditDialogOpen(false);
        setEditingMenu(null);
        resetForm();
        fetchMenus();
      } else {
        setError(response.data.error || 'Failed to update menu');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update menu');
    }
  };

  const handleDeleteMenu = async (id: number) => {
    if (!confirm('Are you sure you want to delete this menu item?')) return;

    try {
      const response = await axiosClient.delete(`/navigation-menus/${id}`);
      if (response.data.success) {
        setSuccess('Menu deleted successfully');
        fetchMenus();
      } else {
        setError(response.data.error || 'Failed to delete menu');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete menu');
    }
  };

  const handleEditMenu = (menu: NavigationMenu) => {
    setEditingMenu(menu);
    setFormData({
      menu_key: menu.menu_key,
      label: menu.label,
      icon: menu.icon,
      route: menu.route,
      order_index: menu.order_index,
      is_active: menu.is_active,
      permissions: { ...menu.permissions }
    });
    setIsEditDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      menu_key: '',
      label: '',
      icon: '',
      route: '',
      order_index: menus.length + 1,
      is_active: true,
      permissions: {
        admin: false,
        contributor: false,
        team_lead: false,
        user: false
      }
    });
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    
    if (draggedIndex === null || draggedIndex === dropIndex) return;

    const newMenus = [...menus];
    const draggedMenu = newMenus[draggedIndex];
    newMenus.splice(draggedIndex, 1);
    newMenus.splice(dropIndex, 0, draggedMenu);

    // Update order indices
    const updatedMenus = newMenus.map((menu, index) => ({
      ...menu,
      order_index: index + 1
    }));

    setMenus(updatedMenus);

    // Update order in backend
    try {
      const orderData = updatedMenus.map(menu => ({
        id: menu.id,
        order_index: menu.order_index
      }));
      
      await axiosClient.put('/menu-order', orderData);
      setSuccess('Menu order updated successfully');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update menu order');
      fetchMenus(); // Revert on error
    }

    setDraggedIndex(null);
  };

  const getRoleBadges = (permissions: NavigationMenu['permissions']) => {
    // Handle case where permissions might be undefined or null
    if (!permissions) {
      return roles.map(role => (
        <Badge 
          key={role.key} 
          variant="secondary"
          className="text-xs bg-gray-100 text-gray-600"
        >
          {role.label}
        </Badge>
      ));
    }

    return roles.map(role => {
      // Handle both boolean values and numeric values (from database)
      const isVisible = permissions[role.key as keyof typeof permissions];
      const hasPermission = Boolean(isVisible) || (isVisible as any) === 1 || (isVisible as any) === '1' || (isVisible as any) === 'true';
      
      return (
        <Badge 
          key={role.key} 
          variant={hasPermission ? "default" : "secondary"}
          className={`text-xs ${hasPermission ? role.color : 'bg-gray-100 text-gray-600'}`}
        >
          {role.label}
        </Badge>
      );
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">Loading menu management...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Navigation Menu Management</h2>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Add Menu Item
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Menu Item</DialogTitle>
              <DialogDescription>
                Add a new navigation menu item with role-based permissions.
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="menu_key">Menu Key</Label>
                <Input
                  id="menu_key"
                  value={formData.menu_key}
                  onChange={(e) => setFormData({ ...formData, menu_key: e.target.value })}
                  placeholder="e.g., reports"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="label">Label</Label>
                <Input
                  id="label"
                  value={formData.label}
                  onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                  placeholder="e.g., Reports"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="icon">Icon</Label>
                <Select value={formData.icon} onValueChange={(value) => setFormData({ ...formData, icon: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an icon" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableIcons.map(icon => (
                      <SelectItem key={icon} value={icon}>{icon}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="route">Route</Label>
                <Input
                  id="route"
                  value={formData.route}
                  onChange={(e) => setFormData({ ...formData, route: e.target.value })}
                  placeholder="e.g., reports"
                />
              </div>
            </div>

            <div className="space-y-4">
              <Label>Role Permissions</Label>
              <div className="grid grid-cols-2 gap-4">
                {roles.map(role => (
                  <div key={role.key} className="flex items-center space-x-2">
                    <Switch
                      checked={formData.permissions[role.key as keyof typeof formData.permissions]}
                      onCheckedChange={(checked) => 
                        setFormData({
                          ...formData,
                          permissions: {
                            ...formData.permissions,
                            [role.key]: checked
                          }
                        })
                      }
                    />
                    <Label className="text-sm">{role.label}</Label>
                  </div>
                ))}
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateMenu}>
                <Save className="h-4 w-4 mr-2" />
                Create Menu
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Navigation Menu Items</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">Order</TableHead>
                <TableHead>Menu Key</TableHead>
                <TableHead>Label</TableHead>
                <TableHead>Icon</TableHead>
                <TableHead>Route</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Permissions</TableHead>
                <TableHead className="w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {menus.map((menu, index) => (
                <TableRow 
                  key={menu.id}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, index)}
                  className="cursor-move"
                >
                  <TableCell>
                    <div className="flex items-center">
                      <GripVertical className="h-4 w-4 text-gray-400 mr-2" />
                      {menu.order_index}
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-sm">{menu.menu_key}</TableCell>
                  <TableCell className="font-medium">{menu.label}</TableCell>
                  <TableCell className="font-mono text-sm">{menu.icon}</TableCell>
                  <TableCell className="font-mono text-sm">{menu.route}</TableCell>
                  <TableCell>
                    <Badge variant={menu.is_active ? "default" : "secondary"}>
                      {menu.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1 min-w-[200px]">
                      {getRoleBadges(menu.permissions)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditMenu(menu)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteMenu(menu.id)}
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
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Menu Item</DialogTitle>
            <DialogDescription>
              Update the navigation menu item and its permissions.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit_menu_key">Menu Key</Label>
              <Input
                id="edit_menu_key"
                value={formData.menu_key}
                onChange={(e) => setFormData({ ...formData, menu_key: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_label">Label</Label>
              <Input
                id="edit_label"
                value={formData.label}
                onChange={(e) => setFormData({ ...formData, label: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_icon">Icon</Label>
              <Select value={formData.icon} onValueChange={(value) => setFormData({ ...formData, icon: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableIcons.map(icon => (
                    <SelectItem key={icon} value={icon}>{icon}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_route">Route</Label>
              <Input
                id="edit_route"
                value={formData.route}
                onChange={(e) => setFormData({ ...formData, route: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label>Active</Label>
            </div>

            <div className="space-y-2">
              <Label>Role Permissions</Label>
              <div className="grid grid-cols-2 gap-4">
                {roles.map(role => (
                  <div key={role.key} className="flex items-center space-x-2">
                    <Switch
                      checked={formData.permissions[role.key as keyof typeof formData.permissions]}
                      onCheckedChange={(checked) => 
                        setFormData({
                          ...formData,
                          permissions: {
                            ...formData.permissions,
                            [role.key]: checked
                          }
                        })
                      }
                    />
                    <Label className="text-sm">{role.label}</Label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateMenu}>
              <Save className="h-4 w-4 mr-2" />
              Update Menu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MenuManagement;
