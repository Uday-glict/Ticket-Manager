import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { projectService } from '../../services/projectService';
import { taskService } from '../../services/taskService';
import { userService } from '../../services/userService';
import { useToast } from '../../context/ToastContext';
import type { Priority, Project, User } from '../../types';
import { mapProject, mapUser } from '../../utils/mappers';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { DatePicker } from '../../components/common/DatePicker';

const priorityOptions = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

export default function CreateTaskPage() {
  const navigate = useNavigate();
  const { error: showError } = useToast();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [projectId, setProjectId] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [statusId, setStatusId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    Promise.all([
      projectService.list(),
      userService.list(),
    ]).then(([projectsRes, usersRes]) => {
      setProjects((projectsRes.data.data || projectsRes.data || []).map(mapProject));
      setUsers((usersRes.data.data || usersRes.data || []).map(mapUser));
    }).catch(() => {});
  }, []);

  const selectedProject = projects.find(p => p.id === projectId);

  const statusOptions = useMemo(() => {
    if (!selectedProject) return [];
    return selectedProject.statuses
      .filter(s => s.enabled)
      .sort((a, b) => a.order - b.order)
      .map(s => ({ value: s.id, label: s.name }));
  }, [selectedProject]);

  const handleProjectChange = (value: string) => {
    setProjectId(value);
    setStatusId('');
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!title.trim()) newErrors.title = 'Title is required';
    if (!projectId) newErrors.projectId = 'Project is required';
    if (!statusId) newErrors.statusId = 'Status is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      await taskService.create({
        title: title.trim(),
        description: description.trim() || undefined,
        project_id: projectId,
        assigned_to: assignedTo || undefined,
        priority,
        status_id: statusId,
        start_date: startDate || undefined,
        due_date: dueDate || undefined,
      });
      navigate('/tasks');
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to create task.';
      showError(message);
      setErrors({ title: message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="cursor-pointer">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Create Task</h1>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-5">
        <Input
          label="Task Title"
          required
          value={title}
          onChange={e => setTitle(e.target.value)}
          error={errors.title}
          placeholder="Enter task title"
        />

        <div className="w-full">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            Description
          </label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={4}
            placeholder="Enter task description"
            className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors text-sm cursor-text resize-none"
          />
        </div>

        <Select
          label="Project"
          required
          options={projects.map(p => ({ value: p.id, label: p.name }))}
          placeholder="Select a project"
          value={projectId}
          onChange={e => handleProjectChange(e.target.value)}
          error={errors.projectId}
        />

        <Select
          label="Assigned User"
          options={users.map(u => ({ value: u.id, label: u.name }))}
          placeholder="Select a user"
          value={assignedTo}
          onChange={e => setAssignedTo(e.target.value)}
        />

        <Select
          label="Priority"
          options={priorityOptions}
          value={priority}
          onChange={e => setPriority(e.target.value as Priority)}
        />

        <Select
          label="Status"
          required
          options={statusOptions}
          placeholder={projectId ? 'Select a status' : 'Select a project first'}
          value={statusId}
          onChange={e => setStatusId(e.target.value)}
          error={errors.statusId}
          disabled={!projectId}
        />

        <DatePicker
          label="Start Date"
          value={startDate}
          onChange={setStartDate}
        />

        <DatePicker
          label="Due Date"
          value={dueDate}
          onChange={setDueDate}
        />

        <div className="flex gap-3 pt-2">
          <Button type="submit">Create Task</Button>
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}

