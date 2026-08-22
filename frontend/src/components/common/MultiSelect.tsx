import { useState, useRef, useEffect } from 'react';
import { cn } from '../../utils/cn';
import { X, ChevronDown } from 'lucide-react';

interface Option {
  value: string;
  label: string;
}

interface MultiSelectProps {
  options: Option[];
  value: string[];
  onChange: (value: string[]) => void;
  label?: string;
  placeholder?: string;
  error?: string;
  className?: string;
}

export function MultiSelect({ options, value, onChange, label, placeholder = 'Select...', error, className }: MultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filtered = options.filter(opt => opt.label.toLowerCase().includes(search.toLowerCase()));
  const selectedLabels = options.filter(opt => value.includes(opt.value)).map(opt => opt.label);

  const toggle = (val: string) => {
    onChange(value.includes(val) ? value.filter(v => v !== val) : [...value, val]);
  };

  return (
    <div className={cn('relative', className)}>
      {label && (
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">{label}</label>
      )}
      <div ref={ref}>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className={cn(
            'w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg border text-left bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer min-h-[42px]',
            error ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'
          )}
        >
          <div className="flex flex-wrap gap-1 flex-1">
            {selectedLabels.length === 0 && <span className="text-slate-400">{placeholder}</span>}
            {selectedLabels.map(label => (
              <span key={label} className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-xs">
                {label}
                <X className="h-3 w-3 cursor-pointer" onClick={(e) => { e.stopPropagation(); toggle(options.find(o => o.label === label)!.value); }} />
              </span>
            ))}
          </div>
          <ChevronDown className={cn('h-4 w-4 text-slate-400 transition-transform', open && 'rotate-180')} />
        </button>
        {open && (
          <div className="absolute top-full mt-1 left-0 right-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-50 max-h-60 overflow-auto">
            <div className="p-2">
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search..."
                className="w-full px-2 py-1.5 text-sm border border-slate-200 dark:border-slate-700 rounded bg-transparent focus:outline-none"
              />
            </div>
            {filtered.map(opt => (
              <button
                key={opt.value}
                onClick={() => toggle(opt.value)}
                className={cn(
                  'w-full px-3 py-2 text-sm text-left hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer',
                  value.includes(opt.value) && 'bg-primary-50 dark:bg-primary-900/20'
                )}
              >
                <div className={cn(
                  'w-4 h-4 rounded border flex items-center justify-center',
                  value.includes(opt.value) ? 'bg-primary-500 border-primary-500' : 'border-slate-300 dark:border-slate-600'
                )}>
                  {value.includes(opt.value) && <span className="text-white text-xs">✓</span>}
                </div>
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
}
