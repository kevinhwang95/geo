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
  Mail,
  ChevronDown,
  ClipboardList,
  Tag,
  CheckCircle
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  const isAdminActive = activeSection === 'admin' || activeSection === 'menu-management' || activeSection === 'email-templates' || 
                       activeSection === 'work-categories' || activeSection === 'work-types' || activeSection === 'work-statuses';
  
  // Admin submenu items
  const adminItems = [
    {
      id: 'admin',
      label: t('navigation.admin.userManagement'),
      icon: Users,
      visible: canManageUsers()
    },
    {
      id: 'menu-management',
      label: t('navigation.admin.menuManagement'),
      icon: Settings,
      visible: canManageUsers()
    },
    {
      id: 'email-templates',
      label: t('navigation.admin.emailTemplates'),
      icon: Mail,
      visible: canManageUsers()
    },
    {
      id: 'work-categories',
      label: t('navigation.admin.workCategories'),
      icon: Tag,
      visible: canManageUsers()
    },
    {
      id: 'work-types',
      label: t('navigation.admin.workTypes'),
      icon: ClipboardList,
      visible: canManageUsers()
    },
    {
      id: 'work-statuses',
      label: t('navigation.admin.workStatuses'),
      icon: CheckCircle,
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
          <span className={isMobile ? "flex-1 text-left" : "hidden sm:inline"}>{t('navigation.admin.title')}</span>
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
