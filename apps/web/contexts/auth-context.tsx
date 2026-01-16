'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { apiClient, tokenStorage, ClientApiError } from '@/lib/api/client';
import { useCurrentUser } from '@/lib/api/queries';
import { queryKeys } from '@/lib/api/queries';
import type { User, RegisterDTO, LoginDTO } from '../lib/shared/types';
import { socketClient } from '@/lib/socket/client';


// Auth context types
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface AuthContextType extends AuthState {
  login: (credentials: LoginDTO) => Promise<void>;
  register: (userData: RegisterDTO) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  refreshUser: () => Promise<void>;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth provider component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  
  // Use TanStack Query for current user data
  const { data: currentUserData, isLoading: isUserLoading, error: userError } = useCurrentUser({
    enabled: tokenStorage.hasValidTokens(), // Only fetch if tokens exist
    retry: false, // Don't retry on auth errors
  });
  
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  });

  // Clear error
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Set loading state
  const setLoading = useCallback((loading: boolean) => {
    setState(prev => ({ ...prev, isLoading: loading }));
  }, []);

  // Set error state
  const setError = useCallback((error: string) => {
    setState(prev => ({ ...prev, error, isLoading: false }));
  }, []);

  // Set authenticated user
  const setUser = useCallback((user: User | null) => {
    setState(prev => ({
      ...prev,
      user,
      isAuthenticated: !!user,
      isLoading: false,
      error: null,
    }));
  }, []);

  // Sync query data to auth state
  useEffect(() => {
    if (isUserLoading) {
      setLoading(true);
      return;
    }

    if (userError || !currentUserData) {
      // Clear invalid tokens if query failed
      if (userError) {
        tokenStorage.clearTokens();
      }
      setUser(null);
      return;
    }

    // Sync user data from query to state
    setUser(currentUserData);
  }, [currentUserData, isUserLoading, userError, setLoading, setUser]);

  // Login function
  const login = useCallback(async (credentials: LoginDTO) => {
    try {
      setLoading(true);
      clearError();

      await apiClient.login(credentials);
      
      await queryClient.invalidateQueries({ queryKey: queryKeys.auth.currentUser() });
      await queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
      await queryClient.invalidateQueries({ queryKey: queryKeys.chats.all });
      
      // Redirect to chats page
      setLoading(false);
      router.push('/chats');
    } catch (error) {
      console.error('Login failed:', error);
      
      if (error instanceof ClientApiError) {
        switch (error.status) {
          case 401:
            setError('Invalid email or password');
            break;
          case 429:
            setError('Too many login attempts. Please try again later.');
            break;
          default:
            setError(error.message);
        }
      } else {
        setError('Login failed. Please try again.');
      }
    }
  }, [setLoading, clearError, setError, router, queryClient]);

  // Register function
  const register = useCallback(async (userData: RegisterDTO) => {
    try {
      setLoading(true);
      clearError();

      await apiClient.register(userData);
      
      // Invalidate all queries to refetch with new auth state
      await queryClient.invalidateQueries({ queryKey: queryKeys.auth.currentUser() });
      await queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
      await queryClient.invalidateQueries({ queryKey: queryKeys.chats.all });
      
      // Redirect to chats page
      router.push('/chats');
    } catch (error) {
      console.error('Registration failed:', error);
      
      if (error instanceof ClientApiError) {
        switch (error.status) {
          case 409:
            setError('Email already exists. Please use a different email.');
            break;
          case 400:
            setError('Invalid registration data. Please check your inputs.');
            break;
          case 429:
            setError('Too many registration attempts. Please try again later.');
            break;
          default:
            setError(error.message);
        }
      } else {
        setError('Registration failed. Please try again.');
      }
    }
  }, [setLoading, clearError, setError, router, queryClient]);

  // Logout function
  const logout = useCallback(async () => {
    try {
      setLoading(true);
      
      await apiClient.logout();
      
      // Clear all query cache
      queryClient.clear();
      setUser(null);

      // Redirect to auth page
      router.push('/auth');
    } catch (error) {
      console.error('Logout failed:', error);
      
      // Clear tokens and cache even if API call fails
      tokenStorage.clearTokens();
      queryClient.clear();
      setUser(null);
      router.push('/auth');
    }
  }, [setLoading, setUser, router, queryClient]);

  // Refresh user data
  const refreshUser = useCallback(async () => {
    try {
      if (!state.isAuthenticated) return;
      
      await queryClient.invalidateQueries({ queryKey: queryKeys.auth.currentUser() });
    } catch (error) {
      console.error('Failed to refresh user:', error);
      
      // If refresh fails, logout user
      tokenStorage.clearTokens();
      queryClient.clear();
      setUser(null);
    }
  }, [state.isAuthenticated, queryClient, setUser]);


  // Setup token refresh interval
  useEffect(() => {
    if (!state.isAuthenticated) return;

    // Refresh token every 14 minutes (tokens expire in 15 minutes)
    const interval = setInterval(async () => {
      try {
        await apiClient.refreshToken();
        socketClient.reconnectWithNewToken();
      } catch (error) {
        console.error('Automatic token refresh failed:', error);
        // Don't logout on automatic refresh failure
        // The user will be logged out when they make their next API call
      }
    }, 14 * 60 * 1000);

    return () => clearInterval(interval);
  }, [state.isAuthenticated]);

  const contextValue: AuthContextType = {
    ...state,
    login,
    register,
    logout,
    clearError,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use auth context
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}

// HOC for protected components
export function withAuth<P extends object>(
  Component: React.ComponentType<P>
) {
  return function AuthenticatedComponent(props: P) {
    const { isAuthenticated, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!isLoading && !isAuthenticated) {
        router.push('/auth');
      }
    }, [isAuthenticated, isLoading, router]);

    if (isLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    if (!isAuthenticated) {
      return null;
    }

    return <Component {...props} />;
  };
}