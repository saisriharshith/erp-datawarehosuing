import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, UserRole } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAdmin: boolean;
  isLecturer: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const verifyUser = async () => {
      if (token) {
        try {
          const profile = await api.getMe();
          setUser(profile);
          localStorage.setItem('user', JSON.stringify(profile));
        } catch (err) {
          console.warn('Session verification failed, logging out:', err);
          logout();
        }
      }
      setIsLoading(false);
    };

    verifyUser();
  }, [token]);

  const login = async (email: string, password: string) => {
    const res = await api.login({ email, password });
    const authUser: User = {
      id: res.user_id,
      email: res.email,
      full_name: res.full_name,
      role: res.role as UserRole,
      is_active: true,
    };
    setToken(res.access_token);
    setUser(authUser);
    localStorage.setItem('token', res.access_token);
    localStorage.setItem('user', JSON.stringify(authUser));
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const isAdmin = user?.role === 'ADMIN';
  const isLecturer = user?.role === 'LECTURER';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        logout,
        isAdmin,
        isLecturer,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
