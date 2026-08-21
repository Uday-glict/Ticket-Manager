import { InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '../../utils/cn';

interface RadioProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
}

export const Radio = forwardRef<HTMLInputElement, RadioProps>(
  ({ label, error, checked, className, id, ...props }, ref) => {
    const radioId = id || label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="flex items-start gap-2">
        <div className="relative flex items-center">
          <input
            ref={ref}
            type="radio"
            id={radioId}
            checked={checked}
            className="peer sr-only"
            {...props}
          />
          <div className={cn(
            'w-5 h-5 rounded-full border-2 border-slate-300 dark:border-slate-600 transition-colors duration-200 cursor-pointer',
            'peer-checked:border-primary-500 peer-focus:ring-2 peer-focus:ring-primary-500',
            error && 'border-red-500'
          )}>
            <div className={cn(
              'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-primary-500 transition-opacity duration-200',
              checked ? 'opacity-100' : 'opacity-0'
            )} />
          </div>
        </div>
        {label && (
          <label htmlFor={radioId} className="text-sm text-slate-700 dark:text-slate-300 cursor-pointer select-none">
            {label}
          </label>
        )}
        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>
    );
  }
);
Radio.displayName = 'Radio';
