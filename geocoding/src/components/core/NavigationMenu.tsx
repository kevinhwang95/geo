import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { 
  Home, 
  Layers, 
  Bell, 
  Eye, 
  UserCheck, 
  ClipboardList, 
  Users,
  Menu,
  Settings,
  MapPin,
  BarChart3,
  FileText,
  Calendar,
  Mail,
  Phone,
  Camera,
  Search,
  Filter,
  Download,
  Upload
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
// Note: Permission functions are now handled by the database configuration
import { useIsMobile } from '@/hooks/use-mobile';
import { useNavigationMenus } from '@/hooks/useNavigationMenus';
import AdminDropdownMenu from './AdminDropdownMenu';

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
  const [isOpen, setIsOpen] = useState(false);
  const isMobile = useIsMobile();
  const { menus, loading } = useNavigationMenus();
  const { t } = useTranslation();

  // Function to translate dynamic menu labels
  const translateMenuLabel = (menuKey: string, originalLabel: string) => {
    const translationKey = `navigation.${menuKey}`;
    const translated = t(translationKey);
    // If translation exists and is different from the key, use it
    return translated !== translationKey ? translated : originalLabel;
  };

  // Icon mapping for dynamic icons
  const iconMap: { [key: string]: React.ComponentType<any> } = {
    Home,
    Layers,
    Bell,
    Eye,
    UserCheck,
    ClipboardList,
    Users,
    Settings,
    MapPin,
    BarChart3,
    FileText,
    Calendar,
    Mail,
    Phone,
    Camera,
    Search,
    Filter,
    Download,
    Upload
  };

  // Convert dynamic menus to the format expected by the component
  // Filter out admin and menu-management items as they'll be handled by dropdown
  const menuItems = menus
    .filter(menu => !['admin', 'menu-management'].includes(menu.menu_key))
    .map(menu => {
      const Icon = iconMap[menu.icon] || Home; // Fallback to Home icon
      
      // Add badges for specific menu items
      let badge = null;
      if (menu.menu_key === 'notifications' && unreadCount > 0) {
        badge = unreadCount > 99 ? '99+' : unreadCount;
      } else if (menu.menu_key === 'map' && highPriorityCount > 0) {
        badge = highPriorityCount > 9 ? '9+' : highPriorityCount;
      }

      return {
        id: menu.menu_key,
        label: translateMenuLabel(menu.menu_key, menu.label),
        icon: Icon,
        visible: menu.is_visible && menu.is_active,
        badge
      };
    });

  const handleSectionChange = (section: string) => {
    onSectionChange(section);
    setIsOpen(false);
  };

  // Show loading state while menus are being fetched
  if (loading) {
    return (
      <nav className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="text-gray-500">{t('navigation.menu.loading')}</div>
          </div>
        </div>
      </nav>
    );
  }

  const renderMenuItem = (item: typeof menuItems[0]) => {
    if (!item.visible) return null;
    
    const Icon = item.icon;
    const isActive = activeSection === item.id;
    
    return (
      <Button
        key={item.id}
        variant={isActive ? "default" : "ghost"}
        onClick={() => handleSectionChange(item.id)}
        className={`w-full justify-start space-x-3 px-4 py-3 text-sm font-medium transition-all duration-200 ${
          isActive 
            ? 'bg-purple-600 text-white shadow-md' 
            : 'text-gray-600 hover:text-purple-600 hover:bg-gray-50'
        }`}
      >
        <Icon className="h-5 w-5" />
        <span className="flex-1 text-left">{item.label}</span>
        {item.badge && (
          <Badge 
            variant="destructive" 
            className="h-5 w-5 flex items-center justify-center p-0 text-xs font-bold"
          >
            {item.badge}
          </Badge>
        )}
      </Button>
    );
  };

  const renderAdminDropdown = (mobile = false) => {
    return (
      <AdminDropdownMenu
        activeSection={activeSection}
        onSectionChange={handleSectionChange}
        isMobile={mobile}
      />
    );
  };

  if (isMobile) {
    return (
      <nav className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Sheet open={isOpen} onOpenChange={setIsOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="sm" className="p-2">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">{t('navigation.menu.openMenu')}</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-80 p-0">
                  <div className="flex flex-col h-full">
                    <div className="p-6 border-b">
                      <h2 className="text-lg font-semibold">{t('navigation.menu.navigation')}</h2>
                    </div>
                    <div className="flex-1 p-4 space-y-2 overflow-y-auto">
                      {menuItems.map(renderMenuItem)}
                      {renderAdminDropdown(true)}
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
            
            {/* Show current active section on mobile */}
            <div className="flex items-center">
              <span className="text-sm font-medium text-gray-700">
                {(() => {
                if (activeSection === 'admin') return t('navigation.admin.userManagement');
                if (activeSection === 'menu-management') return t('navigation.admin.menuManagement');
                if (activeSection === 'error-logs') return t('navigation.admin.errorLogs');
                return menuItems.find(item => item.id === activeSection)?.label || t('navigation.dashboard');
                })()}
              </span>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div 
            className="flex space-x-1 lg:space-x-4 overflow-x-auto"
            style={{
              scrollbarWidth: 'none', /* Firefox */
              msOverflowStyle: 'none', /* Internet Explorer 10+ */
            }}
          >
            {menuItems.map((item) => {
              if (!item.visible) return null;
              
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              
              return (
                <Button
                  key={item.id}
                  variant={isActive ? "default" : "ghost"}
                  onClick={() => onSectionChange(item.id)}
                  className={`relative flex items-center space-x-2 px-2 lg:px-3 py-2 text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                    isActive 
                      ? 'bg-purple-600 text-white shadow-md' 
                      : 'text-gray-600 hover:text-purple-600 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{item.label}</span>
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
            {renderAdminDropdown(false)}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default NavigationMenu;
