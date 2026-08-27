import { ReactNode } from 'react';

interface DataToolbarProps {
  search?: ReactNode;
  filters?: ReactNode;
  actions?: ReactNode;
}

export function DataToolbar({ search, filters, actions }: DataToolbarProps) {
  return (
    <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
      <div className="flex flex-1 flex-col xl:flex-row gap-3 xl:items-center min-w-0">
        {search && <div className="flex-1 xl:flex-initial xl:w-72 min-w-0">{search}</div>}
        {filters && <div className="flex flex-nowrap items-center gap-2.5 overflow-x-auto scrollbar-none">{filters}</div>}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}
