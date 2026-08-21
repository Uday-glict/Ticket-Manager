import { InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '../../utils/cn';
import { Check } from 'lucide-react';

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, error, checked, className, id, ...props }, ref) => {
    const checkboxId = id || label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="flex items-start gap-2">
        <div className="relative flex items-center">
          <input
            ref={ref}
            type="checkbox"
            id={checkboxId}
            checked={checked}
            className="peer sr-only"
            {...props}
          />
          <div className={cn(
            'w-5 h-5 rounded border-2 border-slate-300 dark:border-slate-600 transition-colors duration-200 cursor-pointer',
            'peer-checked:bg-primary-500 peer-checked:border-primary-500 peer-focus:ring-2 peer-focus:ring-primary-500',
            error && 'border-red-500'
          )}>
            <Check className="h-3.5 w-3.5 text-white absolute top-0.5 left-0.5 opacity-0 peer-checked:opacity-100 transition-opacity" />
          </div>
        </div>
        {label && (
          <label htmlFor={checkboxId} className="text-sm text-slate-700 dark:text-slate-300 cursor-pointer select-none">
            {label}
          </label>
        )}
        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>
    );
  }
);
Checkbox.displayName = 'Checkbox';
