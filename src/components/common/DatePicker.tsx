import { useState } from 'react';
import { cn } from '../../utils/cn';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

interface DatePickerProps {
  value?: string;
  onChange?: (value: string) => void;
  label?: string;
  error?: string;
  required?: boolean;
  className?: string;
}

export function DatePicker({ value, onChange, label, error, required, className }: DatePickerProps) {
  const [showCalendar, setShowCalendar] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(value ? new Date(value) : new Date());

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  const handleDateClick = (day: number) => {
    const date = new Date(year, month, day);
    onChange?.(date.toISOString().split('T')[0]);
    setShowCalendar(false);
  };

  return (
    <div className={cn('relative', className)}>
      {label && (
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <button
        type="button"
        onClick={() => setShowCalendar(!showCalendar)}
        className={cn(
          'w-full flex items-center gap-2 px-3 py-2 rounded-lg border text-left bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer',
          error ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'
        )}
      >
        <Calendar className="h-4 w-4 text-slate-400" />
        <span className={value ? '' : 'text-slate-400'}>{value || 'Select date'}</span>
      </button>
      {showCalendar && (
        <div className="absolute top-full mt-1 left-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg p-3 z-50">
          <div className="flex items-center justify-between mb-3">
            <button onClick={() => setCurrentMonth(new Date(year, month - 1))} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded cursor-pointer">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm font-medium">{monthNames[month]} {year}</span>
            <button onClick={() => setCurrentMonth(new Date(year, month + 1))} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded cursor-pointer">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
              <div key={d} className="text-center text-xs font-medium text-slate-400 py-1">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} />)}
            {days.map(day => {
              const dateStr = new Date(year, month, day).toISOString().split('T')[0];
              return (
                <button
                  key={day}
                  onClick={() => handleDateClick(day)}
                  className={cn(
                    'w-8 h-8 text-sm rounded-lg transition-colors cursor-pointer',
                    dateStr === value ? 'bg-primary-500 text-white' : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                  )}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      )}
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
}
