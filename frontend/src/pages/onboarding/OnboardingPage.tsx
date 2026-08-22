import { useNavigate } from 'react-router-dom';
import { Users, Shield, FolderKanban, Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const cards = [
  {
    title: 'Add Users',
    description: 'Invite your team members',
    icon: Users,
    to: '/users',
  },
  {
    title: 'Create Roles',
    description: 'Set up permissions',
    icon: Shield,
    to: '/roles',
  },
  {
    title: 'Create Your First Project',
    description: 'Start managing tasks',
    icon: FolderKanban,
    to: '/projects/create',
  },
] as const;

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 px-4 py-12">
      <button
        onClick={toggleTheme}
        className="fixed top-4 right-4 p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
        aria-label="Toggle theme"
      >
        {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
      </button>

      <div className="w-full max-w-lg text-center">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
          Welcome to TaskManager
        </h1>
        <p className="mt-2 text-slate-500 dark:text-slate-400">
          Let's get your workspace ready.
        </p>

        <div className="mt-10 grid gap-4">
          {cards.map(({ title, description, icon: Icon, to }) => (
            <button
              key={to}
              onClick={() => navigate(to)}
              className="flex items-center gap-4 w-full p-5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md hover:border-primary-300 dark:hover:border-primary-600 transition-all duration-200 text-left cursor-pointer"
            >
              <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-lg bg-primary-50 dark:bg-primary-900/30 text-primary-500">
                <Icon className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white">{title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">{description}</p>
              </div>
            </button>
          ))}
        </div>

        <button
          onClick={() => navigate('/dashboard')}
          className="mt-8 text-sm text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors cursor-pointer"
        >
          Skip for now
        </button>
      </div>
    </div>
  );
}
