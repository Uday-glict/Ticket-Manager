import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

export function Breadcrumb() {
  const location = useLocation();
  const paths = location.pathname.split('/').filter(Boolean);

  if (paths.length === 0) return null;

  return (
    <nav className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 px-6 py-3">
      <Link to="/dashboard" className="hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer">
        <Home className="h-4 w-4" />
      </Link>
      {paths.map((path, idx) => (
        <span key={idx} className="flex items-center gap-2">
          <ChevronRight className="h-4 w-4" />
          <span className="capitalize">{path.replace(/-/g, ' ')}</span>
        </span>
      ))}
    </nav>
  );
}
