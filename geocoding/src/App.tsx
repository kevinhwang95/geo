import { useEffect, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/stores/authStore';
import { useTokenRefresh } from '@/hooks/useTokenRefresh';
import { useTokenExpiryChecker } from '@/hooks/useTokenExpiryChecker';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import ErrorBoundary from '@/components/ErrorBoundary';

// Initialize i18n
import '@/i18n';

import LoginPage from '@/components/auth/LoginPage';
import Dashboard from '@/components/dashboard/Dashboard';
import TerraDrawingTools from '@/components/core/TerraDrawingTools';
import PasswordSetupPage from '@/pages/PasswordSetupPage';
import PasswordResetPage from '@/pages/PasswordResetPage';
import GlobalLanguageSwitcher from '@/components/core/GlobalLanguageSwitcher';

function App() {
  const { isAuthenticated, setLoading, tokens, user } = useAuthStore();
  const { t } = useTranslation();
  
  // Memoize authentication status to prevent unnecessary re-renders
  const authStatus = useMemo(() => {
    return isAuthenticated && tokens?.access_token && user;
  }, [isAuthenticated, tokens?.access_token, user]);
  
  // Initialize automatic token refresh for active users
  useTokenRefresh();
  
  // Initialize periodic token expiry checker
  useTokenExpiryChecker();

  useEffect(() => {
    // Check if user has stored tokens on app load
    const checkStoredAuth = () => {
      try {
        setLoading(true);
        const { tokens, user } = useAuthStore.getState();
        
        if (tokens?.access_token && user) {
          // User has stored tokens, they're considered authenticated
          // No action needed - Zustand store handles this automatically
        } else {
          // No stored tokens, user needs to login
          // This is normal for first-time visitors
        }
      } catch {
        // Silently handle any errors
      } finally {
        setLoading(false);
      }
    };

    checkStoredAuth();
  }, []); // Empty dependency array - this effect should only run once on mount

  return (
    <ErrorBoundary>
      <Router>
        <div className="App">
        {/* Global Language Switcher - appears on all pages */}
        <GlobalLanguageSwitcher />
        <Routes>
          <Route 
            path="/login" 
            element={
              authStatus ? <Navigate to="/dashboard" replace /> : <LoginPage />
            } 
          />
          <Route 
            path="/setup-password" 
            element={<PasswordSetupPage />} 
          />
          <Route 
            path="/reset-password" 
            element={<PasswordResetPage />} 
          />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/map" 
            element={
              <ProtectedRoute>
                <TerraDrawingTools />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute requiredRole="admin">
                <div className="p-8">
                  <h1 className="text-2xl font-bold">{t('pages.admin.title')}</h1>
                  <p>{t('pages.admin.description')}</p>
                </div>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/unauthorized" 
            element={
              <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                  <h1 className="text-2xl font-bold text-gray-900 mb-4">{t('pages.unauthorized.title')}</h1>
                  <p className="text-gray-600 mb-4">{t('pages.unauthorized.message')}</p>
                  <button 
                    onClick={() => window.history.back()}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    {t('pages.unauthorized.goBack')}
                  </button>
                </div>
              </div>
            } 
          />
          <Route 
            path="/" 
            element={<Navigate to="/dashboard" replace />} 
          />
          <Route 
            path="*" 
            element={
              <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                  <h1 className="text-2xl font-bold text-gray-900 mb-4">{t('pages.notFound.title')}</h1>
                  <p className="text-gray-600 mb-4">{t('pages.notFound.message')}</p>
                  <button 
                    onClick={() => window.location.href = '/dashboard'}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    {t('pages.notFound.goToDashboard')}
                  </button>
                </div>
              </div>
            } 
          />
        </Routes>
        
        <Toaster 
          position="top-right"
          expand={true}
          richColors={true}
        />
      </div>
    </Router>
    </ErrorBoundary>
  );
}

export default App;



