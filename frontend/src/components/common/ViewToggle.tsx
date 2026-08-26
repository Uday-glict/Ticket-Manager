import { Table2, LayoutGrid, Columns3 } from 'lucide-react';
import { cn } from '../../utils/cn';

export type ViewMode = 'table' | 'grid' | 'board';

interface ViewToggleProps {
  value: ViewMode;
  onChange: (mode: ViewMode) => void;
  options?: ViewMode[];
}

const icons: Record<ViewMode, React.ReactNode> = {
  table: <Table2 className="h-4 w-4" />,
  grid: <LayoutGrid className="h-4 w-4" />,
  board: <Columns3 className="h-4 w-4" />,
};

const labels: Record<ViewMode, string> = {
  table: 'Table',
  grid: 'Grid',
  board: 'Board',
};

export function ViewToggle({ value, onChange, options = ['table', 'grid'] }: ViewToggleProps) {
  return (
    <div className="inline-flex items-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-1 gap-1">
      {options.map(opt => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className={cn(
            'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors cursor-pointer',
            value === opt
              ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
          )}
        >
          {icons[opt]}
          {labels[opt]}
        </button>
      ))}
    </div>
  );
}
