# Task 2: TypeScript Types Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create the TypeScript type definitions for a Project Management System.

**Architecture:** Single file `src/types/index.ts` containing all interfaces and types as specified.

**Tech Stack:** TypeScript, Vite, React (for context)

## Global Constraints

- TypeScript 5.x
- Vite bundler mode with `verbatimModuleSyntax: true`
- No unused locals/parameters
- No emit (type checking only)

---

### Task 1: Create Type Definitions

**Files:**
- Create: `src/types/index.ts`

**Interfaces:**
- Consumes: None
- Produces: All exported interfaces and types listed in spec

- [ ] **Step 1: Create directory `src/types/`**

```bash
mkdir -p src/types
```

- [ ] **Step 2: Write `src/types/index.ts` with all types**

```typescript
// User
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  status: 'active' | 'inactive';
  lastLogin?: string;
  createdAt: string;
}

// Role
export interface Permission {
  id: string;
  name: string;
  group: string;
}

export interface Role {
  id: string;
  name: string;
  description?: string;
  permissions: string[]; // permission ids
  isSystem: boolean;
  createdAt: string;
}

// Project
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

// Task
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
}

export interface Attachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  uploadedAt: string;
}

// Comment
export interface Comment {
  id: string;
  taskId: string;
  userId: string;
  content: string;
  parentId?: string;
  createdAt: string;
  updatedAt?: string;
}

// Activity
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

// Audit Log
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

// Toast
export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}
```

- [ ] **Step 3: Verify TypeScript compilation**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 4: Commit changes**

```bash
git add src/types/index.ts
git commit -m "feat: add TypeScript type definitions for project management system"
```

- [ ] **Step 5: Write report**

Create `F:/SAVTech/Study/Project/TaskManager/.superpowers/sdd/2026-08-21-taskmanager-ui/task-2-report.md` with status, commits, test summary, concerns, report path.

---

## Self-Review

1. **Spec coverage:** All interfaces and types from spec are included.
2. **Placeholder scan:** No placeholders.
3. **Type consistency:** Types are self-contained; no cross-references needed.

Plan complete and saved to `docs/superpowers/plans/2026-08-21-task-2-typescript-types.md`. Two execution options:

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**