import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/stores/authStore';
import { getTokenTimeRemaining, decodeJWT } from '@/utils/jwt';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, User, Shield } from 'lucide-react';

export const TokenDebugger: React.FC = () => {
  const { t } = useTranslation();
  const { tokens, user, isAuthenticated, isTokenExpired } = useAuthStore();
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [tokenPayload, setTokenPayload] = useState<any>(null);

  useEffect(() => {
    if (!tokens?.access_token) return;

    const updateTimer = () => {
      const remaining = getTokenTimeRemaining(tokens.access_token);
      setTimeRemaining(remaining);
      
      const payload = decodeJWT(tokens.access_token);
      setTokenPayload(payload);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000); // Update every second

    return () => clearInterval(interval);
  }, [tokens?.access_token]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusColor = (seconds: number) => {
    if (seconds <= 60) return 'destructive'; // Red - critical
    if (seconds <= 300) return 'destructive'; // Red - warning
    if (seconds <= 600) return 'default'; // Yellow - caution
    return 'secondary'; // Green - good
  };

  if (!isAuthenticated || !tokens) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Token Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Badge variant="destructive">{t('badges.notAuthenticated')}</Badge>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Token Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* User Info */}
        <div className="flex items-center gap-2">
          <User className="h-4 w-4" />
          <span className="text-sm font-medium">{user?.first_name} {user?.last_name}</span>
          <Badge variant="outline">{t(`userManagement.${user?.role}`)}</Badge>
        </div>

        {/* Token Expiration */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span className="text-sm">Time Remaining:</span>
          </div>
          <Badge variant={getStatusColor(timeRemaining)}>
            {formatTime(timeRemaining)}
          </Badge>
        </div>

        {/* Token Status */}
        <div className="flex items-center justify-between">
          <span className="text-sm">Status:</span>
          <Badge variant={isTokenExpired() ? 'destructive' : 'default'}>
            {isTokenExpired() ? 'Expired' : 'Valid'}
          </Badge>
        </div>

        {/* Token Payload Info */}
        {tokenPayload && (
          <div className="text-xs text-gray-600 space-y-1">
            <div>Issued: {new Date(tokenPayload.iat * 1000).toLocaleTimeString()}</div>
            <div>Expires: {new Date(tokenPayload.exp * 1000).toLocaleTimeString()}</div>
            <div>Type: {tokenPayload.type}</div>
          </div>
        )}

        {/* Debug Info */}
        <details className="text-xs">
          <summary className="cursor-pointer text-gray-600 hover:text-gray-800">
            Debug Info
          </summary>
          <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
            {JSON.stringify({
              hasAccessToken: !!tokens.access_token,
              hasRefreshToken: !!tokens.refresh_token,
              tokenType: tokens.token_type,
              expiresIn: tokens.expires_in,
              timeRemaining,
              isExpired: isTokenExpired()
            }, null, 2)}
          </pre>
        </details>
      </CardContent>
    </Card>
  );
};
