import { ReactNode } from 'react';

interface DataToolbarProps {
  search?: ReactNode;
  filters?: ReactNode;
  actions?: ReactNode;
}

export function DataToolbar({ search, filters, actions }: DataToolbarProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-1 flex-col sm:flex-row gap-3 sm:items-center min-w-0">
        {search && <div className="flex-1 sm:flex-initial sm:w-80 min-w-0">{search}</div>}
        {filters && <div className="flex flex-wrap items-center gap-3">{filters}</div>}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}
