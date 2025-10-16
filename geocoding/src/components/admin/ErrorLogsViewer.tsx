import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DataTable } from '@/components/ui/data-table';
import { 
  AlertTriangle, 
  RefreshCw, 
  Trash2, 
  Download,
  Clock,
  FileText,
  Settings,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import axiosClient from '@/api/axiosClient';
import { toast } from 'sonner';
import { errorLogger } from '@/utils/errorLogger';
import { createBackendErrorColumns, createFrontendErrorColumns } from '@/components/columnDef/errorLogColumns';
import FrontendErrorTester from './FrontendErrorTester';
import { useErrorLogPolling } from '@/hooks/useErrorLogPolling';

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

interface LogStats {
  total_size: number;
  file_count: number;
  latest_error?: BackendErrorLog;
}

const ErrorLogsViewer: React.FC = () => {
  const { } = useTranslation();
  const [backendErrors, setBackendErrors] = useState<BackendErrorLog[]>([]);
  const [frontendErrors, setFrontendErrors] = useState<FrontendErrorLog[]>([]);
  const [logStats, setLogStats] = useState<LogStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<BackendErrorLog | FrontendErrorLog | null>(null);
  const [activeTab, setActiveTab] = useState<'backend' | 'frontend'>('backend');
  const [globalFilter, setGlobalFilter] = useState('');
  const [showTestControls, setShowTestControls] = useState(false);

  // Auto-polling setup
  const {
    isPolling,
    lastUpdate,
    togglePolling,
    manualRefresh,
    isToggling
  } = useErrorLogPolling({
    interval: 30000, // 30 seconds
    enabled: true,
    onBackendErrorsUpdate: setBackendErrors,
    onFrontendErrorsUpdate: setFrontendErrors
  });

  const fetchBackendErrors = async () => {
    try {
      const response = await axiosClient.get('/error-logs/recent?count=50');
      if (response.data.success) {
        setBackendErrors(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch backend errors:', error);
      toast.error('Failed to fetch backend error logs');
    }
  };

  const fetchLogStats = async () => {
    try {
      const response = await axiosClient.get('/error-logs/stats');
      if (response.data.success) {
        setLogStats(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch log stats:', error);
    }
  };

  const fetchFrontendErrors = () => {
    const errors = errorLogger.getRecentErrors(50);
    console.log('Frontend errors fetched:', errors.length, errors);
    setFrontendErrors(errors);
  };

  const clearBackendLogs = async () => {
    try {
      const response = await axiosClient.delete('/error-logs/clear');
      if (response.data.success) {
        toast.success('Backend error logs cleared successfully');
        fetchBackendErrors();
        fetchLogStats();
      }
    } catch (error) {
      console.error('Failed to clear backend logs:', error);
      toast.error('Failed to clear backend error logs');
    }
  };

  const clearFrontendLogs = () => {
    errorLogger.clearLogs();
    setFrontendErrors([]);
    toast.success('Frontend error logs cleared successfully');
  };

  // const _testErrorLogging = () => {
  //   // Test frontend error logging
  //   errorLogger.logError('Test error from Error Logs Viewer', new Error('This is a test error'), { 
  //     test: true, 
  //     timestamp: new Date().toISOString() 
  //   }, 'ErrorLogsViewer');
  //   
  //   // Refresh frontend errors
  //   fetchFrontendErrors();
  //   
  //   toast.info('Test error logged. Check the Frontend Errors tab.');
  // };

  const handleTabChange = (tab: 'backend' | 'frontend') => {
    setActiveTab(tab);
    setGlobalFilter(''); // Reset search when switching tabs
  };

  const testBackendError = async (errorType: string) => {
    try {
      let endpoint = '';
      let method = 'GET';
      
      switch (errorType) {
        case 'database':
          endpoint = '/error-test/database';
          break;
        case 'validation':
          endpoint = '/error-test/validation';
          method = 'POST';
          break;
        case 'filesystem':
          endpoint = '/error-test/filesystem';
          break;
        case 'api':
          endpoint = '/error-test/api';
          break;
        case 'division':
          endpoint = '/error-test/division';
          break;
        case 'memory':
          endpoint = '/error-test/memory';
          break;
        case 'custom':
          endpoint = '/error-test/custom';
          break;
        case 'multiple':
          endpoint = '/error-test/multiple';
          break;
      }

      const config = {
        method,
        url: endpoint,
        ...(method === 'POST' && { data: { required_field: 'test' } })
      };

      await axiosClient(config);
      
      // Refresh backend errors
      await fetchBackendErrors();
      
      toast.success(`${errorType.charAt(0).toUpperCase() + errorType.slice(1)} test error generated! Check Backend Errors tab.`);
      
    } catch (error: any) {
      // Expected to fail - this is the test error
      if (error.response?.status >= 400) {
        toast.success(`${errorType.charAt(0).toUpperCase() + errorType.slice(1)} test error generated! Check Backend Errors tab.`);
        // Refresh backend errors
        await fetchBackendErrors();
      } else {
        toast.error(`Failed to generate ${errorType} test error: ${error.message}`);
      }
    }
  };

  const exportLogs = () => {
    // Get fresh frontend errors from the error logger
    const freshFrontendErrors = errorLogger.getRecentErrors(50);
    
    const allLogs = {
      export_info: {
        exported_at: new Date().toISOString(),
        backend_errors_count: backendErrors.length,
        frontend_errors_count: freshFrontendErrors.length,
        total_errors: backendErrors.length + freshFrontendErrors.length
      },
      backend_errors: backendErrors,
      frontend_errors: freshFrontendErrors,
      log_statistics: logStats
    };

    console.log('Exporting logs:', {
      backend: backendErrors.length,
      frontend: freshFrontendErrors.length,
      stats: logStats
    });

    const blob = new Blob([JSON.stringify(allLogs, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `error-logs-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success(`Exported ${backendErrors.length} backend and ${freshFrontendErrors.length} frontend errors`);
  };

  const exportLogsCSV = () => {
    // Get fresh frontend errors from the error logger
    const freshFrontendErrors = errorLogger.getRecentErrors(50);
    
    let csvContent = '';
    
    // CSV Headers
    const headers = [
      'Type',
      'Timestamp',
      'Level',
      'Message',
      'Component',
      'URL',
      'Method',
      'IP Address',
      'Request ID',
      'Error Class',
      'Error Message',
      'File',
      'Line',
      'User Agent',
      'Context'
    ];
    
    csvContent += headers.join(',') + '\n';
    
    // Backend Errors
    backendErrors.forEach(error => {
      const row = [
        'Backend',
        `"${error.timestamp}"`,
        `"${error.level}"`,
        `"${error.message.replace(/"/g, '""')}"`,
        '"Backend API"',
        `"${error.url}"`,
        `"${error.method}"`,
        `"${error.ip}"`,
        `"${error.request_id}"`,
        `"${error.exception?.class || 'N/A'}"`,
        `"${error.exception?.message?.replace(/"/g, '""') || 'N/A'}"`,
        `"${error.exception?.file || 'N/A'}"`,
        error.exception?.line || 'N/A',
        `"${error.user_agent.replace(/"/g, '""')}"`,
        `"${JSON.stringify(error.context).replace(/"/g, '""')}"`
      ];
      csvContent += row.join(',') + '\n';
    });
    
    // Frontend Errors
    freshFrontendErrors.forEach(error => {
      const row = [
        'Frontend',
        `"${error.timestamp}"`,
        `"${error.level}"`,
        `"${error.message.replace(/"/g, '""')}"`,
        `"${error.component || 'N/A'}"`,
        `"${error.url}"`,
        'N/A',
        'N/A',
        'N/A',
        `"${error.error?.name || 'N/A'}"`,
        `"${error.error?.message?.replace(/"/g, '""') || 'N/A'}"`,
        'N/A',
        'N/A',
        `"${error.userAgent.replace(/"/g, '""')}"`,
        `"${JSON.stringify(error.context || {}).replace(/"/g, '""')}"`
      ];
      csvContent += row.join(',') + '\n';
    });
    
    console.log('Exporting CSV:', {
      backend: backendErrors.length,
      frontend: freshFrontendErrors.length,
      totalRows: backendErrors.length + freshFrontendErrors.length + 1 // +1 for header
    });

    // Create and download CSV file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `error-logs-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success(`Exported ${backendErrors.length} backend and ${freshFrontendErrors.length} frontend errors as CSV`);
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchBackendErrors(),
        fetchLogStats(),
        fetchFrontendErrors()
      ]);
      setLoading(false);
    };

    loadData();
  }, []);

  // Manual refresh function that also updates stats
  const handleManualRefresh = async () => {
    await Promise.all([
      fetchBackendErrors(),
      fetchLogStats(),
      fetchFrontendErrors()
    ]);
    manualRefresh(); // This will also update the polling timestamp
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatTimestamp = (timestamp: string): string => {
    return new Date(timestamp).toLocaleString();
  };

  const backendColumns = createBackendErrorColumns((error: BackendErrorLog) => {
    setSelectedLog(error);
  });

  const frontendColumns = createFrontendErrorColumns((error: FrontendErrorLog) => {
    setSelectedLog(error);
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <RefreshCw className="h-8 w-8 animate-spin mr-2" />
        <span>Loading error logs...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Error Logs</h1>
          <p className="text-gray-600">Monitor and manage application errors</p>
          {lastUpdate && (
            <p className="text-sm text-gray-500 mt-1">
              Last updated: {lastUpdate.toLocaleTimeString()}
              {isPolling && (
                <span className="ml-2 text-green-600">
                  • Auto-refreshing every 30s
                </span>
              )}
            </p>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            onClick={togglePolling}
            variant={isPolling ? "default" : "outline"}
            size="sm"
            className="flex items-center space-x-2"
            disabled={isToggling}
          >
            <RefreshCw className={`h-4 w-4 ${isPolling ? 'animate-spin' : ''} ${isToggling ? 'opacity-50' : ''}`} />
            <span className={isToggling ? 'opacity-50' : ''}>
              {isToggling ? 'Toggling...' : (isPolling ? 'Auto-Refresh ON' : 'Auto-Refresh OFF')}
            </span>
          </Button>
          <Button onClick={handleManualRefresh} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Now
          </Button>
          <Button onClick={exportLogs} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export JSON
          </Button>
          <Button onClick={exportLogsCSV} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button 
            onClick={() => {
              const frontendErrors = errorLogger.getRecentErrors(50);
              const backendCount = backendErrors.length;
              const frontendCount = frontendErrors.length;
              toast.info(`Debug: ${backendCount} backend, ${frontendCount} frontend errors`);
              console.log('Current errors:', { backend: backendCount, frontend: frontendCount, frontendErrors });
            }}
            variant="ghost" 
            size="sm"
            className="text-xs"
          >
            Debug
          </Button>
          <Button 
            onClick={() => setShowTestControls(!showTestControls)}
            variant="outline" 
            size="sm"
            className="flex items-center space-x-2"
          >
            <Settings className="h-4 w-4" />
            <span>Test Controls</span>
            {showTestControls ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {logStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <FileText className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-sm text-gray-600">Total Log Files</p>
                  <p className="text-2xl font-bold">{logStats.file_count}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                <div>
                  <p className="text-sm text-gray-600">Total Size</p>
                  <p className="text-2xl font-bold">{formatFileSize(logStats.total_size)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-red-500" />
                <div>
                  <p className="text-sm text-gray-600">Latest Error</p>
                  <p className="text-sm font-medium">
                    {logStats.latest_error ? formatTimestamp(logStats.latest_error.timestamp) : 'None'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <RefreshCw className={`h-5 w-5 ${isPolling ? 'text-green-500 animate-spin' : 'text-gray-400'}`} />
                <div>
                  <p className="text-sm text-gray-600">Auto-Refresh</p>
                  <p className="text-2xl font-bold">{isPolling ? 'ON' : 'OFF'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => handleTabChange('backend')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'backend'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Backend Errors ({backendErrors.length})
          </button>
          <button
            onClick={() => handleTabChange('frontend')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'frontend'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Frontend Errors ({frontendErrors.length})
          </button>
        </nav>
      </div>

      {/* Test Controls Section */}
      {showTestControls && (
        <>
          {/* Test Buttons for Backend Errors */}
          {activeTab === 'backend' && (
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Test Backend Error Logging</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <Button 
                  onClick={() => testBackendError('database')} 
                  variant="outline" 
                  size="sm"
                  className="text-xs"
                >
                  Database Error
                </Button>
                <Button 
                  onClick={() => testBackendError('validation')} 
                  variant="outline" 
                  size="sm"
                  className="text-xs"
                >
                  Validation Error
                </Button>
                <Button 
                  onClick={() => testBackendError('filesystem')} 
                  variant="outline" 
                  size="sm"
                  className="text-xs"
                >
                  File System Error
                </Button>
                <Button 
                  onClick={() => testBackendError('api')} 
                  variant="outline" 
                  size="sm"
                  className="text-xs"
                >
                  API Error
                </Button>
                <Button 
                  onClick={() => testBackendError('division')} 
                  variant="outline" 
                  size="sm"
                  className="text-xs"
                >
                  Division Error
                </Button>
                <Button 
                  onClick={() => testBackendError('memory')} 
                  variant="outline" 
                  size="sm"
                  className="text-xs"
                >
                  Memory Error
                </Button>
                <Button 
                  onClick={() => testBackendError('custom')} 
                  variant="outline" 
                  size="sm"
                  className="text-xs"
                >
                  Custom Error
                </Button>
                <Button 
                  onClick={() => testBackendError('multiple')} 
                  variant="outline" 
                  size="sm"
                  className="text-xs"
                >
                  Multiple Errors
                </Button>
              </div>
            </div>
          )}

          {/* Frontend Error Testing */}
          {activeTab === 'frontend' && (
            <div className="border border-gray-200 rounded-lg">
              <FrontendErrorTester onErrorGenerated={fetchFrontendErrors} />
            </div>
          )}
        </>
      )}

      {/* Clear Buttons */}
      <div className="flex justify-end space-x-2">
        {activeTab === 'backend' ? (
          <Button onClick={clearBackendLogs} variant="destructive" size="sm">
            <Trash2 className="h-4 w-4 mr-2" />
            Clear Backend Logs
          </Button>
        ) : (
          <Button onClick={clearFrontendLogs} variant="destructive" size="sm">
            <Trash2 className="h-4 w-4 mr-2" />
            Clear Frontend Logs
          </Button>
        )}
      </div>

      {/* Log Content */}
      <div className="space-y-4">
        {activeTab === 'backend' ? (
          backendErrors.length === 0 ? (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>No backend error logs found.</AlertDescription>
            </Alert>
          ) : (
            <DataTable
              columns={backendColumns}
              data={backendErrors}
              searchPlaceholder="Search backend errors..."
              globalFilter={globalFilter}
              onGlobalFilterChange={setGlobalFilter}
            />
          )
        ) : (
          frontendErrors.length === 0 ? (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>No frontend error logs found.</AlertDescription>
            </Alert>
          ) : (
            <DataTable
              columns={frontendColumns}
              data={frontendErrors}
              searchPlaceholder="Search frontend errors..."
              globalFilter={globalFilter}
              onGlobalFilterChange={setGlobalFilter}
            />
          )
        )}
      </div>

      {/* Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[80vh] overflow-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Error Details</h3>
              <Button onClick={() => setSelectedLog(null)} variant="ghost">
                ×
              </Button>
            </div>
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
              {JSON.stringify(selectedLog, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};

export default ErrorLogsViewer;
