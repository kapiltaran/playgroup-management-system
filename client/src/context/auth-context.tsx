import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';

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
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Check authentication status on mount
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/auth/me');
        
        if (response.ok) {
          const data = await response.json();
          if (data.user) {
            setUser(data.user);
            setIsAuthenticated(true);
            sessionStorage.setItem('user', JSON.stringify(data.user));
          } else {
            // User not authenticated
            setUser(null);
            setIsAuthenticated(false);
            sessionStorage.removeItem('user');
          }
        } else if (response.status === 401) {
          // Not authenticated
          setUser(null);
          setIsAuthenticated(false);
          sessionStorage.removeItem('user');
        } else {
          // Error occurred
          console.error('Failed to verify authentication status:', response.statusText);
          
          // Fallback to local storage
          const storedUser = sessionStorage.getItem('user');
          if (storedUser) {
            try {
              const parsedUser = JSON.parse(storedUser);
              setUser(parsedUser);
              setIsAuthenticated(true);
            } catch (err) {
              console.error('Failed to parse stored user data:', err);
              sessionStorage.removeItem('user');
            }
          }
        }
      } catch (error) {
        console.error('Error checking auth status:', error);
        
        // Fallback to session storage
        const storedUser = sessionStorage.getItem('user');
        if (storedUser) {
          try {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
            setIsAuthenticated(true);
          } catch (err) {
            console.error('Failed to parse stored user data:', err);
            sessionStorage.removeItem('user');
          }
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuthStatus();
  }, []);

  const login = (userData: User) => {
    sessionStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    setIsAuthenticated(true);
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      // Use fetch instead of apiRequest due to typing issues
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        sessionStorage.removeItem('user');
        setUser(null);
        setIsAuthenticated(false);
        setLocation('/login');
        toast({
          title: "Logged out successfully",
          description: "You have been logged out of your account",
        });
      } else {
        console.error('Logout failed:', response.statusText);
        toast({
          title: "Logout failed",
          description: "An error occurred while logging out",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        title: "Logout failed",
        description: "An error occurred while logging out",
        variant: "destructive",
      });
    } finally {
      // Even if server logout fails, clear local state
      sessionStorage.removeItem('user');
      setUser(null);
      setIsAuthenticated(false);
      setLocation('/login');
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, logout, isLoading }}>
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