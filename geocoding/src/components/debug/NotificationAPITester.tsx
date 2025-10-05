import React, { useState } from 'react';
import axiosClient from '@/api/axiosClient';
import { useAuthStore } from '@/stores/authStore';
import { isDevelopment } from '@/utils/buildUtils';

interface NotificationAPITesterProps {
  onClose?: () => void;
}

const NotificationAPITester: React.FC<NotificationAPITesterProps> = ({ onClose }) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated } = useAuthStore();

  // Early return in production
  if (!isDevelopment) {
    return null;
  }

  const testNotificationAPI = async () => {
    if (!isAuthenticated) {
      setError('User not authenticated');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      console.log('🧪 Testing notification API...');
      
      // Test notifications endpoint
      const response = await axiosClient.get('/notifications?limit=50');
      console.log('📬 API Response:', response.data);
      
      setResult({
        endpoint: '/notifications',
        response: response.data,
        timestamp: new Date().toISOString()
      });

    } catch (err: any) {
      console.error('❌ API Test Error:', err);
      setError(err.response?.data?.message || err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const testStatsAPI = async () => {
    if (!isAuthenticated) {
      setError('User not authenticated');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      console.log('🧪 Testing notification stats API...');
      
      // Test stats endpoint
      const response = await axiosClient.get('/notifications/stats');
      console.log('📊 Stats Response:', response.data);
      
      setResult({
        endpoint: '/notifications/stats',
        response: response.data,
        timestamp: new Date().toISOString()
      });

    } catch (err: any) {
      console.error('❌ Stats API Test Error:', err);
      setError(err.response?.data?.message || err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded shadow-lg z-50 max-w-md">
        <div className="flex justify-between items-start">
          <div>
            <strong className="font-bold">⚠️ Not Authenticated</strong>
            <p className="text-sm">Please login to test the notification API</p>
          </div>
          {onClose && (
            <button onClick={onClose} className="text-red-500 hover:text-red-700 ml-2">
              ✕
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-300 rounded-lg shadow-lg z-50 max-w-2xl max-h-96 overflow-auto">
      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">🧪 Notification API Tester</h3>
          {onClose && (
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              ✕
            </button>
          )}
        </div>

        <div className="space-y-2 mb-4">
          <button
            onClick={testNotificationAPI}
            disabled={loading}
            className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-4 py-2 rounded text-sm"
          >
            {loading ? 'Testing...' : 'Test /notifications API'}
          </button>
          
          <button
            onClick={testStatsAPI}
            disabled={loading}
            className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white px-4 py-2 rounded text-sm"
          >
            {loading ? 'Testing...' : 'Test /notifications/stats API'}
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded text-sm mb-4">
            <strong>Error:</strong> {error}
          </div>
        )}

        {result && (
          <div className="bg-gray-100 border border-gray-300 rounded p-3 text-sm">
            <div className="mb-2">
              <strong>Endpoint:</strong> {result.endpoint}
            </div>
            <div className="mb-2">
              <strong>Timestamp:</strong> {result.timestamp}
            </div>
            <div>
              <strong>Response:</strong>
              <pre className="mt-1 bg-white p-2 rounded border overflow-auto max-h-48 text-xs">
                {JSON.stringify(result.response, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationAPITester;
