export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  status: 'active' | 'inactive';
  lastLogin?: string;
  createdAt: string;
}

export interface Permission {
  id: string;
  name: string;
  group: string;
}

export interface Role {
  id: string;
  name: string;
  description?: string;
  permissions: string[];
  isSystem: boolean;
  createdAt: string;
}

export interface ProjectStatus {
  id: string;
  name: string;
  color: string;
  order: number;
  enabled: boolean;
}

export interface ProjectMember {
  userId: string;
  roleId: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  managerId: string;
  members: ProjectMember[];
  statuses: ProjectStatus[];
  startDate: string;
  endDate?: string;
  status: 'active' | 'archived';
  createdAt: string;
}

export type Priority = 'low' | 'medium' | 'high' | 'urgent';

export interface Task {
  id: string;
  title: string;
  description?: string;
  projectId: string;
  assignedTo?: string;
  createdBy: string;
  priority: Priority;
  statusId: string;
  startDate?: string;
  dueDate?: string;
  attachments?: Attachment[];
  createdAt: string;
  updatedAt: string;
  teamId?: string;
  sprintId?: string;
  ticketKey?: string;
  assigneeIds?: string[];
}

export interface Team {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  status: 'active' | 'archived';
  memberIds: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface Sprint {
  id: string;
  projectId: string;
  teamId?: string;
  name: string;
  description?: string;
  goal?: string;
  startDate: string;
  endDate: string;
  status: 'PLANNED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface Ticket extends Task {
  ticketKey: string;
  teamId?: string;
  sprintId?: string;
  assigneeIds: string[];
}

export interface CalendarEvent {
  id: string;
  type: 'ticket' | 'sprint' | 'project';
  title: string;
  start: string;
  end: string;
  projectId: string;
  sprintId?: string;
  teamId?: string;
  status?: string;
  ticketId?: string;
  color?: string;
}

export interface Attachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  uploadedAt: string;
}

export interface Comment {
  id: string;
  taskId: string;
  userId: string;
  content: string;
  parentId?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Activity {
  id: string;
  userId: string;
  action: string;
  entity: string;
  entityId: string;
  entityName: string;
  previousValue?: string;
  newValue?: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  module: string;
  record: string;
  previousValue?: string;
  newValue?: string;
  createdAt: string;
}

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}
