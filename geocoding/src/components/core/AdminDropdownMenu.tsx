import React from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Users, 
  Settings, 
  ChevronDown
} from 'lucide-react';
import { canManageUsers } from '@/stores/authStore';

interface AdminDropdownMenuProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  isMobile?: boolean;
}

const AdminDropdownMenu: React.FC<AdminDropdownMenuProps> = ({
  activeSection,
  onSectionChange,
  isMobile = false
}) => {
  const isAdminActive = activeSection === 'admin' || activeSection === 'menu-management';
  
  // Admin submenu items
  const adminItems = [
    {
      id: 'admin',
      label: 'User Management',
      icon: Users,
      visible: canManageUsers()
    },
    {
      id: 'menu-management',
      label: 'Menu Management',
      icon: Settings,
      visible: canManageUsers()
    }
  ];

  const handleSubmenuClick = (section: string) => {
    onSectionChange(section);
  };

  // Don't render if user doesn't have admin permissions
  if (!canManageUsers()) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={isAdminActive ? "default" : "ghost"}
          className={`${
            isMobile 
              ? 'w-full justify-start space-x-3 px-4 py-3 text-sm font-medium transition-all duration-200'
              : 'relative flex items-center space-x-2 px-2 lg:px-3 py-2 text-sm font-medium transition-all duration-200 whitespace-nowrap'
          } ${
            isAdminActive 
              ? 'bg-purple-600 text-white shadow-md' 
              : 'text-gray-600 hover:text-purple-600 hover:bg-gray-50'
          }`}
        >
          <Users className={isMobile ? "h-5 w-5" : "h-4 w-4"} />
          <span className={isMobile ? "flex-1 text-left" : "hidden sm:inline"}>Admin</span>
          <ChevronDown className={isMobile ? "h-4 w-4" : "h-3 w-3"} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={isMobile ? "start" : "end"} className={isMobile ? "w-56" : "w-48"}>
        {adminItems.map((item) => {
          if (!item.visible) return null;
          
          const Icon = item.icon;
          const isActive = activeSection === item.id;
          
          return (
            <DropdownMenuItem
              key={item.id}
              onClick={() => handleSubmenuClick(item.id)}
              className={`cursor-pointer ${
                isActive ? 'bg-purple-50 text-purple-700' : ''
              }`}
            >
              <Icon className="h-4 w-4 mr-2" />
              <span>{item.label}</span>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default AdminDropdownMenu;
