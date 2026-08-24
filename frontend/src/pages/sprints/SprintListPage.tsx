import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Plus, Calendar, Edit, Trash2, Play, CheckCircle } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { DatePicker } from '../../components/common/DatePicker';
import { Badge } from '../../components/common/Badge';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { projectService } from '../../services/projectService';
import { teamService } from '../../services/teamService';
import { sprintService } from '../../services/sprintService';
import { useToast } from '../../context/ToastContext';
import { getErrorMessage } from '../../api/apiClient';
import { mapProject, mapTeam, mapSprint } from '../../utils/mappers';
import type { Sprint, Project, Team } from '../../types';

export default function SprintListPage() {
  const { projectId: paramId } = useParams();
  const { success: showSuccess, error: showError } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState(paramId || '');
  const [teams, setTeams] = useState<Team[]>([]);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<Sprint | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Sprint | null>(null);
  const [form, setForm] = useState({ name: '', goal: '', teamId: '', startDate: '', endDate: '' });

  useEffect(() => {
    projectService.list().then(res => {
      const list = (res.data.data || res.data || []).map(mapProject);
      setProjects(list);
      if (!paramId && list[0]) setProjectId(list[0].id);
    }).catch(e => showError(getErrorMessage(e)));
  }, []);

  const fetchSprints = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const [spRes, tmRes] = await Promise.all([
        sprintService.list(projectId),
        teamService.list(projectId).catch(() => ({ data: { data: [] } })),
      ]);
      setSprints((spRes.data.data || spRes.data || []).map(mapSprint));
      setTeams((tmRes.data.data || tmRes.data || []).map(mapTeam));
    } catch (e) { showError(getErrorMessage(e)); } finally { setLoading(false); }
  }, [projectId]);

  useEffect(() => { fetchSprints(); }, [fetchSprints]);

  const openCreate = () => { setEditing(null); setForm({ name: '', goal: '', teamId: '', startDate: '', endDate: '' }); setShowCreate(true); };
  const openEdit = (s: Sprint) => { setEditing(s); setForm({ name: s.name, goal: s.goal || '', teamId: s.teamId || '', startDate: s.startDate, endDate: s.endDate }); setShowCreate(true); };

  const handleSave = async () => {
    if (!form.name || !form.startDate || !form.endDate) { showError('Name, start date and end date are required'); return; }
    if (new Date(form.endDate) < new Date(form.startDate)) { showError('End date cannot be before start date'); return; }
    try {
      const payload = { name: form.name, goal: form.goal || undefined, team_id: form.teamId || undefined, start_date: form.startDate, end_date: form.endDate };
      const res = editing ? await sprintService.update(editing.id, payload) : await sprintService.create(projectId, payload);
      showSuccess((res.data as any)?.message || (editing ? 'Sprint updated' : 'Sprint created'));
      setShowCreate(false); setEditing(null);
      fetchSprints();
    } catch (e) { showError(getErrorMessage(e)); }
  };

  const handleStart = async (s: Sprint) => {
    try { const res = await sprintService.start(s.id); showSuccess((res.data as any)?.message || 'Sprint started'); fetchSprints(); }
    catch (e) { showError(getErrorMessage(e)); }
  };
  const handleComplete = async (s: Sprint) => {
    try { const res = await sprintService.complete(s.id); showSuccess((res.data as any)?.message || 'Sprint completed'); fetchSprints(); }
    catch (e) { showError(getErrorMessage(e)); }
  };
  const handleDelete = async () => {
    if (!deleteTarget) return;
    try { const res = await sprintService.delete(deleteTarget.id); showSuccess((res.data as any)?.message || 'Sprint deleted'); setDeleteTarget(null); fetchSprints(); }
    catch (e) { showError(getErrorMessage(e)); }
  };

  const project = projects.find(p => p.id === projectId);
  const teamOptions = teams.map(t => ({ value: t.id, label: t.name }));
  const teamName = (id?: string | null) => teams.find(t => t.id === id)?.name;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Sprints</h1>
          <p className="text-sm text-slate-500">Project: {project?.name || '—'}</p>
        </div>
        <div className="flex gap-3">
          <Select options={projects.map(p => ({ value: p.id, label: p.name }))} value={projectId} onChange={e => setProjectId(e.target.value)} className="w-56" />
          <Button onClick={openCreate}><Plus className="h-4 w-4" />Create Sprint</Button>
        </div>
      </div>

      {loading ? <div className="py-20 text-center text-slate-400">Loading sprints...</div> :
        sprints.length === 0 ? <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 py-12 text-center text-slate-400">No sprints found</div> :
        <div className="grid gap-4">
          {sprints.map(s => (
            <div key={s.id} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">{s.name} <Badge variant={s.status === 'ACTIVE' ? 'info' : s.status === 'COMPLETED' ? 'success' : 'default'}>{s.status}</Badge></h3>
                  <p className="text-sm text-slate-500 flex items-center gap-1"><Calendar className="h-3 w-3" />{s.startDate} → {s.endDate}{s.teamId ? ` • ${teamName(s.teamId)}` : ''}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">{s.goal}</p>
                </div>
                <div className="flex gap-2">
                  {s.status === 'PLANNED' && <Button size="sm" variant="outline" onClick={() => handleStart(s)}><Play className="h-4 w-4" />Start</Button>}
                  {s.status === 'ACTIVE' && <Button size="sm" variant="outline" onClick={() => handleComplete(s)}><CheckCircle className="h-4 w-4" />Complete</Button>}
                  <Button size="sm" variant="ghost" onClick={() => openEdit(s)}><Edit className="h-4 w-4" /></Button>
                  <Button size="sm" variant="ghost" onClick={() => setDeleteTarget(s)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      }

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title={editing ? 'Edit Sprint' : 'Create Sprint'}>
        <div className="space-y-4">
          <Input label="Sprint Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
          <Input label="Goal" value={form.goal} onChange={e => setForm({ ...form, goal: e.target.value })} placeholder="Complete payment module" />
          <Select label="Team" options={teamOptions} value={form.teamId} onChange={e => setForm({ ...form, teamId: e.target.value })} placeholder="Select team" />
          <div className="grid grid-cols-2 gap-4">
            <DatePicker label="Start Date" value={form.startDate} onChange={v => setForm({ ...form, startDate: v })} />
            <DatePicker label="End Date" value={form.endDate} onChange={v => setForm({ ...form, endDate: v })} />
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={handleSave}>{editing ? 'Save' : 'Create Sprint'}</Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} title="Delete Sprint" message={`Delete "${deleteTarget?.name}"?`} confirmLabel="Delete" />
    </div>
  );
}
