"use client"

import { type ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Eye, 
  AlertTriangle, 
  Database, 
  FileText, 
  Globe, 
  Zap,
  Bug,
  Server,
  Code,
  Calculator
} from "lucide-react"
import { useTranslation } from "react-i18next"

interface BackendErrorLog {
  timestamp: string;
  level: string;
  message: string;
  request_id: string;
  url: string;
  method: string;
  ip: string;
  user_agent: string;
  context: Record<string, any>;
  exception?: {
    class: string;
    message: string;
    file: string;
    line: number;
    trace: string;
  };
}

interface FrontendErrorLog {
  timestamp: string;
  level: string;
  message: string;
  component?: string;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
  context?: Record<string, any>;
  userAgent: string;
  url: string;
}

type ErrorLog = BackendErrorLog | FrontendErrorLog;

const getErrorTypeIcon = (error: ErrorLog) => {
  if ('exception' in error) {
    // Backend error
    const context = error.context;
    if (context?.test_type) {
      switch (context.test_type) {
        case 'database': return <Database className="h-4 w-4 text-blue-500" />;
        case 'validation': return <FileText className="h-4 w-4 text-yellow-500" />;
        case 'filesystem': return <Server className="h-4 w-4 text-red-500" />;
        case 'api': return <Globe className="h-4 w-4 text-purple-500" />;
        case 'mathematical': return <Calculator className="h-4 w-4 text-orange-500" />;
        case 'memory': return <Zap className="h-4 w-4 text-pink-500" />;
        case 'custom': return <Bug className="h-4 w-4 text-green-500" />;
        default: return <AlertTriangle className="h-4 w-4 text-gray-500" />;
      }
    }
    return <Server className="h-4 w-4 text-gray-500" />;
  } else {
    // Frontend error
    return <Code className="h-4 w-4 text-indigo-500" />;
  }
};

const getErrorTypeLabel = (error: ErrorLog) => {
  if ('exception' in error) {
    const context = error.context;
    if (context?.test_type) {
      return context.test_type.charAt(0).toUpperCase() + context.test_type.slice(1);
    }
    return 'Backend';
  } else {
    return 'Frontend';
  }
};

const formatTimestamp = (timestamp: string): string => {
  return new Date(timestamp).toLocaleString();
};

const truncateText = (text: string, maxLength: number = 50): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

const getMethodBadge = (method: string) => {
  const colors = {
    GET: 'bg-blue-100 text-blue-800',
    POST: 'bg-green-100 text-green-800',
    PUT: 'bg-yellow-100 text-yellow-800',
    DELETE: 'bg-red-100 text-red-800',
    PATCH: 'bg-purple-100 text-purple-800'
  };
  
  return (
    <Badge className={`text-xs ${colors[method as keyof typeof colors] || 'bg-gray-100 text-gray-800'}`}>
      {method}
    </Badge>
  );
};

export const createBackendErrorColumns = (
  onViewDetails: (error: BackendErrorLog) => void
): ColumnDef<BackendErrorLog>[] => {
  const { t } = useTranslation();

  return [
    {
      accessorKey: 'timestamp',
      header: 'Timestamp',
      cell: ({ row }) => (
        <div className="text-sm text-gray-600">
          {formatTimestamp(row.getValue('timestamp'))}
        </div>
      ),
      enableSorting: true,
    },
    {
      accessorKey: 'level',
      header: 'Level',
      cell: ({ row }) => (
        <Badge variant="destructive" className="text-xs">
          {row.getValue('level')}
        </Badge>
      ),
      enableSorting: true,
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id));
      },
    },
    {
      accessorKey: 'message',
      header: 'Message',
      cell: ({ row }) => (
        <div className="max-w-xs">
          <div className="text-sm font-medium text-gray-900">
            {truncateText(row.getValue('message'), 60)}
          </div>
        </div>
      ),
      enableSorting: false,
    },
    {
      accessorKey: 'method',
      header: 'Method',
      cell: ({ row }) => getMethodBadge(row.getValue('method')),
      enableSorting: true,
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id));
      },
    },
    {
      accessorKey: 'url',
      header: 'URL',
      cell: ({ row }) => (
        <div className="max-w-xs">
          <div className="text-sm text-gray-600">
            {truncateText(row.getValue('url'), 40)}
          </div>
        </div>
      ),
      enableSorting: false,
    },
    {
      accessorKey: 'ip',
      header: 'IP',
      cell: ({ row }) => (
        <div className="text-sm text-gray-600 font-mono">
          {row.getValue('ip')}
        </div>
      ),
      enableSorting: true,
    },
    {
      id: 'error_type',
      header: 'Type',
      cell: ({ row }) => (
        <div className="flex items-center space-x-2">
          {getErrorTypeIcon(row.original)}
          <span className="text-sm text-gray-600">
            {getErrorTypeLabel(row.original)}
          </span>
        </div>
      ),
      enableSorting: false,
      filterFn: (row, id, value) => {
        const errorType = getErrorTypeLabel(row.original);
        return value.includes(errorType);
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onViewDetails(row.original)}
          className="h-8 w-8 p-0"
        >
          <Eye className="h-4 w-4" />
        </Button>
      ),
      enableSorting: false,
    },
  ];
};

export const createFrontendErrorColumns = (
  onViewDetails: (error: FrontendErrorLog) => void
): ColumnDef<FrontendErrorLog>[] => {
  const { t } = useTranslation();

  return [
    {
      accessorKey: 'timestamp',
      header: 'Timestamp',
      cell: ({ row }) => (
        <div className="text-sm text-gray-600">
          {formatTimestamp(row.getValue('timestamp'))}
        </div>
      ),
      enableSorting: true,
    },
    {
      accessorKey: 'level',
      header: 'Level',
      cell: ({ row }) => (
        <Badge variant="destructive" className="text-xs">
          {row.getValue('level')}
        </Badge>
      ),
      enableSorting: true,
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id));
      },
    },
    {
      accessorKey: 'message',
      header: 'Message',
      cell: ({ row }) => (
        <div className="max-w-xs">
          <div className="text-sm font-medium text-gray-900">
            {truncateText(row.getValue('message'), 60)}
          </div>
        </div>
      ),
      enableSorting: false,
    },
    {
      accessorKey: 'component',
      header: 'Component',
      cell: ({ row }) => (
        <div className="max-w-xs">
          <div className="text-sm text-gray-600">
            {row.getValue('component') || 'Unknown'}
          </div>
        </div>
      ),
      enableSorting: true,
      filterFn: (row, id, value) => {
        const component = row.getValue(id) || 'Unknown';
        return value.includes(component);
      },
    },
    {
      accessorKey: 'url',
      header: 'URL',
      cell: ({ row }) => (
        <div className="max-w-xs">
          <div className="text-sm text-gray-600">
            {truncateText(row.getValue('url'), 40)}
          </div>
        </div>
      ),
      enableSorting: false,
    },
    {
      id: 'error_type',
      header: 'Type',
      cell: ({ row }) => (
        <div className="flex items-center space-x-2">
          {getErrorTypeIcon(row.original)}
          <span className="text-sm text-gray-600">
            Frontend
          </span>
        </div>
      ),
      enableSorting: false,
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onViewDetails(row.original)}
          className="h-8 w-8 p-0"
        >
          <Eye className="h-4 w-4" />
        </Button>
      ),
      enableSorting: false,
    },
  ];
};
