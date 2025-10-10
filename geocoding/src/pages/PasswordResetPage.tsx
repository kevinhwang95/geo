import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, AlertCircle, Eye, EyeOff, Lock } from 'lucide-react';
import axiosClient from '@/api/axiosClient';

const PasswordResetPage: React.FC = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [user, setUser] = useState<{
    id: number;
    email: string;
    first_name: string;
    last_name: string;
  } | null>(null);
  
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });

  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setError(t('passwordReset.errors.noToken'));
      setLoading(false);
      return;
    }

    validateToken();
  }, [token, t]);

  const validateToken = async () => {
    try {
      const response = await axiosClient.post('/password/validate-reset-token', {
        token: token
      });

      if (response.data.success) {
        setUser(response.data.user);
        setError(null);
      } else {
        setError(response.data.error || t('passwordReset.errors.invalidToken'));
      }
    } catch (err: any) {
      setError(err.response?.data?.error || t('passwordReset.errors.validationFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      setError(t('passwordReset.errors.passwordsDontMatch'));
      return;
    }

    if (formData.password.length < 8) {
      setError(t('passwordReset.errors.passwordTooShort'));
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await axiosClient.post('/password/reset', {
        token: token,
        password: formData.password
      });

      if (response.data.success) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else {
        setError(response.data.error || t('passwordReset.errors.resetFailed'));
      }
    } catch (err: any) {
      setError(err.response?.data?.error || t('passwordReset.errors.resetFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-center space-x-2">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span>{t('passwordReset.validatingToken')}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle className="text-2xl text-green-600">{t('passwordReset.success.title')}</CardTitle>
            <CardDescription>
              {t('passwordReset.success.message')}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (error && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle className="text-2xl text-red-600">{t('passwordReset.invalidLink.title')}</CardTitle>
            <CardDescription>
              {error}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => navigate('/login')} variant="outline">
              {t('passwordReset.invalidLink.backToLogin')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
            <Lock className="h-6 w-6 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold">{t('passwordReset.title')}</CardTitle>
          <CardDescription>
            {t('passwordReset.subtitle', { name: user?.first_name })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t('passwordReset.emailLabel')}</Label>
              <Input
                id="email"
                type="email"
                value={user?.email || ''}
                disabled
                className="bg-gray-50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">{t('passwordReset.newPasswordLabel')}</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder={t('passwordReset.newPasswordPlaceholder')}
                  required
                  minLength={8}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{t('passwordReset.confirmPasswordLabel')}</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder={t('passwordReset.confirmPasswordPlaceholder')}
                  required
                  minLength={8}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="text-sm text-gray-600">
              <p>{t('passwordReset.passwordRequirements')}</p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>{t('passwordReset.requirement1')}</li>
                <li>{t('passwordReset.requirement2')}</li>
              </ul>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={submitting || !formData.password || !formData.confirmPassword}
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('passwordReset.resetting')}
                </>
              ) : (
                t('passwordReset.resetButton')
              )}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm text-gray-600">
            <p>{t('passwordReset.expiryNotice')}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PasswordResetPage;
