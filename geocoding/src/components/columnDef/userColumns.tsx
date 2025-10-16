"use client"

import { type ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { 
  Edit, 
  Trash2, 
  MoreHorizontal, 
  Shield,
  User,
  UserPlus,
  Crown,
  Mail,
  Phone,
  Calendar,
  CheckCircle,
  XCircle,
  Globe
} from "lucide-react"

// This type is used to define the shape of our data.
export type UserData = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  role: 'admin' | 'contributor' | 'user' | 'team_lead';
  language_preference?: string;
  avatar_url?: string;
  is_active: boolean;
  last_login?: string;
  created_at: string;
}

interface UserColumnsProps {
  onEdit: (user: UserData) => void
  onDelete: (user: UserData) => void
  t: (key: string) => string
}

// Helper functions for role icons and badges
const getRoleIcon = (role: string) => {
  switch (role) {
    case 'admin':
      return <Shield className="h-4 w-4 text-red-500" />;
    case 'team_lead':
      return <Crown className="h-4 w-4 text-purple-500" />;
    case 'contributor':
      return <UserPlus className="h-4 w-4 text-blue-500" />;
    default:
      return <User className="h-4 w-4 text-gray-500" />;
  }
};

const getRoleBadge = (role: string, t: (key: string) => string) => {
  switch (role) {
    case 'admin':
      return <Badge variant="destructive">{t('userTable.roles.admin')}</Badge>;
    case 'team_lead':
      return <Badge variant="secondary">{t('userTable.roles.team_lead')}</Badge>;
    case 'contributor':
      return <Badge variant="outline">{t('userTable.roles.contributor')}</Badge>;
    default:
      return <Badge variant="outline">{t('userTable.roles.user')}</Badge>;
  }
};

const getInitials = (firstName: string, lastName: string) => {
  return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
};

const getLanguageDisplay = (language: string) => {
  switch (language) {
    case 'en':
      return { flag: '🇺🇸', name: 'English' };
    case 'th':
      return { flag: '🇹🇭', name: 'Thai' };
    default:
      return { flag: '🌐', name: 'Unknown' };
  }
};

export const createColumns = ({
  onEdit,
  onDelete,
  t,
}: UserColumnsProps): ColumnDef<UserData>[] => [
  {
    accessorKey: "first_name",
    header: t('userTable.name'),
    cell: ({ row }) => {
      const user = row.original;
      return (
        <div className="flex items-center space-x-3">
          <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-medium">
            {getInitials(user.first_name, user.last_name)}
          </div>
          <div>
            <div className="font-medium">
              {user.first_name} {user.last_name}
            </div>
            <div className="text-sm text-gray-500">{user.email}</div>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "role",
    header: t('userTable.role'),
    cell: ({ row }) => {
      const role = row.getValue("role") as string;
      return (
        <div className="flex items-center space-x-2">
          {getRoleIcon(role)}
          {getRoleBadge(role, t)}
        </div>
      );
    },
  },
  {
    accessorKey: "language_preference",
    header: t('userTable.language'),
    cell: ({ row }) => {
      const language = row.getValue("language_preference") as string;
      const languageDisplay = getLanguageDisplay(language || 'en');
      return (
        <div className="flex items-center space-x-2">
          <Globe className="h-3 w-3 text-gray-400" />
          <span className="text-sm">{languageDisplay.flag}</span>
          <span className="text-sm">{languageDisplay.name}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "phone",
    header: t('userTable.phone'),
    cell: ({ row }) => {
      const phone = row.getValue("phone") as string;
      return (
        <div className="flex items-center space-x-1">
          <Phone className="h-3 w-3 text-gray-400" />
          <span className="text-sm">{phone || '-'}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "is_active",
    header: t('userTable.status'),
    cell: ({ row }) => {
      const isActive = row.getValue("is_active") as boolean;
      return (
        <div className="flex items-center space-x-1">
          {isActive ? (
            <>
              <CheckCircle className="h-3 w-3 text-green-500" />
              <Badge variant="outline" className="text-green-600 border-green-200">
                {t('userTable.active')}
              </Badge>
            </>
          ) : (
            <>
              <XCircle className="h-3 w-3 text-red-500" />
              <Badge variant="outline" className="text-red-600 border-red-200">
                {t('userTable.inactive')}
              </Badge>
            </>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "last_login",
    header: t('userTable.lastLogin'),
    cell: ({ row }) => {
      const lastLogin = row.getValue("last_login") as string | null;
      if (lastLogin) {
        return (
          <div className="flex items-center space-x-1">
            <Calendar className="h-3 w-3 text-gray-400" />
            <span className="text-sm">
              {new Date(lastLogin).toLocaleDateString()}
            </span>
          </div>
        );
      }
      return <span className="text-sm text-gray-500">-</span>;
    },
  },
  {
    accessorKey: "created_at",
    header: t('userTable.createdAt'),
    cell: ({ row }) => {
      const createdAt = row.getValue("created_at") as string;
      return (
        <div className="flex items-center space-x-1">
          <Calendar className="h-3 w-3 text-gray-400" />
          <span className="text-sm">
            {new Date(createdAt).toLocaleDateString()}
          </span>
        </div>
      );
    },
  },
  {
    id: "actions",
    header: t('userTable.actions'),
    cell: ({ row }) => {
      const user = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">{t('userTable.openMenu')}</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(user)}>
              <Edit className="mr-2 h-4 w-4" />
              {t('userTable.edit')}
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => onDelete(user)}
              className="text-red-600"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {t('userTable.delete')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]
