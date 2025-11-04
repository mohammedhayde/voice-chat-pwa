'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { logout as logoutService, getCurrentUser, isLoggedIn } from '@/lib/authService';

interface User {
  userId: string;
  username: string;
  isGuest: boolean;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  logout: () => Promise<void>;
  refreshUser: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { data: session, status } = useSession();

  const refreshUser = () => {
    // Check NextAuth session first
    if (session?.user) {
      const nextAuthUser: User = {
        userId: session.user.userId?.toString() || session.user.id || '',
        username: session.user.username || session.user.name || 'Google User',
        isGuest: false,
      };

      // Store tokens in localStorage for API calls
      if (session.user.backendToken) {
        localStorage.setItem('accessToken', session.user.backendToken);
      }
      if (session.user.refreshToken) {
        localStorage.setItem('refreshToken', session.user.refreshToken);
      }

      setUser(nextAuthUser);
      return;
    }

    // Fallback to traditional auth
    const currentUser = getCurrentUser();
    setUser(currentUser);
  };

  useEffect(() => {
    // Update user when session changes
    if (status !== 'loading') {
      refreshUser();
      setLoading(false);
    }
  }, [session, status]);

  useEffect(() => {
    // Check if user is logged in on mount (traditional auth)
    if (!session && isLoggedIn()) {
      refreshUser();
    }
    if (status !== 'loading') {
      setLoading(false);
    }

    // Auto-refresh token every 10 minutes (before the 15-minute expiry)
    const refreshInterval = setInterval(async () => {
      if (isLoggedIn() && !session) {
        try {
          const { refreshAccessToken } = await import('@/lib/authService');
          await refreshAccessToken();
          console.log('🔄 Token refreshed automatically');
        } catch (error) {
          console.error('Failed to refresh token:', error);
        }
      }
    }, 10 * 60 * 1000); // 10 minutes

    return () => clearInterval(refreshInterval);
  }, [session, status]);

  const logout = async () => {
    try {
      // Sign out from NextAuth if session exists
      if (session) {
        await signOut({ redirect: false });
      }

      // Traditional logout
      await logoutService();
      setUser(null);
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        loading,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
