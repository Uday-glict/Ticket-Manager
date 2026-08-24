# Project/Task/Role Management UI Enhancement Design

**Date:** 2026-08-24
**Context:** Frontend already has 14 pages, 27 components, dynamic API integration via mappers, but App.tsx routing is incomplete and Project add/edit flows are not unified.

## 1. Goal
Complete all management flows (Project add/edit/delete, Task create/detail/list/board, User/Role CRUD) with dynamic API integration, no duplication, existing flow preserved, backend at 8000 via vite proxy.

## 2. Gap Analysis
- **App.tsx:** Missing routes: `/projects/create` (CreateProjectPage exists but not routed), `/projects/:id` (ProjectDetailsPage), `/tasks/create` (CreateTaskPage), `/tasks/:id` (TaskDetailPage), `/roles/new` & `/roles/:id/edit` (RoleFormPage). Only 7 routes registered vs 10 defined in ROUTES.
- **CreateProjectPage:** Create-only. No edit mode. Should handle `PUT /projects/:id` plus diff for members/statuses. Should redirect to `/dashboard` per spec (currently `/projects`).
- **ProjectDetailsPage:** Has edit-free view + status-config link but no explicit Edit/Delete header actions. Needs Edit button -> `/projects/:id/edit` and Delete with ConfirmDialog + toast + redirect.
- **Task flow:** TaskListPage dynamic via mappers, but CreateTaskPage and TaskDetailPage not reachable without routes. Verify dynamic assignment/status handling.
- **Roles:** RoleListPage navigates to `/roles/new` vs ROUTES.ROLE_CREATE=`/roles/create` mismatch. RoleFormPage expects `:id` for edit, but route missing.
- **Users:** UserListPage + UserFormModal currently do optimistic local state, needs API-backed create/update/toggle via `userService`.

## 3. Approach Options
**A) Minimal routing fix (Recommended):** Add missing Routes in App.tsx, extend CreateProjectPage to support edit via `useParams`, fix ROLE_CREATE path mismatch, add Edit/Delete to ProjectDetails header. Reuse existing components, no new screens.
- Pros: No duplication, least risk, preserves flow.
- Cons: None.

**B) Separate Edit screens:** Create distinct `EditProjectPage`, `EditTaskPage` duplicating create logic.
- Cons: Duplication, violates guideline.

**C) Full refactor with feature folders:** Restructure into `features/projects` etc.
- Cons: Unnecessary architecture change.

**Chosen: A**

## 4. Detailed Design

### 4.1 Routing (App.tsx)
Add:
- `/projects/create` -> CreateProjectPage
- `/projects/:id` -> ProjectDetailsPage
- `/projects/:id/edit` -> CreateProjectPage (edit mode)
- `/tasks/create` -> CreateTaskPage
- `/tasks/:id` -> TaskDetailPage
- `/roles/create` -> RoleFormPage
- `/roles/:id/edit` -> RoleFormPage (already reads :id)
- Keep existing `/projects`, `/tasks`, `/roles`, `/board`, `/users` etc.
- Wrap all new routes inside `<AppShell>` as authenticated routes.
- Fix RoleListPage navigate from `/roles/new` to `ROUTES.ROLE_CREATE`.

### 4.2 Project Add/Edit (CreateProjectPage)
- Detect `id` param via `useParams`. If present, set `isEditing=true`, fetch `projectService.get(id)`, `getMembers`, `getStatuses`, prefill states. Loading skeleton while fetching.
- On save: if editing, `PUT /projects/:id` for base fields, then diff members: remove missing, add new, update role changes; diff statuses: update existing, create new, delete removed. If creating, existing flow (create + add members/statuses).
- Success: `toast.success(projectRes.message || ...)` via `useToast`, then `navigate(ROUTES.DASHBOARD)` per spec.
- Error: `getErrorMessage(err)` -> toast + field errors.
- Validation: name required, dates optional, manager optional.
- Reuse `mapProject` for prefills.

### 4.3 Delete Project
- Keep ProjectListPage ConfirmDialog + `projectService.delete`. Add toast success/error via `getErrorMessage`, call `toast`.
- Add Delete in ProjectDetailsPage header (Trash2 + ConfirmDialog), on success navigate to dashboard.

### 4.4 Task Management (Dynamic)
- No new screen needed; ensure TaskListPage already dynamic via `mapTask`/`mapProject`/`mapUser`.
- Ensure CreateTaskPage navigates to dashboard on success (currently `/tasks`, change to `/dashboard` per spec or keep `/tasks`? Spec says dashboard for projects only; keep `/tasks` for tasks).
- TaskDetailPage: ensure all actions (status change, assign, comment add/update/delete) call APIs and show toast via backend message, already dynamic.
- Board: already dynamic via `boardService` proxy.
- Add missing routes only.

### 4.5 User Roles & Settings End-to-End
- UserListPage: replace optimistic `handleSave`/`handleToggleStatus` with API calls: `userService.create/update/toggleStatus`, map responses, toast.
- RoleListPage + RoleFormPage: fix route mismatch, ensure create/update/delete via `roleService`, toast.
- Settings: ProfilePage already uses toast placeholder; keep as is. AuditLogPage already dynamic.
- AppShell Sidebar: ensure navigation links include new routes.

### 4.6 API Integration
- Base via `apiClient` -> `/api/v1` -> vite proxy `http://localhost:8000` (already fixed). No hardcoded 8000 in services.
- Ensure all new flows use existing services (`projectService`, `taskService`, `userService`, `roleService`, etc.) + `getErrorMessage` + `useToast`.

### 4.7 Code Quality
- No new duplicate components; reuse Button/Input/Select/DatePicker/Switch/ConfirmDialog/Table.
- Keep file paths same; only modify App.tsx, CreateProjectPage, ProjectDetailsPage, UserListPage, RoleListPage.
- Add `frontend/src/utils/mappers.ts` already centralizes snake_case mapping.

## 5. Testing
- Verify `npm run build` passes.
- Manual: Create project -> redirects dashboard, appears in list; Edit project -> changes persist; Delete -> ConfirmDialog + removed; Create task -> appears in TaskList & Board; Assign task; Roles create/edit/delete; User invite/edit.

## 6. Risks
- Edit diff logic must handle concurrent member/status updates atomically; do sequential awaits with error handling.
- Ensure missing `isSystem` guard prevents editing system roles.

---
Approved: pending user review
