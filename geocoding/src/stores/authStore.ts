import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  role: 'admin' | 'contributor' | 'user' | 'team_lead';
  avatar_url?: string;
  is_active: boolean;
  last_login?: string;
  created_at: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface AuthActions {
  setUser: (user: User) => void;
  setTokens: (tokens: AuthTokens) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  login: (user: User, tokens: AuthTokens) => void;
  logout: () => void;
  clearError: () => void;
  updateUser: (updates: Partial<User>) => void;
}

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set, get) => ({
      // State
      user: null,
      tokens: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Actions
      setUser: (user) => set({ user, isAuthenticated: true }),
      setTokens: (tokens) => set({ tokens }),
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
      
      login: (user, tokens) => set({
        user,
        tokens,
        isAuthenticated: true,
        isLoading: false,
        error: null
      }),
      
      logout: () => set({
        user: null,
        tokens: null,
        isAuthenticated: false,
        isLoading: false,
        error: null
      }),
      
      clearError: () => set({ error: null }),
      
      updateUser: (updates) => {
        const currentUser = get().user;
        if (currentUser) {
          set({ user: { ...currentUser, ...updates } });
        }
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        tokens: state.tokens,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
);

// Helper functions
export const hasRole = (requiredRole: 'admin' | 'contributor' | 'user' | 'team_lead'): boolean => {
  const user = useAuthStore.getState().user;
  if (!user) return false;
  
  const roleHierarchy = {
    user: 1,
    team_lead: 2,
    contributor: 3,
    admin: 4
  };
  
  return roleHierarchy[user.role] >= roleHierarchy[requiredRole];
};

export const hasAnyRole = (roles: ('admin' | 'contributor' | 'user' | 'team_lead')[]): boolean => {
  const user = useAuthStore.getState().user;
  if (!user) return false;
  
  return roles.includes(user.role);
};

export const canManageLands = (): boolean => {
  return hasAnyRole(['admin', 'contributor']);
};

export const canManageUsers = (): boolean => {
  return hasRole('admin');
};

export const canManagePlantTypes = (): boolean => {
  return hasRole('admin');
};

export const canManageCategories = (): boolean => {
  return hasRole('admin');
};

export const canManageTeams = (): boolean => {
  return hasAnyRole(['admin', 'contributor']);
};

export const canManageWorkAssignments = (): boolean => {
  return hasAnyRole(['admin', 'contributor']);
};
