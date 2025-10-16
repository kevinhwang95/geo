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
import { Eye, Edit, Trash2, MoreHorizontal, AlertTriangle, Clock, Users, User, MapPin, Calendar } from "lucide-react"
import { getTranslatedText } from "@/utils/translationUtils"

// Helper function to get work type translation key
const getWorkTypeTranslationKey = (workTypeName: string): string => {
  const workTypeKeyMap: Record<string, string> = {
    'Harvesting': 'workTypes.harvesting',
    'Planting': 'workTypes.planting',
    'Fertilizing': 'workTypes.fertilizing',
    'Irrigation': 'workTypes.irrigation',
    'Pruning': 'workTypes.pruning',
    'Pest Control': 'workTypes.pest_control',
    'Soil Preparation': 'workTypes.soil_preparation',
    'Weeding': 'workTypes.weeding',
    'Monitoring': 'workTypes.monitoring',
    'Maintenance': 'workTypes.maintenance'
  };
  
  return workTypeKeyMap[workTypeName] || `workTypes.${workTypeName.toLowerCase().replace(/\s+/g, '_')}`;
};

// This type is used to define the shape of our data.
export type WorkAssignment = {
  id: number;
  title: string;
  description: string;
  landId: number | null;
  landName: string | null;
  landCode: string | null;
  workTypeId: number;
  workTypeName: string;
  workTypeIcon: string | null;
  categoryId: number;
  categoryName: string;
  categoryColor: string;
  categoryIcon: string | null;
  assignedTeamId: number | null;
  assignedTeamName: string | null;
  assignedToUserId: number | null;
  assignedToUserName: string | null;
  creatorUserId: number;
  creatorName: string;
  assignerUserId: number | null;
  assignerName: string | null;
  priorityLevel: 'critical' | 'high' | 'medium' | 'low';
  status: 'created' | 'assigned' | 'in_progress' | 'completed' | 'canceled' | 'pending' | 'postponed';
  assignedDate: string | null;
  dueDate: string | null;
  startedDate: string | null;
  completedDate: string | null;
  dueStatus: string | null;
  createdAt: string;
  updatedAt: string;
}

interface WorkAssignmentColumnsProps {
  onView: (assignment: WorkAssignment) => void
  onEdit: (assignment: WorkAssignment) => void
  onDelete: (assignment: WorkAssignment) => void
  t: (key: string) => string
}

// Helper functions for priority and status badges
const getPriorityIcon = (priority: string) => {
  switch (priority) {
    case 'critical': return <AlertTriangle className="h-4 w-4 text-red-500" />;
    case 'high': return <AlertTriangle className="h-4 w-4 text-orange-500" />;
    case 'medium': return <Clock className="h-4 w-4 text-yellow-500" />;
    case 'low': return <Clock className="h-4 w-4 text-green-500" />;
    default: return <Clock className="h-4 w-4 text-gray-500" />;
  }
};

const getPriorityBadge = (priority: string, t: (key: string) => string) => {
  const variants = {
    critical: 'destructive',
    high: 'destructive', 
    medium: 'secondary',
    low: 'outline'
  } as const;
  
  const priorityTranslations = {
    critical: t('workAssignments.critical'),
    high: t('workAssignments.high'),
    medium: t('workAssignments.medium'),
    low: t('workAssignments.low')
  };
  
  return <Badge variant={variants[priority as keyof typeof variants] || 'secondary'}>
    {priorityTranslations[priority as keyof typeof priorityTranslations] || priority}
  </Badge>;
};

const getStatusBadge = (status: string, t: (key: string) => string) => {
  const variants = {
    created: 'secondary',
    assigned: 'default',
    in_progress: 'default',
    completed: 'secondary',
    canceled: 'destructive',
    pending: 'outline',
    postponed: 'outline'
  } as const;
  
  const statusTranslations = {
    created: t('workAssignments.created'),
    assigned: t('workAssignments.assigned'),
    in_progress: t('workAssignments.inProgress'),
    completed: t('workAssignments.completed'),
    canceled: t('workAssignments.canceled'),
    pending: t('workAssignments.pending'),
    postponed: t('workAssignments.postponed')
  };
  
  return <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
    {statusTranslations[status as keyof typeof statusTranslations] || status}
  </Badge>;
};

