# TaskManager Backend — Design Spec

## Overview

Production FastAPI backend for the TaskManager project management system. Modular monolith with PostgreSQL, JWT auth, role-based permissions, and dynamic project workflows.

**Stack:** Python 3.13, FastAPI, SQLAlchemy 2.x, Alembic, PostgreSQL, Pydantic v2, JWT, bcrypt

**Frontend:** Existing React + TypeScript app at port 5173, backend at port 3000

---

## Architecture

```
React Frontend (5173) → Vite proxy → FastAPI (3000)
    ↓
API Router (v1) → Schema validation → Auth dependency → Permission dependency
    ↓
Service Layer (business logic, transactions)
    ↓
Repository Layer (DB queries)
    ↓
SQLAlchemy 2.x → PostgreSQL
    ↓
Alembic migrations
```

### Layer Responsibilities

| Layer | Responsibility | Never |
|-------|---------------|-------|
| Router | HTTP concerns, status codes, call service | Business logic, DB queries |
| Schema | Request/response validation, serialization | Business rules |
| Service | Business logic, transactions, authorization orchestration | Direct SQL |
| Repository | Database queries, data access | Business decisions |
| Model | Table definition, relationships | Query logic |

---

## Folder Structure

```
backend/
├── app/
│   ├── main.py
│   ├── core/
│   │   ├── config.py
│   │   ├── security.py
│   │   ├── exceptions.py
│   │   └── logging.py
│   ├── db/
│   │   ├── database.py
│   │   └── base.py
│   ├── models/
│   │   ├── __init__.py
│   │   ├── user.py
│   │   ├── workspace.py
│   │   ├── workspace_member.py
│   │   ├── role.py
│   │   ├── permission.py
│   │   ├── role_permission.py
│   │   ├── project.py
│   │   ├── project_member.py
│   │   ├── project_status.py
│   │   ├── task.py
│   │   ├── task_assignment.py
│   │   ├── task_comment.py
│   │   ├── audit_log.py
│   │   └── refresh_token.py
│   ├── schemas/
│   │   ├── __init__.py
│   │   ├── auth.py
│   │   ├── user.py
│   │   ├── role.py
│   │   ├── permission.py
│   │   ├── project.py
│   │   ├── project_status.py
│   │   ├── project_member.py
│   │   ├── task.py
│   │   ├── comment.py
│   │   ├── dashboard.py
│   │   ├── audit_log.py
│   │   └── common.py
│   ├── repositories/
│   │   ├── __init__.py
│   │   ├── user_repository.py
│   │   ├── workspace_repository.py
│   │   ├── role_repository.py
│   │   ├── permission_repository.py
│   │   ├── project_repository.py
│   │   ├── project_member_repository.py
│   │   ├── project_status_repository.py
│   │   ├── task_repository.py
│   │   ├── task_assignment_repository.py
│   │   ├── comment_repository.py
│   │   └── audit_repository.py
│   ├── services/
│   │   ├── __init__.py
│   │   ├── auth_service.py
│   │   ├── user_service.py
│   │   ├── role_service.py
│   │   ├── project_service.py
│   │   ├── project_status_service.py
│   │   ├── task_service.py
│   │   ├── task_assignment_service.py
│   │   ├── comment_service.py
│   │   ├── dashboard_service.py
│   │   └── audit_service.py
│   ├── api/
│   │   └── v1/
│   │       ├── __init__.py
│   │       ├── router.py
│   │       ├── auth.py
│   │       ├── users.py
│   │       ├── roles.py
│   │       ├── permissions.py
│   │       ├── projects.py
│   │       ├── project_members.py
│   │       ├── project_statuses.py
│   │       ├── tasks.py
│   │       ├── comments.py
│   │       ├── board.py
│   │       ├── dashboard.py
│   │       └── audit_logs.py
│   ├── dependencies/
│   │   ├── __init__.py
│   │   ├── database.py
│   │   ├── auth.py
│   │   └── permissions.py
│   ├── middleware/
│   │   ├── __init__.py
│   │   ├── request_id.py
│   │   └── error_handler.py
│   ├── utils/
│   │   ├── __init__.py
│   │   ├── pagination.py
│   │   ├── response.py
│   │   ├── datetime.py
│   │   └── validators.py
│   └── constants/
│       ├── __init__.py
│       ├── roles.py
│       ├── permissions.py
│       └── status.py
├── alembic/
│   ├── versions/
│   ├── env.py
│   └── script.py.mako
├── tests/
│   ├── conftest.py
│   ├── auth/
│   ├── users/
│   ├── roles/
│   ├── projects/
│   ├── tasks/
│   └── comments/
├── alembic.ini
├── requirements.txt
├── .env
└── .env.example
```

