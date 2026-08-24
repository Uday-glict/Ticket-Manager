import { useState } from 'react';
import { Plus, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { Switch } from '../../components/common/Switch';
import type { ProjectStatus } from '../../types';

interface ProjectStatusConfigProps {
  statuses: ProjectStatus[];
  onChange: (statuses: ProjectStatus[]) => void;
  className?: string;
}

export function ProjectStatusConfig({ statuses, onChange, className }: ProjectStatusConfigProps) {
  const addStatus = () => {
    const newId = `status-${Date.now()}`;
    onChange([
      ...statuses,
      { id: newId, name: '', color: '#3b82f6', order: statuses.length, enabled: true },
    ]);
  };

  const removeStatus = (id: string) => {
    onChange(statuses.filter(s => s.id !== id));
  };

  const updateStatus = (id: string, field: keyof ProjectStatus, value: any) => {
    onChange(statuses.map(s => (s.id === id ? { ...s, [field]: value } : s)));
  };

  const moveStatus = (id: string, direction: 'up' | 'down') => {
    const idx = statuses.findIndex(s => s.id === id);
    if (idx === -1) return;
    if (direction === 'up' && idx === 0) return;
    if (direction === 'down' && idx === statuses.length - 1) return;
    const copy = [...statuses];
    const swap = direction === 'up' ? idx - 1 : idx + 1;
    [copy[idx], copy[swap]] = [copy[swap], copy[idx]];
    copy.forEach((s, i) => (s.order = i));
    onChange(copy);
  };

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          Project Statuses
        </h3>
        <Button variant="outline" size="sm" onClick={addStatus}>
          <Plus className="h-4 w-4" />
          Add Status
        </Button>
      </div>
      <div className="space-y-2">
        {statuses.map((s, idx) => (
          <div
            key={s.id}
            className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700"
          >
            <div className="flex flex-col gap-0.5">
              <button
                onClick={() => moveStatus(s.id, 'up')}
                disabled={idx === 0}
                className="p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 disabled:opacity-30 cursor-pointer"
              >
                <ChevronUp className="h-3 w-3" />
              </button>
              <button
                onClick={() => moveStatus(s.id, 'down')}
                disabled={idx === statuses.length - 1}
                className="p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 disabled:opacity-30 cursor-pointer"
              >
                <ChevronDown className="h-3 w-3" />
              </button>
            </div>
            <input
              type="color"
              value={s.color}
              onChange={e => updateStatus(s.id, 'color', e.target.value)}
              className="h-8 w-8 rounded cursor-pointer border-0"
            />
            <input
              type="text"
              value={s.name}
              onChange={e => updateStatus(s.id, 'name', e.target.value)}
              placeholder="Status name"
              className="flex-1 px-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-text"
            />
            <Switch
              checked={s.enabled}
              onChange={checked => updateStatus(s.id, 'enabled', checked)}
            />
            <button
              onClick={() => removeStatus(s.id)}
              className="p-1 text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
        {statuses.length === 0 && (
          <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-6">
            No statuses configured. Add one to get started.
          </p>
        )}
      </div>
    </div>
  );
}

export default ProjectStatusConfig;

