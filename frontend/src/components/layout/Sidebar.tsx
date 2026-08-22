import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { cn } from '../../utils/cn';
import {
  LayoutDashboard, FolderKanban, CheckSquare, Columns3,
  Users, Shield, Settings, ChevronLeft, ChevronRight, Menu
} from 'lucide-react';

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard className="h-5 w-5" /> },
  { label: 'Projects', path: '/projects', icon: <FolderKanban className="h-5 w-5" /> },
  { label: 'Tasks', path: '/tasks', icon: <CheckSquare className="h-5 w-5" /> },
  { label: 'Board', path: '/board', icon: <Columns3 className="h-5 w-5" /> },
  { label: 'Users', path: '/users', icon: <Users className="h-5 w-5" /> },
  { label: 'Roles', path: '/roles', icon: <Shield className="h-5 w-5" /> },
  { label: 'Settings', path: '/settings', icon: <Settings className="h-5 w-5" /> },
];

interface SidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
  className?: string;
}

export function Sidebar({ collapsed, onToggle, className }: SidebarProps) {
  return (
    <aside className={cn(
      'flex flex-col h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 transition-all duration-300',
      collapsed ? 'w-16' : 'w-60',
      className
    )}>
      <div className="flex items-center justify-between px-4 py-4 border-b border-slate-200 dark:border-slate-700">
        {!collapsed && (
          <span className="text-lg font-bold text-primary-500">TaskManager</span>
        )}
        <button onClick={onToggle} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer">
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>
      <nav className="flex-1 p-2 space-y-1">
        {navItems.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
              isActive
                ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100',
              collapsed && 'justify-center px-2'
            )}
          >
            {item.icon}
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
