'use client';

import { createContext, useContext, useEffect, useState } from 'react';

interface UserData {
  _id: string;
  name: string;
  email: string;
  role: string;
  employeeId?: string | null;
  mustResetPassword?: boolean;
  [key: string]: unknown;
}

interface AuthContextValue {
  isLoggedIn: boolean;
  userData: UserData | null;
  authLoading: boolean;
  login: (token: string, user: UserData) => void;
  logout: () => void;
  refreshUser: (updates: Partial<UserData>) => void;
  isHR: boolean;
  isDeptHead: boolean;
  isStaff: boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const token = sessionStorage.getItem('token');
    const stored = sessionStorage.getItem('userData');
    if (token && stored) {
      try {
        setUserData(JSON.parse(stored));
        setIsLoggedIn(true);
      } catch {
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('userData');
      }
    }
    setAuthLoading(false);
  }, []);

  const login = (token: string, user: UserData) => {
    sessionStorage.setItem('token', token);
    sessionStorage.setItem('userData', JSON.stringify(user));
    setUserData(user);
    setIsLoggedIn(true);
  };

  const logout = () => {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('userData');
    setUserData(null);
    setIsLoggedIn(false);
  };

  const refreshUser = (updates: Partial<UserData>) => {
    setUserData((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, ...updates } as UserData;
      sessionStorage.setItem('userData', JSON.stringify(updated));
      return updated;
    });
  };

  const role = userData?.role ?? '';
  const isHR = role === 'super_admin' || role === 'hr_manager';
  const isDeptHead = role === 'department_head';
  const isStaff = role === 'staff';

  return (
    <AuthContext.Provider value={{ isLoggedIn, userData, authLoading, login, logout, refreshUser, isHR, isDeptHead, isStaff }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
