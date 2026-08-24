import type { User, Role, Project, Task, Comment, Activity, AuditLog } from '../types';

export function mapUser(raw: any): User {
  return {
    id: raw.id,
    name: raw.name,
    email: raw.email,
    avatar: raw.avatar || undefined,
    status: raw.status || 'active',
    lastLogin: raw.last_login || raw.lastLogin || undefined,
    createdAt: raw.created_at || raw.createdAt || new Date().toISOString(),
  };
}

export function mapRole(raw: any): Role {
  return {
    id: raw.id,
    name: raw.name,
    description: raw.description || undefined,
    permissions: raw.permissions || [],
    isSystem: raw.is_system ?? raw.isSystem ?? false,
    createdAt: raw.created_at || raw.createdAt || new Date().toISOString(),
  };
}

export function mapProject(raw: any): Project {
  return {
    id: raw.id,
    name: raw.name,
    description: raw.description || '',
    managerId: raw.manager_id || raw.managerId || '',
    members: (raw.members || []).map((m: any) => ({ userId: m.user_id || m.userId, roleId: m.role_id || m.roleId })),
    statuses: (raw.statuses || []).map((s: any) => ({
      id: s.id,
      name: s.name,
      color: s.color,
      order: s.order ?? s.display_order ?? 0,
      enabled: s.enabled ?? s.is_enabled ?? true,
    })),
    startDate: raw.start_date || raw.startDate || '',
    endDate: raw.end_date || raw.endDate || undefined,
    status: raw.status || 'active',
    createdAt: raw.created_at || raw.createdAt || new Date().toISOString(),
  };
}

export function mapTask(raw: any): Task {
  return {
    id: raw.id,
    title: raw.title,
    description: raw.description || undefined,
    projectId: raw.project_id || raw.projectId,
    assignedTo: raw.assigned_to || raw.assignedTo || undefined,
    createdBy: raw.created_by || raw.createdBy,
    priority: raw.priority || 'medium',
    statusId: raw.status_id || raw.statusId,
    startDate: raw.start_date || raw.startDate || undefined,
    dueDate: raw.due_date || raw.dueDate || undefined,
    attachments: raw.attachments || undefined,
    createdAt: raw.created_at || raw.createdAt || new Date().toISOString(),
    updatedAt: raw.updated_at || raw.updatedAt || new Date().toISOString(),
    teamId: raw.team_id || raw.teamId || undefined,
    sprintId: raw.sprint_id || raw.sprintId || undefined,
    ticketKey: raw.ticket_key || raw.ticketKey || raw.ticket_number || undefined,
    assigneeIds: raw.assignee_ids || raw.assigneeIds || (raw.assigned_to ? [raw.assigned_to] : undefined),
  };
}

export function mapTeam(raw: any): import('../types').Team {
  return {
    id: raw.id,
    projectId: raw.project_id || raw.projectId,
    name: raw.name,
    description: raw.description || undefined,
    status: raw.status || 'active',
    memberIds: raw.member_ids || raw.memberIds || (raw.members || []).map((m: any) => m.user_id || m.userId || m) || [],
    createdBy: raw.created_by || raw.createdBy || '',
    createdAt: raw.created_at || raw.createdAt || new Date().toISOString(),
    updatedAt: raw.updated_at || raw.updatedAt || new Date().toISOString(),
  };
}

export function mapSprint(raw: any): import('../types').Sprint {
  return {
    id: raw.id,
    projectId: raw.project_id || raw.projectId,
    teamId: raw.team_id || raw.teamId || undefined,
    name: raw.name,
    description: raw.description || undefined,
    goal: raw.goal || undefined,
    startDate: raw.start_date || raw.startDate || '',
    endDate: raw.end_date || raw.endDate || '',
    status: raw.status || 'PLANNED',
    createdBy: raw.created_by || raw.createdBy || '',
    createdAt: raw.created_at || raw.createdAt || new Date().toISOString(),
    updatedAt: raw.updated_at || raw.updatedAt || new Date().toISOString(),
  };
}

export function mapComment(raw: any): Comment {
  return {
    id: raw.id,
    taskId: raw.task_id || raw.taskId,
    userId: raw.user_id || raw.userId,
    content: raw.content,
    parentId: raw.parent_id || raw.parentId || undefined,
    createdAt: raw.created_at || raw.createdAt || new Date().toISOString(),
    updatedAt: raw.updated_at || raw.updatedAt || undefined,
  };
}

export function mapActivity(raw: any): Activity {
  return {
    id: raw.id,
    userId: raw.user_id || raw.userId,
    action: raw.action,
    entity: raw.entity || raw.entity_type || raw.entityType || '',
    entityId: raw.entity_id || raw.entityId || '',
    entityName: raw.entity_name || raw.entityName || '',
    previousValue: raw.previous_value || raw.previousValue || undefined,
    newValue: raw.new_value || raw.newValue || undefined,
    createdAt: raw.created_at || raw.createdAt || new Date().toISOString(),
  };
}

export function mapAuditLog(raw: any): AuditLog {
  return {
    id: raw.id,
    userId: raw.user_id || raw.userId,
    action: raw.action,
    module: raw.module || raw.entity_type || raw.entityType || '',
    record: raw.record || raw.entity_name || raw.entityName || '',
    previousValue: raw.previous_value || raw.previousValue || undefined,
    newValue: raw.new_value || raw.newValue || undefined,
    createdAt: raw.created_at || raw.createdAt || new Date().toISOString(),
  };
}

export function mapCalendarEvent(raw: any): import('../types').CalendarEvent {
  return {
    id: raw.id,
    type: raw.type,
    title: raw.title,
    start: raw.start,
    end: raw.end,
    projectId: raw.project_id || raw.projectId,
    sprintId: raw.sprint_id || raw.sprintId || undefined,
    teamId: raw.team_id || raw.teamId || undefined,
    status: raw.status_id || raw.statusId || raw.status || undefined,
    ticketId: raw.task_id || raw.ticket_id || raw.ticketId || undefined,
    color: raw.color || undefined,
  };
}
