import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckSquare,
  Clock,
  AlertTriangle,
  Loader2,
  FolderKanban,
  CalendarDays,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { taskService } from '../../services/taskService';
import { projectService } from '../../services/projectService';
import { Badge } from '../../components/common/Badge';
import { Avatar } from '../../components/common/Avatar';
import type { Task, Project } from '../../types';
import { mapProject, mapTask } from '../../utils/mappers';

const today = new Date();
const todayStr = today.toISOString().slice(0, 10);

function isOverdue(dueDate?: string): boolean {
  if (!dueDate) return false;
  return new Date(dueDate) < today;
}

function isDueToday(dueDate?: string): boolean {
  if (!dueDate) return false;
  return dueDate.slice(0, 10) === todayStr;
}

function getStatusName(project: Project, statusId: string): string {
  return project.statuses.find((s) => s.id === statusId)?.name ?? statusId;
}

function getPriorityVariant(p: Task['priority']): 'danger' | 'warning' | 'info' | 'default' {
  if (p === 'urgent' || p === 'high') return 'danger';
  if (p === 'medium') return 'warning';
  return 'info';
}

function formatDate(iso?: string): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function TaskRow({ task }: { task: Task }) {
  const [project, setProject] = useState<Project | undefined>();

  useEffect(() => {
    projectService.get(task.projectId).then(res => setProject(mapProject(res.data.data || res.data))).catch(() => {});
  }, [task.projectId]);

  const statusLabel = project ? getStatusName(project, task.statusId) : task.statusId;
  const overdue = isOverdue(task.dueDate);

  return (
    <Link
      to={`/tasks/${task.id}`}
      className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 dark:border-slate-700 p-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer transition-colors"
    >
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
          {task.title}
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          {project?.name}
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Badge variant={getPriorityVariant(task.priority)}>{task.priority}</Badge>
        {overdue ? (
          <Badge variant="danger">Overdue</Badge>
        ) : (
          <Badge variant="default">{statusLabel}</Badge>
        )}
        {task.dueDate && (
          <span className={`text-xs ${overdue ? 'text-red-500 font-semibold' : 'text-slate-500 dark:text-slate-400'}`}>
            {formatDate(task.dueDate)}
          </span>
        )}
      </div>
    </Link>
  );
}

function StatCard({ icon: Icon, label, count, color }: { icon: React.ElementType; label: string; count: number; color: string }) {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 flex items-center gap-4 cursor-default">
      <div className={`flex items-center justify-center h-11 w-11 rounded-lg ${color}`}>
        <Icon className="h-5 w-5 text-white" />
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-900 dark:text-white">{count}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
      </div>
    </div>
  );
}

function ProjectCard({ project }: { project: Project }) {
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    taskService.list({ project_id: project.id }).then(res => setTasks((res.data.data || res.data || []).map(mapTask))).catch(() => {});
  }, [project.id]);

  const completedStatuses = project.statuses.filter((s) => s.name.toLowerCase().includes('complet') || s.name.toLowerCase().includes('done'));
  const completedIds = new Set(completedStatuses.map((s) => s.id));
  const completed = tasks.filter((t) => completedIds.has(t.statusId)).length;
  const total = tasks.length;
  const pct = total === 0 ? 0 : Math.round((completed / total) * 100);

  return (
    <Link
      to={`/projects/${project.id}`}
      className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 hover:border-primary-300 dark:hover:border-primary-700 cursor-pointer transition-colors"
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{project.name}</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{project.description}</p>
        </div>
        <Badge variant={project.status === 'active' ? 'success' : 'default'}>{project.status}</Badge>
      </div>
      <div className="mt-4">
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
          <span>Progress</span>
          <span>{completed}/{total} tasks</span>
        </div>
        <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
          <div className="h-full rounded-full bg-primary-500 transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>
      <div className="flex items-center justify-between mt-4">
        <div className="flex -space-x-2">
          {project.members.slice(0, 4).map((m) => (
            <Avatar key={m.userId} src="" name={m.userId} size="sm" className="ring-2 ring-white dark:ring-slate-900" />
          ))}
          {project.members.length > 4 && (
            <span className="flex items-center justify-center h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300 ring-2 ring-white dark:ring-slate-900">
              +{project.members.length - 4}
            </span>
          )}
        </div>
        <ArrowRight className="h-4 w-4 text-slate-400" />
      </div>
    </Link>
  );
}

