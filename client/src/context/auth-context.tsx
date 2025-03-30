import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { useLocation } from 'wouter';

interface User {
  id: number;
  username: string;
  email: string;
  fullName: string;
  role: 'parent' | 'teacher' | 'officeadmin' | 'superadmin';
  active: boolean;
  studentId: number | null;
  [key: string]: any;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (userData: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Check if user data exists in session storage
    const userData = sessionStorage.getItem('user');
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        setIsAuthenticated(true);
      } catch (err) {
        console.error('Failed to parse user data:', err);
        sessionStorage.removeItem('user');
        setLocation('/login');
      }
    }
  }, [setLocation]);

  const login = (userData: User) => {
    sessionStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    setIsAuthenticated(true);
  };

  const logout = () => {
    sessionStorage.removeItem('user');
    setUser(null);
    setIsAuthenticated(false);
    setLocation('/login');
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, logout }}>
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