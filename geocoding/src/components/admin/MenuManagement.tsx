import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
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
    { key: 'admin', label: t('menuManagement.admin'), color: 'bg-red-100 text-red-800' },
    { key: 'contributor', label: t('menuManagement.contributor'), color: 'bg-blue-100 text-blue-800' },
    { key: 'team_lead', label: t('menuManagement.teamLead'), color: 'bg-green-100 text-green-800' },
    { key: 'user', label: t('menuManagement.user'), color: 'bg-gray-100 text-gray-800' }
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
        setError(response.data.error || t('menuManagement.failedToFetchMenus'));
      }
    } catch (err: any) {
      setError(err.response?.data?.error || t('menuManagement.failedToFetchMenus'));
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMenu = async () => {
    try {
      const response = await axiosClient.post('/navigation-menus', formData);
      if (response.data.success) {
        setSuccess(t('menuManagement.menuCreatedSuccess'));
        setIsCreateDialogOpen(false);
        resetForm();
        fetchMenus();
      } else {
        setError(response.data.error || t('menuManagement.failedToCreateMenu'));
      }
    } catch (err: any) {
      setError(err.response?.data?.error || t('menuManagement.failedToCreateMenu'));
    }
  };

  const handleUpdateMenu = async () => {
    if (!editingMenu) return;

    try {
      const response = await axiosClient.put(`/navigation-menus/${editingMenu.id}`, formData);
      if (response.data.success) {
        setSuccess(t('menuManagement.menuUpdatedSuccess'));
        setIsEditDialogOpen(false);
        setEditingMenu(null);
        resetForm();
        fetchMenus();
      } else {
        setError(response.data.error || t('menuManagement.failedToUpdateMenu'));
      }
    } catch (err: any) {
      setError(err.response?.data?.error || t('menuManagement.failedToUpdateMenu'));
    }
  };

  const handleDeleteMenu = async (id: number) => {
    if (!confirm(t('menuManagement.deleteMenuItemConfirm'))) return;

    try {
      const response = await axiosClient.delete(`/navigation-menus/${id}`);
      if (response.data.success) {
        setSuccess(t('menuManagement.menuDeletedSuccess'));
        fetchMenus();
      } else {
        setError(response.data.error || t('menuManagement.failedToDeleteMenu'));
      }
    } catch (err: any) {
      setError(err.response?.data?.error || t('menuManagement.failedToDeleteMenu'));
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
      setSuccess(t('menuManagement.menuOrderUpdatedSuccess'));
    } catch (err: any) {
      setError(err.response?.data?.error || t('menuManagement.failedToUpdateMenuOrder'));
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
        <div className="text-gray-500">{t('menuManagement.loadingMenuManagement')}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">{t('menuManagement.title')}</h2>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
{t('menuManagement.addMenuItem')}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{t('menuManagement.createNewMenuItem')}</DialogTitle>
              <DialogDescription>
                {t('menuManagement.createNewMenuItemDescription')}
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="menu_key">{t('menuManagement.menuKey')}</Label>
                <Input
                  id="menu_key"
                  value={formData.menu_key}
                  onChange={(e) => setFormData({ ...formData, menu_key: e.target.value })}
                  placeholder={t('menuManagement.menuKeyPlaceholder')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="label">{t('menuManagement.label')}</Label>
                <Input
                  id="label"
                  value={formData.label}
                  onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                  placeholder={t('menuManagement.labelPlaceholder')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="icon">{t('menuManagement.icon')}</Label>
                <Select value={formData.icon} onValueChange={(value) => setFormData({ ...formData, icon: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('menuManagement.selectIconPlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableIcons.map(icon => (
                      <SelectItem key={icon} value={icon}>{icon}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="route">{t('menuManagement.route')}</Label>
                <Input
                  id="route"
                  value={formData.route}
                  onChange={(e) => setFormData({ ...formData, route: e.target.value })}
                  placeholder={t('menuManagement.routePlaceholder')}
                />
              </div>
            </div>

            <div className="space-y-4">
              <Label>{t('menuManagement.rolePermissions')}</Label>
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
                {t('menuManagement.cancel')}
              </Button>
              <Button onClick={handleCreateMenu}>
                <Save className="h-4 w-4 mr-2" />
                {t('menuManagement.createMenu')}
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
          <CardTitle>{t('menuManagement.navigationMenuItems')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">{t('menuManagement.order')}</TableHead>
                <TableHead>{t('menuManagement.menuKey')}</TableHead>
                <TableHead>{t('menuManagement.label')}</TableHead>
                <TableHead>{t('menuManagement.icon')}</TableHead>
                <TableHead>{t('menuManagement.route')}</TableHead>
                <TableHead>{t('menuManagement.status')}</TableHead>
                <TableHead>{t('menuManagement.permissions')}</TableHead>
                <TableHead className="w-24">{t('menuManagement.actions')}</TableHead>
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
                      {menu.is_active ? t('menuManagement.active') : t('menuManagement.inactive')}
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
            <DialogTitle>{t('menuManagement.editMenuItem')}</DialogTitle>
            <DialogDescription>
              {t('menuManagement.editMenuItemDescription')}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit_menu_key">{t('menuManagement.menuKey')}</Label>
              <Input
                id="edit_menu_key"
                value={formData.menu_key}
                onChange={(e) => setFormData({ ...formData, menu_key: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_label">{t('menuManagement.label')}</Label>
              <Input
                id="edit_label"
                value={formData.label}
                onChange={(e) => setFormData({ ...formData, label: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_icon">{t('menuManagement.icon')}</Label>
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
              <Label htmlFor="edit_route">{t('menuManagement.route')}</Label>
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
              <Label>{t('menuManagement.active')}</Label>
            </div>

            <div className="space-y-2">
              <Label>{t('menuManagement.rolePermissions')}</Label>
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
              {t('menuManagement.cancel')}
            </Button>
            <Button onClick={handleUpdateMenu}>
              <Save className="h-4 w-4 mr-2" />
              {t('menuManagement.updateMenu')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MenuManagement;
