import { useState, useMemo, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Eye, Trash2 } from 'lucide-react';
import { Table, type Column } from '../../components/common/Table';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Avatar } from '../../components/common/Avatar';
import { SearchBox } from '../../components/common/SearchBox';
import { Pagination } from '../../components/common/Pagination';
import { Select } from '../../components/common/Select';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { DataToolbar } from '../../components/common/DataToolbar';
import { ViewToggle, type ViewMode } from '../../components/common/ViewToggle';
import { projectService } from '../../services/projectService';
import { taskService } from '../../services/taskService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { getErrorMessage } from '../../api/apiClient';
import type { Project } from '../../types';
import { mapProject, mapTask } from '../../utils/mappers';

const PAGE_SIZE = 5;

export default function ProjectListPage() {
  const navigate = useNavigate();
  const { success: showSuccess, error: showError } = useToast();
  const { hasPermission } = useAuth();
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState('');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [projects, setProjects] = useState<Project[]>([]);
  const [allTasks, setAllTasks] = useState<{ projectId: string; statusId: string; statusName: string }[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('table');

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      projectService.list(),
      taskService.list(),
    ]).then(([projectsRes, tasksRes]) => {
      const pData = projectsRes.data.data || projectsRes.data || [];
      const tData = tasksRes.data.data || tasksRes.data || [];
      setProjects((Array.isArray(pData) ? pData : []).map(mapProject));
      const rawTasks = Array.isArray(tData) ? tData : [];
      setAllTasks(rawTasks.map((t: any) => ({ projectId: t.project_id || t.projectId, statusId: t.status_id || t.statusId, statusName: '' })));
    }).finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = useMemo(() => {
    let list = [...projects];

    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        p =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q)
      );
    }

    if (filters.status) {
      list = list.filter(p => p.status === filters.status);
    }

    if (sortKey) {
      list.sort((a, b) => {
        let av: string | number = '';
        let bv: string | number = '';
        switch (sortKey) {
          case 'name':
            av = a.name;
            bv = b.name;
            break;
          case 'startDate':
            av = a.startDate;
            bv = b.startDate;
            break;
          case 'endDate':
            av = a.endDate ?? '';
            bv = b.endDate ?? '';
            break;
          case 'status':
            av = a.status;
            bv = b.status;
            break;
        }
        if (typeof av === 'string') {
          return sortDir === 'asc' ? av.localeCompare(bv as string) : (bv as string).localeCompare(av);
        }
        return 0;
      });
    }

    return list;
  }, [search, sortKey, sortDir, filters, projects]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const getTaskCount = (projId: string) => allTasks.filter(t => t.projectId === projId).length;
  const getProgress = (proj: Project) => {
    const total = allTasks.filter(t => t.projectId === proj.id).length;
    if (total === 0) return 0;
    const done = allTasks.filter(
      t =>
        t.projectId === proj.id &&
        proj.statuses.some(s => s.id === t.statusId && (s.name.toLowerCase().includes('completed') || s.name.toLowerCase().includes('done') || s.name.toLowerCase().includes('complete')))
    ).length;
    return Math.round((done / total) * 100);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res: any = await projectService.delete(deleteTarget.id);
      setProjects(prev => prev.filter(p => p.id !== deleteTarget.id));
      showSuccess(res.data?.message || 'Project deleted successfully');
    } catch (err: any) {
      showError(getErrorMessage(err));
    }
    setDeleteTarget(null);
  };

  const columns: Column<Project>[] = [
    {
      key: 'name',
      header: 'Name',
      sortable: true,
      render: p => (
        <Link to={`/projects/${p.id}`} className="font-medium text-slate-900 dark:text-slate-100 hover:text-primary-500 transition-colors cursor-pointer">
          {p.name}
        </Link>
      ),
    },
    {
      key: 'manager',
      header: 'Manager',
      render: p => (
        <div className="flex items-center gap-2">
          <Avatar src="" name={p.managerId} size="sm" />
          <span className="text-sm">{p.managerId}</span>
        </div>
      ),
    },
    {
      key: 'members',
      header: 'Members',
      render: p => (
        <div className="flex -space-x-2">
          {p.members.slice(0, 4).map((m, i) => (
            <Avatar key={i} src="" name={m.userId} size="sm" className="ring-2 ring-white dark:ring-slate-900" />
          ))}
          {p.members.length > 4 && (
            <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-medium ring-2 ring-white dark:ring-slate-900">
              +{p.members.length - 4}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'progress',
      header: 'Progress',
      render: p => {
        const pct = getProgress(p);
        return (
          <div className="flex items-center gap-2">
            <div className="flex-1 h-2 rounded-full bg-slate-200 dark:bg-slate-700">
              <div className="h-full rounded-full bg-primary-500 transition-all" style={{ width: `${pct}%` }} />
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400 w-10 text-right">{pct}%</span>
          </div>
        );
      },
    },
    {
      key: 'tasks',
      header: 'Tasks',
      render: p => <span>{getTaskCount(p.id)}</span>,
    },
    {
      key: 'startDate',
      header: 'Start Date',
      sortable: true,
      render: p => (
        <span className="text-slate-500 dark:text-slate-400">
          {p.startDate ? new Date(p.startDate).toLocaleDateString() : '—'}
        </span>
      ),
    },
    {
      key: 'endDate',
      header: 'End Date',
      sortable: true,
      render: p => (
        <span className="text-slate-500 dark:text-slate-400">
          {p.endDate ? new Date(p.endDate).toLocaleDateString() : '—'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: p => (
        <Badge variant={p.status === 'active' ? 'success' : 'default'}>
          {p.status === 'active' ? 'Active' : 'Archived'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'w-24',
      render: p => (
        <div className="flex items-center gap-1">
          <Link to={`/projects/${p.id}`}>
            <Button variant="ghost" size="sm">
              <Eye className="h-4 w-4" />
            </Button>
          </Link>
          {hasPermission('projects.delete') && (
            <button
              onClick={() => setDeleteTarget(p)}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
              title="Delete"
            >
              <Trash2 className="h-4 w-4 text-red-500" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Projects</h1>

      <DataToolbar
        search={
          <SearchBox
            value={search}
            onChange={v => { setSearch(v); setPage(1); }}
            placeholder="Search projects..."
          />
        }
        filters={
          <Select
            options={[{ value: '', label: 'All Status' }, { value: 'active', label: 'Active' }, { value: 'archived', label: 'Archived' }]}
            value={filters.status || ''}
            onChange={e => { setFilters(f => ({ ...f, status: e.target.value })); setPage(1); }}
            placeholder="All Status"
            className="w-40"
          />
        }
        actions={
          hasPermission('projects.create') ? (
            <Link to="/projects/create">
              <Button>
                <Plus className="h-4 w-4" />
                Create Project
              </Button>
            </Link>
          ) : undefined
        }
      />

      <div className="flex justify-end">
        <ViewToggle value={viewMode} onChange={setViewMode} />
      </div>

      {viewMode === 'table' ? (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <Table
            columns={columns}
            data={paginated}
            sortKey={sortKey}
            sortDirection={sortDir}
            onSort={handleSort}
            emptyMessage="No projects found"
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {paginated.length === 0 ? (
            <div className="col-span-full py-12 text-center text-slate-500 dark:text-slate-400">No projects found</div>
          ) : (
            paginated.map(p => (
              <div key={p.id} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-5 space-y-3">
                <div className="flex items-start justify-between">
                  <Link to={`/projects/${p.id}`} className="font-semibold text-slate-900 dark:text-slate-100 hover:text-primary-500 transition-colors line-clamp-1">{p.name}</Link>
                  <Badge variant={p.status === 'active' ? 'success' : 'default'}>{p.status === 'active' ? 'Active' : 'Archived'}</Badge>
                </div>
                <p className="text-sm text-slate-500 line-clamp-2">{p.description || 'No description'}</p>
                <div className="flex -space-x-2">
                  {p.members.slice(0, 4).map((m, i) => (
                    <Avatar key={i} src="" name={m.userId} size="sm" className="ring-2 ring-white dark:ring-slate-900" />
                  ))}
                  {p.members.length > 4 && (
                    <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-medium ring-2 ring-white dark:ring-slate-900">+{p.members.length - 4}</div>
                  )}
                  <span className="ml-3 text-xs text-slate-500 flex items-center">{p.members.length} members</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 rounded-full bg-slate-200 dark:bg-slate-700">
                    <div className="h-full rounded-full bg-primary-500 transition-all" style={{ width: `${getProgress(p)}%` }} />
                  </div>
                  <span className="text-xs text-slate-500 w-10 text-right">{getProgress(p)}%</span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>{p.startDate ? new Date(p.startDate).toLocaleDateString() : '—'} → {p.endDate ? new Date(p.endDate).toLocaleDateString() : '—'}</span>
                  <span>{getTaskCount(p.id)} tasks</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Project"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
      />
    </div>
  );
}

