import { FolderKanban, CheckCircle, CheckSquare, AlertTriangle, Clock, MessageSquare, Plus, ArrowRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { mockProjects, mockTasks, mockUsers, mockActivities } from '../../utils/mockData';
import { Avatar } from '../../components/common/Avatar';
import { Badge } from '../../components/common/Badge';

const TASK_STATUS_COLORS: Record<string, string> = {
  'To Do': '#94a3b8',
  'In Progress': '#3b82f6',
  'Done': '#22c55e',
  'Review': '#f59e0b',
};

function getTaskStatusCounts() {
  const counts: Record<string, number> = {};
  for (const task of mockTasks) {
    const project = mockProjects.find(p => p.id === task.projectId);
    const status = project?.statuses.find(s => s.id === task.statusId);
    const name = status?.name ?? 'Unknown';
    counts[name] = (counts[name] || 0) + 1;
  }
  return Object.entries(counts).map(([name, value]) => ({ name, value }));
}

function isOverdue(dueDate?: string) {
  if (!dueDate) return false;
  return new Date(dueDate) < new Date();
}

function getProjectProgress(projectId: string) {
  const tasks = mockTasks.filter(t => t.projectId === projectId);
  const project = mockProjects.find(p => p.id === projectId);
  if (!project || tasks.length === 0) return 0;
  const completed = tasks.filter(t => {
    const status = project.statuses.find(s => s.id === t.statusId);
    return status?.name.toLowerCase().includes('complet') || status?.name.toLowerCase() === 'done';
  }).length;
  return Math.round((completed / tasks.length) * 100);
}

function getTeamWorkload() {
  return mockUsers.map(user => {
    const assigned = mockTasks.filter(t => t.assignedTo === user.id);
    const completed = assigned.filter(t => {
      const project = mockProjects.find(p => p.id === t.projectId);
      const status = project?.statuses.find(s => s.id === t.statusId);
      return status?.name.toLowerCase().includes('complet') || status?.name.toLowerCase() === 'done';
    });
    const overdue = assigned.filter(t => isOverdue(t.dueDate));
    return {
      ...user,
      totalAssigned: assigned.length,
      completedCount: completed.length,
      pendingCount: assigned.length - completed.length,
      overdueCount: overdue.length,
    };
  });
}

const actionIcons: Record<string, typeof Clock> = {
  completed: CheckCircle,
  created: Plus,
  updated: ArrowRight,
  commented: MessageSquare,
  assigned: ArrowRight,
};

const actionColors: Record<string, string> = {
  completed: 'text-emerald-500',
  created: 'text-blue-500',
  updated: 'text-amber-500',
  commented: 'text-purple-500',
  assigned: 'text-cyan-500',
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

const workload = getTeamWorkload();
const taskStatusData = getTaskStatusCounts();
const overdueCount = mockTasks.filter(t => isOverdue(t.dueDate)).length;

const kpis = [
  { label: 'Total Projects', value: mockProjects.length, icon: FolderKanban, color: 'bg-blue-500', lightBg: 'bg-blue-50 dark:bg-blue-900/20' },
  { label: 'Active Projects', value: mockProjects.filter(p => p.status === 'active').length, icon: CheckCircle, color: 'bg-emerald-500', lightBg: 'bg-emerald-50 dark:bg-emerald-900/20' },
  { label: 'Total Tasks', value: mockTasks.length, icon: CheckSquare, color: 'bg-violet-500', lightBg: 'bg-violet-50 dark:bg-violet-900/20' },
  { label: 'Overdue Tasks', value: overdueCount, icon: AlertTriangle, color: 'bg-red-500', lightBg: 'bg-red-50 dark:bg-red-900/20' },
];

export default function AdminDashboard() {
  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Admin Dashboard</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Overview of all projects, tasks, and team performance.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(kpi => (
          <div key={kpi.label} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 flex items-center gap-4 cursor-pointer hover:shadow-md transition-shadow">
            <div className={`${kpi.color} rounded-lg p-3`}>
              <kpi.icon className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{kpi.value}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">{kpi.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Project Progress */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Project Progress</h2>
          <div className="space-y-4">
            {mockProjects.map(project => {
              const progress = getProjectProgress(project.id);
              return (
                <div key={project.id} className="cursor-pointer">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{project.name}</span>
                    <span className="text-sm font-semibold text-slate-900 dark:text-white">{progress}%</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2.5">
                    <div
                      className="h-2.5 rounded-full transition-all duration-500"
                      style={{
                        width: `${progress}%`,
                        backgroundColor: progress >= 100 ? '#22c55e' : progress >= 50 ? '#3b82f6' : '#f59e0b',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Task Status Chart */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Task Status Distribution</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={taskStatusData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#f8fafc' }}
                  cursor={{ fill: 'rgba(148, 163, 184, 0.1)' }}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {taskStatusData.map((entry) => (
                    <Cell key={entry.name} fill={TASK_STATUS_COLORS[entry.name] || '#94a3b8'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Team Workload */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Team Workload</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700">
                <th className="text-left py-3 px-4 font-medium text-slate-500 dark:text-slate-400">Member</th>
                <th className="text-center py-3 px-4 font-medium text-slate-500 dark:text-slate-400">Assigned</th>
                <th className="text-center py-3 px-4 font-medium text-slate-500 dark:text-slate-400">Completed</th>
                <th className="text-center py-3 px-4 font-medium text-slate-500 dark:text-slate-400">Pending</th>
                <th className="text-center py-3 px-4 font-medium text-slate-500 dark:text-slate-400">Overdue</th>
              </tr>
            </thead>
            <tbody>
              {workload.map(member => (
                <tr key={member.id} className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors cursor-pointer">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <Avatar src={member.avatar} name={member.name} size="sm" />
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">{member.name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{member.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="text-center py-3 px-4 font-medium text-slate-900 dark:text-white">{member.totalAssigned}</td>
                  <td className="text-center py-3 px-4">
                    <Badge variant="success">{member.completedCount}</Badge>
                  </td>
                  <td className="text-center py-3 px-4">
                    <Badge variant="info">{member.pendingCount}</Badge>
                  </td>
                  <td className="text-center py-3 px-4">
                    {member.overdueCount > 0 ? (
                      <Badge variant="danger">{member.overdueCount}</Badge>
                    ) : (
                      <span className="text-slate-400 dark:text-slate-500">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Recent Activity</h2>
        <div className="space-y-4">
          {[...mockActivities]
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .map(activity => {
              const user = mockUsers.find(u => u.id === activity.userId);
              const Icon = actionIcons[activity.action] || Clock;
              const colorClass = actionColors[activity.action] || 'text-slate-500';
              return (
                <div key={activity.id} className="flex items-start gap-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/30 rounded-lg p-2 -mx-2 transition-colors">
                  <div className="mt-0.5">
                    <Icon className={`h-5 w-5 ${colorClass}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-700 dark:text-slate-300">
                      <span className="font-medium text-slate-900 dark:text-white">{user?.name ?? 'Unknown'}</span>
                      {' '}{activity.action}{' '}
                      <span className="font-medium text-slate-900 dark:text-white">{activity.entityName}</span>
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                      {formatDate(activity.createdAt)} at {formatTime(activity.createdAt)}
                    </p>
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}
