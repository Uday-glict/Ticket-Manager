import { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  MoreHorizontal,
  UserPlus,
  Trash2,
  MessageSquare,
  Send,
  Reply,
  Pencil,
  FileText,
  Activity,
  AlertCircle,
  CheckCircle2,
  CircleDot,
  Tag,
  Loader2,
} from 'lucide-react';
import { taskService } from '../../services/taskService';
import { projectService } from '../../services/projectService';
import { commentService } from '../../services/commentService';
import { auditService } from '../../services/auditService';
import { userService } from '../../services/userService';
import { useAuth } from '../../context/AuthContext';
import type { Comment, Priority, Task, Project, User } from '../../types';
import { mapUser, mapComment, mapAuditLog, mapTask, mapProject } from '../../utils/mappers';
import { Badge } from '../../components/common/Badge';
import { Avatar } from '../../components/common/Avatar';
import { Button } from '../../components/common/Button';
import { Select } from '../../components/common/Select';
import { Dropdown } from '../../components/common/Dropdown';
import { Modal } from '../../components/common/Modal';
import { DatePicker } from '../../components/common/DatePicker';

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

const priorityOptions = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

const activityIcons: Record<string, typeof CheckCircle2> = {
  created: CircleDot,
  updated: Pencil,
  completed: CheckCircle2,
  commented: MessageSquare,
  assigned: UserPlus,
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function getStatusBadgeVariant(color: string) {
  if (color.includes('22c55e') || color.includes('green')) return 'success';
  if (color.includes('3b82f6') || color.includes('blue')) return 'info';
  if (color.includes('f59e0b') || color.includes('amber')) return 'warning';
  if (color.includes('a855f7') || color.includes('purple')) return 'info';
  return 'default';
}

function buildCommentTree(comments: Comment[], taskId: string) {
  const taskComments = comments.filter(c => c.taskId === taskId);
  const map = new Map<string, Comment & { replies: Comment[] }>();
  const roots: (Comment & { replies: Comment[] })[] = [];

  for (const c of taskComments) {
    map.set(c.id, { ...c, replies: [] });
  }

  for (const c of taskComments) {
    const node = map.get(c.id)!;
    if (c.parentId && map.has(c.parentId)) {
      map.get(c.parentId)!.replies.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
}

interface CommentItemProps {
  comment: Comment & { replies: Comment[] };
  currentUser: { id: string };
  onReply: (commentId: string) => void;
  onEdit: (commentId: string, content: string) => void;
  onDelete: (commentId: string) => void;
  replyingTo: string | null;
  replyContent: string;
  onReplyContentChange: (value: string) => void;
  onSubmitReply: (parentId: string) => void;
  onCancelReply: () => void;
  editingCommentId: string | null;
  editContent: string;
  onEditContentChange: (value: string) => void;
  onSubmitEdit: (commentId: string) => void;
  onCancelEdit: () => void;
  depth: number;
  users: User[];
}

function CommentItem({
  comment,
  currentUser,
  onReply,
  onEdit,
  onDelete,
  replyingTo,
  replyContent,
  onReplyContentChange,
  onSubmitReply,
  onCancelReply,
  editingCommentId,
  editContent,
  onEditContentChange,
  onSubmitEdit,
  onCancelEdit,
  depth,
  users,
}: CommentItemProps & { users: User[] }) {
  const user = users.find(u => u.id === comment.userId);
  const isOwn = comment.userId === currentUser.id;
  const isEditing = editingCommentId === comment.id;
  const isReplying = replyingTo === comment.id;

  return (
    <div className={depth > 0 ? 'ml-8' : ''}>
      <div className="flex gap-3">
        <Avatar src={user?.avatar} name={user?.name ?? 'Unknown'} size="sm" />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-slate-900 dark:text-slate-100 text-sm">
              {user?.name ?? 'Unknown'}
            </span>
            <span className="text-xs text-slate-400 dark:text-slate-500">
              {formatDateTime(comment.createdAt)}
            </span>
            {comment.updatedAt && (
              <span className="text-xs text-slate-400 dark:text-slate-500">(edited)</span>
            )}
          </div>

          {isEditing ? (
            <div className="mt-1">
              <textarea
                value={editContent}
                onChange={e => onEditContentChange(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 min-h-[60px] cursor-pointer"
              />
              <div className="flex gap-2 mt-2">
                <Button size="sm" onClick={() => onSubmitEdit(comment.id)} disabled={!editContent.trim()}>
                  Save
                </Button>
                <Button size="sm" variant="ghost" onClick={onCancelEdit}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <p className="mt-1 text-slate-700 dark:text-slate-300 text-sm whitespace-pre-wrap">
              {comment.content}
            </p>
          )}

          {!isEditing && (
            <div className="flex items-center gap-3 mt-2">
              <button
                onClick={() => onReply(comment.id)}
                className="flex items-center gap-1 text-xs text-slate-400 hover:text-primary-500 transition-colors cursor-pointer"
              >
                <Reply className="h-3.5 w-3.5" />
                Reply
              </button>
              {isOwn && (
                <>
                  <button
                    onClick={() => onEdit(comment.id, comment.content)}
                    className="flex items-center gap-1 text-xs text-slate-400 hover:text-primary-500 transition-colors cursor-pointer"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                  </button>
                  <button
                    onClick={() => onDelete(comment.id)}
                    className="flex items-center gap-1 text-xs text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </button>
                </>
              )}
            </div>
          )}

          {isReplying && (
            <div className="mt-3 flex gap-2">
              <input
                type="text"
                value={replyContent}
                onChange={e => onReplyContentChange(e.target.value)}
                placeholder="Write a reply..."
                className="flex-1 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer"
                onKeyDown={e => {
                  if (e.key === 'Enter') onSubmitReply(comment.id);
                  if (e.key === 'Escape') onCancelReply();
                }}
                autoFocus
              />
              <Button size="sm" onClick={() => onSubmitReply(comment.id)} disabled={!replyContent.trim()}>
                <Send className="h-3.5 w-3.5" />
              </Button>
              <Button size="sm" variant="ghost" onClick={onCancelReply}>
                Cancel
              </Button>
            </div>
          )}
        </div>
      </div>

      {comment.replies.length > 0 && (
        <div className="mt-3 space-y-3">
          {comment.replies.map(reply => (
            <CommentItem
              key={reply.id}
              comment={{ ...reply, replies: [] }}
              currentUser={currentUser}
              users={users}
              onReply={onReply}
              onEdit={onEdit}
              onDelete={onDelete}
              replyingTo={replyingTo}
              replyContent={replyContent}
              onReplyContentChange={onReplyContentChange}
              onSubmitReply={onSubmitReply}
              onCancelReply={onCancelReply}
              editingCommentId={editingCommentId}
              editContent={editContent}
              onEditContentChange={onEditContentChange}
              onSubmitEdit={onSubmitEdit}
              onCancelEdit={onCancelEdit}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function TaskDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: currentUser, hasPermission } = useAuth();
  const canUpdate = hasPermission('tickets.update');
  const canDelete = hasPermission('tickets.delete');

  const [task, setTask] = useState<Task | null>(null);
  const [project, setProject] = useState<Project | undefined>();
  const [users, setUsers] = useState<User[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [reassignUserId, setReassignUserId] = useState('');
  const [reassignReason, setReassignReason] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      taskService.get(id),
      commentService.getByTask(id),
      auditService.list({ entity_type: 'tasks' }),
      userService.list(),
    ]).then(([taskRes, commentsRes, auditRes, usersRes]) => {
      setTask(mapTask(taskRes.data.data || taskRes.data));
      setComments((commentsRes.data.data || commentsRes.data || []).map(mapComment));
      setActivities((auditRes.data.data || auditRes.data || []).map(mapAuditLog));
      setUsers((usersRes.data.data || usersRes.data || []).map(mapUser));
      return projectService.get(mapTask(taskRes.data.data || taskRes.data).projectId);
    }).then(projectRes => {
      setProject(mapProject(projectRes.data.data || projectRes.data));
    }).finally(() => setLoading(false));
  }, [id]);

  const commentTree = useMemo(
    () => (task ? buildCommentTree(comments, task.id) : []),
    [comments, task]
  );

  const taskActivities = useMemo(
    () =>
      task
        ? activities
            .filter(a => a.record === task.id)
            .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        : [],
    [activities, task]
  );

  const statusOptions = useMemo(() => {
    if (!project) return [];
    return project.statuses
      .filter(s => s.enabled)
      .sort((a, b) => a.order - b.order)
      .map(s => ({ value: s.id, label: s.name }));
  }, [project]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!task) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <AlertCircle className="h-12 w-12 text-slate-400 mb-4" />
        <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-300 mb-2">Task not found</h2>
        <p className="text-slate-500 dark:text-slate-400 mb-4">The task you are looking for does not exist.</p>
        <Button onClick={() => navigate('/tasks')}>
          <ArrowLeft className="h-4 w-4" />
          Back to Tasks
        </Button>
      </div>
    );
  }

  const assignedUser = task.assignedTo ? users.find(u => u.id === task.assignedTo) : null;
  const createdByUser = users.find(u => u.id === task.createdBy);

  const handlePriorityChange = async (value: string) => {
    try {
      await taskService.update(task.id, { priority: value });
      setTask(prev => prev ? { ...prev, priority: value as Priority, updatedAt: new Date().toISOString() } : prev);
    } catch {}
  };

  const handleStatusChange = async (value: string) => {
    try {
      await taskService.update(task.id, { status_id: value });
      setTask(prev => prev ? { ...prev, statusId: value, updatedAt: new Date().toISOString() } : prev);
    } catch {}
  };

  const handleStartDateChange = async (value: string) => {
    try {
      await taskService.update(task.id, { start_date: value || null });
      setTask(prev => prev ? { ...prev, startDate: value || undefined, updatedAt: new Date().toISOString() } : prev);
    } catch {}
  };

  const handleDueDateChange = async (value: string) => {
    try {
      await taskService.update(task.id, { due_date: value || null });
      setTask(prev => prev ? { ...prev, dueDate: value || undefined, updatedAt: new Date().toISOString() } : prev);
    } catch {}
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    try {
      const res = await commentService.create({ task_id: task.id, content: newComment.trim() });
      setComments(prev => [...prev, res.data]);
      setNewComment('');
    } catch {}
  };

  const handleReply = async (parentId: string) => {
    if (!replyContent.trim()) return;
    try {
      const res = await commentService.create({ task_id: task.id, content: replyContent.trim(), parent_id: parentId });
      setComments(prev => [...prev, res.data]);
      setReplyContent('');
      setReplyingTo(null);
    } catch {}
  };

  const handleEditComment = async (commentId: string) => {
    if (!editContent.trim()) return;
    try {
      await commentService.update(commentId, { content: editContent.trim() });
      setComments(prev =>
        prev.map(c =>
          c.id === commentId ? { ...c, content: editContent.trim(), updatedAt: new Date().toISOString() } : c
        )
      );
      setEditingCommentId(null);
      setEditContent('');
    } catch {}
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await commentService.delete(commentId);
      setComments(prev => prev.filter(c => c.id !== commentId && c.parentId !== commentId));
    } catch {}
  };

  const handleReassign = async () => {
    if (!reassignUserId) return;
    try {
      await taskService.reassign(task.id, { user_id: reassignUserId, reason: reassignReason || undefined });
      setTask(prev => prev ? { ...prev, assignedTo: reassignUserId, updatedAt: new Date().toISOString() } : prev);
      setShowReassignModal(false);
      setReassignUserId('');
      setReassignReason('');
    } catch {}
  };

  const handleDeleteTask = async () => {
    try {
      await taskService.update(task.id, { status_id: '__deleted__' });
    } catch {}
    navigate('/tasks');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/tasks')}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-5 w-5 text-slate-600 dark:text-slate-400" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{task.title}</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{task.id}</p>
          </div>
        </div>
        <Dropdown
          trigger={
            <button className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer">
              <MoreHorizontal className="h-5 w-5 text-slate-600 dark:text-slate-400" />
            </button>
          }
          items={[
            ...(canUpdate ? [{
              label: 'Reassign',
              icon: <UserPlus className="h-4 w-4" />,
              onClick: () => {
                setReassignUserId(task.assignedTo || '');
                setShowReassignModal(true);
              },
            }] : []),
            ...(canUpdate ? priorityOptions.map(p => ({
              label: `Priority: ${p.label}`,
              icon: <Tag className="h-4 w-4" />,
              onClick: () => handlePriorityChange(p.value),
            })) : []),
            ...(canDelete ? [{
              label: 'Delete',
              icon: <Trash2 className="h-4 w-4" />,
              danger: true,
              onClick: () => setShowDeleteConfirm(true),
            }] : []),
          ]}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
              <FileText className="h-5 w-5 text-slate-500" />
              Description
            </h2>
            {task.description ? (
              <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                {task.description}
              </p>
            ) : (
              <p className="text-slate-400 dark:text-slate-500 italic">No description provided.</p>
            )}
          </div>

          {/* Comments Section */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-slate-500" />
              Comments ({commentTree.length})
            </h2>

            <div className="space-y-4">
              {commentTree.length === 0 ? (
                <p className="text-slate-400 dark:text-slate-500 text-center py-6">No comments yet.</p>
              ) : (
                commentTree.map(comment => (
                  <CommentItem
                    key={comment.id}
                    comment={comment}
                    currentUser={currentUser ? { id: currentUser.id } : { id: '' }}
                    users={users}
                    onReply={(cId) => {
                      setReplyingTo(cId);
                      setReplyContent('');
                    }}
                    onEdit={(cId, content) => {
                      setEditingCommentId(cId);
                      setEditContent(content);
                    }}
                    onDelete={handleDeleteComment}
                    replyingTo={replyingTo}
                    replyContent={replyContent}
                    onReplyContentChange={setReplyContent}
                    onSubmitReply={handleReply}
                    onCancelReply={() => setReplyingTo(null)}
                    editingCommentId={editingCommentId}
                    editContent={editContent}
                    onEditContentChange={setEditContent}
                    onSubmitEdit={handleEditComment}
                    onCancelEdit={() => setEditingCommentId(null)}
                    depth={0}
                  />
                ))
              )}
            </div>

            {/* New Comment */}
            <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
              <div className="flex gap-3">
                <Avatar src={currentUser?.avatar} name={currentUser?.name ?? 'You'} size="sm" />
                <div className="flex-1">
                  <textarea
                    value={newComment}
                    onChange={e => setNewComment(e.target.value)}
                    placeholder="Write a comment..."
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 min-h-[80px] cursor-pointer"
                    onKeyDown={e => {
                      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                        handleAddComment();
                      }
                    }}
                  />
                  <div className="flex justify-end mt-2">
                    <Button size="sm" onClick={handleAddComment} disabled={!newComment.trim()}>
                      <Send className="h-4 w-4" />
                      Comment
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Activity Timeline */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
              <Activity className="h-5 w-5 text-slate-500" />
              Activity
            </h2>

            {taskActivities.length === 0 ? (
              <p className="text-slate-400 dark:text-slate-500 text-center py-6">No activity recorded.</p>
            ) : (
              <div className="space-y-4">
                {taskActivities.map(activity => {
                  const user = users.find(u => u.id === activity.userId);
                  const Icon = activityIcons[activity.action] || CircleDot;

                  return (
                    <div key={activity.id} className="flex gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                          <Icon className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-slate-700 dark:text-slate-300">
                          <span className="font-medium">{user?.name ?? 'Unknown'}</span>{' '}
                          <span className="text-slate-500 dark:text-slate-400">{activity.action}</span>{' '}
                          <span className="text-slate-500 dark:text-slate-400">{activity.entity}</span>
                          {activity.newValue && activity.action === 'assigned' && (
                            <span className="text-slate-500 dark:text-slate-400">
                              {' → '}
                              {users.find((u: User) => u.id === activity.newValue)?.name ?? activity.newValue}
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                          {formatDateTime(activity.createdAt)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6 space-y-5">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Details</h2>

            <div>
              <label className="text-sm text-slate-500 dark:text-slate-400">Project</label>
              {project ? (
                <Link
                  to={`/projects/${project.id}`}
                  className="block mt-1 text-primary-600 dark:text-primary-400 hover:underline font-medium cursor-pointer"
                >
                  {project.name}
                </Link>
              ) : (
                <p className="mt-1 text-slate-700 dark:text-slate-300">—</p>
              )}
            </div>

            <div>
              <label className="text-sm text-slate-500 dark:text-slate-400">Assigned To</label>
              {assignedUser ? (
                <div className="flex items-center gap-2 mt-1">
                  <Avatar src={assignedUser.avatar} name={assignedUser.name} size="sm" />
                  <span className="text-slate-700 dark:text-slate-300 font-medium">{assignedUser.name}</span>
                </div>
              ) : (
                <p className="mt-1 text-slate-400 dark:text-slate-500 italic">Unassigned</p>
              )}
            </div>

            <div>
              <label className="text-sm text-slate-500 dark:text-slate-400">Status</label>
              <div className="mt-1">
                {canUpdate ? <Select options={statusOptions} value={task.statusId} onChange={e => handleStatusChange(e.target.value)} /> : <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">{statusOptions.find(s => s.value === task.statusId)?.label ?? task.statusId}</p>}
              </div>
            </div>

            <div>
              <label className="text-sm text-slate-500 dark:text-slate-400">Priority</label>
              <div className="mt-1">
                {canUpdate ? <Select options={priorityOptions} value={task.priority} onChange={e => handlePriorityChange(e.target.value)} /> : <p className="mt-1 text-sm capitalize text-slate-700 dark:text-slate-300">{task.priority}</p>}
              </div>
            </div>

            <div>
              <label className="text-sm text-slate-500 dark:text-slate-400">Start Date</label>
              <div className="mt-1">
                {canUpdate ? <DatePicker value={task.startDate ? task.startDate.split('T')[0] : undefined} onChange={handleStartDateChange} /> : <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">{task.startDate ? formatDate(task.startDate) : '—'}</p>}
              </div>
            </div>

            <div>
              <label className="text-sm text-slate-500 dark:text-slate-400">Due Date</label>
              <div className="mt-1">
                {canUpdate ? <DatePicker value={task.dueDate ? task.dueDate.split('T')[0] : undefined} onChange={handleDueDateChange} /> : <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">{task.dueDate ? formatDate(task.dueDate) : '—'}</p>}
              </div>
            </div>

            <hr className="border-slate-200 dark:border-slate-700" />

            <div>
              <label className="text-sm text-slate-500 dark:text-slate-400">Created By</label>
              <p className="mt-1 text-slate-700 dark:text-slate-300 font-medium">{createdByUser?.name ?? '—'}</p>
            </div>

            <div>
              <label className="text-sm text-slate-500 dark:text-slate-400">Created At</label>
              <p className="mt-1 text-slate-700 dark:text-slate-300">{formatDateTime(task.createdAt)}</p>
            </div>

            <div>
              <label className="text-sm text-slate-500 dark:text-slate-400">Updated At</label>
              <p className="mt-1 text-slate-700 dark:text-slate-300">{formatDateTime(task.updatedAt)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Reassignment Modal */}
      <Modal isOpen={showReassignModal} onClose={() => setShowReassignModal(false)} title="Reassign Task" size="md">
        <div className="space-y-4">
          <div>
            <label className="text-sm text-slate-500 dark:text-slate-400">Current Assignee</label>
            {assignedUser ? (
              <div className="flex items-center gap-2 mt-1">
                <Avatar src={assignedUser.avatar} name={assignedUser.name} size="sm" />
                <span className="text-slate-700 dark:text-slate-300 font-medium">{assignedUser.name}</span>
              </div>
            ) : (
              <p className="mt-1 text-slate-400 dark:text-slate-500 italic">Unassigned</p>
            )}
          </div>
          <Select
            label="New Assignee"
            options={users.map(u => ({ value: u.id, label: u.name }))}
            value={reassignUserId}
            onChange={e => setReassignUserId(e.target.value)}
            placeholder="Select a user"
          />
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Reason (optional)
            </label>
            <textarea
              value={reassignReason}
              onChange={e => setReassignReason(e.target.value)}
              placeholder="Why are you reassigning this task?"
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 min-h-[80px] cursor-pointer"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setShowReassignModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleReassign} disabled={!reassignUserId}>
              Reassign
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)} title="Delete Task" size="sm">
        <div className="space-y-4">
          <p className="text-slate-700 dark:text-slate-300">
            Are you sure you want to delete this task? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setShowDeleteConfirm(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDeleteTask}>
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}


