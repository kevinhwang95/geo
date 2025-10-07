import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Shield, 
  RefreshCw, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Settings
} from 'lucide-react';
import axiosClient from '@/api/axiosClient';
import { toast } from 'sonner';


interface PermissionMatrix {
  endpoint_key: string;
  endpoint_name: string;
  http_method: string;
  endpoint_pattern: string;
  is_active: boolean;
  permissions: {
    admin: boolean;
    contributor: boolean;
    team_lead: boolean;
    user: boolean;
  };
}

const EndpointPermissionManagement: React.FC = () => {
  const [permissions, setPermissions] = useState<PermissionMatrix[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [showInactive, setShowInactive] = useState(false);

  const roles = ['admin', 'contributor', 'team_lead', 'user'];

  useEffect(() => {
    fetchPermissions();
  }, []);

  const fetchPermissions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axiosClient.get('/endpoint-permissions/matrix');
      
      if (response.data.success) {
        setPermissions(response.data.data);
      } else {
        setError(response.data.error || 'Failed to fetch permissions');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch permissions');
    } finally {
      setLoading(false);
    }
  };

  const updatePermission = async (endpointKey: string, role: string, isAllowed: boolean) => {
    try {
      const response = await axiosClient.post('/endpoint-permissions', {
        endpoint_key: endpointKey,
        role: role,
        is_allowed: isAllowed
      });

      if (response.data.success) {
        // Update local state
        setPermissions(prev => 
          prev.map(perm => 
            perm.endpoint_key === endpointKey 
              ? { ...perm, permissions: { ...perm.permissions, [role]: isAllowed } }
              : perm
          )
        );
        
        toast.success('Permission updated successfully');
      } else {
        toast.error(response.data.error || 'Failed to update permission');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to update permission');
    }
  };


  const resetToDefaults = async () => {
    if (!window.confirm('Are you sure you want to reset all permissions to defaults? This action cannot be undone.')) {
      return;
    }

    try {
      setSaving(true);
      
      const response = await axiosClient.put('/endpoint-permissions/reset-defaults');
      
      if (response.data.success) {
        toast.success('Permissions reset to defaults');
        fetchPermissions();
      } else {
        toast.error(response.data.error || 'Failed to reset permissions');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to reset permissions');
    } finally {
      setSaving(false);
    }
  };

  const filteredPermissions = permissions.filter(permission => {
    const matchesSearch = permission.endpoint_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         permission.endpoint_key.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         permission.endpoint_pattern.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesActive = showInactive || permission.is_active;
    
    return matchesSearch && matchesActive;
  });


  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET': return 'bg-green-100 text-green-800';
      case 'POST': return 'bg-blue-100 text-blue-800';
      case 'PUT': return 'bg-yellow-100 text-yellow-800';
      case 'DELETE': return 'bg-red-100 text-red-800';
      case 'PATCH': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-gray-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading endpoint permissions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Error Loading Permissions</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={fetchPermissions} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <Shield className="h-8 w-8 mr-3 text-blue-600" />
                Endpoint Permissions
              </h1>
              <p className="text-gray-600 mt-2">
                Manage API endpoint access permissions for different user roles
              </p>
            </div>
            <div className="flex space-x-3">
              <Button 
                onClick={resetToDefaults} 
                variant="outline" 
                disabled={saving}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Reset to Defaults
              </Button>
              <Button 
                onClick={fetchPermissions} 
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Settings className="h-5 w-5 mr-2" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search Endpoints
                </label>
                <Input
                  placeholder="Search by name, key, or pattern..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Filter by Role
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                >
                  <option value="all">All Roles</option>
                  {roles.map(role => (
                    <option key={role} value={role}>
                      {role.charAt(0).toUpperCase() + role.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={showInactive}
                    onChange={(e) => setShowInactive(e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Show Inactive Endpoints
                  </span>
                </label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Permissions Table */}
        <Card>
          <CardHeader>
            <CardTitle>Endpoint Permissions Matrix</CardTitle>
            <CardDescription>
              {filteredPermissions.length} endpoint(s) found
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Endpoint</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Method</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Pattern</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-900">Admin</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-900">Contributor</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-900">Team Lead</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-900">User</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPermissions.map((permission) => (
                    <tr key={`${permission.endpoint_key}-${permission.http_method}`} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div>
                          <div className="font-medium text-gray-900">
                            {permission.endpoint_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {permission.endpoint_key}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge className={getMethodColor(permission.http_method)}>
                          {permission.http_method}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                          {permission.endpoint_pattern}
                        </code>
                      </td>
                      {roles.map(role => (
                        <td key={role} className="py-3 px-4 text-center">
                          <button
                            onClick={() => updatePermission(permission.endpoint_key, role, !permission.permissions[role as keyof typeof permission.permissions])}
                            className={`inline-flex items-center justify-center w-8 h-8 rounded-full transition-colors ${
                              permission.permissions[role as keyof typeof permission.permissions]
                                ? 'bg-green-100 text-green-600 hover:bg-green-200'
                                : 'bg-red-100 text-red-600 hover:bg-red-200'
                            }`}
                            title={`Click to ${permission.permissions[role as keyof typeof permission.permissions] ? 'deny' : 'allow'} ${role} access`}
                          >
                            {permission.permissions[role as keyof typeof permission.permissions] ? (
                              <CheckCircle className="h-4 w-4" />
                            ) : (
                              <XCircle className="h-4 w-4" />
                            )}
                          </button>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EndpointPermissionManagement;
