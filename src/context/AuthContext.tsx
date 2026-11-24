import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { authService } from '../services/authService';
import {
  clearStoredToken,
  getStoredToken,
  setStoredToken
} from '../services/apiClient';
import type { User } from '../types';

interface AuthContextValue {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => getStoredToken());
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(() => Boolean(getStoredToken()));

  const logout = useCallback(() => {
    clearStoredToken();
    setToken(null);
    setUser(null);
    setIsLoading(false);
  }, []);

  const refreshUser = useCallback(async () => {
    const activeToken = getStoredToken();
    if (!activeToken) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const response = await authService.getMe();
      if (response.data?.role !== 'admin') {
        logout();
        return;
      }
      setUser(response.data);
    } catch {
      logout();
    } finally {
      setIsLoading(false);
    }
  }, [logout]);

  useEffect(() => {
    if (!token) return;
    let active = true;

    authService
      .getMe()
      .then((response) => {
        if (!active) return;
        if (response.data?.role !== 'admin') {
          logout();
          return;
        }
        setUser(response.data);
        setIsLoading(false);
      })
      .catch(() => {
        if (!active) return;
        logout();
      });

    return () => {
      active = false;
    };
  }, [token, logout]);

  const login = useCallback(async (email: string, password: string) => {
    const response = await authService.login(email, password);
    const loggedInUser = response.data?.user;
    const accessToken = response.data?.token;

    if (!accessToken || !loggedInUser) {
      throw new Error('Invalid authentication response from server.');
    }

    if (loggedInUser.role !== 'admin') {
      throw new Error('Only administrator accounts can access this dashboard.');
    }

    setStoredToken(accessToken);
    setToken(accessToken);
    setUser(loggedInUser);
    return loggedInUser;
  }, []);

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        isAuthenticated: Boolean(token && user && user.role === 'admin'),
        isLoading,
        login,
        logout,
        refreshUser,
        setUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
