import React, { useState, useEffect } from 'react';

interface CommunicationAnalyzerProps {
  onClose?: () => void;
}

interface APICall {
  endpoint: string;
  method: string;
  frequency: string;
  purpose: string;
  necessity: 'Critical' | 'Important' | 'Optional' | 'Redundant';
  optimization: string;
}

const CommunicationAnalyzer: React.FC<CommunicationAnalyzerProps> = ({ onClose }) => {
  const [apiCalls, setApiCalls] = useState<APICall[]>([
    // Authentication & Token Management
    {
      endpoint: '/auth/refresh',
      method: 'POST',
      frequency: 'Every 13 minutes (when active)',
      purpose: 'Refresh access token before expiration',
      necessity: 'Critical',
      optimization: 'Only when user is active and token expires in <2 minutes'
    },
    
    // Notification Polling
    {
      endpoint: '/notifications?limit=50',
      method: 'GET',
      frequency: 'Every 30 seconds',
      purpose: 'Fetch new notifications for real-time updates',
      necessity: 'Important',
      optimization: 'Could reduce to 60 seconds or use WebSocket'
    },
    {
      endpoint: '/notifications/stats',
      method: 'GET',
      frequency: 'Every 30 seconds',
      purpose: 'Get notification statistics',
      necessity: 'Optional',
      optimization: 'Could be combined with notifications endpoint or cached'
    },
    
    // CRUD Operations
    {
      endpoint: '/lands',
      method: 'GET',
      frequency: 'On dashboard load + map markers',
      purpose: 'Fetch all lands for map display',
      necessity: 'Important',
      optimization: 'Cache results, only refresh when needed'
    },
    {
      endpoint: '/plant-types',
      method: 'GET',
      frequency: 'Every form dialog open',
      purpose: 'Get plant type options for forms',
      necessity: 'Important',
      optimization: 'Cache globally, refresh only when needed'
    },
    {
      endpoint: '/categories',
      method: 'GET',
      frequency: 'Every form dialog open',
      purpose: 'Get category options for forms',
      necessity: 'Important',
      optimization: 'Cache globally, refresh only when needed'
    },
    
    // User Management
    {
      endpoint: '/users',
      method: 'GET',
      frequency: 'On user management forms',
      purpose: 'Get user list for team assignments',
      necessity: 'Important',
      optimization: 'Cache and refresh periodically'
    },
    {
      endpoint: '/users/{id}',
      method: 'GET',
      frequency: 'On dashboard load',
      purpose: 'Get current user details',
      necessity: 'Important',
      optimization: 'Already cached in auth store'
    },
    
    // Team Management
    {
      endpoint: '/teams',
      method: 'GET',
      frequency: 'On work assignment forms',
      purpose: 'Get team list for assignments',
      necessity: 'Important',
      optimization: 'Cache and refresh when teams change'
    },
    {
      endpoint: '/teams/{id}/members',
      method: 'GET',
      frequency: 'When viewing team details',
      purpose: 'Get team member list',
      necessity: 'Important',
      optimization: 'Cache with team data'
    },
    
    // Notification Actions
    {
      endpoint: '/notifications/mark-read/{id}',
      method: 'POST',
      frequency: 'When user clicks notification',
      purpose: 'Mark notification as read',
      necessity: 'Important',
      optimization: 'Optimistic updates'
    },
    {
      endpoint: '/notifications/dismiss/{id}',
      method: 'POST',
      frequency: 'When user dismisses notification',
      purpose: 'Dismiss notification',
      necessity: 'Important',
      optimization: 'Optimistic updates'
    },
    
    // Debug/Testing
    {
      endpoint: '/notifications?limit=50',
      method: 'GET',
      frequency: 'Manual testing only',
      purpose: 'Debug notification API',
      necessity: 'Optional',
      optimization: 'Remove in production'
    }
  ]);

  const getNecessityColor = (necessity: string) => {
    switch (necessity) {
      case 'Critical': return 'bg-red-100 text-red-700';
      case 'Important': return 'bg-blue-100 text-blue-700';
      case 'Optional': return 'bg-yellow-100 text-yellow-700';
      case 'Redundant': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const criticalCount = apiCalls.filter(call => call.necessity === 'Critical').length;
  const importantCount = apiCalls.filter(call => call.necessity === 'Important').length;
  const optionalCount = apiCalls.filter(call => call.necessity === 'Optional').length;
  const redundantCount = apiCalls.filter(call => call.necessity === 'Redundant').length;

  return (
    <div className="fixed top-4 right-4 bg-white border border-gray-300 rounded-lg shadow-lg z-50 max-w-4xl max-h-[80vh] overflow-auto">
      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">📊 Frontend-Backend Communication Analysis</h3>
          {onClose && (
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              ✕
            </button>
          )}
        </div>

        {/* Summary */}
        <div className="grid grid-cols-4 gap-2 mb-6">
          <div className="bg-red-50 border border-red-200 rounded p-2 text-center">
            <div className="text-2xl font-bold text-red-600">{criticalCount}</div>
            <div className="text-sm text-red-600">Critical</div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded p-2 text-center">
            <div className="text-2xl font-bold text-blue-600">{importantCount}</div>
            <div className="text-sm text-blue-600">Important</div>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded p-2 text-center">
            <div className="text-2xl font-bold text-yellow-600">{optionalCount}</div>
            <div className="text-sm text-yellow-600">Optional</div>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded p-2 text-center">
            <div className="text-2xl font-bold text-gray-600">{redundantCount}</div>
            <div className="text-sm text-gray-600">Redundant</div>
          </div>
        </div>

        {/* API Calls Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">Endpoint</th>
                <th className="text-left p-2">Method</th>
                <th className="text-left p-2">Frequency</th>
                <th className="text-left p-2">Purpose</th>
                <th className="text-left p-2">Necessity</th>
                <th className="text-left p-2">Optimization</th>
              </tr>
            </thead>
            <tbody>
              {apiCalls.map((call, index) => (
                <tr key={index} className="border-b hover:bg-gray-50">
                  <td className="p-2 font-mono text-xs">{call.endpoint}</td>
                  <td className="p-2">
                    <span className={`px-2 py-1 rounded text-xs ${
                      call.method === 'GET' ? 'bg-green-100 text-green-700' :
                      call.method === 'POST' ? 'bg-blue-100 text-blue-700' :
                      call.method === 'PUT' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {call.method}
                    </span>
                  </td>
                  <td className="p-2 text-xs">{call.frequency}</td>
                  <td className="p-2 text-xs">{call.purpose}</td>
                  <td className="p-2">
                    <span className={`px-2 py-1 rounded text-xs ${getNecessityColor(call.necessity)}`}>
                      {call.necessity}
                    </span>
                  </td>
                  <td className="p-2 text-xs">{call.optimization}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Recommendations */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-semibold mb-2">🚀 Optimization Recommendations</h4>
          <ul className="text-sm space-y-1">
            <li>• <strong>Reduce notification polling</strong> from 30s to 60s or implement WebSocket</li>
            <li>• <strong>Cache plant-types and categories</strong> globally, refresh only when needed</li>
            <li>• <strong>Combine notifications + stats</strong> into single endpoint call</li>
            <li>• <strong>Implement optimistic updates</strong> for notification actions</li>
            <li>• <strong>Cache lands data</strong> and refresh only when map data changes</li>
            <li>• <strong>Remove debug endpoints</strong> in production builds</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default CommunicationAnalyzer;
