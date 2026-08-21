import { forwardRef } from 'react';
import { cn } from '../../utils/cn';

interface SwitchProps {
  label?: string;
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  id?: string;
}

export const Switch = forwardRef<HTMLButtonElement, SwitchProps>(
  ({ label, checked = false, onChange, disabled, id }, ref) => {
    const switchId = id || label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="flex items-center gap-2">
        <button
          ref={ref}
          id={switchId}
          type="button"
          role="switch"
          aria-checked={checked}
          disabled={disabled}
          onClick={() => onChange?.(!checked)}
          className={cn(
            'relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 cursor-pointer',
            checked ? 'bg-primary-500' : 'bg-slate-300 dark:bg-slate-600',
            disabled ? 'opacity-50 cursor-not-allowed' : ''
          )}
        >
          <span
            className={cn(
              'inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200',
              checked ? 'translate-x-6' : 'translate-x-1'
            )}
          />
        </button>
        {label && (
          <label htmlFor={switchId} className="text-sm text-slate-700 dark:text-slate-300 cursor-pointer select-none">
            {label}
          </label>
        )}
      </div>
    );
  }
);
Switch.displayName = 'Switch';
