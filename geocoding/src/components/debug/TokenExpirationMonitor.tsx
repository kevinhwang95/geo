import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { decodeJWT, isTokenExpired, getTokenTimeRemaining } from '@/utils/jwt';
import { attemptTokenRefresh } from '@/utils/tokenRefreshManager';

interface TokenInfo {
  accessToken: any;
  refreshToken: any;
  accessExpired: boolean;
  refreshExpired: boolean;
  accessTimeRemaining: number;
  refreshTimeRemaining: number;
  lastRefreshAttempt?: string;
  refreshAttempts: number;
  logoutReason?: string;
}

const TokenExpirationMonitor: React.FC = () => {
  const { tokens, isAuthenticated, logout } = useAuthStore();
  const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [refreshHistory, setRefreshHistory] = useState<string[]>([]);

  useEffect(() => {
    const updateTokenInfo = () => {
      if (!tokens?.access_token || !tokens?.refresh_token) {
        setTokenInfo(null);
        return;
      }

      const accessPayload = decodeJWT(tokens.access_token);
      const refreshPayload = decodeJWT(tokens.refresh_token);

      setTokenInfo({
        accessToken: accessPayload,
        refreshToken: refreshPayload,
        accessExpired: isTokenExpired(tokens.access_token, 0),
        refreshExpired: isTokenExpired(tokens.refresh_token, 0),
        accessTimeRemaining: getTokenTimeRemaining(tokens.access_token),
        refreshTimeRemaining: getTokenTimeRemaining(tokens.refresh_token),
        refreshAttempts: 0
      });
    };

    updateTokenInfo();
    const interval = setInterval(updateTokenInfo, 1000); // Update every second

    return () => clearInterval(interval);
  }, [tokens]);

  const handleManualRefresh = async () => {
    const timestamp = new Date().toLocaleTimeString();
    setRefreshHistory(prev => [...prev.slice(-4), `Manual refresh at ${timestamp}`]);
    
    try {
      const result = await attemptTokenRefresh('manual-debug');
      if (result.success) {
        setRefreshHistory(prev => [...prev.slice(-4), `✅ Refresh successful at ${timestamp}`]);
      } else {
        setRefreshHistory(prev => [...prev.slice(-4), `❌ Refresh failed at ${timestamp}: ${result.error}`]);
        if (result.error === 'No refresh token available' || result.error === 'Max refresh attempts exceeded') {
          setRefreshHistory(prev => [...prev.slice(-4), `🚪 User will be logged out due to: ${result.error}`]);
        }
      }
    } catch (error) {
      setRefreshHistory(prev => [...prev.slice(-4), `❌ Refresh error at ${timestamp}: ${error}`]);
    }
  };

  const handleForceLogout = () => {
    const timestamp = new Date().toLocaleTimeString();
    setRefreshHistory(prev => [...prev.slice(-4), `🚪 Manual logout at ${timestamp}`]);
    logout();
  };


  const formatTime = (seconds: number) => {
    if (seconds <= 0) return 'EXPIRED';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  const getStatusColor = (expired: boolean, timeRemaining: number) => {
    if (expired) return 'text-red-600 bg-red-100';
    if (timeRemaining < 60) return 'text-orange-600 bg-orange-100';
    if (timeRemaining < 300) return 'text-yellow-600 bg-yellow-100';
    return 'text-green-600 bg-green-100';
  };

  if (!isAuthenticated || !tokenInfo) {
    return (
      <div className="fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded shadow-lg z-50 max-w-sm">
        <div className="flex justify-between items-start">
          <div>
            <strong className="font-bold">⚠️ No Token Info</strong>
            <p className="text-sm">User not authenticated or no tokens available</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg z-50 hover:bg-blue-700 transition-colors"
      >
        🔑 Token Monitor
      </button>

      {/* Monitor Panel */}
      {isVisible && (
        <div className="fixed bottom-16 right-4 bg-white border border-gray-300 rounded-lg shadow-lg z-50 max-w-md">
          <div className="p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">🔑 Token Expiration Monitor</h3>
              <button 
                onClick={() => setIsVisible(false)} 
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-sm">
              {/* Access Token */}
              <div className="border rounded p-3">
                <h4 className="font-semibold text-blue-600 mb-2">Access Token</h4>
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <strong>Status:</strong> 
                    <span className={`px-2 py-1 rounded text-xs ${getStatusColor(tokenInfo.accessExpired, tokenInfo.accessTimeRemaining)}`}>
                      {tokenInfo.accessExpired ? 'EXPIRED' : 'VALID'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <strong>Time Remaining:</strong> 
                    <span className={tokenInfo.accessTimeRemaining < 60 ? 'text-red-600 font-bold' : ''}>
                      {formatTime(tokenInfo.accessTimeRemaining)}
                    </span>
                  </div>
                  <div><strong>Expires At:</strong> {formatDate(tokenInfo.accessToken.exp)}</div>
                  <div><strong>User ID:</strong> {tokenInfo.accessToken.user_id}</div>
                  <div><strong>Role:</strong> {tokenInfo.accessToken.role}</div>
                </div>
              </div>

              {/* Refresh Token */}
              <div className="border rounded p-3">
                <h4 className="font-semibold text-green-600 mb-2">Refresh Token</h4>
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <strong>Status:</strong> 
                    <span className={`px-2 py-1 rounded text-xs ${getStatusColor(tokenInfo.refreshExpired, tokenInfo.refreshTimeRemaining)}`}>
                      {tokenInfo.refreshExpired ? 'EXPIRED' : 'VALID'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <strong>Time Remaining:</strong> 
                    <span className={tokenInfo.refreshTimeRemaining < 3600 ? 'text-orange-600 font-bold' : ''}>
                      {formatTime(tokenInfo.refreshTimeRemaining)}
                    </span>
                  </div>
                  <div><strong>Expires At:</strong> {formatDate(tokenInfo.refreshToken.exp)}</div>
                  <div><strong>Type:</strong> {tokenInfo.refreshToken.type}</div>
                </div>
              </div>

              {/* Actions */}
              <div className="border rounded p-3">
                <h4 className="font-semibold text-purple-600 mb-2">Actions</h4>
                <div className="space-y-2">
                  <button
                    onClick={handleManualRefresh}
                    className="w-full bg-blue-500 text-white px-3 py-1 rounded text-xs hover:bg-blue-600"
                  >
                    🔄 Manual Refresh
                  </button>
                  <button
                    onClick={handleForceLogout}
                    className="w-full bg-red-500 text-white px-3 py-1 rounded text-xs hover:bg-red-600"
                  >
                    🚪 Force Logout
                  </button>
                </div>
              </div>

              {/* Refresh History */}
              {refreshHistory.length > 0 && (
                <div className="border rounded p-3">
                  <h4 className="font-semibold text-gray-600 mb-2">Recent Activity</h4>
                  <div className="space-y-1 text-xs">
                    {refreshHistory.map((entry, index) => (
                      <div key={index} className="text-gray-600">
                        {entry}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Current Time */}
              <div className="text-xs text-gray-500 text-center">
                Current Time: {new Date().toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TokenExpirationMonitor;
