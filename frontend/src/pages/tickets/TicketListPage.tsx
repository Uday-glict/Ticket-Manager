import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { MultiSelect } from '../../components/common/MultiSelect';
import { DatePicker } from '../../components/common/DatePicker';
import { Badge } from '../../components/common/Badge';
import { Avatar } from '../../components/common/Avatar';
import { Table } from '../../components/common/Table';
import { ticketService } from '../../services/ticketService';
import { projectService } from '../../services/projectService';
import { teamService } from '../../services/teamService';
import { sprintService } from '../../services/sprintService';
import { userService } from '../../services/userService';
import { useToast } from '../../context/ToastContext';
import { getErrorMessage } from '../../api/apiClient';
import { mapProject, mapTask, mapTeam, mapSprint, mapUser } from '../../utils/mappers';
import type { Ticket, Team, Sprint, Project, User } from '../../types';

export default function TicketListPage() {
  const { projectId: paramId } = useParams();
  const { success: showSuccess, error: showError } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState(paramId || '');
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [teamMembers, setTeamMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', teamId: '', sprintId: '', priority: 'medium' as any, statusId: '', assigneeIds: [] as string[], startDate: '', dueDate: '' });
  const [search, setSearch] = useState('');
  const [filterTeam, setFilterTeam] = useState('');
  const [filterSprint, setFilterSprint] = useState('');

  const fetchProjects = useCallback(async () => {
    try {
      const res = await projectService.list();
      const list = (res.data.data || res.data || []).map(mapProject);
      setProjects(list);
      if (!projectId && list[0]) setProjectId(list[0].id);
      else if (paramId) setProjectId(paramId);
    } catch (e) { showError(getErrorMessage(e)); }
  }, [paramId]);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  const fetchMeta = useCallback(async () => {
    if (!projectId) return;
    try {
      const [teamsRes, sprintsRes, usersRes, projectRes] = await Promise.all([
        teamService.list(projectId).catch(() => ({ data: { data: [] } })),
        sprintService.list(projectId).catch(() => ({ data: { data: [] } })),
        userService.list().catch(() => ({ data: { data: [] } })),
        projectService.get(projectId).catch(() => null),
      ]);
      const tms: Team[] = (teamsRes.data.data || teamsRes.data || []).map(mapTeam);
      const sps: Sprint[] = (sprintsRes.data.data || sprintsRes.data || []).map(mapSprint);
      setTeams(tms);
      setSprints(sps);
      const allUsers: User[] = (usersRes.data.data || usersRes.data || []).map(mapUser);
      if (projectRes) {
        const proj = mapProject(projectRes.data.data || projectRes.data);
        setProjects(prev => {
          const exists = prev.find(p => p.id === proj.id);
          return exists ? prev.map(p => p.id === proj.id ? proj : p) : [...prev, proj];
        });
        const memberIds = proj.members.map(m => m.userId);
        setUsers(allUsers.filter(u => memberIds.includes(u.id)));
      } else {
        setUsers(allUsers);
      }
      if (tms[0] && !form.teamId) setForm(f => ({ ...f, teamId: f.teamId || tms[0].id }));
    } catch (e) { showError(getErrorMessage(e)); }
  }, [projectId]);

  const fetchTickets = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const params: Record<string, string> = { project_id: projectId };
      if (filterTeam) params.team_id = filterTeam;
      if (filterSprint) params.sprint_id = filterSprint;
      const res = await ticketService.listTickets(params);
      const raw = res.data.data || res.data || [];
      const list = Array.isArray(raw) ? raw.map((r: any) => mapTask(r) as Ticket) : [];
      setTickets(list);
    } catch (e) { showError(getErrorMessage(e)); } finally { setLoading(false); }
  }, [projectId, filterTeam, filterSprint]);

  useEffect(() => { if (projectId) fetchMeta(); }, [fetchMeta]);
  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  useEffect(() => {
    if (!form.teamId) { setTeamMembers(users); return; }
    teamService.listMembers(form.teamId).then(res => {
      const ids: string[] = (res.data.data || res.data || []).map((m: any) => m.user_id || m.userId || m.id);
      setTeamMembers(users.filter(u => ids.includes(u.id)));
    }).catch(() => setTeamMembers(users));
  }, [form.teamId, users]);

  const project = projects.find(p => p.id === projectId);
  const statusOptions = project?.statuses.filter(s => s.enabled).map(s => ({ value: s.id, label: s.name })) || [];
  const teamOptions = teams.map(t => ({ value: t.id, label: t.name }));
  const sprintOptions = sprints.filter(s => !form.teamId || !s.teamId || s.teamId === form.teamId).map(s => ({ value: s.id, label: s.name }));
  const userOptions = teamMembers.map(u => ({ value: u.id, label: u.name }));
  const assigneeMap = useMemo(() => new Map(users.map(u => [u.id, u])), [users]);

  const filtered = useMemo(() => {
    if (!search) return tickets;
    const q = search.toLowerCase();
    return tickets.filter(t => t.title.toLowerCase().includes(q) || (t.ticketKey || '').toLowerCase().includes(q));
  }, [tickets, search]);

  const handleCreate = async () => {
    if (!form.title || !form.statusId) { showError('Title and Status are required'); return; }
    if (form.sprintId) {
      const sp = sprints.find(s => s.id === form.sprintId);
      if (sp && sp.projectId !== projectId) { showError('Sprint does not belong to selected project'); return; }
    }
    try {
      const payload: Record<string, unknown> = {
        title: form.title,
        description: form.description || undefined,
        project_id: projectId,
        team_id: form.teamId || undefined,
        sprint_id: form.sprintId || undefined,
        status_id: form.statusId,
        priority: form.priority,
        assignee_ids: form.assigneeIds,
        start_date: form.startDate || undefined,
        due_date: form.dueDate || undefined,
      };
      const res = await ticketService.createTicket(payload);
      showSuccess((res.data as any)?.message || 'Ticket created');
      setShowCreate(false);
      setForm({ title: '', description: '', teamId: teams[0]?.id || '', sprintId: '', priority: 'medium', statusId: '', assigneeIds: [], startDate: '', dueDate: '' });
      fetchTickets();
    } catch (e) { showError(getErrorMessage(e)); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Tickets</h1>
          <p className="text-sm text-slate-500">Project: {project?.name || '—'}</p>
        </div>
        <div className="flex gap-3">
          <Select options={projects.map(p => ({ value: p.id, label: p.name }))} value={projectId} onChange={e => { setProjectId(e.target.value); setFilterTeam(''); setFilterSprint(''); }} className="w-56" />
          <Button onClick={() => setShowCreate(true)}><Plus className="h-4 w-4" />Create Ticket</Button>
        </div>
      </div>
      <div className="flex gap-3 flex-wrap">
        <div className="flex-1 max-w-md relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tickets..." className="w-full pl-10 pr-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm" />
        </div>
        <Select options={[{ value: '', label: 'All Teams' }, ...teamOptions]} value={filterTeam} onChange={e => setFilterTeam(e.target.value)} className="w-48" />
        <Select options={[{ value: '', label: 'All Sprints' }, ...sprintOptions]} value={filterSprint} onChange={e => setFilterSprint(e.target.value)} className="w-48" />
      </div>
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        {loading ? <div className="p-8 text-center text-sm text-slate-500">Loading tickets...</div> : (
          <Table
            columns={[
              { key: 'ticketKey', header: 'Ticket', render: t => <span className="font-mono text-xs font-semibold text-primary-600">{t.ticketKey || t.id.slice(0, 8)}</span> },
              { key: 'title', header: 'Title', render: t => <Link to={`/tasks/${t.id}`} className="font-medium hover:text-primary-600">{t.title}</Link> },
              { key: 'priority', header: 'Priority', render: t => <Badge variant={t.priority === 'urgent' ? 'danger' : t.priority === 'high' ? 'warning' : 'default'}>{t.priority}</Badge> },
              { key: 'status', header: 'Status', render: t => { const s = project?.statuses.find(x => x.id === t.statusId); return <Badge>{s?.name || t.statusId}</Badge>; } },
              { key: 'sprint', header: 'Sprint', render: t => sprints.find(s => s.id === t.sprintId)?.name || '—' },
              { key: 'assignees', header: 'Assignees', render: t => <div className="flex -space-x-1">{(t.assigneeIds || []).map(id => { const u = assigneeMap.get(id); return <Avatar key={id} name={u?.name || id} src={u?.avatar} size="sm" className="ring-2 ring-white" />; })}</div> },
              { key: 'dueDate', header: 'Due', render: t => t.dueDate || '—' },
            ]}
            data={filtered}
            emptyMessage="No tickets found"
          />
        )}
      </div>

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create Ticket" size="lg">
        <div className="space-y-4">
          <Input label="Ticket Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required placeholder="Implement Login API" />
          <div>
            <label className="block text-sm font-medium mb-1.5">Description</label>
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select label="Team" options={teamOptions} value={form.teamId} onChange={e => setForm({ ...form, teamId: e.target.value, assigneeIds: [] })} />
            <Select label="Sprint" options={sprintOptions} value={form.sprintId} onChange={e => setForm({ ...form, sprintId: e.target.value })} placeholder="Select sprint" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select label="Priority" options={[{ value: 'low', label: 'Low' }, { value: 'medium', label: 'Medium' }, { value: 'high', label: 'High' }, { value: 'urgent', label: 'Urgent' }]} value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value as any })} />
            <Select label="Status" options={statusOptions} value={form.statusId} onChange={e => setForm({ ...form, statusId: e.target.value })} required />
          </div>
          <MultiSelect label="Assignees" options={userOptions} value={form.assigneeIds} onChange={v => setForm({ ...form, assigneeIds: v })} placeholder="Select assignees" />
          <div className="grid grid-cols-2 gap-4">
            <DatePicker label="Start Date" value={form.startDate} onChange={v => setForm({ ...form, startDate: v })} />
            <DatePicker label="Due Date" value={form.dueDate} onChange={v => setForm({ ...form, dueDate: v })} />
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={handleCreate}>Create Ticket</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
