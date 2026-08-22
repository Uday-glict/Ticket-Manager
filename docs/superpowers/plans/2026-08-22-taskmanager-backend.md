# TaskManager Backend — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a production FastAPI backend with PostgreSQL for the TaskManager project management system, then integrate it with the existing React frontend.

**Architecture:** Modular monolith — API Router → Schema → Auth → Permission → Service → Repository → SQLAlchemy → PostgreSQL. JWT auth with refresh token rotation.

**Tech Stack:** Python 3.13, FastAPI, SQLAlchemy 2.x, Alembic, PostgreSQL, Pydantic v2, bcrypt, JWT (python-jose), pytest, HTTPX, axios (frontend)

## Global Constraints
- Python 3.13, FastAPI latest, SQLAlchemy 2.x, Pydantic v2
- PostgreSQL database, UUID primary keys
- bcrypt password hashing (12 rounds)
- JWT access token (15min) + refresh token (7 days, rotation)
- All routes under /api/v1/
- Response format: { success, message, data, pagination? }
- Error format: { success, message, error: { code } }
- Frontend at port 5173, backend at port 3000

---

## File Structure

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
│   ├── models/ (14 files: user, workspace, workspace_member, role, permission, role_permission, project, project_member, project_status, task, task_assignment, task_comment, audit_log, refresh_token)
│   ├── schemas/ (12 files: auth, user, role, permission, project, project_status, project_member, task, comment, dashboard, audit_log, common)
│   ├── repositories/ (11 files: user, workspace, role, permission, project, project_member, project_status, task, task_assignment, comment, audit)
│   ├── services/ (10 files: auth, user, role, project, project_status, task, task_assignment, comment, dashboard, audit)
│   ├── api/v1/ (13 files: router, auth, users, roles, permissions, projects, project_members, project_statuses, tasks, comments, board, dashboard, audit_logs)
│   ├── dependencies/ (database, auth, permissions)
│   ├── utils/ (pagination, response, datetime, validators)
│   └── constants/ (roles, permissions, status)
├── alembic/
├── tests/
├── alembic.ini
├── requirements.txt
└── .env
```

---

## Phase 1: Backend Setup

### Task 1: Initialize Backend Project

**Files:** `backend/requirements.txt`, `backend/.env`, `backend/.env.example`, `backend/app/__init__.py`, `backend/app/main.py`

**Steps:**

- [ ] Create directory structure:
```bash
mkdir -p backend/app/core backend/app/db backend/app/models backend/app/schemas backend/app/repositories backend/app/services backend/app/api/v1 backend/app/dependencies backend/app/middleware backend/app/utils backend/app/constants backend/alembic/versions backend/tests
```

- [ ] Create `backend/requirements.txt`:
```
fastapi==0.115.12
uvicorn[standard]==0.34.2
sqlalchemy[asyncio]==2.0.41
asyncpg==0.30.0
alembic==1.15.2
pydantic==2.11.3
pydantic-settings==2.9.1
python-jose[cryptography]==3.4.0
passlib[bcrypt]==1.7.4
python-multipart==0.0.20
httpx==0.28.1
pytest==8.3.5
pytest-asyncio==0.25.3
python-dotenv==1.1.0
```

- [ ] Create `backend/.env`:
```
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/taskmanager
SECRET_KEY=your-secret-key-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7
CORS_ORIGINS=["http://localhost:5173"]
ENVIRONMENT=development
```

- [ ] Create `backend/.env.example` (same as `.env` with placeholders).

- [ ] Create `backend/app/__init__.py` (empty).

- [ ] Create `backend/app/main.py`:
```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    yield

