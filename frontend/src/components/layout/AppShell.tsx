import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { Breadcrumb } from './Breadcrumb';
import { useAuth } from '../../context/AuthContext';

export function AppShell() {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout, validate } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    validate();
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header userName={user?.name} onLogout={handleLogout} />
        <Breadcrumb />
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
