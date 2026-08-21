import { cn } from '../../utils/cn';
import { Loader2 } from 'lucide-react';

interface LoaderProps {
  size?: 'sm' | 'md' | 'lg';
  message?: string;
  className?: string;
}

const sizes = { sm: 'h-4 w-4', md: 'h-8 w-8', lg: 'h-12 w-12' };

export function Loader({ size = 'md', message, className }: LoaderProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3', className)}>
      <Loader2 className={cn('animate-spin text-primary-500', sizes[size])} />
      {message && <p className="text-sm text-slate-500 dark:text-slate-400">{message}</p>}
    </div>
  );
}
