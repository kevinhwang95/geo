import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { decodeJWT, isTokenExpired, getTokenTimeRemaining } from '@/utils/jwt';

interface TokenExpirationDebuggerProps {
  onClose?: () => void;
}

const TokenExpirationDebugger: React.FC<TokenExpirationDebuggerProps> = ({ onClose }) => {
  const { tokens, isAuthenticated } = useAuthStore();
  const [tokenInfo, setTokenInfo] = useState<{
    accessToken: any;
    refreshToken: any;
    accessExpired: boolean;
    refreshExpired: boolean;
    accessTimeRemaining: number;
    refreshTimeRemaining: number;
  } | null>(null);

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
      });
    };

    updateTokenInfo();
    const interval = setInterval(updateTokenInfo, 1000); // Update every second

    return () => clearInterval(interval);
  }, [tokens]);

  if (!isAuthenticated || !tokenInfo) {
    return (
      <div className="fixed bottom-4 left-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded shadow-lg z-50 max-w-md">
        <div className="flex justify-between items-start">
          <div>
            <strong className="font-bold">⚠️ No Token Info</strong>
            <p className="text-sm">User not authenticated or no tokens available</p>
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

  const formatTime = (seconds: number) => {
    if (seconds <= 0) return 'Expired';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  return (
    <div className="fixed bottom-4 left-4 bg-white border border-gray-300 rounded-lg shadow-lg z-50 max-w-md">
      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">🔑 Token Expiration Debugger</h3>
          {onClose && (
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              ✕
            </button>
          )}
        </div>

        <div className="space-y-3 text-sm">
          {/* Access Token */}
          <div className="border rounded p-2">
            <h4 className="font-semibold text-blue-600">Access Token</h4>
            <div className="space-y-1">
              <div>
                <strong>Status:</strong> 
                <span className={`ml-1 px-2 py-1 rounded text-xs ${
                  tokenInfo.accessExpired ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                }`}>
                  {tokenInfo.accessExpired ? 'EXPIRED' : 'VALID'}
                </span>
              </div>
              <div><strong>Time Remaining:</strong> {formatTime(tokenInfo.accessTimeRemaining)}</div>
              <div><strong>Expires At:</strong> {formatDate(tokenInfo.accessToken.exp)}</div>
              <div><strong>User ID:</strong> {tokenInfo.accessToken.user_id}</div>
              <div><strong>Role:</strong> {tokenInfo.accessToken.role}</div>
            </div>
          </div>

          {/* Refresh Token */}
          <div className="border rounded p-2">
            <h4 className="font-semibold text-green-600">Refresh Token</h4>
            <div className="space-y-1">
              <div>
                <strong>Status:</strong> 
                <span className={`ml-1 px-2 py-1 rounded text-xs ${
                  tokenInfo.refreshExpired ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                }`}>
                  {tokenInfo.refreshExpired ? 'EXPIRED' : 'VALID'}
                </span>
              </div>
              <div><strong>Time Remaining:</strong> {formatTime(tokenInfo.refreshTimeRemaining)}</div>
              <div><strong>Expires At:</strong> {formatDate(tokenInfo.refreshToken.exp)}</div>
              <div><strong>Type:</strong> {tokenInfo.refreshToken.type}</div>
            </div>
          </div>

          {/* Activity Status */}
          <div className="border rounded p-2">
            <h4 className="font-semibold text-purple-600">Activity Status</h4>
            <div className="space-y-1">
              <div><strong>Current Time:</strong> {new Date().toLocaleString()}</div>
              <div><strong>Last Activity:</strong> Check console for activity logs</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TokenExpirationDebugger;