app = FastAPI(title="TaskManager API", version="1.0.0", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:5173"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

@app.get("/health")
async def health():
    return {"status": "ok"}
```

- [ ] Install dependencies and verify server starts:
```bash
cd backend && python -m venv venv && venv\Scripts\activate && pip install -r requirements.txt && uvicorn app.main:app --reload --port 3000
```

- [ ] Visit `http://localhost:3000/health` — should return `{"status": "ok"}`.

---

### Task 2: Core Modules

**Files:** `backend/app/core/config.py`, `backend/app/core/exceptions.py`, `backend/app/core/logging.py`, `backend/app/utils/response.py`, `backend/app/utils/pagination.py`, `backend/app/utils/validators.py`, `backend/app/utils/datetime.py`, `backend/app/constants/permissions.py`, `backend/app/constants/roles.py`, `backend/app/constants/status.py`

**Interfaces:** Produces `settings`, `success_response()`, `error_response()`, `paginate()`, `validate_password()`, `utcnow()`

**Steps:**

- [ ] Create `backend/app/core/__init__.py` (empty).

- [ ] Create `backend/app/core/config.py`:
```python
from pydantic_settings import BaseSettings
from typing import List
import json

class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    CORS_ORIGINS: str = '["http://localhost:5173"]'
    ENVIRONMENT: str = "development"

    @property
    def cors_origins_list(self) -> List[str]:
        return json.loads(self.CORS_ORIGINS)

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}

settings = Settings()
```

- [ ] Create `backend/app/core/exceptions.py`:
```python
from fastapi import HTTPException

class AppException(HTTPException):
    def __init__(self, status_code: int, message: str, code: str):
        super().__init__(status_code=status_code, detail=message)
        self.code = code
        self.message = message

class NotFoundException(AppException):
    def __init__(self, resource: str = "Resource"):
        super().__init__(404, f"{resource} not found", "NOT_FOUND")

class BadRequestException(AppException):
    def __init__(self, message: str = "Bad request"):
        super().__init__(400, message, "BAD_REQUEST")

class UnauthorizedException(AppException):
    def __init__(self, message: str = "Unauthorized"):
        super().__init__(401, message, "UNAUTHORIZED")

class ForbiddenException(AppException):
    def __init__(self, message: str = "Forbidden"):
        super().__init__(403, message, "FORBIDDEN")

class ConflictException(AppException):
    def __init__(self, message: str = "Resource already exists"):
        super().__init__(409, message, "CONFLICT")
```

- [ ] Create `backend/app/core/logging.py`:
```python
import logging
import sys

def setup_logging():
    logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s", handlers=[logging.StreamHandler(sys.stdout)])
```

- [ ] Create `backend/app/utils/__init__.py` (empty).

- [ ] Create `backend/app/utils/response.py`:
```python
from typing import Any, Dict, Optional

def success_response(data: Any = None, message: str = "Success", pagination: Optional[Dict] = None) -> Dict:
    response = {"success": True, "message": message, "data": data}
    if pagination:
        response["pagination"] = pagination
    return response

def error_response(message: str = "Error", code: str = "ERROR") -> Dict:
    return {"success": False, "message": message, "error": {"code": code}}
```

- [ ] Create `backend/app/utils/pagination.py`:
```python
from typing import Any, Dict
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

async def paginate(db: AsyncSession, query, page: int = 1, limit: int = 20) -> Dict[str, Any]:
    total_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(total_query)
    total = total_result.scalar()
    offset = (page - 1) * limit
    query = query.offset(offset).limit(limit)
    result = await db.execute(query)
    items = result.scalars().all()
    return {
        "items": items,
        "pagination": {"page": page, "limit": limit, "total": total, "total_pages": (total + limit - 1) // limit if total else 0},
    }
```

- [ ] Create `backend/app/utils/validators.py`:
```python
import re

def validate_password(password: str) -> bool:
    if len(password) < 8:
        return False
    if not re.search(r"[A-Z]", password):
        return False
    if not re.search(r"[a-z]", password):
        return False
    if not re.search(r"\d", password):
        return False
    return True

def validate_email(email: str) -> bool:
    pattern = r"^[^\s@]+@[^\s@]+\.[^\s@]+$"
    return bool(re.match(pattern, email))
```

- [ ] Create `backend/app/utils/datetime.py`:
```python
from datetime import datetime, timezone

def utcnow() -> datetime:
    return datetime.now(timezone.utc)
```

- [ ] Create `backend/app/constants/__init__.py` (empty).

- [ ] Create `backend/app/constants/permissions.py`:
```python
class Permissions:
    PROJECT_VIEW = "projects.view"
    PROJECT_CREATE = "projects.create"
    PROJECT_UPDATE = "projects.update"
    PROJECT_DELETE = "projects.delete"
    TASK_VIEW = "tasks.view"
    TASK_CREATE = "tasks.create"
    TASK_UPDATE = "tasks.update"
    TASK_DELETE = "tasks.delete"
    TASK_ASSIGN = "tasks.assign"
    TASK_REASSIGN = "tasks.reassign"
    BOARD_VIEW = "board.view"
    BOARD_MOVE_TASK = "board.move_task"
    COMMENT_ADD = "comments.add"
    COMMENT_REPLY = "comments.reply"
    USER_MANAGE = "users.manage"
    ROLE_MANAGE = "roles.manage"
    AUDIT_VIEW = "settings.view_audit_log"
    SETTINGS_MANAGE = "settings.manage_settings"
    ALL = [
        "projects.view", "projects.create", "projects.update", "projects.delete",
        "tasks.view", "tasks.create", "tasks.update", "tasks.delete", "tasks.assign", "tasks.reassign",
        "board.view", "board.move_task",
        "comments.add", "comments.reply",
        "users.manage", "roles.manage",
        "settings.view_audit_log", "settings.manage_settings",
    ]
```

- [ ] Create `backend/app/constants/roles.py`:
```python
class DefaultRoles:
    ADMIN = "Admin"
    PROJECT_MANAGER = "Project Manager"
    DEVELOPER = "Developer"
    VIEWER = "Viewer"
```

- [ ] Create `backend/app/constants/status.py`:
```python
class TaskPriority:
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"

class ProjectStatusType:
    ACTIVE = "active"
    ARCHIVED = "archived"

class UserStatus:
    ACTIVE = "active"
    INACTIVE = "inactive"

class WorkspaceType:
    INDIVIDUAL = "individual"
    COMPANY = "company"

class WorkspaceMemberRole:
    OWNER = "owner"
    ADMIN = "admin"
    MEMBER = "member"

DEFAULT_PROJECT_STATUSES = [
    {"name": "To Do", "color": "#6B7280", "display_order": 0},
    {"name": "In Progress", "color": "#3B82F6", "display_order": 1},
    {"name": "Done", "color": "#22C55E", "display_order": 2},
]
```


---

## Phase 2: Database

### Task 3: Database Setup

**Files:** `backend/app/db/__init__.py`, `backend/app/db/database.py`, `backend/app/db/base.py`

**Interfaces:** Produces `async_session_factory`, `get_db()`, `Base`, `UUIDMixin`, `TimestampMixin`

**Steps:**

- [ ] Create `backend/app/db/__init__.py` (empty).

- [ ] Create `backend/app/db/base.py`:
```python
import uuid
from sqlalchemy import Column, DateTime, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import DeclarativeBase

class Base(DeclarativeBase):
    pass

class TimestampMixin:
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

class UUIDMixin:
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, nullable=False)
```

- [ ] Create `backend/app/db/database.py`:
```python
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from app.core.config import settings

engine = create_async_engine(settings.DATABASE_URL, echo=False)
async_session_factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

async def get_db():
    async with async_session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
```

---

### Task 4: SQLAlchemy Models

**Files:** `backend/app/models/user.py`, `backend/app/models/workspace.py`, `backend/app/models/workspace_member.py`, `backend/app/models/role.py`, `backend/app/models/permission.py`, `backend/app/models/role_permission.py`, `backend/app/models/project.py`, `backend/app/models/project_member.py`, `backend/app/models/project_status.py`, `backend/app/models/task.py`, `backend/app/models/task_assignment.py`, `backend/app/models/task_comment.py`, `backend/app/models/audit_log.py`, `backend/app/models/refresh_token.py`, `backend/app/models/__init__.py`

**Interfaces:** Consumes `Base`, `UUIDMixin`, `TimestampMixin`. Produces 14 SQLAlchemy model classes.

**Steps:**

- [ ] Create `backend/app/models/user.py`:
```python
from sqlalchemy import Column, String, Boolean, DateTime, Enum as SAEnum
from sqlalchemy.orm import relationship
from app.db.base import Base, UUIDMixin, TimestampMixin

class User(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "users"
    email = Column(String(255), unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=False)
    password_hash = Column(String(255), nullable=False)
    avatar = Column(String(500), nullable=True)
    status = Column(SAEnum("active", "inactive", name="user_status"), nullable=False, default="active")
    is_superadmin = Column(Boolean, default=False)
    last_login_at = Column(DateTime(timezone=True), nullable=True)
    workspaces = relationship("Workspace", back_populates="owner")
    workspace_memberships = relationship("WorkspaceMember", back_populates="user")
    refresh_tokens = relationship("RefreshToken", back_populates="user")
    audit_logs = relationship("AuditLog", back_populates="user")
```

- [ ] Create `backend/app/models/workspace.py`:
```python
from sqlalchemy import Column, String, Text, Enum as SAEnum, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.base import Base, UUIDMixin, TimestampMixin

class Workspace(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "workspaces"
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    type = Column(SAEnum("individual", "company", name="workspace_type"), nullable=False)
    owner_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    owner = relationship("User", back_populates="workspaces")
    members = relationship("WorkspaceMember", back_populates="workspace")
    roles = relationship("Role", back_populates="workspace")
    projects = relationship("Project", back_populates="workspace")
    audit_logs = relationship("AuditLog", back_populates="workspace")
```

- [ ] Create `backend/app/models/workspace_member.py`:
```python
from sqlalchemy import Column, String, Enum as SAEnum, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.base import Base, UUIDMixin, TimestampMixin

class WorkspaceMember(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "workspace_members"
    __table_args__ = (UniqueConstraint("workspace_id", "user_id"),)
    workspace_id = Column(UUID(as_uuid=True), ForeignKey("workspaces.id"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    role = Column(SAEnum("owner", "admin", "member", name="workspace_member_role"), nullable=False, default="member")
    workspace = relationship("Workspace", back_populates="members")
    user = relationship("User", back_populates="workspace_memberships")
```

- [ ] Create `backend/app/models/role.py`:
```python
from sqlalchemy import Column, String, Text, Boolean, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.base import Base, UUIDMixin, TimestampMixin

class Role(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "roles"
    __table_args__ = (UniqueConstraint("workspace_id", "name"),)
    workspace_id = Column(UUID(as_uuid=True), ForeignKey("workspaces.id"), nullable=False)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    is_system = Column(Boolean, default=False)
    workspace = relationship("Workspace", back_populates="roles")
    permissions = relationship("Permission", secondary="role_permissions", back_populates="roles")
```

- [ ] Create `backend/app/models/permission.py`:
```python
from sqlalchemy import Column, String, Text
from sqlalchemy.orm import relationship
from app.db.base import Base, UUIDMixin

class Permission(Base, UUIDMixin):
    __tablename__ = "permissions"
    name = Column(String(100), unique=True, nullable=False)
    group_name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    roles = relationship("Role", secondary="role_permissions", back_populates="permissions")
```

- [ ] Create `backend/app/models/role_permission.py`:
```python
from sqlalchemy import Column, ForeignKey, PrimaryKeyConstraint
from sqlalchemy.dialects.postgresql import UUID
from app.db.base import Base

class RolePermission(Base):
    __tablename__ = "role_permissions"
    __table_args__ = (PrimaryKeyConstraint("role_id", "permission_id"),)
    role_id = Column(UUID(as_uuid=True), ForeignKey("roles.id"), nullable=False)
    permission_id = Column(UUID(as_uuid=True), ForeignKey("permissions.id"), nullable=False)
```

- [ ] Create `backend/app/models/project.py`:
```python
from sqlalchemy import Column, String, Text, Date, Enum as SAEnum, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.base import Base, UUIDMixin, TimestampMixin

class Project(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "projects"
    workspace_id = Column(UUID(as_uuid=True), ForeignKey("workspaces.id"), nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    manager_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    start_date = Column(Date, nullable=True)
    end_date = Column(Date, nullable=True)
    status = Column(SAEnum("active", "archived", name="project_status"), default="active")
    workspace = relationship("Workspace", back_populates="projects")
    manager = relationship("User", foreign_keys=[manager_id])
    members = relationship("ProjectMember", back_populates="project")
    statuses = relationship("ProjectStatus", back_populates="project", order_by="ProjectStatus.display_order")
    tasks = relationship("Task", back_populates="project")
```

- [ ] Create `backend/app/models/project_member.py`:
```python
from sqlalchemy import Column, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.base import Base, UUIDMixin, TimestampMixin

class ProjectMember(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "project_members"
    __table_args__ = (UniqueConstraint("project_id", "user_id"),)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    role_id = Column(UUID(as_uuid=True), ForeignKey("roles.id"), nullable=False)
    project = relationship("Project", back_populates="members")
    user = relationship("User")
    role = relationship("Role")
```

- [ ] Create `backend/app/models/project_status.py`:
```python
from sqlalchemy import Column, String, Integer, Boolean, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.base import Base, UUIDMixin, TimestampMixin

class ProjectStatus(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "project_statuses"
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id"), nullable=False)
    name = Column(String(100), nullable=False)
    color = Column(String(7), default="#6B7280")
    display_order = Column(Integer, nullable=False)
    is_enabled = Column(Boolean, default=True)
    project = relationship("Project", back_populates="statuses")
    tasks = relationship("Task", back_populates="status")
```

- [ ] Create `backend/app/models/task.py`:
```python
from sqlalchemy import Column, String, Text, Date, Enum as SAEnum, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.base import Base, UUIDMixin, TimestampMixin

class Task(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "tasks"
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id"), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    assigned_to = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    priority = Column(SAEnum("low", "medium", "high", "urgent", name="task_priority"), default="medium")
    status_id = Column(UUID(as_uuid=True), ForeignKey("project_statuses.id"), nullable=False)
    start_date = Column(Date, nullable=True)
    due_date = Column(Date, nullable=True)
    project = relationship("Project", back_populates="tasks")
    assignee = relationship("User", foreign_keys=[assigned_to])
    creator = relationship("User", foreign_keys=[created_by])
    status = relationship("ProjectStatus", back_populates="tasks")
    assignments = relationship("TaskAssignment", back_populates="task")
    comments = relationship("TaskComment", back_populates="task")
```

- [ ] Create `backend/app/models/task_assignment.py`:
```python
from sqlalchemy import Column, Text, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.base import Base, UUIDMixin

class TaskAssignment(Base, UUIDMixin):
    __tablename__ = "task_assignments"
    task_id = Column(UUID(as_uuid=True), ForeignKey("tasks.id"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    assigned_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    assigned_at = Column(DateTime(timezone=True), nullable=False)
    unassigned_at = Column(DateTime(timezone=True), nullable=True)
    reason = Column(Text, nullable=True)
    task = relationship("Task", back_populates="assignments")
    assignee = relationship("User", foreign_keys=[user_id])
    assigner = relationship("User", foreign_keys=[assigned_by])
```

- [ ] Create `backend/app/models/task_comment.py`:
```python
from sqlalchemy import Column, Text, Boolean, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.base import Base, UUIDMixin, TimestampMixin

class TaskComment(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "task_comments"
    task_id = Column(UUID(as_uuid=True), ForeignKey("tasks.id"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    content = Column(Text, nullable=False)
    parent_id = Column(UUID(as_uuid=True), ForeignKey("task_comments.id"), nullable=True)
    is_deleted = Column(Boolean, default=False)
    task = relationship("Task", back_populates="comments")
    user = relationship("User")
    parent = relationship("TaskComment", remote_side="TaskComment.id")
    replies = relationship("TaskComment", back_populates="parent")
```

- [ ] Create `backend/app/models/audit_log.py`:
```python
from sqlalchemy import Column, String, DateTime, JSON, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.base import Base, UUIDMixin

class AuditLog(Base, UUIDMixin):
    __tablename__ = "audit_logs"
    __table_args__ = (Index("ix_audit_logs_created_at", "created_at"),)
    workspace_id = Column(UUID(as_uuid=True), ForeignKey("workspaces.id"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    action = Column(String(100), nullable=False)
    entity_type = Column(String(50), nullable=False)
    entity_id = Column(UUID(as_uuid=True), nullable=False)
    entity_name = Column(String(255), nullable=True)
    previous_value = Column(JSON, nullable=True)
    new_value = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False)
    workspace = relationship("Workspace", back_populates="audit_logs")
    user = relationship("User", back_populates="audit_logs")
```

- [ ] Create `backend/app/models/refresh_token.py`:
```python
from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.base import Base, UUIDMixin, TimestampMixin

class RefreshToken(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "refresh_tokens"
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    token_hash = Column(String(255), unique=True, nullable=False, index=True)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    revoked_at = Column(DateTime(timezone=True), nullable=True)
    user = relationship("User", back_populates="refresh_tokens")
```

- [ ] Create `backend/app/models/__init__.py` importing all models.

---

### Task 5: Alembic Setup + Initial Migration

**Files:** `backend/alembic.ini`, `backend/alembic/env.py`, `backend/alembic/script.py.mako`

**Steps:**

- [ ] Create `backend/alembic.ini` with `script_location = alembic` and `sqlalchemy.url` pointing to the database.

- [ ] Create `backend/alembic/script.py.mako` (standard Alembic template).

- [ ] Create `backend/alembic/env.py` that imports `Base` from `app.db.base` and all models from `app.models`, uses async engine.

- [ ] Run `alembic revision --autogenerate -m "initial"`.

- [ ] Run `alembic upgrade head`.


---

## Phase 3: Authentication

### Task 6: Security Module

**Files:** `backend/app/core/security.py`

**Interfaces:** Produces `hash_password()`, `verify_password()`, `create_access_token()`, `create_refresh_token()`, `decode_token()`, `hash_token()`

**Steps:**

- [ ] Create `backend/app/core/security.py`:
```python
from datetime import timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
from app.core.config import settings
from app.utils.datetime import utcnow
import hashlib

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto", bcrypt__rounds=12)

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire, "type": "access"})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

def create_refresh_token(data: dict) -> str:
    to_encode = data.copy()
    expire = utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "type": "refresh"})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

def decode_token(token: str) -> dict | None:
    try:
        return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    except JWTError:
        return None

def hash_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()
```

---

### Task 7: Auth Schemas

**Files:** `backend/app/schemas/__init__.py`, `backend/app/schemas/common.py`, `backend/app/schemas/auth.py`

**Interfaces:** Produces `SignupRequest`, `LoginRequest`, `RefreshRequest`, `AuthResponse`, `UserResponse`, `SuccessResponse`, `ErrorResponse`, `PaginationMeta`

**Steps:**

- [ ] Create `backend/app/schemas/common.py`:
```python
from pydantic import BaseModel
from typing import Any, Optional

class PaginationMeta(BaseModel):
    page: int
    limit: int
    total: int
    total_pages: int

class SuccessResponse(BaseModel):
    success: bool = True
    message: str
    data: Any = None
    pagination: Optional[PaginationMeta] = None

class ErrorDetail(BaseModel):
    code: str

class ErrorResponse(BaseModel):
    success: bool = False
    message: str
    error: ErrorDetail
```

- [ ] Create `backend/app/schemas/auth.py`:
```python
from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from uuid import UUID

class SignupRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    name: str = Field(min_length=1, max_length=255)
    workspace_name: Optional[str] = None
    workspace_type: str = "individual"

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class RefreshRequest(BaseModel):
    refresh_token: str

class UserResponse(BaseModel):
    id: UUID
    email: str
    name: str
    avatar: Optional[str] = None
    status: str
    is_superadmin: bool = False
    model_config = {"from_attributes": True}

class AuthResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserResponse
```

---

### Task 8: Auth Dependencies

**Files:** `backend/app/dependencies/__init__.py`, `backend/app/dependencies/database.py`, `backend/app/dependencies/auth.py`, `backend/app/dependencies/permissions.py`

**Interfaces:** Produces `get_db()`, `get_current_user()`, `get_current_active_user()`, `get_current_workspace_member()`, `require_permission()`, `require_project_member()`

**Steps:**

- [ ] Create `backend/app/dependencies/database.py`:
```python
from app.db.database import get_db
```

- [ ] Create `backend/app/dependencies/auth.py`:
```python
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.dependencies.database import get_db
from app.core.security import decode_token
from app.models.user import User

security = HTTPBearer()

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db),
) -> User:
    token = credentials.credentials
    payload = decode_token(token)
    if payload is None or payload.get("type") != "access":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    user_id = payload.get("sub")
    if user_id is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user

async def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    if current_user.status != "active":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User is inactive")
    return current_user
```

- [ ] Create `backend/app/dependencies/permissions.py`:
```python
from fastapi import Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.dependencies.database import get_db
from app.dependencies.auth import get_current_active_user
from app.models.user import User
from app.models.workspace_member import WorkspaceMember
from app.models.project_member import ProjectMember
from app.models.role import Role

async def get_current_workspace_member(
    user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> WorkspaceMember:
    result = await db.execute(select(WorkspaceMember).where(WorkspaceMember.user_id == user.id))
    member = result.scalar_one_or_none()
    if not member:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not a workspace member")
    return member

def require_permission(permission: str):
    async def checker(
        workspace_member: WorkspaceMember = Depends(get_current_workspace_member),
        db: AsyncSession = Depends(get_db),
    ) -> WorkspaceMember:
        if workspace_member.role in ("owner", "admin"):
            return workspace_member
        result = await db.execute(
            select(Role).join(Role.permissions).where(Role.workspace_id == workspace_member.workspace_id)
        )
        for role in result.scalars().all():
            for perm in role.permissions:
                if perm.name == permission:
                    return workspace_member
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=f"Permission denied: {permission}")
    return checker

async def require_project_member(
    project_id: str,
    user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> ProjectMember:
    from uuid import UUID
    result = await db.execute(
        select(ProjectMember).where(ProjectMember.project_id == UUID(project_id), ProjectMember.user_id == user.id)
    )
    member = result.scalar_one_or_none()
    if not member:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not a project member")
    return member
```

---

### Task 9: Auth Repository + Service

**Files:** `backend/app/repositories/user_repository.py`, `backend/app/repositories/workspace_repository.py`, `backend/app/repositories/role_repository.py`, `backend/app/repositories/permission_repository.py`, `backend/app/services/auth_service.py`

**Interfaces:** Produces `AuthService.signup()`, `AuthService.login()`, `AuthService.refresh()`, `AuthService.logout()`, `AuthService.get_me()`

**Steps:**

- [ ] Create repository classes for user, workspace, role, permission with CRUD operations.

- [ ] Create `backend/app/services/auth_service.py` implementing signup (creates user + workspace + membership + admin role + permissions in transaction), login (verifies password, issues tokens), refresh (revokes old token, issues new pair), logout (revokes token), get_me.

---

### Task 10: Auth API Routes + main.py Update

**Files:** `backend/app/api/v1/auth.py`, `backend/app/api/v1/router.py`, `backend/app/main.py`

**Interfaces:** Produces routes at `/api/v1/auth/signup`, `/login`, `/refresh`, `/logout`, `/me`

**Steps:**

- [ ] Create `backend/app/api/v1/auth.py` with 5 endpoints.

- [ ] Create `backend/app/api/v1/router.py` that includes auth router.

- [ ] Update `backend/app/main.py` to include api_router and AppException handler.

- [ ] Test signup and login with curl.


---

## Phase 4: Users, Roles, Permissions

### Task 11: User APIs

**Files:** `backend/app/schemas/user.py`, `backend/app/services/user_service.py`, `backend/app/api/v1/users.py`

**Interfaces:** Produces `GET /api/v1/users`, `GET /api/v1/users/{id}`, `PUT /api/v1/users/{id}`, `PATCH /api/v1/users/{id}/status`

**Steps:**

- [ ] Create `backend/app/schemas/user.py` with `UserCreateRequest`, `UserUpdateRequest`, `UserListItem`.

- [ ] Extend user repository with `list_users()` supporting search, status filter, pagination.

- [ ] Create `backend/app/services/user_service.py` with `list_users()`, `get_user()`, `update_user()`, `toggle_status()`.

- [ ] Create `backend/app/api/v1/users.py` with all endpoints using `require_permission("users.manage")`.

- [ ] Add to `router.py`: `api_router.include_router(users.router)`.

---

### Task 12: Role/Permission APIs

**Files:** `backend/app/schemas/role.py`, `backend/app/schemas/permission.py`, `backend/app/services/role_service.py`, `backend/app/api/v1/roles.py`, `backend/app/api/v1/permissions.py`

**Interfaces:** Produces `GET/POST /api/v1/roles`, `PUT/DELETE /api/v1/roles/{id}`, `GET /api/v1/permissions`

**Steps:**

- [ ] Create role and permission schemas.

- [ ] Create `backend/app/services/role_service.py` with CRUD + permission assignment. System roles cannot be deleted/modified.

- [ ] Create `backend/app/api/v1/roles.py` and `backend/app/api/v1/permissions.py`.

- [ ] Add both to `router.py`.

---

### Task 13: Seed Data

**Files:** `backend/app/seeds/permissions.py`, `backend/app/main.py` (update lifespan)

**Steps:**

- [ ] Create `backend/app/seeds/permissions.py` that seeds 18 permissions (projects.view/create/update/delete, tasks.view/create/update/delete/assign/reassign, board.view/move_task, comments.add/reply, users.manage, roles.manage, settings.view_audit_log/manage_settings).

- [ ] Update `main.py` lifespan to call `seed_permissions()` on startup.


---

## Phase 5: Projects

### Task 14: Project APIs

**Files:** `backend/app/schemas/project.py`, `backend/app/repositories/project_repository.py`, `backend/app/services/project_service.py`, `backend/app/api/v1/projects.py`

**Interfaces:** Produces `GET/POST /api/v1/projects`, `GET/PUT /api/v1/projects/{id}`

**Steps:**

- [ ] Create project schema with nested member/status responses.

- [ ] Create project repository with `create()`, `get_by_id()`, `list_projects()` (search, status filter, pagination), `add_member()`, `update()`.

- [ ] Create project service and API routes.

- [ ] Add to `router.py`.

---

### Task 15: Project Member APIs

**Files:** `backend/app/schemas/project_member.py`, `backend/app/repositories/project_member_repository.py`, `backend/app/api/v1/project_members.py`

**Interfaces:** Produces `GET/POST /api/v1/projects/{id}/members`, `PUT/DELETE /api/v1/projects/{id}/members/{user_id}`

**Steps:**

- [ ] Create member add/update schemas.

- [ ] Create repository with `get_members()`, `add_member()`, `update_member()`, `remove_member()`.

- [ ] Create API routes and add to `router.py`.

---

### Task 16: Dynamic Project Status APIs

**Files:** `backend/app/schemas/project_status.py`, `backend/app/repositories/project_status_repository.py`, `backend/app/services/project_status_service.py`, `backend/app/api/v1/project_statuses.py`

**Interfaces:** Produces `GET/POST /api/v1/projects/{id}/statuses`, `PUT/DELETE /api/v1/projects/{id}/statuses/{status_id}`

**Steps:**

- [ ] Create status schema with reorder support.

- [ ] Create repository, service, and API routes.

- [ ] Add to `router.py`.

---

## Phase 6: Tasks

### Task 17: Task APIs

**Files:** `backend/app/schemas/task.py`, `backend/app/repositories/task_repository.py`, `backend/app/services/task_service.py`, `backend/app/api/v1/tasks.py`

**Interfaces:** Produces `GET/POST /api/v1/tasks`, `GET/PUT /api/v1/tasks/{id}`

**Steps:**

- [ ] Create task schema with priority enum, status reference.

- [ ] Create repository with `create()`, `get_by_id()`, `list_tasks()` (filter by project, assignee, priority, status), `update()`.

- [ ] Create service and API routes.

- [ ] Add to `router.py`.

---

### Task 18: Task Assignment/Reassignment

**Files:** `backend/app/repositories/task_assignment_repository.py`, `backend/app/services/task_assignment_service.py`, `backend/app/api/v1/tasks.py` (extend)

**Interfaces:** Produces `POST /api/v1/tasks/{id}/assign`, `POST /api/v1/tasks/{id}/reassign`, `GET /api/v1/tasks/{id}/assignments`

**Steps:**

- [ ] Create assignment repository with `create()`, `get_active_assignment()`, `get_history()`.

- [ ] Create assignment service that handles assign (creates assignment + updates task.assigned_to) and reassign (closes old assignment, creates new one with reason).

- [ ] Add assign/reassign/history endpoints to tasks router.


---

## Phase 7: Comments

### Task 19: Comment APIs

**Files:** `backend/app/schemas/comment.py`, `backend/app/repositories/comment_repository.py`, `backend/app/services/comment_service.py`, `backend/app/api/v1/comments.py`

**Interfaces:** Produces `GET /api/v1/comments/task/{task_id}`, `POST /api/v1/comments`, `PUT /api/v1/comments/{id}`, `DELETE /api/v1/comments/{id}`

**Steps:**

- [ ] Create comment schema with parent_id for threading.

- [ ] Create repository with `get_by_task()` (filter deleted), `get_by_id()`, `create()`, `update()`.

- [ ] Create service with threaded reply support and soft delete (owner-only edit/delete).

- [ ] Create API routes and add to `router.py`.

---

## Phase 8: Board + Dashboard + Audit

### Task 20: Kanban Board API

**Files:** `backend/app/api/v1/board.py`

**Interfaces:** Produces `GET /api/v1/board/{project_id}`

**Steps:**

- [ ] Create board endpoint that:
  - Verifies user is project member
  - Fetches enabled statuses ordered by display_order
  - Groups tasks by status_id
  - Returns `{ status: {id, name, color}, tasks: [...] }` per column

- [ ] Add to `router.py`.

---

### Task 21: Dashboard APIs

**Files:** `backend/app/schemas/dashboard.py`, `backend/app/services/dashboard_service.py`, `backend/app/api/v1/dashboard.py`

**Interfaces:** Produces `GET /api/v1/dashboard/summary`, `GET /api/v1/dashboard/projects`

**Steps:**

- [ ] Create dashboard service computing: total_projects, total_tasks, completed_tasks (by Done/Completed statuses), in_progress_tasks, overdue_tasks (due_date < today).

- [ ] Create project summary endpoint returning per-project task counts.

- [ ] Add to `router.py`.

---

### Task 22: Audit Log APIs

**Files:** `backend/app/schemas/audit_log.py`, `backend/app/repositories/audit_repository.py`, `backend/app/services/audit_service.py`, `backend/app/api/v1/audit_logs.py`

**Interfaces:** Produces `GET /api/v1/audit-logs` with entity_type, user_id filters, pagination

**Steps:**

- [ ] Create audit repository with `create()` and `list_logs()` (filter by entity_type, user_id, paginated, ordered by created_at desc).

- [ ] Create audit service with `log()` helper and `list_logs()`.

- [ ] Create API route using `require_permission("settings.view_audit_log")`.

- [ ] Add to `router.py`.

---

## Phase 9: Frontend Integration

### Task 23: Frontend API Client

**Files:** `frontend/src/api/apiClient.ts`, `frontend/vite.config.ts`

**Steps:**

- [ ] Create `frontend/src/api/apiClient.ts` with axios instance:
  - `baseURL: http://localhost:3000/api/v1`
  - Request interceptor: attach access token from localStorage
  - Response interceptor: on 401, attempt token refresh → retry original request
  - If refresh fails: clear localStorage, redirect to `/login`
  - Queue concurrent requests during refresh

- [ ] Update `frontend/vite.config.ts` to add proxy:
```typescript
server: {
  proxy: { '/api': { target: 'http://localhost:3000', changeOrigin: true } },
}
```

---

### Task 24: Frontend Services

**Files:** `frontend/src/services/authService.ts`, `userService.ts`, `roleService.ts`, `projectService.ts`, `taskService.ts`, `commentService.ts`, `boardService.ts`, `dashboardService.ts`, `auditService.ts`

**Steps:**

- [ ] Create each service file using `apiClient` to call corresponding backend endpoints.

- [ ] Each service exports functions matching the backend API: `list()`, `get()`, `create()`, `update()`, `delete()`, plus domain-specific actions.

---

### Task 25: Frontend Auth Integration

**Files:** `frontend/src/context/AuthContext.tsx`, `frontend/src/components/ProtectedRoute.tsx`, `frontend/src/App.tsx`

**Steps:**

- [ ] Replace `AuthContext.tsx` mock login with real API calls using `authService.login()` / `authService.signup()`.

- [ ] Add `loading` state and `useEffect` to restore user from token on mount.

- [ ] Create `ProtectedRoute.tsx` that redirects to `/login` if not authenticated.

- [ ] Update `App.tsx` to wrap dashboard routes with `<ProtectedRoute />`.

---

### Task 26: Frontend Data Integration

**Files:** All page components under `frontend/src/pages/`

**Steps:**

- [ ] In each page, replace `import { mockX } from '../utils/mockData'` with service imports and `useEffect` data fetching.

- [ ] Add loading states and error handling for each page.

- [ ] Apply to: ProjectListPage, TaskListPage, KanbanBoardPage, UserListPage, RoleListPage, AuditLogPage, AdminDashboard, ProjectDetailsPage, TaskDetailPage.

---

### Task 27: Frontend Cleanup

**Files:** Delete `frontend/src/utils/mockData.ts`

**Steps:**

- [ ] Run `npm run build` in frontend to verify no import errors.

- [ ] Fix any remaining references to mockData.

- [ ] Delete `frontend/src/utils/mockData.ts`.

- [ ] Verify build passes again.

---

## Phase 10: Testing

### Task 28: Backend Tests

**Files:** `backend/tests/conftest.py`, `backend/tests/auth/test_auth.py`, `backend/tests/users/test_users.py`, `backend/tests/roles/test_roles.py`, `backend/tests/projects/test_projects.py`, `backend/tests/tasks/test_tasks.py`, `backend/tests/comments/test_comments.py`

**Steps:**

- [ ] Create `backend/tests/conftest.py` with async test client (HTTPX AsyncClient), test database setup, fixtures for authenticated user.

- [ ] Write auth tests: signup, login, refresh, logout, me, invalid credentials, duplicate email.

- [ ] Write user tests: list, get, update, toggle status, permission checks.

- [ ] Write role tests: CRUD, permission assignment, system role protection.

- [ ] Write project tests: CRUD, member management, status management.

- [ ] Write task tests: CRUD, assignment, reassignment, status change.

- [ ] Write comment tests: create, reply, edit, soft delete.

- [ ] Run `pytest` and verify all tests pass.
