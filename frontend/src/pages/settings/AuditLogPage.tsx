import { useState, useMemo, useEffect } from 'react';
import { Shield } from 'lucide-react';
import { SearchBox } from '../../components/common/SearchBox';
import { FilterPanel } from '../../components/common/FilterPanel';
import { Table, type Column } from '../../components/common/Table';
import { Pagination } from '../../components/common/Pagination';
import { Avatar } from '../../components/common/Avatar';
import { Badge } from '../../components/common/Badge';
import { auditService } from '../../services/auditService';
import { userService } from '../../services/userService';
import type { AuditLog, User } from '../../types';
import { mapUser, mapAuditLog } from '../../utils/mappers';

const PAGE_SIZE = 8;

const modules = ['projects', 'tasks', 'users', 'roles'];
const actions = ['created', 'updated', 'deleted', 'assigned', 'completed', 'archived'];

const actionBadge: Record<string, 'success' | 'info' | 'warning' | 'danger' | 'default'> = {
  created: 'success',
  updated: 'info',
  completed: 'success',
  assigned: 'info',
  archived: 'warning',
  deleted: 'danger',
};

const formatDate = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const DiffValue = ({ value, type }: { value?: string; type: 'old' | 'new' }) => {
  if (!value) return <span className="text-slate-400 dark:text-slate-500 italic">—</span>;
  if (type === 'old') {
    return (
      <span className="line-through text-red-500/70 dark:text-red-400/70 bg-red-50 dark:bg-red-900/10 px-1 rounded">
        {value}
      </span>
    );
  }
  return (
    <span className="text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/10 px-1 rounded font-medium">
      {value}
    </span>
  );
};

export default function AuditLogPage() {
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [sortKey, setSortKey] = useState<string>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    Promise.all([
      auditService.list(),
      userService.list(),
    ]).then(([logsRes, usersRes]) => {
      setAuditLogs((logsRes.data.data || logsRes.data || []).map(mapAuditLog));
      setUsers((usersRes.data.data || usersRes.data || []).map(mapUser));
    }).catch(() => {});
  }, []);

  const userMap = useMemo(() => {
    const m = new Map<string, User>();
    users.forEach(u => m.set(u.id, u));
    return m;
  }, [users]);

  const filtered = useMemo(() => {
    let logs = [...auditLogs];

    if (search) {
      const q = search.toLowerCase();
      logs = logs.filter(log => {
        const u = userMap.get(log.userId);
        return (
          u?.name.toLowerCase().includes(q) ||
          log.action.toLowerCase().includes(q) ||
          log.module.toLowerCase().includes(q) ||
          log.record.toLowerCase().includes(q) ||
          log.previousValue?.toLowerCase().includes(q) ||
          log.newValue?.toLowerCase().includes(q)
        );
      });
    }

    if (filters.user) {
      logs = logs.filter(log => log.userId === filters.user);
    }
    if (filters.module) {
      logs = logs.filter(log => log.module === filters.module);
    }
    if (filters.action) {
      logs = logs.filter(log => log.action === filters.action);
    }

    logs.sort((a, b) => {
      if (sortKey === 'createdAt') {
        const diff = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        return sortDirection === 'asc' ? diff : -diff;
      }
      const va = (a as any)[sortKey] ?? '';
      const vb = (b as any)[sortKey] ?? '';
      return sortDirection === 'asc'
        ? String(va).localeCompare(String(vb))
        : String(vb).localeCompare(String(va));
    });

    return logs;
  }, [search, filters, sortKey, sortDirection, userMap, auditLogs]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDirection(d => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDirection('desc');
    }
    setCurrentPage(1);
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setFilters({});
    setSearch('');
    setCurrentPage(1);
  };

  const columns: Column<AuditLog>[] = [
    {
      key: 'user',
      header: 'User',
      sortable: true,
      render: log => {
        const u = userMap.get(log.userId);
        return u ? (
          <div className="flex items-center gap-2">
            <Avatar src={u.avatar} name={u.name} size="sm" />
            <span className="font-medium">{u.name}</span>
          </div>
        ) : log.userId;
      },
    },
    {
      key: 'action',
      header: 'Action',
      sortable: true,
      render: log => (
        <Badge variant={actionBadge[log.action] ?? 'default'}>{log.action}</Badge>
      ),
    },
    { key: 'module', header: 'Module', sortable: true },
    { key: 'record', header: 'Record', sortable: true },
    {
      key: 'previousValue',
      header: 'Previous Value',
      render: log => <DiffValue value={log.previousValue} type="old" />,
    },
    {
      key: 'newValue',
      header: 'New Value',
      render: log => <DiffValue value={log.newValue} type="new" />,
    },
    {
      key: 'createdAt',
      header: 'Date / Time',
      sortable: true,
      render: log => (
        <span className="text-slate-500 dark:text-slate-400 whitespace-nowrap">{formatDate(log.createdAt)}</span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Shield className="h-6 w-6" />
          Audit Log
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Track all changes and actions across the system
        </p>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <SearchBox
          value={search}
          onChange={v => { setSearch(v); setCurrentPage(1); }}
          placeholder="Search audit logs..."
          className="sm:w-72"
        />
        <FilterPanel
          filters={[
            { key: 'user', label: 'User', options: users.map(u => ({ value: u.id, label: u.name })) },
            { key: 'module', label: 'Module', options: modules.map(m => ({ value: m, label: m })) },
            { key: 'action', label: 'Action', options: actions.map(a => ({ value: a, label: a })) },
          ]}
          values={filters}
          onChange={handleFilterChange}
          onClear={handleClearFilters}
        />
      </div>

      <Table<AuditLog>
        columns={columns}
        data={paginated}
        sortKey={sortKey}
        sortDirection={sortDirection}
        onSort={handleSort}
        emptyMessage="No audit log entries found."
      />

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />
    </div>
  );
}

