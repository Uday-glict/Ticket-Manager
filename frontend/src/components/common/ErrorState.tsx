import { AlertCircle, RefreshCw } from 'lucide-react';
import { cn } from '../../utils/cn';
import { Button } from './Button';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({ message = 'Something went wrong', onRetry, className }: ErrorStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-12 text-center', className)}>
      <div className="p-4 rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
        <AlertCircle className="h-8 w-8 text-red-500" />
      </div>
      <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-1">{message}</h3>
      {onRetry && (
        <Button variant="outline" onClick={onRetry} className="mt-4 cursor-pointer">
          <RefreshCw className="h-4 w-4" />
          Retry
        </Button>
      )}
    </div>
  );
}
