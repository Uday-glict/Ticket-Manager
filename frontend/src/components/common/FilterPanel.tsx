import { useState } from 'react';
import { cn } from '../../utils/cn';
import { ChevronDown, X } from 'lucide-react';
import { Button } from './Button';

interface Filter {
  key: string;
  label: string;
  options: { value: string; label: string }[];
}

interface FilterPanelProps {
  filters: Filter[];
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
  onClear: () => void;
  className?: string;
}

export function FilterPanel({ filters, values, onChange, onClear, className }: FilterPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const hasFilters = Object.values(values).some(v => v);

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
          className="cursor-pointer"
        >
          <ChevronDown className={cn('h-4 w-4 transition-transform', isOpen && 'rotate-180')} />
          Filters
        </Button>
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={onClear} className="cursor-pointer">
            <X className="h-4 w-4" />
            Clear
          </Button>
        )}
      </div>
      {isOpen && (
        <div className="flex flex-wrap gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
          {filters.map(filter => (
            <div key={filter.key} className="space-y-1">
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400">{filter.label}</label>
              <select
                value={values[filter.key] || ''}
                onChange={e => onChange(filter.key, e.target.value)}
                className="block w-40 h-8 px-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer"
              >
                <option value="">All</option>
                {filter.options.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
