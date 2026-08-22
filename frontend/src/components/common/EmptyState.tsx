import { ReactNode } from 'react';
import { cn } from '../../utils/cn';
import { Inbox } from 'lucide-react';
import { Button } from './Button';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({ icon, title, description, actionLabel, onAction, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-12 text-center', className)}>
      <div className="p-4 rounded-full bg-slate-100 dark:bg-slate-800 mb-4">
        {icon || <Inbox className="h-8 w-8 text-slate-400" />}
      </div>
      <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-1">{title}</h3>
      {description && <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 max-w-sm">{description}</p>}
      {actionLabel && onAction && (
        <Button onClick={onAction} className="cursor-pointer">{actionLabel}</Button>
      )}
    </div>
  );
}
