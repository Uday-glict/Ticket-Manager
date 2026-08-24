import { useState, useMemo, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Users,
  ListTodo,
  MessageSquare,
  ChevronRight,
  Circle,
  Loader2,
  Pencil,
  Trash2,
} from 'lucide-react';
import { Tabs } from '../../components/common/Tabs';
import { Badge } from '../../components/common/Badge';
import { Avatar } from '../../components/common/Avatar';
import { Button } from '../../components/common/Button';
import { Table, Column } from '../../components/common/Table';
import { SearchBox } from '../../components/common/SearchBox';
import { Select } from '../../components/common/Select';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { projectService } from '../../services/projectService';
import { taskService } from '../../services/taskService';
import { userService } from '../../services/userService';
import { roleService } from '../../services/roleService';
import { auditService } from '../../services/auditService';
import { useToast } from '../../context/ToastContext';
import { getErrorMessage } from '../../api/apiClient';
import { ROUTES } from '../../constants/routes';
import type { Task, Activity, Priority, ProjectStatus, Project, User, Role } from '../../types';
import { mapProject, mapTask, mapUser, mapRole, mapActivity, mapAuditLog } from '../../utils/mappers';

function getStatusBadgeVariant(status: string) {
  switch (status) {
    case 'active':
      return 'success';
    case 'archived':
      return 'default';
    default:
      return 'default';
  }
}

function getPriorityBadgeVariant(priority: Priority) {
  switch (priority) {
    case 'urgent':
      return 'danger';
    case 'high':
      return 'warning';
    case 'medium':
      return 'info';
    case 'low':
      return 'default';
    default:
      return 'default';
  }
}

function getTaskStatusName(task: Task, statuses: ProjectStatus[]) {
  const s = statuses.find(st => st.id === task.statusId);
  return s?.name ?? 'Unknown';
}

function getTaskStatusColor(task: Task, statuses: ProjectStatus[]) {
  const s = statuses.find(st => st.id === task.statusId);
  return s?.color ?? '#94a3b8';
}

function isOverdue(task: Task) {
  if (!task.dueDate) return false;
  return new Date(task.dueDate) < new Date() && task.statusId !== statuses_last_id(task);
}

