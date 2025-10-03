import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, MapPin, Users, Shield, Camera, MessageSquare } from 'lucide-react';
import axios from 'axios';
import { useAuthStore } from '@/stores/authStore';
import { useNavigate } from 'react-router-dom';

const LoginPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [googleAuthUrl, setGoogleAuthUrl] = useState<string | null>(null);
  
  const { login } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    // Get Google OAuth URL using direct axios call (no auth required)
    const fetchGoogleAuthUrl = async () => {
      try {
        const response = await axios.get('http://localhost:8000/api/oauth/google-url');
        setGoogleAuthUrl(response.data.auth_url);
      } catch (error) {
        console.error('Failed to get Google auth URL:', error);
        setError('Failed to initialize Google login. Please check if the backend server is running.');
      }
    };

    fetchGoogleAuthUrl();
  }, []);

  const handleGoogleLogin = async () => {
    if (!googleAuthUrl) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Redirect to Google OAuth URL
      window.location.href = googleAuthUrl;
    } catch (error: any) {
      setError(error.message || 'Failed to initiate Google login');
      setIsLoading(false);
    }
  };

  const features = [
    {
      icon: MapPin,
      title: 'Interactive Mapping',
      description: 'Draw and manage land boundaries with precision using Google Maps'
    },
    {
      icon: Users,
      title: 'Role-Based Access',
      description: 'Admin, Contributor, and User roles with appropriate permissions'
    },
    {
      icon: Shield,
      title: 'Secure Authentication',
      description: 'OAuth 2.0 integration with Google for secure login'
    },
    {
      icon: Camera,
      title: 'Photo Documentation',
      description: 'Attach photos with GPS coordinates to land records'
    },
    {
      icon: MessageSquare,
      title: 'Collaborative Notes',
      description: 'Share comments and notes about land management activities'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left side - Features */}
        <div className="space-y-8">
          <div className="text-center lg:text-left">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Land Management System
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Comprehensive land management with interactive mapping, role-based access, and collaborative features.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="border-0 shadow-md bg-white/80 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <feature.icon className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">
                        {feature.title}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Right side - Login */}
        <div className="flex items-center justify-center">
          <Card className="w-full max-w-md shadow-xl bg-white/90 backdrop-blur-sm">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold text-gray-900">
                Welcome Back
              </CardTitle>
              <CardDescription className="text-gray-600">
                Sign in to access your land management dashboard
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button
                onClick={handleGoogleLogin}
                disabled={isLoading || !googleAuthUrl}
                className="w-full h-12 text-lg font-medium"
                variant="outline"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="currentColor"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    Continue with Google
                  </>
                )}
              </Button>

              <div className="text-center">
                <p className="text-sm text-gray-500">
                  By signing in, you agree to our{' '}
                  <a href="#" className="text-green-600 hover:underline">
                    Terms of Service
                  </a>{' '}
                  and{' '}
                  <a href="#" className="text-green-600 hover:underline">
                    Privacy Policy
                  </a>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