export default function DeveloperDashboard() {
  const { user: currentUser } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;
    Promise.all([
      taskService.list({ assigned_to: currentUser.id }),
      projectService.list(),
    ]).then(([tasksRes, projectsRes]) => {
      setTasks((tasksRes.data.data || tasksRes.data || []).map(mapTask));
      setProjects((projectsRes.data.data || projectsRes.data || []).map(mapProject));
    }).finally(() => setLoading(false));
  }, [currentUser]);

  const myTasks = tasks;
  const dueToday = myTasks.filter((t) => isDueToday(t.dueDate));
  const overdueTasks = myTasks.filter((t) => isOverdue(t.dueDate));
  const inProgressTasks = myTasks.filter((t) => {
    const project = projects.find((p) => p.id === t.projectId);
    if (!project) return false;
    const status = project.statuses.find((s) => s.id === t.statusId);
    return status?.name.toLowerCase().includes('progress') || status?.name.toLowerCase().includes('build') || status?.name.toLowerCase().includes('develop');
  });
  const myProjects = projects.filter((p) => p.members.some((m) => m.userId === currentUser?.id));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Welcome back, {currentUser?.name ?? 'Developer'}
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Here's an overview of your tasks and projects.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={CheckSquare} label="My Tasks" count={myTasks.length} color="bg-blue-500" />
        <StatCard icon={CalendarDays} label="Due Today" count={dueToday.length} color="bg-amber-500" />
        <StatCard icon={AlertTriangle} label="Overdue" count={overdueTasks.length} color="bg-red-500" />
        <StatCard icon={Loader2} label="In Progress" count={inProgressTasks.length} color="bg-primary-500" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 space-y-6">
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Clock className="h-5 w-5 text-amber-500" />
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Tasks Due Today</h2>
            </div>
            {dueToday.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400 p-4 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 text-center">
                No tasks due today.
              </p>
            ) : (
              <div className="space-y-2">
                {dueToday.map((t) => (
                  <TaskRow key={t.id} task={t} />
                ))}
              </div>
            )}
          </section>

          <section>
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Overdue Tasks</h2>
            </div>
            {overdueTasks.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400 p-4 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 text-center">
                No overdue tasks.
              </p>
            ) : (
              <div className="space-y-2">
                {overdueTasks.map((t) => (
                  <TaskRow key={t.id} task={t} />
                ))}
              </div>
            )}
          </section>

          <section>
            <div className="flex items-center gap-2 mb-3">
              <Loader2 className="h-5 w-5 text-primary-500" />
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">In Progress</h2>
            </div>
            {inProgressTasks.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400 p-4 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 text-center">
                No tasks in progress.
              </p>
            ) : (
              <div className="space-y-2">
                {inProgressTasks.map((t) => (
                  <TaskRow key={t.id} task={t} />
                ))}
              </div>
            )}
          </section>

          <section>
            <div className="flex items-center gap-2 mb-3">
              <CheckSquare className="h-5 w-5 text-blue-500" />
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">All My Tasks</h2>
            </div>
            <div className="space-y-2">
              {myTasks.map((t) => (
                <TaskRow key={t.id} task={t} />
              ))}
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section>
            <div className="flex items-center gap-2 mb-3">
              <FolderKanban className="h-5 w-5 text-primary-500" />
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">My Projects</h2>
            </div>
            <div className="space-y-4">
              {myProjects.map((p) => (
                <ProjectCard key={p.id} project={p} />
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}



