import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { DatePicker } from '../../components/common/DatePicker';
import { Select } from '../../components/common/Select';
import { Avatar } from '../../components/common/Avatar';
import { Switch } from '../../components/common/Switch';
import { mockUsers, mockRoles } from '../../utils/mockData';
import type { ProjectStatus, ProjectMember } from '../../types';

const DEFAULT_STATUSES: ProjectStatus[] = [
  { id: 'new-1', name: 'Started', color: '#94a3b8', order: 0, enabled: true },
  { id: 'new-2', name: 'In Progress', color: '#3b82f6', order: 1, enabled: true },
  { id: 'new-3', name: 'Testing', color: '#f59e0b', order: 2, enabled: true },
  { id: 'new-4', name: 'Completed', color: '#22c55e', order: 3, enabled: true },
];

export default function CreateProjectPage() {
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [statuses, setStatuses] = useState<ProjectStatus[]>(DEFAULT_STATUSES);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Project name is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    // Mock creation - in real app would call API
    navigate('/projects');
  };

  const addMember = () => {
    const available = mockUsers.filter(u => !members.some(m => m.userId === u.id));
    if (available.length > 0) {
      setMembers([...members, { userId: available[0].id, roleId: mockRoles[1]?.id ?? mockRoles[0].id }]);
    }
  };

  const removeMember = (userId: string) => {
    setMembers(members.filter(m => m.userId !== userId));
  };

  const updateMemberRole = (userId: string, roleId: string) => {
    setMembers(members.map(m => m.userId === userId ? { ...m, roleId } : m));
  };

  const addStatus = () => {
    const newId = `status-${Date.now()}`;
    setStatuses([
      ...statuses,
      { id: newId, name: '', color: '#3b82f6', order: statuses.length, enabled: true },
    ]);
  };

  const removeStatus = (id: string) => {
    setStatuses(statuses.filter(s => s.id !== id));
  };

  const updateStatus = (id: string, field: keyof ProjectStatus, value: any) => {
    setStatuses(statuses.map(s => s.id === id ? { ...s, [field]: value } : s));
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
    setStatuses(copy);
  };

  const availableUsers = mockUsers.filter(u => !members.some(m => m.userId === u.id));

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Create Project</h1>
      </div>

      {/* Basic Information */}
      <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6 space-y-4">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Basic Information</h2>
        <Input
          label="Project Name"
          required
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Enter project name"
          error={errors.name}
        />
        <div className="w-full">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Description</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Describe the project..."
            rows={4}
            className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors text-sm resize-none cursor-text"
          />
        </div>
      </section>

      {/* Timeline */}
      <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Timeline</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <DatePicker
            label="Start Date"
            value={startDate}
            onChange={setStartDate}
          />
          <DatePicker
            label="End Date"
            value={endDate}
            onChange={setEndDate}
          />
        </div>
      </section>

      {/* Project Members */}
      <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6 space-y-4">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Project Members</h2>
        {members.length > 0 && (
          <div className="space-y-3">
            {members.map(m => {
              const user = mockUsers.find(u => u.id === m.userId);
              if (!user) return null;
              return (
                <div key={m.userId} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                  <Avatar src={user.avatar} name={user.name} size="sm" />
                  <span className="flex-1 text-sm font-medium text-slate-900 dark:text-slate-100">{user.name}</span>
                  <select
                    value={m.roleId}
                    onChange={e => updateMemberRole(m.userId, e.target.value)}
                    className="px-2 py-1 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 cursor-pointer"
                  >
                    {mockRoles.map(r => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => removeMember(m.userId)}
                    className="p-1 text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
        {availableUsers.length > 0 && (
          <Select
            placeholder="Add a member..."
            options={availableUsers.map(u => ({ value: u.id, label: u.name }))}
            value=""
            onChange={e => {
              if (e.target.value) {
                setMembers([...members, { userId: e.target.value, roleId: mockRoles[1]?.id ?? mockRoles[0].id }]);
              }
            }}
          />
        )}
      </section>

      {/* Status Configuration */}
      <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Project Status Configuration</h2>
          <Button variant="outline" size="sm" onClick={addStatus}>
            <Plus className="h-4 w-4" />
            Add Status
          </Button>
        </div>
        <div className="space-y-3">
          {statuses.map((s, idx) => (
            <div key={s.id} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
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
        </div>
      </section>

      {/* Save */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={() => navigate(-1)}>
          Cancel
        </Button>
        <Button onClick={handleSave}>
          Save Project
        </Button>
      </div>
    </div>
  );
}
