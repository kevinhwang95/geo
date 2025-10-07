import { useState, useEffect } from 'react';
import axiosClient from '@/api/axiosClient';
import { useAuthStore } from '@/stores/authStore';

interface NavigationMenu {
  id: number;
  menu_key: string;
  label: string;
  icon: string;
  route: string;
  order_index: number;
  is_active: boolean;
  is_visible: boolean;
}

export const useNavigationMenus = () => {
  const [menus, setMenus] = useState<NavigationMenu[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuthStore();

  useEffect(() => {
    if (user?.role) {
      fetchMenusForRole(user.role);
    }
  }, [user?.role]);

  const fetchMenusForRole = async (role: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axiosClient.get(`/navigation-menus/role/${role}`);
      
      if (response.data.success) {
        setMenus(response.data.data);
      } else {
        setError(response.data.error || 'Failed to fetch navigation menus');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch navigation menus');
    } finally {
      setLoading(false);
    }
  };

  const refreshMenus = () => {
    if (user?.role) {
      fetchMenusForRole(user.role);
    }
  };

  return {
    menus,
    loading,
    error,
    refreshMenus
  };
};