---

## Database Schema

### users
| Column | Type | Constraints |
|--------|------|------------|
| id | UUID | PK |
| email | VARCHAR(255) | UNIQUE, NOT NULL, INDEX |
| name | VARCHAR(255) | NOT NULL |
| password_hash | VARCHAR(255) | NOT NULL |
| avatar | VARCHAR(500) | NULLABLE |
| status | ENUM('active','inactive') | NOT NULL, DEFAULT 'active' |
| is_superadmin | BOOLEAN | DEFAULT false |
| last_login_at | TIMESTAMP | NULLABLE |
| created_at | TIMESTAMP | NOT NULL |
| updated_at | TIMESTAMP | NOT NULL |

### workspaces
| Column | Type | Constraints |
|--------|------|------------|
| id | UUID | PK |
| name | VARCHAR(255) | NOT NULL |
| description | TEXT | NULLABLE |
| type | ENUM('individual','company') | NOT NULL |
| owner_id | UUID | FK → users.id, NOT NULL |
| created_at | TIMESTAMP | NOT NULL |
| updated_at | TIMESTAMP | NOT NULL |

### workspace_members
| Column | Type | Constraints |
|--------|------|------------|
| id | UUID | PK |
| workspace_id | UUID | FK → workspaces.id, NOT NULL |
| user_id | UUID | FK → users.id, NOT NULL |
| role | ENUM('owner','admin','member') | NOT NULL, DEFAULT 'member' |
| created_at | TIMESTAMP | NOT NULL |
| | | UNIQUE(workspace_id, user_id) |

### roles
| Column | Type | Constraints |
|--------|------|------------|
| id | UUID | PK |
| workspace_id | UUID | FK → workspaces.id, NOT NULL |
| name | VARCHAR(100) | NOT NULL |
| description | TEXT | NULLABLE |
| is_system | BOOLEAN | DEFAULT false |
| created_at | TIMESTAMP | NOT NULL |
| updated_at | TIMESTAMP | NOT NULL |
| | | UNIQUE(workspace_id, name) |

### permissions
| Column | Type | Constraints |
|--------|------|------------|
| id | UUID | PK |
| name | VARCHAR(100) | UNIQUE, NOT NULL |
| group_name | VARCHAR(100) | NOT NULL |
| description | TEXT | NULLABLE |

### role_permissions
| Column | Type | Constraints |
|--------|------|------------|
| role_id | UUID | FK → roles.id, NOT NULL |
| permission_id | UUID | FK → permissions.id, NOT NULL |
| | | PK(role_id, permission_id) |

### projects
| Column | Type | Constraints |
|--------|------|------------|
| id | UUID | PK |
| workspace_id | UUID | FK → workspaces.id, NOT NULL |
| name | VARCHAR(255) | NOT NULL |
| description | TEXT | NULLABLE |
| manager_id | UUID | FK → users.id, NOT NULL |
| start_date | DATE | NULLABLE |
| end_date | DATE | NULLABLE |
| status | ENUM('active','archived') | DEFAULT 'active' |
| created_at | TIMESTAMP | NOT NULL |
| updated_at | TIMESTAMP | NOT NULL |

