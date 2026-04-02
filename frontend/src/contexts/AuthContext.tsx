import React, { createContext, useContext, useState, useEffect } from 'react';

/**
 * NFR 3.1 & 3.2 Security: Authentication & Session Management
 * This context manages the authenticated user state, supporting role-based logic 
 * for Customers, Managers, and Admins.
 */

export interface User {
  id: string;
  role: 'customer' | 'manager' | 'admin' | 'staff';
  username?: string;
  department?: string;
  branch_id?: string;
}

interface AuthContextType {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session in localStorage on mount
    const savedUser = localStorage.getItem('obms_auth_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        console.error('Failed to parse auth user from storage:', error);
        localStorage.removeItem('obms_auth_user');
      }
    }
    setLoading(false);
  }, []);

  const login = (userData: User) => {
    setUser(userData);
    localStorage.setItem('obms_auth_user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('obms_auth_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider. Ensure main.tsx wraps the app correctly.');
  }
  return context;
}
