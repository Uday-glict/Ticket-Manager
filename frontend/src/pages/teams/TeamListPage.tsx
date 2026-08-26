import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Plus, Users, Edit, Trash2, UserMinus } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { MultiSelect } from '../../components/common/MultiSelect';
import { Avatar } from '../../components/common/Avatar';
import { Badge } from '../../components/common/Badge';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { EmptyState } from '../../components/common/EmptyState';
import { SearchBox } from '../../components/common/SearchBox';
import { DataToolbar } from '../../components/common/DataToolbar';
import { ViewToggle, type ViewMode } from '../../components/common/ViewToggle';
import { projectService } from '../../services/projectService';
import { userService } from '../../services/userService';
import { teamService } from '../../services/teamService';
import { useToast } from '../../context/ToastContext';
import apiClient, { getErrorMessage } from '../../api/apiClient';
import { mapProject, mapUser, mapTeam } from '../../utils/mappers';
import type { Team, Project, User } from '../../types';

export default function TeamListPage() {
  const { projectId: paramId } = useParams();
  const { success: showSuccess, error: showError } = useToast();
  const fetchSeq = useRef(0);
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState(paramId || '');
  const [users, setUsers] = useState<User[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<Team | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Team | null>(null);
  const [viewTeam, setViewTeam] = useState<Team | null>(null);
  const [viewMembers, setViewMembers] = useState<User[]>([]);
  const [form, setForm] = useState({ name: '', description: '', memberIds: [] as string[] });
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  useEffect(() => {
    Promise.all([projectService.list(), userService.list().catch(() => ({ data: { data: [] } }))]).then(([pRes, uRes]) => {
      const plist = (pRes.data.data || pRes.data || []).map(mapProject);
      setProjects(plist);
      setUsers((uRes.data.data || uRes.data || []).map(mapUser));
      if (!paramId && plist[0]) setProjectId(plist[0].id);
    }).catch(e => showError(getErrorMessage(e)));
  }, []);

  const hydrateMembers = useCallback(async (list: Team[]): Promise<Team[]> => {
    return Promise.all(list.map(async t => {
      try {
        const res = await teamService.listMembers(t.id);
        const ids: string[] = (res.data.data || res.data || []).map((m: any) => m.user_id || m.userId || m.id);
        return { ...t, memberIds: ids };
      } catch { return { ...t, memberIds: [] }; }
    }));
  }, []);

  const fetchTeams = useCallback(async () => {
    if (!projectId) return;
    const seq = ++fetchSeq.current;
    setLoading(true);
    try {
      const res = await teamService.list(projectId);
      const raw = (res.data.data || res.data || []).map(mapTeam);
      const hydrated = await hydrateMembers(raw);
      if (seq !== fetchSeq.current) return;
      setTeams(hydrated);
    } catch (e) { if (seq === fetchSeq.current) showError(getErrorMessage(e)); } finally { if (seq === fetchSeq.current) setLoading(false); }
  }, [projectId, hydrateMembers]);

  useEffect(() => { fetchTeams(); }, [fetchTeams]);

  const userById = (id: string) => users.find(u => u.id === id);

  const openCreate = () => { setEditing(null); setForm({ name: '', description: '', memberIds: [] }); setShowCreate(true); };
  const openEdit = (t: Team) => { setEditing(t); setForm({ name: t.name, description: t.description || '', memberIds: [...t.memberIds] }); setShowCreate(true); };

  const handleSave = async () => {
    if (!form.name.trim()) { showError('Team name is required'); return; }
    try {
      if (editing) {
        const res = await teamService.update(editing.id, { name: form.name, description: form.description || undefined });
        showSuccess((res.data as any)?.message || 'Team updated');
      } else {
        const res = await teamService.create(projectId, { name: form.name, description: form.description || undefined });
        const newId = (res.data.data || res.data)?.id;
        const failed: string[] = [];
        for (const uid of form.memberIds) {
          try { await apiClient.post(`/teams/${newId}/members`, { user_id: uid }); }
          catch { failed.push(userById(uid)?.name || uid); }
        }
        showSuccess(((res.data as any)?.message || 'Team created') + (failed.length ? ` (failed to add: ${failed.join(', ')})` : ''));
      }
      setShowCreate(false);
      fetchTeams();
    } catch (e) { showError(getErrorMessage(e)); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try { const res = await teamService.delete(deleteTarget.id); showSuccess((res.data as any)?.message || 'Team deleted'); setDeleteTarget(null); fetchTeams(); }
    catch (e) { showError(getErrorMessage(e)); }
  };

  const openView = async (t: Team) => {
    setViewTeam(t);
    try {
      const res = await teamService.listMembers(t.id);
      const ids: string[] = (res.data.data || res.data || []).map((m: any) => m.user_id || m.userId || m.id);
      setViewMembers(ids.map(id => userById(id)).filter(Boolean) as User[]);
    } catch { setViewMembers([]); }
  };

  const refreshView = async (teamId: string) => {
    const res = await teamService.get(teamId);
    const updated = mapTeam(res.data.data || res.data);
    const mRes = await teamService.listMembers(teamId);
    const ids: string[] = (mRes.data.data || mRes.data || []).map((m: any) => m.user_id || m.userId || m.id);
    updated.memberIds = ids;
    setViewTeam(updated);
    setViewMembers(ids.map(id => userById(id)).filter(Boolean) as User[]);
    fetchTeams();
  };

  const handleRemoveMember = async (teamId: string, userId: string) => {
    try { await apiClient.delete(`/teams/${teamId}/members/${userId}`); showSuccess('Member removed'); await refreshView(teamId); }
    catch (e) { showError(getErrorMessage(e)); }
  };

  const handleAddMember = async (teamId: string, userId: string) => {
    try { await apiClient.post(`/teams/${teamId}/members`, { user_id: userId }); showSuccess('Member added'); await refreshView(teamId); }
    catch (e) { showError(getErrorMessage(e)); }
  };

  const project = projects.find(p => p.id === projectId);
  const userOptions = users.map(u => ({ value: u.id, label: u.name }));

  const filtered = teams.filter(t => {
    if (!search) return true;
    const q = search.toLowerCase();
    return t.name.toLowerCase().includes(q) || (t.description || '').toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Teams</h1>
      <p className="text-sm text-slate-500">Project: {project?.name || '—'}</p>

      <DataToolbar
        search={<SearchBox value={search} onChange={setSearch} placeholder="Search teams..." />}
        filters={<Select options={projects.map(p => ({ value: p.id, label: p.name }))} value={projectId} onChange={e => setProjectId(e.target.value)} className="w-56" />}
        actions={<Button onClick={openCreate}><Plus className="h-4 w-4" />Create Team</Button>}
      />

      <div className="flex justify-end">
        <ViewToggle value={viewMode} onChange={setViewMode} options={['grid', 'table']} />
      </div>

      {loading ? <div className="py-20 text-center text-slate-400">Loading teams...</div> :
        filtered.length === 0 ? <EmptyState title="No teams" description="Create your first team" /> :
        viewMode === 'table' ? (
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Members</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Status</th>
                    <th className="w-24"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {filtered.map(team => (
                    <tr key={team.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-900 dark:text-white">{team.name}</p>
                        <p className="text-xs text-slate-500 truncate max-w-[240px]">{team.description || 'No description'}</p>
                      </td>
                      <td className="px-4 py-3"><span className="flex items-center gap-1 text-sm text-slate-500"><Users className="h-4 w-4" />{team.memberIds.length}</span></td>
                      <td className="px-4 py-3"><Badge variant="success">{team.status}</Badge></td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" onClick={() => openView(team)}>View</Button>
                          <Button variant="ghost" size="sm" onClick={() => openEdit(team)}><Edit className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(team)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map(team => (
              <div key={team.id} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-5 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white">{team.name}</h3>
                    <p className="text-sm text-slate-500 line-clamp-2">{team.description || 'No description'}</p>
                  </div>
                  <Badge variant="success">{team.status}</Badge>
                </div>
                <div className="flex -space-x-2">
                  {team.memberIds.slice(0, 5).map(id => { const u = userById(id); return <Avatar key={id} name={u?.name || id} src={u?.avatar} size="sm" className="ring-2 ring-white" />; })}
                  {team.memberIds.length > 5 && <span className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center text-xs">+{team.memberIds.length - 5}</span>}
                  <span className="ml-3 text-sm text-slate-500 flex items-center gap-1"><Users className="h-4 w-4" />{team.memberIds.length} Members</span>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" onClick={() => openView(team)}>View</Button>
                  <Button variant="ghost" size="sm" onClick={() => openEdit(team)}><Edit className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(team)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                </div>
              </div>
            ))}
          </div>
        )}

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title={editing ? 'Edit Team' : 'Create Team'}>
        <div className="space-y-4">
          <Input label="Team Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required placeholder="Development Team" />
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Description</label>
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Backend and frontend team" rows={3} className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm" />
          </div>
          {!editing && <MultiSelect options={userOptions} value={form.memberIds} onChange={v => setForm({ ...form, memberIds: v })} placeholder="Select members" />}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={handleSave}>{editing ? 'Save' : 'Create Team'}</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!viewTeam} onClose={() => setViewTeam(null)} title={viewTeam?.name || 'Team Details'} size="lg">
        {viewTeam && (
          <div className="space-y-4">
            <p className="text-sm text-slate-600 dark:text-slate-400">{viewTeam.description}</p>
            <div>
              <h4 className="text-sm font-semibold mb-2">Members</h4>
              <div className="space-y-2">
                {viewMembers.map(u => (
                  <div key={u.id} className="flex items-center gap-3 p-2 rounded-lg bg-slate-50 dark:bg-slate-800">
                    <Avatar name={u.name} src={u.avatar} size="sm" />
                    <span className="flex-1 text-sm font-medium">{u.name}</span>
                    <button onClick={() => handleRemoveMember(viewTeam.id, u.id)} className="p-1 hover:text-red-500"><UserMinus className="h-4 w-4" /></button>
                  </div>
                ))}
                {viewMembers.length === 0 && <p className="text-sm text-slate-400">No members yet</p>}
              </div>
            </div>
            <div className="flex gap-2">
              <Select options={userOptions.filter(o => !viewTeam.memberIds.includes(o.value))} value="" onChange={e => { if (e.target.value) handleAddMember(viewTeam.id, e.target.value); }} placeholder="Add member..." />
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} title="Delete Team" message={`Delete "${deleteTarget?.name}"?`} confirmLabel="Delete" />
    </div>
  );
}
