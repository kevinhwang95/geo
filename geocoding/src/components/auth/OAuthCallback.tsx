import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

const OAuthCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        const success = searchParams.get('success');
        const error = searchParams.get('error');

        if (error) {
          setStatus('error');
          setError(`OAuth error: ${error}`);
          return;
        }

        if (success) {
          try {
            // Decode the success data
            const decodedData = JSON.parse(atob(success));
            
            if (decodedData.success) {
              const { user, tokens } = decodedData;
              login(user, tokens);
              setStatus('success');
              
              // Redirect to dashboard after a short delay
              setTimeout(() => {
                navigate('/dashboard');
              }, 2000);
            } else {
              setStatus('error');
              setError('Authentication failed');
            }
          } catch (decodeError) {
            setStatus('error');
            setError('Failed to decode authentication data');
          }
        } else {
          setStatus('error');
          setError('No authentication data received');
        }
      } catch (error: any) {
        setStatus('error');
        setError(error.message || 'Authentication failed');
      }
    };

    handleOAuthCallback();
  }, [searchParams, login, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-xl p-8 text-center">
          {status === 'loading' && (
            <>
              <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Completing Authentication
              </h2>
              <p className="text-gray-600">
                Please wait while we complete your Google sign-in...
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-600" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Authentication Successful!
              </h2>
              <p className="text-gray-600">
                Redirecting you to the dashboard...
              </p>
            </>
          )}

          {status === 'error' && (
            <>
              <XCircle className="h-12 w-12 mx-auto mb-4 text-red-600" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Authentication Failed
              </h2>
              <p className="text-gray-600 mb-4">
                {error || 'An error occurred during authentication'}
              </p>
              <button
                onClick={() => navigate('/login')}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Back to Login
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default OAuthCallback;
