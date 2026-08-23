import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { User, Role } from '../types';
import { authService } from '../services/authService';

interface AuthContextType {
  user: User | null;
  role: Role | null;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (email: string, password: string, name: string, workspaceName?: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      authService.getMe()
        .then((res) => {
          const u = res.data;
          setUser({ id: u.id, name: u.name, email: u.email, avatar: u.avatar, status: u.status, createdAt: new Date().toISOString() });
          setRole({ id: '1', name: 'Admin', description: 'Full access', permissions: [], isSystem: true, createdAt: new Date().toISOString() });
        })
        .catch(() => {
          localStorage.clear();
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const res = await authService.login(email, password);
      localStorage.setItem('access_token', res.data.access_token);
      localStorage.setItem('refresh_token', res.data.refresh_token);
      const u = res.data.user;
      setUser({ id: u.id, name: u.name, email: u.email, avatar: u.avatar, status: u.status, createdAt: new Date().toISOString() });
      setRole({ id: '1', name: 'Admin', description: 'Full access', permissions: [], isSystem: true, createdAt: new Date().toISOString() });
      return true;
    } catch {
      return false;
    }
  };

  const signup = async (email: string, password: string, name: string, workspaceName?: string) => {
    try {
      const res = await authService.signup({ email, password, name, workspace_name: workspaceName });
      localStorage.setItem('access_token', res.data.access_token);
      localStorage.setItem('refresh_token', res.data.refresh_token);
      const u = res.data.user;
      setUser({ id: u.id, name: u.name, email: u.email, avatar: u.avatar, status: u.status, createdAt: new Date().toISOString() });
      setRole({ id: '1', name: 'Admin', description: 'Full access', permissions: [], isSystem: true, createdAt: new Date().toISOString() });
      return true;
    } catch {
      return false;
    }
  };

  const logout = () => {
    const refreshToken = localStorage.getItem('refresh_token');
    if (refreshToken) {
      authService.logout(refreshToken).catch(() => {});
    }
    localStorage.clear();
    setUser(null);
    setRole(null);
  };

  return (
    <AuthContext.Provider value={{ user, role, login, signup, logout, isAuthenticated: !!user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
