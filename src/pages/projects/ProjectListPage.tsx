import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Eye } from 'lucide-react';
import { Table, type Column } from '../../components/common/Table';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Avatar } from '../../components/common/Avatar';
import { SearchBox } from '../../components/common/SearchBox';
import { Pagination } from '../../components/common/Pagination';
import { FilterPanel } from '../../components/common/FilterPanel';
import { mockProjects, mockUsers, mockTasks } from '../../utils/mockData';
import type { Project } from '../../types';

const PAGE_SIZE = 5;

export default function ProjectListPage() {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState('');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<Record<string, string>>({});

  const filtered = useMemo(() => {
    let list = [...mockProjects];

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
  }, [search, sortKey, sortDir, filters]);

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

  const getUser = (id: string) => mockUsers.find(u => u.id === id);
  const getTaskCount = (projId: string) => mockTasks.filter(t => t.projectId === projId).length;
  const getProgress = (proj: Project) => {
    const total = mockTasks.filter(t => t.projectId === proj.id).length;
    if (total === 0) return 0;
    const done = mockTasks.filter(
      t =>
        t.projectId === proj.id &&
        proj.statuses.some(s => s.id === t.statusId && s.name.toLowerCase().includes('completed') || s.name.toLowerCase().includes('done') || s.name.toLowerCase().includes('complete'))
    ).length;
    return Math.round((done / total) * 100);
  };

  const columns: Column<Project>[] = [
    {
      key: 'name',
      header: 'Name',
      sortable: true,
      render: p => (
        <span className="font-medium text-slate-900 dark:text-slate-100 cursor-pointer hover:text-primary-500 transition-colors">
          {p.name}
        </span>
      ),
    },
    {
      key: 'manager',
      header: 'Manager',
      render: p => {
        const mgr = getUser(p.managerId);
        return mgr ? (
          <div className="flex items-center gap-2">
            <Avatar src={mgr.avatar} name={mgr.name} size="sm" />
            <span>{mgr.name}</span>
          </div>
        ) : (
          '—'
        );
      },
    },
    {
      key: 'members',
      header: 'Members',
      render: p => (
        <div className="flex -space-x-2">
          {p.members.slice(0, 4).map(m => {
            const u = getUser(m.userId);
            return u ? (
              <Avatar key={m.userId} src={u.avatar} name={u.name} size="sm" className="ring-2 ring-white dark:ring-slate-900" />
            ) : null;
          })}
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
          {new Date(p.startDate).toLocaleDateString()}
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
      render: p => (
        <Link to={`/projects/${p.id}`}>
          <Button variant="ghost" size="sm">
            <Eye className="h-4 w-4" />
          </Button>
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Projects</h1>
        <Link to="/projects/create">
          <Button>
            <Plus className="h-4 w-4" />
            Create Project
          </Button>
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <SearchBox
          value={search}
          onChange={v => { setSearch(v); setPage(1); }}
          placeholder="Search projects..."
          className="sm:w-80"
        />
        <FilterPanel
          filters={[
            {
              key: 'status',
              label: 'Status',
              options: [
                { value: 'active', label: 'Active' },
                { value: 'archived', label: 'Archived' },
              ],
            },
          ]}
          values={filters}
          onChange={(k, v) => { setFilters(f => ({ ...f, [k]: v })); setPage(1); }}
          onClear={() => { setFilters({}); setPage(1); }}
        />
      </div>

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

      <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}
