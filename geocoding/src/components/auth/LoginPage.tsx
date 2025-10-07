import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, MapPin, Users, Shield, Camera, MessageSquare, LogIn, UserPlus, Mail } from 'lucide-react';
import axios from 'axios';
import { useAuthStore } from '@/stores/authStore';
import { useNavigate } from 'react-router-dom';

const LoginPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);
  const [forgotPasswordSuccess, setForgotPasswordSuccess] = useState(false);
  
  // Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Registration form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/auth/login`, {
        email,
        password
      });
      
      const { token, user } = response.data;
      
      login(user, token);
      navigate('/dashboard');
    } catch (error: any) {
      setError(error.response?.data?.error || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !firstName || !lastName) {
      setError('Please fill in all required fields');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/auth/register`, {
        email,
        firstName,
        lastName,
        phone
      });
      
      if (response.data.success) {
        // Show success message instead of auto-login
        setError(null);
        alert('Registration successful! Please check your email for a password setup link.');
        // Reset form
        setEmail('');
        setFirstName('');
        setLastName('');
        setPhone('');
        setIsRegisterMode(false);
      } else {
        setError(response.data.error || 'Registration failed');
      }
    } catch (error: any) {
      setError(error.response?.data?.error || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!forgotPasswordEmail) {
      setError('Please enter your email address');
      return;
    }
    
    setForgotPasswordLoading(true);
    setError(null);
    
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/password/reset-email`, {
        email: forgotPasswordEmail
      });
      
      if (response.data.success) {
        setForgotPasswordSuccess(true);
        setError(null);
      } else {
        setError(response.data.error || 'Failed to send reset email');
      }
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to send reset email');
    } finally {
      setForgotPasswordLoading(false);
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
      description: 'JWT-based authentication with secure login and registration'
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
            {/* Logo Section */}
            <div className="mb-8">
              <div className="flex flex-col items-center lg:items-start space-y-6">
                {/* Logo Image with Enhanced Effects */}
                <div className="relative group">
                  {/* Background glow */}
                  <div className="absolute inset-0 bg-gradient-to-r from-green-400/30 to-blue-400/30 rounded-2xl blur-2xl opacity-50 group-hover:opacity-70 transition-opacity duration-300 -z-10 scale-110"></div>
                  
                  {/* Logo container */}
                  <div className="relative bg-white/90 backdrop-blur-sm rounded-2xl p-4 shadow-xl border border-white/50 group-hover:shadow-2xl transition-all duration-300 group-hover:scale-105">
                    <img 
                      src="/logolong.PNG" 
                      alt="Chokdee Logo" 
                      className="h-16 sm:h-20 lg:h-24 w-auto object-contain"
                    />
                  </div>
                  
                  {/* Decorative elements */}
                  <div className="absolute -top-2 -right-2 w-4 h-4 bg-green-400 rounded-full opacity-60 animate-pulse"></div>
                  <div className="absolute -bottom-2 -left-2 w-3 h-3 bg-blue-400 rounded-full opacity-60 animate-pulse" style={{animationDelay: '1s'}}></div>
                </div>
                
                {/* Enhanced Tagline */}
                <div className="text-center lg:text-left space-y-3">
                  <div className="relative">
                    <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                      Land Management System
                    </h1>
                    {/* Underline effect */}
                    <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-green-400 to-blue-400 rounded-full opacity-60"></div>
                  </div>
                  
                  <p className="text-sm sm:text-base text-gray-600 max-w-md leading-relaxed">
                    Comprehensive land management with interactive mapping, role-based access, and collaborative features.
                  </p>
                  
                  {/* Feature highlights */}
                  <div className="flex flex-wrap gap-2 mt-4">
                    <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                      Interactive Mapping
                    </span>
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                      Role-Based Access
                    </span>
                    <span className="px-3 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
                      Real-time Collaboration
                    </span>
                  </div>
                </div>
              </div>
            </div>
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

        {/* Right side - Login/Register */}
        <div className="flex items-center justify-center">
          <Card className="w-full max-w-md shadow-xl bg-white/90 backdrop-blur-sm">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold text-gray-900">
                {isRegisterMode ? 'Create Account' : 'Welcome Back'}
              </CardTitle>
              <CardDescription className="text-gray-600">
                {isRegisterMode 
                  ? 'Sign up to access your land management dashboard'
                  : 'Sign in to access your land management dashboard'
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={isRegisterMode ? handleRegister : handleLogin} className="space-y-4">
                {isRegisterMode && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="firstName">First Name *</Label>
                        <Input
                          id="firstName"
                          type="text"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          required
                          disabled={isLoading}
                        />
                      </div>
                      <div>
                        <Label htmlFor="lastName">Last Name *</Label>
                        <Input
                          id="lastName"
                          type="text"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          required
                          disabled={isLoading}
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        disabled={isLoading}
                      />
                    </div>
                  </>
                )}
                
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>
                
                {!isRegisterMode && (
                  <div>
                    <Label htmlFor="password">Password *</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={isLoading}
                    />
                  </div>
                )}
                
                {!isRegisterMode && (
                  <div className="text-right">
                    <button
                      type="button"
                      onClick={() => setShowForgotPassword(true)}
                      disabled={isLoading}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      Forgot your password?
                    </button>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 text-lg font-medium"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      {isRegisterMode ? 'Sending Confirmation...' : 'Signing In...'}
                    </>
                  ) : (
                    <>
                      {isRegisterMode ? (
                        <>
                          <UserPlus className="mr-2.5 h-5 w-5" />
                          Send Confirmation Email
                        </>
                      ) : (
                        <>
                          <LogIn className="mr-2.5 h-5 w-5" />
                          Sign In
                        </>
                      )}
                    </>
                  )}
                </Button>
              </form>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setIsRegisterMode(!isRegisterMode)}
                  disabled={isLoading}
                  className="text-sm text-green-600 hover:underline"
                >
                  {isRegisterMode 
                    ? 'Already have an account, sign in' 
                    : "Don't have an account? Create one"
                  }
                </button>
              </div>

              {/* Forgot Password Modal */}
              {showForgotPassword && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <Card className="w-full max-w-md mx-4">
                    <CardHeader>
                      <CardTitle className="text-center">Reset Password</CardTitle>
                      <CardDescription className="text-center">
                        Enter your email address and we'll send you a link to reset your password.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {forgotPasswordSuccess ? (
                        <div className="text-center space-y-4">
                          <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                            <Mail className="h-6 w-6 text-green-600" />
                          </div>
                          <div>
                            <h3 className="text-lg font-medium text-gray-900">Check your email</h3>
                            <p className="text-sm text-gray-600 mt-2">
                              We've sent a password reset link to <strong>{forgotPasswordEmail}</strong>
                            </p>
                            <p className="text-xs text-gray-500 mt-2">
                              The link will expire in 24 hours for security reasons.
                            </p>
                          </div>
                          <Button
                            onClick={() => {
                              setShowForgotPassword(false);
                              setForgotPasswordSuccess(false);
                              setForgotPasswordEmail('');
                            }}
                            className="w-full"
                          >
                            Close
                          </Button>
                        </div>
                      ) : (
                        <form onSubmit={handleForgotPassword} className="space-y-4">
                          <div>
                            <Label htmlFor="forgotEmail">Email Address</Label>
                            <Input
                              id="forgotEmail"
                              type="email"
                              value={forgotPasswordEmail}
                              onChange={(e) => setForgotPasswordEmail(e.target.value)}
                              placeholder="Enter your email address"
                              required
                              disabled={forgotPasswordLoading}
                            />
                          </div>
                          
                          {error && (
                            <Alert variant="destructive">
                              <AlertDescription>{error}</AlertDescription>
                            </Alert>
                          )}
                          
                          <div className="flex space-x-3">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                setShowForgotPassword(false);
                                setForgotPasswordEmail('');
                                setError(null);
                              }}
                              disabled={forgotPasswordLoading}
                              className="flex-1"
                            >
                              Cancel
                            </Button>
                            <Button
                              type="submit"
                              disabled={forgotPasswordLoading || !forgotPasswordEmail}
                              className="flex-1"
                            >
                              {forgotPasswordLoading ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Sending...
                                </>
                              ) : (
                                <>
                                  <Mail className="mr-2 h-4 w-4" />
                                  Send Reset Link
                                </>
                              )}
                            </Button>
                          </div>
                        </form>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}

              <div className="text-center">
                <p className="text-xs text-gray-500">
                  By {isRegisterMode ? 'creating an account' : 'signing in'}, you agree to our{' '}
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
