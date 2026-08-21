import { cn } from '../../utils/cn';
import { Avatar } from './Avatar';
import { Badge } from './Badge';
import { Calendar, GripVertical } from 'lucide-react';
import type { Task, Priority } from '../../types';

interface KanbanCardProps {
  task: Task;
  assigneeName?: string;
  onClick?: () => void;
  dragHandleProps?: Record<string, any>;
  className?: string;
}

const priorityConfig: Record<Priority, { label: string; variant: 'danger' | 'warning' | 'info' | 'default' }> = {
  urgent: { label: 'Urgent', variant: 'danger' },
  high: { label: 'High', variant: 'warning' },
  medium: { label: 'Medium', variant: 'info' },
  low: { label: 'Low', variant: 'default' },
};

export function KanbanCard({ task, assigneeName, onClick, dragHandleProps, className }: KanbanCardProps) {
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date();
  const priority = priorityConfig[task.priority];

  return (
    <div
      className={cn(
        'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div {...dragHandleProps} className="mt-0.5 cursor-grab active:cursor-grabbing">
          <GripVertical className="h-4 w-4 text-slate-400" />
        </div>
        <Badge variant={priority.variant}>{priority.label}</Badge>
      </div>
      <h4 className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-2 line-clamp-2">{task.title}</h4>
      <div className="flex items-center justify-between">
        {assigneeName && (
          <Avatar name={assigneeName} size="sm" />
        )}
        {task.dueDate && (
          <span className={cn(
            'flex items-center gap-1 text-xs',
            isOverdue ? 'text-red-500' : 'text-slate-500 dark:text-slate-400'
          )}>
            <Calendar className="h-3 w-3" />
            {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
        )}
      </div>
    </div>
  );
}