### project_members
| Column | Type | Constraints |
|--------|------|------------|
| id | UUID | PK |
| project_id | UUID | FK → projects.id, NOT NULL |
| user_id | UUID | FK → users.id, NOT NULL |
| role_id | UUID | FK → roles.id, NOT NULL |
| created_at | TIMESTAMP | NOT NULL |
| | | UNIQUE(project_id, user_id) |

### project_statuses
| Column | Type | Constraints |
|--------|------|------------|
| id | UUID | PK |
| project_id | UUID | FK → projects.id, NOT NULL |
| name | VARCHAR(100) | NOT NULL |
| color | VARCHAR(7) | DEFAULT '#6B7280' |
| display_order | INTEGER | NOT NULL |
| is_enabled | BOOLEAN | DEFAULT true |
| created_at | TIMESTAMP | NOT NULL |

### tasks
| Column | Type | Constraints |
|--------|------|------------|
| id | UUID | PK |
| project_id | UUID | FK → projects.id, NOT NULL |
| title | VARCHAR(255) | NOT NULL |
| description | TEXT | NULLABLE |
| assigned_to | UUID | FK → users.id, NULLABLE |
| created_by | UUID | FK → users.id, NOT NULL |
| priority | ENUM('low','medium','high','urgent') | DEFAULT 'medium' |
| status_id | UUID | FK → project_statuses.id, NOT NULL |
| start_date | DATE | NULLABLE |
| due_date | DATE | NULLABLE |
| created_at | TIMESTAMP | NOT NULL |
| updated_at | TIMESTAMP | NOT NULL |

### task_assignments
| Column | Type | Constraints |
|--------|------|------------|
| id | UUID | PK |
| task_id | UUID | FK → tasks.id, NOT NULL |
| user_id | UUID | FK → users.id, NOT NULL |
| assigned_by | UUID | FK → users.id, NOT NULL |
| assigned_at | TIMESTAMP | NOT NULL |
| unassigned_at | TIMESTAMP | NULLABLE |
| reason | TEXT | NULLABLE |

### task_comments
| Column | Type | Constraints |
|--------|------|------------|
| id | UUID | PK |
| task_id | UUID | FK → tasks.id, NOT NULL |
| user_id | UUID | FK → users.id, NOT NULL |
| content | TEXT | NOT NULL |
| parent_id | UUID | FK → task_comments.id, NULLABLE |
| is_deleted | BOOLEAN | DEFAULT false |
| created_at | TIMESTAMP | NOT NULL |
| updated_at | TIMESTAMP | NOT NULL |

### audit_logs
| Column | Type | Constraints |
|--------|------|------------|
| id | UUID | PK |
| workspace_id | UUID | FK → workspaces.id, NOT NULL |
| user_id | UUID | FK → users.id, NOT NULL |
| action | VARCHAR(100) | NOT NULL |
| entity_type | VARCHAR(50) | NOT NULL |
| entity_id | UUID | NOT NULL |
| entity_name | VARCHAR(255) | NULLABLE |
| previous_value | JSONB | NULLABLE |
| new_value | JSONB | NULLABLE |
| created_at | TIMESTAMP | NOT NULL, INDEX |

### refresh_tokens
| Column | Type | Constraints |
|--------|------|------------|
| id | UUID | PK |
| user_id | UUID | FK → users.id, NOT NULL |
| token_hash | VARCHAR(255) | UNIQUE, NOT NULL, INDEX |
| expires_at | TIMESTAMP | NOT NULL |
| revoked_at | TIMESTAMP | NULLABLE |
| created_at | TIMESTAMP | NOT NULL |

---

## Authentication

### Signup Flow
```
POST /api/v1/auth/signup
  → Validate email, password, name
  → Hash password (bcrypt)
  → Create user
  → Create workspace (individual or company)
  → Create workspace membership (role: owner)
  → Create default Admin role with all permissions
  → Assign Admin role permissions
  → Create default project statuses (To Do, In Progress, Done)
  → Generate JWT access + refresh tokens
  → Return tokens + user
```