function statuses_last_id(task: Task) {
  return task.statusId;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function timeAgo(dateStr: string) {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHrs = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHrs / 24);
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHrs < 24) return `${diffHrs}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(dateStr);
}

function ActionIcon({ action }: { action: string }) {
  switch (action) {
    case 'completed':
      return <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
    case 'created':
      return <Circle className="h-5 w-5 text-blue-500" />;
    case 'updated':
      return <Clock className="h-5 w-5 text-amber-500" />;
    case 'commented':
      return <MessageSquare className="h-5 w-5 text-purple-500" />;
    case 'assigned':
      return <Users className="h-5 w-5 text-cyan-500" />;
    default:
      return <Circle className="h-5 w-5 text-slate-400" />;
  }
}

function OverviewTab({ project, users, roles, tasks }: { project: Project; users: User[]; roles: Role[]; tasks: Task[] }) {
  const manager = users.find(u => u.id === project.managerId);
  const members = project.members
    .map(m => ({
      ...m,
      user: users.find(u => u.id === m.userId),
      role: roles.find(r => r.id === m.roleId),
    }))
    .filter(m => m.user);

  const projectTasks = tasks.filter(t => t.projectId === project.id);
  const completedCount = projectTasks.filter(t => {
    const status = project.statuses.find(s => s.id === t.statusId);
    return status?.name.toLowerCase().includes('complet') || status?.name.toLowerCase().includes('done');
  }).length;
  const inProgressCount = projectTasks.filter(t => {
    const status = project.statuses.find(s => s.id === t.statusId);
    return status?.name.toLowerCase().includes('progress') || status?.name.toLowerCase().includes('develop') || status?.name.toLowerCase().includes('build');
  }).length;
  const overdueCount = projectTasks.filter(t => {
    if (!t.dueDate) return false;
    const isLastStatus = project.statuses[project.statuses.length - 1]?.id === t.statusId;
    return new Date(t.dueDate) < new Date() && !isLastStatus;
  }).length;

  const progress = projectTasks.length > 0 ? Math.round((completedCount / projectTasks.length) * 100) : 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Description</h3>
          <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed">{project.description}</p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">Members</h3>
          <div className="flex flex-wrap gap-3">
            {members.map(m => (
              <div key={m.userId} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                <Avatar src={m.user!.avatar} name={m.user!.name} size="sm" />
                <div className="text-sm">
                  <span className="font-medium text-slate-900 dark:text-slate-100">{m.user!.name}</span>
                  <span className="text-slate-400 dark:text-slate-500 ml-1.5 text-xs">({m.role?.name})</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">Progress</h3>
          <div className="flex items-end justify-between mb-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">{progress}%</span>
            <span className="text-sm text-slate-500 dark:text-slate-400">{completedCount}/{projectTasks.length} tasks</span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
            <div
              className="h-full rounded-full bg-primary-500 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">Manager</h3>
          {manager && (
            <div className="flex items-center gap-3">
              <Avatar src={manager.avatar} name={manager.name} size="lg" />
              <div>
                <p className="font-medium text-slate-900 dark:text-slate-100">{manager.name}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">{manager.email}</p>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6 space-y-4">
          <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Timeline</h3>
          <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
            <Calendar className="h-4 w-4 text-slate-400" />
            <span>Start: {formatDate(project.startDate)}</span>
          </div>
          {project.endDate && (
            <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
              <Calendar className="h-4 w-4 text-slate-400" />
              <span>End: {formatDate(project.endDate)}</span>
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6 space-y-3">
          <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Task Summary</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 text-center">
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{projectTasks.length}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Total</p>
            </div>
            <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-center">
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{completedCount}</p>
              <p className="text-xs text-emerald-600 dark:text-emerald-400">Completed</p>
            </div>
            <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-center">
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{inProgressCount}</p>
              <p className="text-xs text-blue-600 dark:text-blue-400">In Progress</p>
            </div>
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-center">
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">{overdueCount}</p>
              <p className="text-xs text-red-600 dark:text-red-400">Overdue</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TasksTab({ project, users, tasks }: { project: Project; users: User[]; tasks: Task[] }) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const projectTasks = tasks.filter(t => t.projectId === project.id);

  const filteredTasks = useMemo(() => {
    return projectTasks.filter(t => {
      const matchesSearch = !search || t.title.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'all' || t.statusId === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [projectTasks, search, statusFilter]);

  const statusOptions = [
    { value: 'all', label: 'All Statuses' },
    ...project.statuses.map(s => ({ value: s.id, label: s.name })),
  ];

  const columns: Column<Task>[] = [
    {
      key: 'title',
      header: 'Task',
      sortable: true,
      render: (task) => (
        <Link
          to={`/tasks/${task.id}`}
          className="font-medium text-slate-900 dark:text-slate-100 hover:text-primary-500 dark:hover:text-primary-400 transition-colors cursor-pointer"
        >
          {task.title}
        </Link>
      ),
    },
    {
      key: 'assignedTo',
      header: 'Assigned To',
      render: (task) => {
        const user = users.find(u => u.id === task.assignedTo);
        if (!user) return <span className="text-slate-400">Unassigned</span>;
        return (
          <div className="flex items-center gap-2">
            <Avatar src={user.avatar} name={user.name} size="sm" />
            <span className="text-sm text-slate-700 dark:text-slate-300">{user.name}</span>
          </div>
        );
      },
    },
    {
      key: 'priority',
      header: 'Priority',
      sortable: true,
      render: (task) => (
        <Badge variant={getPriorityBadgeVariant(task.priority)}>
          {task.priority}
        </Badge>
      ),
    },
    {
      key: 'statusId',
      header: 'Status',
      render: (task) => {
        const statusName = getTaskStatusName(task, project.statuses);
        const statusColor = getTaskStatusColor(task, project.statuses);
        return (
          <span
            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
            style={{ backgroundColor: statusColor + '20', color: statusColor }}
          >
            {statusName}
          </span>
        );
      },
    },
    {
      key: 'dueDate',
      header: 'Due Date',
      sortable: true,
      render: (task) => {
        if (!task.dueDate) return <span className="text-slate-400">-</span>;
        const overdue = new Date(task.dueDate) < new Date() && project.statuses[project.statuses.length - 1]?.id !== task.statusId;
        return (
          <span className={overdue ? 'text-red-500 font-medium' : 'text-slate-700 dark:text-slate-300'}>
            {formatDate(task.dueDate)}
          </span>
        );
      },
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <SearchBox
          value={search}
          onChange={setSearch}
          placeholder="Search tasks..."
          className="sm:w-72"
        />
        <Select
          options={statusOptions}
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="sm:w-48"
        />
      </div>
      <Table
        columns={columns}
        data={filteredTasks as any}
        emptyMessage="No tasks found"
      />
    </div>
  );
}

function BoardTab({ project, users, tasks }: { project: Project; users: User[]; tasks: Task[] }) {
  const projectTasks = tasks.filter(t => t.projectId === project.id);
  const statuses = project.statuses.sort((a, b) => a.order - b.order);

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {statuses.map(status => {
        const tasks = projectTasks.filter(t => t.statusId === status.id);
        return (
          <div key={status.id} className="flex-shrink-0 w-72">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: status.color }} />
              <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{status.name}</h4>
              <span className="text-xs text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">{tasks.length}</span>
            </div>
            <div className="space-y-3">
              {tasks.map(task => {
                const assignedUser = users.find(u => u.id === task.assignedTo);
                return (
                  <Link
                    key={task.id}
                    to={`/tasks/${task.id}`}
                    className="block p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h5 className="text-sm font-medium text-slate-900 dark:text-slate-100 line-clamp-2">{task.title}</h5>
                      <Badge variant={getPriorityBadgeVariant(task.priority)} className="flex-shrink-0">
                        {task.priority}
                      </Badge>
                    </div>
                    {task.dueDate && (
                      <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                        <Calendar className="h-3 w-3" />
                        <span>{formatDate(task.dueDate)}</span>
                      </div>
                    )}
                    {assignedUser && (
                      <div className="flex items-center gap-1.5 mt-2">
                        <Avatar src={assignedUser.avatar} name={assignedUser.name} size="sm" />
                        <span className="text-xs text-slate-600 dark:text-slate-400">{assignedUser.name}</span>
                      </div>
                    )}
                  </Link>
                );
              })}
              {tasks.length === 0 && (
                <div className="p-4 text-center text-sm text-slate-400 dark:text-slate-500 rounded-xl border border-dashed border-slate-300 dark:border-slate-600">
                  No tasks
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function MembersTab({ project, users, roles }: { project: Project; users: User[]; roles: Role[] }) {
  const members = project.members
    .map(m => ({
      ...m,
      user: users.find(u => u.id === m.userId),
      role: roles.find(r => r.id === m.roleId),
    }))
    .filter(m => m.user);

  const columns: Column<typeof members[number]>[] = [
    {
      key: 'user',
      header: 'Member',
      render: (m) => (
        <div className="flex items-center gap-3">
          <Avatar src={m.user!.avatar} name={m.user!.name} size="md" />
          <div>
            <p className="font-medium text-slate-900 dark:text-slate-100">{m.user!.name}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">{m.user!.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Project Role',
      render: (m) => (
        <Badge variant="info">{m.role?.name ?? 'Unknown'}</Badge>
      ),
    },
  ];

  return (
    <Table
      columns={columns}
      data={members as any}
      emptyMessage="No members found"
    />
  );
}

function ActivityTab({ project, users, tasks, activities }: { project: Project; users: User[]; tasks: Task[]; activities: any[] }) {
  const projectActivities = activities.filter(a => {
    return tasks.some(t => t.projectId === project.id && t.id === a.record);
  });

  const sortedActivities = [...projectActivities].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  if (sortedActivities.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500 dark:text-slate-400">
        No activity yet
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="absolute left-6 top-0 bottom-0 w-px bg-slate-200 dark:bg-slate-700" />
      <div className="space-y-6">
        {sortedActivities.map(activity => {
          const user = users.find(u => u.id === activity.userId);
          return (
            <div key={activity.id} className="relative flex gap-4">
              <div className="relative z-10 flex-shrink-0">
                {user ? (
                  <Avatar src={user.avatar} name={user.name} size="md" />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                    <ActionIcon action={activity.action} />
                  </div>
                )}
              </div>
              <div className="flex-1 pb-1">
                <div className="flex items-center gap-2">
                  <ActionIcon action={activity.action} />
                  <p className="text-sm text-slate-900 dark:text-slate-100">
                    <span className="font-medium">{user?.name ?? 'Unknown'}</span>
                    <span className="text-slate-500 dark:text-slate-400"> {activity.action} </span>
                    <span className="font-medium">{activity.entity}</span>
                    {activity.entityName && (
                      <span className="text-slate-500 dark:text-slate-400"> "{activity.entityName}"</span>
                    )}
                  </p>
                </div>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 ml-7">
                  {timeAgo(activity.createdAt)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function ProjectDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { success: showSuccess, error: showError } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDelete, setShowDelete] = useState(false);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      projectService.get(id),
      taskService.list({ project_id: id }),
      userService.list(),
      roleService.list(),
      auditService.list({ entity_type: 'tasks' }),
    ]).then(([projectRes, tasksRes, usersRes, rolesRes, auditRes]) => {
      const pData = projectRes.data.data || projectRes.data;
      setProject(mapProject(pData));
      const tData = tasksRes.data.data || tasksRes.data;
      setTasks((Array.isArray(tData) ? tData : []).map(mapTask));
      const uData = usersRes.data.data || usersRes.data;
      setUsers((Array.isArray(uData) ? uData : []).map(mapUser));
      const rData = rolesRes.data.data || rolesRes.data;
      setRoles((Array.isArray(rData) ? rData : []).map(mapRole));
      const aData = auditRes.data.data || auditRes.data;
      setActivities((Array.isArray(aData) ? aData : []).map(mapAuditLog));
    }).finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="max-w-3xl mx-auto text-center py-20">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4">Project not found</h1>
        <p className="text-slate-500 dark:text-slate-400 mb-6">The project you're looking for doesn't exist.</p>
        <Button onClick={() => navigate('/projects')}>
          <ArrowLeft className="h-4 w-4" />
          Back to Projects
        </Button>
      </div>
    );
  }

  const projectTasks = tasks.filter(t => t.projectId === project.id);

  const tabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'tasks', label: 'Tasks', count: projectTasks.length },
    { key: 'board', label: 'Board' },
    { key: 'members', label: 'Members', count: project.members.length },
    { key: 'activity', label: 'Activity' },
  ];

  const handleDelete = async () => {
    if (!id) return;
    try {
      await projectService.delete(id);
      showSuccess('Project deleted successfully');
      navigate(ROUTES.DASHBOARD);
    } catch (err: any) {
      showError(getErrorMessage(err));
    }
    setShowDelete(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{project.name}</h1>
            <Badge variant={getStatusBadgeVariant(project.status)}>
              {project.status}
            </Badge>
          </div>
        </div>
        <Link to={`/projects/${project.id}/edit`}>
          <Button variant="outline" size="sm">
            <Pencil className="h-4 w-4" />
            Edit
          </Button>
        </Link>
        <Button variant="outline" size="sm" onClick={() => setShowDelete(true)} className="text-red-600 hover:bg-red-50">
          <Trash2 className="h-4 w-4" />
          Delete
        </Button>
        <Link to={`/projects/${project.id}/status-config`}>
          <Button variant="outline" size="sm">
            Configure Statuses
            <ChevronRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      <div className="mt-6">
        {activeTab === 'overview' && <OverviewTab project={project} users={users} roles={roles} tasks={tasks} />}
        {activeTab === 'tasks' && <TasksTab project={project} users={users} tasks={tasks} />}
        {activeTab === 'board' && <BoardTab project={project} users={users} tasks={tasks} />}
        {activeTab === 'members' && <MembersTab project={project} users={users} roles={roles} />}
        {activeTab === 'activity' && <ActivityTab project={project} users={users} tasks={tasks} activities={activities} />}
      </div>
      <ConfirmDialog
        isOpen={showDelete}
        onClose={() => setShowDelete(false)}
        onConfirm={handleDelete}
        title="Delete Project"
        message={`Are you sure you want to delete "${project.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
      />
    </div>
  );
}