export const createColumns = ({
  onView,
  onEdit,
  onDelete,
  t,
}: WorkAssignmentColumnsProps): ColumnDef<WorkAssignment>[] => [
  {
    accessorKey: "title",
    header: t('workAssignments.title'),
    cell: ({ row }) => (
      <div className="font-medium max-w-[200px] truncate">
        {row.getValue("title")}
      </div>
    ),
  },
  {
    accessorKey: "workTypeName",
    header: t('workAssignments.workType'),
    cell: ({ row }) => {
      const workType = row.original;
      const translationKey = getWorkTypeTranslationKey(workType.workTypeName);
      const translatedWorkTypeName = getTranslatedText(t, translationKey, workType.workTypeName);
      
      return (
        <div className="flex items-center space-x-2">
          <div 
            className="w-3 h-3 rounded-full" 
            style={{ backgroundColor: workType.categoryColor }}
          />
          <span className="text-sm">{translatedWorkTypeName}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "assignedTeamName",
    header: t('workAssignments.assignedTo'),
    cell: ({ row }) => {
      const assignment = row.original;
      if (assignment.assignedTeamName) {
        return (
          <div className="flex items-center space-x-1">
            <Users className="h-3 w-3 text-blue-500" />
            <span className="text-sm">{assignment.assignedTeamName}</span>
          </div>
        );
      } else if (assignment.assignedToUserName) {
        return (
          <div className="flex items-center space-x-1">
            <User className="h-3 w-3 text-purple-500" />
            <span className="text-sm">{assignment.assignedToUserName}</span>
          </div>
        );
      }
      return <span className="text-sm text-gray-500">-</span>;
    },
  },
  {
    accessorKey: "landName",
    header: t('workAssignments.land'),
    cell: ({ row }) => {
      const assignment = row.original;
      if (assignment.landName) {
        return (
          <div className="flex items-center space-x-1">
            <MapPin className="h-3 w-3 text-green-500" />
            <span className="text-sm">{assignment.landName} ({assignment.landCode})</span>
          </div>
        );
      }
      return <span className="text-sm text-gray-500">-</span>;
    },
  },
  {
    accessorKey: "priorityLevel",
    header: t('workAssignments.priority'),
    cell: ({ row }) => (
      <div className="flex items-center space-x-2">
        {getPriorityIcon(row.getValue("priorityLevel"))}
        {getPriorityBadge(row.getValue("priorityLevel"), t)}
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: t('workAssignments.status'),
    cell: ({ row }) => getStatusBadge(row.getValue("status"), t),
  },
  {
    accessorKey: "dueDate",
    header: t('workAssignments.dueDate'),
    cell: ({ row }) => {
      const dueDate = row.getValue("dueDate") as string | null;
      if (dueDate) {
        return (
          <div className="flex items-center space-x-1">
            <Calendar className="h-3 w-3 text-blue-500" />
            <span className="text-sm">{new Date(dueDate).toLocaleDateString()}</span>
          </div>
        );
      }
      return <span className="text-sm text-gray-500">-</span>;
    },
  },
  {
    accessorKey: "createdAt",
    header: t('workAssignments.createdAt'),
    cell: ({ row }) => (
      <span className="text-sm text-gray-500">
        {new Date(row.getValue("createdAt")).toLocaleDateString()}
      </span>
    ),
  },
  {
    id: "actions",
    header: t('workAssignments.actions'),
    cell: ({ row }) => {
      const assignment = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">{t('workAssignments.openMenu')}</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onView(assignment)}>
              <Eye className="mr-2 h-4 w-4" />
              {t('workAssignments.view')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit(assignment)}>
              <Edit className="mr-2 h-4 w-4" />
              {t('workAssignments.edit')}
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => onDelete(assignment)}
              className="text-red-600"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {t('workAssignments.delete')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]





