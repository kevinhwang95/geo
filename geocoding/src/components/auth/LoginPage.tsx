import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, MapPin, Users, Shield, Camera, MessageSquare, LogIn, UserPlus, Mail } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { useAuthStore } from '@/stores/authStore';
import { useNavigate } from 'react-router-dom';

const LoginPage: React.FC = () => {
  const { t, i18n } = useTranslation();
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
      setError(t('auth.fillAllFields'));
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
      setError(error.response?.data?.error || t('auth.loginError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !firstName || !lastName) {
      setError(t('auth.fillAllFields'));
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
        alert(t('auth.registerSuccess'));
        // Reset form
        setEmail('');
        setFirstName('');
        setLastName('');
        setPhone('');
        setIsRegisterMode(false);
      } else {
        setError(response.data.error || t('auth.registerError'));
      }
    } catch (error: any) {
      setError(error.response?.data?.error || t('auth.registerError'));
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
        email: forgotPasswordEmail,
        language: i18n.language
      });
      
      if (response.data.success) {
        setForgotPasswordSuccess(true);
        setError(null);
      } else {
        setError(response.data.error || t('forgotPassword.errors.sendFailed'));
      }
    } catch (error: any) {
      setError(error.response?.data?.error || t('forgotPassword.errors.sendFailed'));
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  const features = [
    {
      icon: MapPin,
      title: t('landing.features.interactiveMapping.title'),
      description: t('landing.features.interactiveMapping.description')
    },
    {
      icon: Users,
      title: t('landing.features.roleBasedAccess.title'),
      description: t('landing.features.roleBasedAccess.description')
    },
    {
      icon: Shield,
      title: t('landing.features.secureAuthentication.title'),
      description: t('landing.features.secureAuthentication.description')
    },
    {
      icon: Camera,
      title: t('landing.features.photoDocumentation.title'),
      description: t('landing.features.photoDocumentation.description')
    },
    {
      icon: MessageSquare,
      title: t('landing.features.collaborativeNotes.title'),
      description: t('landing.features.collaborativeNotes.description')
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
                      alt={t('landing.logoAlt')} 
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
                      {t('landing.title')}
                    </h1>
                    {/* Underline effect */}
                    <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-green-400 to-blue-400 rounded-full opacity-60"></div>
                  </div>
                  
                  <p className="text-sm sm:text-base text-gray-600 max-w-md leading-relaxed">
                    {t('landing.tagline')}
                  </p>
                  
                  {/* Feature highlights */}
                  <div className="flex flex-wrap gap-2 mt-4">
                    <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                      {t('landing.badges.interactiveMapping')}
                    </span>
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                      {t('landing.badges.roleBasedAccess')}
                    </span>
                    <span className="px-3 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
                      {t('landing.badges.realTimeCollaboration')}
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
                {isRegisterMode ? t('auth.createAccount') : t('auth.login')}
              </CardTitle>
              <CardDescription className="text-gray-600">
                {isRegisterMode 
                  ? t('auth.register')
                  : t('auth.login')
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
                        <Label htmlFor="firstName">{t('auth.firstName')} *</Label>
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
                        <Label htmlFor="lastName">{t('auth.lastName')} *</Label>
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
                      <Label htmlFor="phone">{t('auth.phone')}</Label>
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
                  <Label htmlFor="email">{t('auth.email')} *</Label>
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
                    <Label htmlFor="password">{t('auth.password')} *</Label>
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
                      {t('auth.forgotPassword')}
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
                      {isRegisterMode ? t('common.loading') : t('common.loading')}
                    </>
                  ) : (
                    <>
                      {isRegisterMode ? (
                        <>
                          <UserPlus className="mr-2.5 h-5 w-5" />
                          {t('auth.createAccount')}
                        </>
                      ) : (
                        <>
                          <LogIn className="mr-2.5 h-5 w-5" />
                          {t('auth.login')}
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
                    ? t('auth.alreadyHaveAccount') 
                    : t('auth.dontHaveAccount')
                  }
                </button>
              </div>

              {/* Forgot Password Modal */}
              {showForgotPassword && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <Card className="w-full max-w-md mx-4">
                    <CardHeader>
                      <CardTitle className="text-center">{t('forgotPassword.modal.title')}</CardTitle>
                      <CardDescription className='text-center'>
                        {t('forgotPassword.modal.description')}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {forgotPasswordSuccess ? (
                        <div className="text-center space-y-4">
                          <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                            <Mail className="h-6 w-6 text-green-600" />
                          </div>
                          <div>
                            <h3 className="text-lg font-medium text-gray-900">{t('forgotPassword.modal.success.title')}</h3>
                            <p className="text-sm text-gray-600 mt-2">
                              {t('forgotPassword.modal.success.message')} <strong>{forgotPasswordEmail}</strong>
                            </p>
                            <p className="text-xs text-gray-500 mt-2">
                              {t('forgotPassword.modal.success.expiry')}
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
{t('forgotPassword.modal.success.close')}
                          </Button>
                        </div>
                      ) : (
                        <form onSubmit={handleForgotPassword} className="space-y-4">
                          <div>
                            <Label htmlFor="forgotEmail">{t('forgotPassword.modal.emailLabel')}</Label>
                            <Input
                              id="forgotEmail"
                              type="email"
                              value={forgotPasswordEmail}
                              onChange={(e) => setForgotPasswordEmail(e.target.value)}
                              placeholder={t('forgotPassword.modal.emailPlaceholder')}
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
{t('forgotPassword.modal.cancel')}
                            </Button>
                            <Button
                              type="submit"
                              disabled={forgotPasswordLoading || !forgotPasswordEmail}
                              className="flex-1"
                            >
                              {forgotPasswordLoading ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  {t('forgotPassword.modal.sending')}
                                </>
                              ) : (
                                <>
                                  <Mail className="mr-2 h-4 w-4" />
                                  {t('forgotPassword.modal.sendResetLink')}
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
                  {isRegisterMode ? t('landing.terms.byCreatingAccount') : t('landing.terms.bySigningIn')}, {t('landing.terms.agreeTo')}{' '}
                  <a href="#" className="text-green-600 hover:underline">
                    {t('landing.terms.termsOfService')}
                  </a>{' '}
                  {t('landing.terms.and')}{' '}
                  <a href="#" className="text-green-600 hover:underline">
                    {t('landing.terms.privacyPolicy')}
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
