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
    const currentUser = getCurrentUser();
    setUser(currentUser);
  };

  useEffect(() => {
    // If NextAuth session exists, save backend JWT to localStorage
    if (session && (session as any).backendToken) {
      console.log('✅ [AuthContext] NextAuth session detected, saving JWT');
      localStorage.setItem('accessToken', (session as any).backendToken);
      if ((session as any).refreshToken) {
        localStorage.setItem('refreshToken', (session as any).refreshToken);
      }

      // Save user data
      if (session.user) {
        const userData = {
          userId: (session as any).userId || session.user.email || '',
          username: session.user.name || session.user.email?.split('@')[0] || 'User',
          email: session.user.email,
          isGuest: false,
        };
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
      }
    }

    // Check if user is logged in on mount (for non-Google logins)
    if (status === 'unauthenticated' && isLoggedIn()) {
      refreshUser();
    }

    if (status !== 'loading') {
      setLoading(false);
    }

    // Auto-refresh token every 10 minutes (before the 15-minute expiry)
    const refreshInterval = setInterval(async () => {
      if (isLoggedIn()) {
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

      // Clear local storage
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
