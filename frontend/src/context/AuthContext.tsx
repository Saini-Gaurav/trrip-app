import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthState } from '../types';
import { authApi } from '../services/api';

interface AuthContextType extends AuthState {
  login: (accessToken: string, user: User) => void;
  logout: () => void;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isLoading: true,
  });

  useEffect(() => {
    // Restore from localStorage on mount.
    // The refresh token lives in an httpOnly cookie — we only need the
    // access token + user data here.
    const accessToken = localStorage.getItem('trrip_token');
    const userStr     = localStorage.getItem('trrip_user');

    if (accessToken && userStr) {
      try {
        const user = JSON.parse(userStr) as User;
        setState({ user, token: accessToken, isLoading: false });
      } catch {
        setState({ user: null, token: null, isLoading: false });
      }
    } else {
      setState((s) => ({ ...s, isLoading: false }));
    }
  }, []);

  const login = (accessToken: string, user: User) => {
    localStorage.setItem('trrip_token', accessToken);
    localStorage.setItem('trrip_user', JSON.stringify(user));
    setState({ user, token: accessToken, isLoading: false });
  };

  const logout = async () => {
    try {
      // Tell the server to revoke this device's refresh token.
      // The httpOnly cookie is sent automatically (withCredentials: true).
      await authApi.logout();
    } catch {
      /* ignore — still clear locally */
    }
    localStorage.removeItem('trrip_token');
    localStorage.removeItem('trrip_user');
    setState({ user: null, token: null, isLoading: false });
  };

  const updateUser = (user: User) => {
    localStorage.setItem('trrip_user', JSON.stringify(user));
    setState((s) => ({ ...s, user }));
  };

  return (
    <AuthContext.Provider value={{ ...state, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