### Token Strategy
- Access token: 15 minutes, contains `{sub: user_id, workspace_id, role_id}`
- Refresh token: 7 days, single-use with rotation
- Refresh token stored as SHA-256 hash in DB
- On refresh: revoke old token, issue new pair
- On logout: revoke refresh token

### Password Requirements
- Minimum 8 characters
- At least 1 uppercase, 1 lowercase, 1 digit
- Bcrypt hash with 12 rounds

---

## Authorization

### Permission Check Flow
```
Request → Auth dependency (extract JWT, load user)
       → Permission dependency (check workspace membership → role → permissions)
       → Route handler
```

### Permission Format
```
{resource}.{action}     e.g., projects.create, tasks.assign
```

### Default Permissions (seeded)
| Group | Permissions |
|-------|------------|
| Projects | view, create, update, delete |
| Tasks | view, create, update, delete, assign, reassign |
| Board | view, move_task |
| Comments | add, reply |
| Users | manage |
| Roles | manage |
| Settings | view_audit_log, manage_settings |

### Authorization Rules
1. User must be workspace member
2. For project APIs: user must be project member
3. Project role determines permissions
4. Admin/Owner bypass permission checks
5. System roles cannot be deleted
6. Only workspace owner can delete workspace

---

## API Response Format

### Success
```json
{
  "success": true,
  "message": "Project created",
  "data": { "id": "...", "name": "..." }
}
```

### List with Pagination
```json
{
  "success": true,
  "message": "Tasks fetched",
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "total_pages": 8
  }
}
```

### Error
```json
{
  "success": false,
  "message": "Project not found",
  "error": { "code": "NOT_FOUND" }
}
```

---

## Frontend Integration Plan

### New Files to Create
```
src/
├── api/
│   └── apiClient.ts          # Axios instance, interceptors, token refresh
├── services/
│   ├── authService.ts
│   ├── userService.ts
│   ├── roleService.ts
│   ├── projectService.ts
│   ├── taskService.ts
│   ├── commentService.ts
│   ├── boardService.ts
│   ├── dashboardService.ts
│   └── auditService.ts
├── hooks/
│   ├── useAuth.ts
│   └── useApi.ts             # Generic loading/error state hook
├── components/
│   └── ProtectedRoute.tsx     # Route guard component
```

### Changes to Existing Files
- `AuthContext.tsx` — replace mock login with real API calls
- `App.tsx` — add ProtectedRoute wrapper, fix missing routes
- All page components — replace `import { mockX } from '../utils/mockData'` with service calls
- `mockData.ts` — delete after integration complete

### API Client Architecture
```
apiClient.ts:
  - baseURL: http://localhost:3000/api/v1
  - Request interceptor: attach access token
  - Response interceptor: on 401, attempt refresh → retry
  - If refresh fails: clear auth, redirect to /login
  - Timeout: 30 seconds
```

---

## Testing Strategy

### Backend Tests (pytest + HTTPX)
- Unit tests for services (mocked DB)
- Integration tests for endpoints (test client)
- Test database: separate test DB, clean between tests

### Test Coverage
- Auth: signup, login, refresh, logout, me
- Users: CRUD, search, filter, pagination
- Roles: CRUD, permission assignment
- Projects: CRUD, members, statuses
- Tasks: CRUD, assignment, reassignment, status change
- Comments: create, reply, edit, delete
- Board: get board data
- Dashboard: summary stats
- Audit: log creation, retrieval
- Authorization: unauthorized access, wrong workspace, wrong project

### Frontend Verification
- Login flow works end-to-end
- Protected routes redirect to login
- All CRUD operations persist to database
- Kanban drag-and-drop updates task status
- Comments appear in real-time
- Dashboard shows real statistics
- Permission-based UI hides/shows elements
