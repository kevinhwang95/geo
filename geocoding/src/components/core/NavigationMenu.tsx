import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Home, 
  Layers, 
  Bell, 
  Eye, 
  UserCheck, 
  ClipboardList, 
  Users 
} from 'lucide-react';
import { canManageUsers, canManageTeams, canManageWorkAssignments } from '@/stores/authStore';

interface NavigationMenuProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  unreadCount: number;
  highPriorityCount: number;
}

const NavigationMenu: React.FC<NavigationMenuProps> = ({ 
  activeSection, 
  onSectionChange, 
  unreadCount,
  highPriorityCount
}) => {
  const menuItems = [
    {
      id: 'overview',
      label: 'Overview',
      icon: Home,
      visible: true
    },
    {
      id: 'lands',
      label: 'Lands',
      icon: Layers,
      visible: true
    },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: Bell,
      visible: true,
      badge: unreadCount > 0 ? (unreadCount > 99 ? '99+' : unreadCount) : null
    },
    {
      id: 'map',
      label: 'Map',
      icon: Eye,
      visible: true,
      badge: highPriorityCount > 0 ? (highPriorityCount > 9 ? '9+' : highPriorityCount) : null
    },
    {
      id: 'teams',
      label: 'Teams',
      icon: UserCheck,
      visible: canManageTeams()
    },
    {
      id: 'work-assignments',
      label: 'Work Assignments',
      icon: ClipboardList,
      visible: canManageWorkAssignments()
    },
    {
      id: 'admin',
      label: 'Admin',
      icon: Users,
      visible: canManageUsers()
    }
  ];

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex space-x-8">
            {menuItems.map((item) => {
              if (!item.visible) return null;
              
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              
              return (
                <Button
                  key={item.id}
                  variant={isActive ? "default" : "ghost"}
                  onClick={() => onSectionChange(item.id)}
                  className={`relative flex items-center space-x-2 px-4 py-2 text-sm font-medium transition-all duration-200 ${
                    isActive 
                      ? 'bg-purple-600 text-white shadow-md' 
                      : 'text-gray-600 hover:text-purple-600 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                  {item.badge && (
                    <Badge 
                      variant="destructive" 
                      className="ml-2 h-5 w-5 flex items-center justify-center p-0 text-xs font-bold"
                    >
                      {item.badge}
                    </Badge>
                  )}
                </Button>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default NavigationMenu;
