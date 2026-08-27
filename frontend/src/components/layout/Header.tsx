import { Search, Bell, Sun, Moon, LogOut, User } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { Avatar } from '../common/Avatar';
import { Dropdown } from '../common/Dropdown';
import { SearchBox } from '../common/SearchBox';
import { Badge } from '../common/Badge';

interface HeaderProps {
  userName?: string;
  onLogout?: () => void;
  className?: string;
}

export function Header({ userName = 'User', onLogout, className }: HeaderProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className={`flex items-center justify-between px-6 py-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 ${className}`}>
      <div className="flex-1 max-w-md">
        <SearchBox value="" placeholder="Search projects, tasks..." onChange={() => {}} />
      </div>
      <div className="flex items-center gap-4">
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>
        <button className="relative p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer" title="Notifications">
          <Bell className="h-5 w-5" />
        </button>
        <Dropdown
          trigger={<Avatar name={userName} size="sm" className="cursor-pointer" />}
          items={[
            { label: 'Profile', icon: <User className="h-4 w-4" />, onClick: () => {} },
            { label: 'Logout', icon: <LogOut className="h-4 w-4" />, onClick: onLogout || (() => {}), danger: true },
          ]}
        />
      </div>
    </header>
  );
}
