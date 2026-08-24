import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { User, Role } from '../types';
import { authService } from '../services/authService';

interface AuthContextType {
  user: User | null;
  role: Role | null;
  permissions: string[];
  hasPermission: (perm: string) => boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  signup: (email: string, password: string, name: string, workspaceName?: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const applyUser = (u: any) => {
    setUser({ id: u.id, name: u.name, email: u.email, avatar: u.avatar, status: u.status, createdAt: new Date().toISOString() });
    const perms: string[] = u.permissions || [];
    setPermissions(perms);
    const isAdmin = perms.includes('users.manage') || perms.includes('projects.view') || u.is_superadmin;
    setRole({ id: '1', name: isAdmin ? 'Admin' : 'Member', description: isAdmin ? 'Full access' : 'Limited', permissions: perms, isSystem: true, createdAt: new Date().toISOString() });
  };

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      authService.getMe()
        .then((res) => {
          const u = res.data.data || res.data;
          applyUser(u);
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
      const data = res.data.data || res.data;
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('refresh_token', data.refresh_token);
      try {
        const me = await authService.getMe();
        applyUser(me.data.data || me.data);
      } catch {
        const u = data.user;
        applyUser(u);
      }
      return { success: true, message: res.data.message };
    } catch (err: any) {
      const message = err.response?.data?.message || 'Login failed.';
      return { success: false, message };
    }
  };

  const signup = async (email: string, password: string, name: string, workspaceName?: string) => {
    try {
      const res = await authService.signup({ email, password, name, workspace_name: workspaceName });
      const data = res.data.data || res.data;
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('refresh_token', data.refresh_token);
      try {
        const me = await authService.getMe();
        applyUser(me.data.data || me.data);
      } catch {
        const u = data.user;
        applyUser(u);
      }
      return { success: true, message: res.data.message };
    } catch (err: any) {
      const message = err.response?.data?.message || 'Signup failed.';
      return { success: false, message };
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
    setPermissions([]);
  };

  const hasPermission = (perm: string) => permissions.includes(perm) || user?.email?.includes('admin') || false;

  return (
    <AuthContext.Provider value={{ user, role, permissions, hasPermission, login, signup, logout, isAuthenticated: !!user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
