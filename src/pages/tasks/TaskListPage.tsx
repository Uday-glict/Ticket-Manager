import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { mockTasks, mockProjects, mockUsers } from '../../utils/mockData';
import type { Priority } from '../../types';
import { Table, type Column } from '../../components/common/Table';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Avatar } from '../../components/common/Avatar';
import { SearchBox } from '../../components/common/SearchBox';
import { FilterPanel } from '../../components/common/FilterPanel';
import { Pagination } from '../../components/common/Pagination';

const ITEMS_PER_PAGE = 5;

const priorityVariant: Record<Priority, 'default' | 'info' | 'warning' | 'danger'> = {
  low: 'default',
  medium: 'info',
  high: 'warning',
  urgent: 'danger',
};

const priorityLabel: Record<Priority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent',
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function isOverdue(dueDate?: string) {
  if (!dueDate) return false;
  return new Date(dueDate) < new Date();
}

function getStatusBadgeVariant(color: string) {
  if (color.includes('22c55e') || color.includes('green')) return 'success';
  if (color.includes('3b82f6') || color.includes('blue')) return 'info';
  if (color.includes('f59e0b') || color.includes('amber')) return 'warning';
  if (color.includes('a855f7') || color.includes('purple')) return 'info';
  return 'default';
}

export default function TaskListPage() {
  const [search, setSearch] = useState('');
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [sortKey, setSortKey] = useState<string>('updatedAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);

  const getProject = (projectId: string) => mockProjects.find(p => p.id === projectId);
  const getUser = (userId: string) => mockUsers.find(u => u.id === userId);

  const filteredTasks = useMemo(() => {
    let tasks = [...mockTasks];

    if (search) {
      tasks = tasks.filter(t => t.title.toLowerCase().includes(search.toLowerCase()));
    }

    if (filterValues.project) {
      tasks = tasks.filter(t => t.projectId === filterValues.project);
    }

    if (filterValues.assignedTo) {
      tasks = tasks.filter(t => t.assignedTo === filterValues.assignedTo);
    }

    if (filterValues.status) {
      tasks = tasks.filter(t => {
        const project = getProject(t.projectId);
        const status = project?.statuses.find(s => s.id === t.statusId);
        return status?.name === filterValues.status;
      });
    }

    if (filterValues.priority) {
      tasks = tasks.filter(t => t.priority === filterValues.priority);
    }

    tasks.sort((a, b) => {
      let aVal = a[sortKey as keyof typeof a] ?? '';
      let bVal = b[sortKey as keyof typeof b] ?? '';
      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();
      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return tasks;
  }, [search, filterValues, sortKey, sortDirection]);

  const totalPages = Math.ceil(filteredTasks.length / ITEMS_PER_PAGE);
  const paginatedTasks = filteredTasks.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const filters = [
    {
      key: 'project',
      label: 'Project',
      options: mockProjects.map(p => ({ value: p.id, label: p.name })),
    },
    {
      key: 'assignedTo',
      label: 'Assigned To',
      options: mockUsers.map(u => ({ value: u.id, label: u.name })),
    },
    {
      key: 'status',
      label: 'Status',
      options: [
        ...new Set(
          mockProjects.flatMap(p =>
            p.statuses.filter(s => s.enabled).map(s => s.name)
          )
        ),
      ].map(name => ({ value: name, label: name })),
    },
    {
      key: 'priority',
      label: 'Priority',
      options: [
        { value: 'low', label: 'Low' },
        { value: 'medium', label: 'Medium' },
        { value: 'high', label: 'High' },
        { value: 'urgent', label: 'Urgent' },
      ],
    },
  ];

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDirection(d => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilterValues(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setFilterValues({});
    setCurrentPage(1);
  };

  const columns: Column<typeof paginatedTasks[0]>[] = [
    {
      key: 'title',
      header: 'Title',
      sortable: true,
      render: task => (
        <Link
          to={`/tasks/${task.id}`}
          className="text-primary-600 dark:text-primary-400 hover:underline font-medium cursor-pointer"
        >
          {task.title}
        </Link>
      ),
    },
    {
      key: 'project',
      header: 'Project',
      sortable: true,
      render: task => {
        const project = getProject(task.projectId);
        return project?.name ?? '—';
      },
    },
    {
      key: 'assignedTo',
      header: 'Assigned To',
      sortable: true,
      render: task => {
        if (!task.assignedTo) return '—';
        const user = getUser(task.assignedTo);
        if (!user) return '—';
        return (
          <div className="flex items-center gap-2">
            <Avatar src={user.avatar} name={user.name} size="sm" />
            <span>{user.name}</span>
          </div>
        );
      },
    },
    {
      key: 'priority',
      header: 'Priority',
      sortable: true,
      render: task => (
        <Badge variant={priorityVariant[task.priority]}>{priorityLabel[task.priority]}</Badge>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: task => {
        const project = getProject(task.projectId);
        const status = project?.statuses.find(s => s.id === task.statusId);
        if (!status) return '—';
        return (
          <Badge variant={getStatusBadgeVariant(status.color)}>
            {status.name}
          </Badge>
        );
      },
    },
    {
      key: 'dueDate',
      header: 'Due Date',
      sortable: true,
      render: task => {
        if (!task.dueDate) return '—';
        return (
          <span className={isOverdue(task.dueDate) ? 'text-red-600 dark:text-red-400 font-medium' : ''}>
            {formatDate(task.dueDate)}
          </span>
        );
      },
    },
    {
      key: 'createdBy',
      header: 'Created By',
      render: task => {
        const user = getUser(task.createdBy);
        return user?.name ?? '—';
      },
    },
    {
      key: 'updatedAt',
      header: 'Updated At',
      sortable: true,
      render: task => formatDate(task.updatedAt),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Tasks</h1>
        <Link to="/tasks/create">
          <Button>
            <Plus className="h-4 w-4" />
            Create Task
          </Button>
        </Link>
      </div>

      <SearchBox
        value={search}
        onChange={setSearch}
        placeholder="Search tasks..."
        className="max-w-md"
      />

      <FilterPanel
        filters={filters}
        values={filterValues}
        onChange={handleFilterChange}
        onClear={handleClearFilters}
      />

      <Table
        columns={columns}
        data={paginatedTasks}
        sortKey={sortKey}
        sortDirection={sortDirection}
        onSort={handleSort}
        emptyMessage="No tasks found"
      />

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />
    </div>
  );
}
