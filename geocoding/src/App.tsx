import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { useAuthStore } from '@/stores/authStore';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import LoginPage from '@/components/auth/LoginPage';
import OAuthCallback from '@/components/auth/OAuthCallback';
import Dashboard from '@/components/dashboard/Dashboard';
import TerraDrawingTools from '@/components/core/TerraDrawingTools';

function App() {
  const { isAuthenticated, setLoading, setError } = useAuthStore();

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
      } catch (error) {
        // Silently handle any errors
      } finally {
        setLoading(false);
      }
    };

    checkStoredAuth();
  }, [setLoading, setError]);

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route 
            path="/login" 
            element={
              isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />
            } 
          />
          <Route 
            path="/oauth/callback" 
            element={<OAuthCallback />} 
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
                  <h1 className="text-2xl font-bold">Admin Panel</h1>
                  <p>Admin-only content will go here</p>
                </div>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/unauthorized" 
            element={
              <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                  <h1 className="text-2xl font-bold text-gray-900 mb-4">Unauthorized</h1>
                  <p className="text-gray-600 mb-4">You don't have permission to access this page.</p>
                  <button 
                    onClick={() => window.history.back()}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Go Back
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
                  <h1 className="text-2xl font-bold text-gray-900 mb-4">Page Not Found</h1>
                  <p className="text-gray-600 mb-4">The page you're looking for doesn't exist.</p>
                  <button 
                    onClick={() => window.location.href = '/dashboard'}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Go to Dashboard
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
  );
}

export default App;



