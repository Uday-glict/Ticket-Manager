import { ReactNode } from 'react';
import { cn } from '../../utils/cn';

interface KanbanColumnProps {
  title: string;
  count: number;
  color?: string;
  children: ReactNode;
  className?: string;
}

export function KanbanColumn({ title, count, color, children, className }: KanbanColumnProps) {
  return (
    <div className={cn('flex flex-col min-w-[280px] max-w-[320px] bg-slate-50 dark:bg-slate-900/50 rounded-xl', className)}>
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          {color && <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />}
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
        </div>
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded-full">
          {count}
        </span>
      </div>
      <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-2 min-h-[200px]">
        {children}
      </div>
    </div>
  );
}
