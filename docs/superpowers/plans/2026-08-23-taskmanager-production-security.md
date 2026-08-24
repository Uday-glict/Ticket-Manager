# TaskManager Production-Grade Security & Response System

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace bcrypt with Argon2id, implement centralized backend messages/error codes/response format, and wire frontend toast system to display backend-provided messages.

**Architecture:** Backend becomes the single source of truth for all business messages. Frontend `apiClient` extracts `response.message` and routes it through a centralized `ToastProvider`. Password hashing switches from passlib+bcrypt to argon2-cffi. All API responses follow a standard `{success, message, data?, error?, pagination?}` envelope.

**Tech Stack:** Python 3.13, FastAPI, SQLAlchemy 2.x, asyncpg, argon2-cffi, Pydantic v2, React 18, TypeScript, Axios, Tailwind CSS

## Global Constraints

- Python 3.13, FastAPI, SQLAlchemy 2.x, Pydantic v2, asyncpg
- React 18 + TypeScript + Tailwind CSS frontend
- Backend at port 3000, frontend at port 5173 (Vite proxy)
- No microservices, no Redis, no Kafka
- `.env` for secrets, Alembic migrations only
- Venv is `backend/venv/`
- Do NOT modify frontend UI design; only wire API integration and toast
- Do NOT create duplicate APIs or replace working APIs
- Do NOT change existing folder architecture unnecessarily

## Files Created (Planned)

| File | Purpose |
|------|---------|
| `backend/app/constants/messages.py` | Centralized message constants by module |
| `backend/app/constants/error_codes.py` | Centralized error code constants |

## Files Modified (Planned)

| File | Change |
|------|--------|
| `backend/requirements.txt` | Add argon2-cffi, remove passlib/bcrypt |
| `backend/app/core/security.py` | Replace bcrypt with argon2-cffi |
| `backend/app/core/exceptions.py` | Add ValidationException, DatabaseException; add `details` field |
| `backend/app/main.py` | Add global handlers for RequestValidationError, generic Exception |
| `backend/app/api/v1/auth.py` | Use message constants, proper status codes, standard responses |
| `backend/app/services/auth_service.py` | Use message constants, wrap in try/except for DB errors |
| `backend/app/schemas/auth.py` | Add max_length=128 to password field |
| `backend/app/dependencies/auth.py` | Use message constants |
| `backend/app/dependencies/permissions.py` | Use message constants |
| `backend/app/api/v1/users.py` | Use response helpers, message constants |
| `backend/app/api/v1/roles.py` | Use response helpers, message constants |
| `backend/app/api/v1/projects.py` | Use response helpers, message constants |
| `backend/app/api/v1/project_members.py` | Use response helpers, message constants |
| `backend/app/api/v1/project_statuses.py` | Use response helpers, message constants |
| `backend/app/api/v1/tasks.py` | Use response helpers, message constants |
| `backend/app/api/v1/comments.py` | Use response helpers, message constants |
| `backend/app/api/v1/board.py` | Use response helpers, message constants |
| `backend/app/api/v1/dashboard.py` | Use response helpers, message constants |
| `backend/app/api/v1/audit_logs.py` | Use response helpers, message constants |
| `backend/app/api/v1/permissions.py` | Use response helpers, message constants |
| `backend/app/utils/response.py` | Enhance helpers with message param from constants |
| `frontend/src/api/apiClient.ts` | Extract message from responses, handle errors centrally |
| `frontend/src/context/AuthContext.tsx` | Return error info from login/signup instead of boolean |
| `frontend/src/pages/auth/SignupPage.tsx` | Use backend message for errors |
| `frontend/src/pages/auth/LoginPage.tsx` | Use backend message for errors |
| `frontend/src/pages/projects/CreateProjectPage.tsx` | Use backend message for errors |
| `frontend/src/pages/tasks/CreateTaskPage.tsx` | Use backend message for errors |
| `frontend/src/pages/settings/ProfilePage.tsx` | Use backend message for success/errors |

## New Files Created (Frontend)

| File | Purpose |
|------|---------|
| `frontend/src/context/ToastContext.tsx` | ToastProvider + useToast hook wrapping existing ToastContainer |

---

## Task 1: Install argon2-cffi and Remove passlib/bcrypt

**Files:**
- Modify: `backend/requirements.txt`

- [ ] **Step 1: Update requirements.txt**

Remove these lines:
```
passlib[bcrypt]==1.7.4
bcrypt==4.0.1
passlib==1.7.4
bcrypt==4.0.1
```

Add this line:
```
argon2-cffi==23.1.0
```

- [ ] **Step 2: Install in venv**

```bash
cd F:/SAVTech/Study/Project/TaskManager/backend
venv/Scripts/pip.exe install argon2-cffi==23.1.0
venv/Scripts/pip.exe uninstall passlib bcrypt -y
```

- [ ] **Step 3: Verify install**

```bash
cd F:/SAVTech/Study/Project/TaskManager/backend
venv/Scripts/python.exe -c "from argon2 import PasswordHasher; ph = PasswordHasher(); h = ph.hash('test1234'); print('Argon2id OK:', ph.verify(h, 'test1234'))"
```

Expected: `Argon2id OK: True`

- [ ] **Step 4: Commit**

```bash
git add backend/requirements.txt
git commit -m "deps: replace passlib/bcrypt with argon2-cffi"
```

---

## Task 2: Create Centralized Message Constants

**Files:**
- Create: `backend/app/constants/messages.py`

- [ ] **Step 1: Create messages.py**

```python
AUTH_MESSAGES = {
    "SIGNUP_SUCCESS": "Account created successfully.",
    "LOGIN_SUCCESS": "Login successful.",
    "LOGOUT_SUCCESS": "Logged out successfully.",
    "REFRESH_SUCCESS": "Token refreshed successfully.",
    "INVALID_CREDENTIALS": "Invalid email or password.",
    "EMAIL_ALREADY_EXISTS": "An account with this email already exists.",
    "PASSWORD_VALIDATION_FAILED": "Password must be between 8 and 128 characters.",
    "ACCOUNT_INACTIVE": "Your account is inactive.",
    "TOKEN_EXPIRED": "Your session has expired.",
    "INVALID_TOKEN": "Invalid authentication token.",
    "USER_NOT_FOUND": "User not found.",
}

USER_MESSAGES = {
    "LIST_SUCCESS": "Users retrieved successfully.",
    "GET_SUCCESS": "User retrieved successfully.",
    "UPDATED": "User updated successfully.",
    "STATUS_UPDATED": "User status updated successfully.",
    "NOT_FOUND": "User not found.",
    "ALREADY_EXISTS": "User already exists.",
}

ROLE_MESSAGES = {
    "LIST_SUCCESS": "Roles retrieved successfully.",
    "CREATED": "Role created successfully.",
    "UPDATED": "Role updated successfully.",
    "DELETED": "Role deleted successfully.",
    "NOT_FOUND": "Role not found.",
    "ALREADY_EXISTS": "A role with this name already exists.",
    "CANNOT_MODIFY_SYSTEM": "Cannot modify a system role.",
    "CANNOT_DELETE_SYSTEM": "Cannot delete a system role.",
}

PERMISSION_MESSAGES = {
    "LIST_SUCCESS": "Permissions retrieved successfully.",
    "UPDATED": "Permissions updated successfully.",
    "FORBIDDEN": "You do not have permission to perform this action.",
}

PROJECT_MESSAGES = {
    "LIST_SUCCESS": "Projects retrieved successfully.",
    "GET_SUCCESS": "Project retrieved successfully.",
    "CREATED": "Project created successfully.",
    "UPDATED": "Project updated successfully.",
    "DELETED": "Project deleted successfully.",
    "NOT_FOUND": "Project not found.",
}

PROJECT_MEMBER_MESSAGES = {
    "LIST_SUCCESS": "Project members retrieved successfully.",
    "ADDED": "Member added to project successfully.",
    "UPDATED": "Member role updated successfully.",
    "REMOVED": "Member removed from project successfully.",
    "NOT_FOUND": "Project member not found.",
}

PROJECT_STATUS_MESSAGES = {
    "LIST_SUCCESS": "Project statuses retrieved successfully.",
    "CREATED": "Project status created successfully.",
    "UPDATED": "Project status updated successfully.",
    "DELETED": "Project status deleted successfully.",
    "NOT_FOUND": "Project status not found.",
}

TASK_MESSAGES = {
    "LIST_SUCCESS": "Tasks retrieved successfully.",
    "GET_SUCCESS": "Task retrieved successfully.",
    "CREATED": "Task created successfully.",
    "UPDATED": "Task updated successfully.",
    "ASSIGNED": "Task assigned successfully.",
    "REASSIGNED": "Task reassigned successfully.",
    "NOT_FOUND": "Task not found.",
    "ASSIGNMENTS_SUCCESS": "Assignment history retrieved successfully.",
}

COMMENT_MESSAGES = {
    "LIST_SUCCESS": "Comments retrieved successfully.",
    "CREATED": "Comment added successfully.",
    "UPDATED": "Comment updated successfully.",
    "DELETED": "Comment deleted successfully.",
    "NOT_FOUND": "Comment not found.",
    "FORBIDDEN": "You can only modify your own comments.",
}

BOARD_MESSAGES = {
    "GET_SUCCESS": "Board data retrieved successfully.",
}

DASHBOARD_MESSAGES = {
    "SUMMARY_SUCCESS": "Dashboard summary retrieved successfully.",
    "PROJECTS_SUCCESS": "Project summaries retrieved successfully.",
}

AUDIT_MESSAGES = {
    "LIST_SUCCESS": "Audit logs retrieved successfully.",
}

COMMON_MESSAGES = {
    "SUCCESS": "Operation completed successfully.",
    "VALIDATION_ERROR": "Please check the provided information.",
    "UNAUTHORIZED": "Authentication is required.",
    "FORBIDDEN": "You do not have permission to perform this action.",
    "NOT_FOUND": "Requested resource was not found.",
    "CONFLICT": "The requested operation conflicts with existing data.",
    "INTERNAL_ERROR": "An unexpected error occurred. Please try again later.",
    "DATABASE_ERROR": "A database error occurred. Please try again later.",
}
```

- [ ] **Step 2: Commit**

```bash
git add backend/app/constants/messages.py
git commit -m "feat: add centralized backend message constants"
```

---

## Task 3: Create Centralized Error Codes

**Files:**
- Create: `backend/app/constants/error_codes.py`

- [ ] **Step 1: Create error_codes.py**

```python
# Authentication
AUTH_INVALID_CREDENTIALS = "AUTH_INVALID_CREDENTIALS"
AUTH_EMAIL_ALREADY_EXISTS = "AUTH_EMAIL_ALREADY_EXISTS"
AUTH_PASSWORD_VALIDATION_FAILED = "AUTH_PASSWORD_VALIDATION_FAILED"
AUTH_ACCOUNT_INACTIVE = "AUTH_ACCOUNT_INACTIVE"
AUTH_TOKEN_EXPIRED = "AUTH_TOKEN_EXPIRED"
AUTH_INVALID_TOKEN = "AUTH_INVALID_TOKEN"
AUTH_USER_NOT_FOUND = "AUTH_USER_NOT_FOUND"

# Users
USER_NOT_FOUND = "USER_NOT_FOUND"
USER_ALREADY_EXISTS = "USER_ALREADY_EXISTS"
USER_UPDATE_FAILED = "USER_UPDATE_FAILED"

# Roles
ROLE_NOT_FOUND = "ROLE_NOT_FOUND"
ROLE_ALREADY_EXISTS = "ROLE_ALREADY_EXISTS"
ROLE_CANNOT_MODIFY_SYSTEM = "ROLE_CANNOT_MODIFY_SYSTEM"
ROLE_CANNOT_DELETE_SYSTEM = "ROLE_CANNOT_DELETE_SYSTEM"

# Projects
PROJECT_NOT_FOUND = "PROJECT_NOT_FOUND"
PROJECT_MEMBER_NOT_FOUND = "PROJECT_MEMBER_NOT_FOUND"
PROJECT_STATUS_NOT_FOUND = "PROJECT_STATUS_NOT_FOUND"

# Tasks
TASK_NOT_FOUND = "TASK_NOT_FOUND"

# Comments
COMMENT_NOT_FOUND = "COMMENT_NOT_FOUND"
COMMENT_FORBIDDEN = "COMMENT_FORBIDDEN"

# Permissions
PERMISSION_DENIED = "PERMISSION_DENIED"

# General
VALIDATION_ERROR = "VALIDATION_ERROR"
RESOURCE_NOT_FOUND = "RESOURCE_NOT_FOUND"
RESOURCE_CONFLICT = "RESOURCE_CONFLICT"
INTERNAL_SERVER_ERROR = "INTERNAL_SERVER_ERROR"
DATABASE_ERROR = "DATABASE_ERROR"
```

- [ ] **Step 2: Commit**

```bash
git add backend/app/constants/error_codes.py
git commit -m "feat: add centralized error codes"
```

---

## Task 4: Implement Argon2id Password Hashing

**Files:**
- Modify: `backend/app/core/security.py`

- [ ] **Step 1: Replace security.py contents**

Replace the entire file with:

```python
from datetime import timedelta
from jose import JWTError, jwt
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError, InvalidHashError
from app.core.config import settings
from app.utils.datetime import utcnow
import hashlib

ph = PasswordHasher(
    time_cost=3,
    memory_cost=65536,
    parallelism=4,
    hash_len=32,
    salt_len=16,
)


def hash_password(password: str) -> str:
    return ph.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        ph.verify(hashed_password, plain_password)
        return True
    except (VerifyMismatchError, InvalidHashError):
        return False


def needs_rehash(password_hash: str) -> bool:
    return ph.check_needs_rehash(password_hash)


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

- [ ] **Step 2: Verify imports work**

```bash
cd F:/SAVTech/Study/Project/TaskManager/backend
venv/Scripts/python.exe -c "from app.core.security import hash_password, verify_password; h = hash_password('test1234!'); print('Hash:', h[:20] + '...'); print('Verify:', verify_password('test1234!', h)); print('Wrong:', verify_password('wrong', h))"
```

Expected:
```
Hash: $argon2id$v=19$m=...
Verify: True
Wrong: False
```

- [ ] **Step 3: Commit**

```bash
git add backend/app/core/security.py
git commit -m "feat: replace bcrypt with argon2id password hashing"
```

---

## Task 5: Update Password Schema Validation

**Files:**
- Modify: `backend/app/schemas/auth.py`

- [ ] **Step 1: Update SignupRequest password field**

Change:
```python
password: str = Field(min_length=8)
```

To:
```python
password: str = Field(min_length=8, max_length=128)
```

- [ ] **Step 2: Commit**

```bash
git add backend/app/schemas/auth.py
git commit -m "feat: add max_length=128 to password field"
```

---

## Task 6: Enhance Exception System

**Files:**
- Modify: `backend/app/core/exceptions.py`

- [ ] **Step 1: Replace exceptions.py**

```python
from fastapi import HTTPException
from typing import Any, List, Optional


class AppException(HTTPException):
    def __init__(self, status_code: int, message: str, code: str, details: Any = None):
        super().__init__(status_code=status_code, detail=message)
        self.code = code
        self.message = message
        self.details = details


class NotFoundException(AppException):
    def __init__(self, resource: str = "Resource", code: str = "RESOURCE_NOT_FOUND"):
        super().__init__(404, f"{resource} not found", code)


class BadRequestException(AppException):
    def __init__(self, message: str = "Bad request", code: str = "BAD_REQUEST"):
        super().__init__(400, message, code)


class UnauthorizedException(AppException):
    def __init__(self, message: str = "Unauthorized", code: str = "UNAUTHORIZED"):
        super().__init__(401, message, code)


class ForbiddenException(AppException):
    def __init__(self, message: str = "Forbidden", code: str = "PERMISSION_DENIED"):
        super().__init__(403, message, code)


class ConflictException(AppException):
    def __init__(self, message: str = "Resource already exists", code: str = "RESOURCE_CONFLICT"):
        super().__init__(409, message, code)


class ValidationException(AppException):
    def __init__(self, message: str = "Validation error", details: Any = None):
        super().__init__(422, message, "VALIDATION_ERROR", details)


class DatabaseException(AppException):
    def __init__(self, message: str = "A database error occurred", code: str = "DATABASE_ERROR"):
        super().__init__(500, message, code)
```

- [ ] **Step 2: Commit**

```bash
git add backend/app/core/exceptions.py
git commit -m "feat: enhance exception system with ValidationException and DatabaseException"
```

---

## Task 7: Update Global Exception Handlers

**Files:**
- Modify: `backend/app/main.py`

- [ ] **Step 1: Replace main.py**

```python
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from contextlib import asynccontextmanager
from app.api.v1.router import api_router
from app.core.exceptions import AppException
from app.constants.messages import COMMON_MESSAGES
from app.constants.error_codes import INTERNAL_SERVER_ERROR, VALIDATION_ERROR
import logging

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield


app = FastAPI(title="TaskManager API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(AppException)
async def app_exception_handler(request: Request, exc: AppException):
    content = {
        "success": False,
        "message": exc.message,
        "error": {"code": exc.code, "details": exc.details},
    }
    return JSONResponse(status_code=exc.status_code, content=content)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    details = []
    for error in exc.errors():
        field = ".".join(str(loc) for loc in error["loc"] if loc != "body")
        details.append({"field": field, "message": error["msg"]})
    return JSONResponse(
        status_code=422,
        content={
            "success": False,
            "message": COMMON_MESSAGES["VALIDATION_ERROR"],
            "error": {"code": VALIDATION_ERROR, "details": details},
        },
    )


@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled exception")
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "message": COMMON_MESSAGES["INTERNAL_ERROR"],
            "error": {"code": INTERNAL_SERVER_ERROR, "details": None},
        },
    )


app.include_router(api_router)


@app.get("/health")
async def health():
    return {"status": "ok"}
```

- [ ] **Step 2: Commit**

```bash
git add backend/app/main.py
git commit -m "feat: add global exception handlers for validation and generic errors"
```

---

## Task 8: Enhance Response Helpers

**Files:**
- Modify: `backend/app/utils/response.py`

- [ ] **Step 1: Replace response.py**

```python
from typing import Any, Dict, List, Optional


def success_response(data: Any = None, message: str = "Success", pagination: Optional[Dict] = None) -> Dict:
    response: Dict[str, Any] = {"success": True, "message": message, "data": data}
    if pagination:
        response["pagination"] = pagination
    return response


def error_response(message: str = "Error", code: str = "ERROR", details: Any = None) -> Dict:
    return {"success": False, "message": message, "error": {"code": code, "details": details}}


def paginated_response(data: Any, pagination: Dict, message: str = "Success") -> Dict:
    return {"success": True, "message": message, "data": data, "pagination": pagination}
```

- [ ] **Step 2: Commit**

```bash
git add backend/app/utils/response.py
git commit -m "feat: enhance response helpers with details support"
```

---

## Task 9: Update Auth API to Use Messages and Standard Responses

**Files:**
- Modify: `backend/app/api/v1/auth.py`

- [ ] **Step 1: Replace auth.py**

```python
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.database import get_db
from app.schemas.auth import SignupRequest, LoginRequest, RefreshRequest
from app.services.auth_service import AuthService
from app.dependencies.auth import get_current_active_user
from app.models.user import User
from app.utils.response import success_response
from app.constants.messages import AUTH_MESSAGES, COMMON_MESSAGES

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/signup", status_code=status.HTTP_201_CREATED)
async def signup(request: SignupRequest, db: AsyncSession = Depends(get_db)):
    service = AuthService(db)
    result = await service.signup(
        email=request.email,
        password=request.password,
        name=request.name,
        workspace_name=request.workspace_name,
        workspace_type=request.workspace_type,
    )
    return success_response(data=result, message=AUTH_MESSAGES["SIGNUP_SUCCESS"])


@router.post("/login")
async def login(request: LoginRequest, db: AsyncSession = Depends(get_db)):
    service = AuthService(db)
    result = await service.login(email=request.email, password=request.password)
    return success_response(data=result, message=AUTH_MESSAGES["LOGIN_SUCCESS"])


@router.post("/refresh")
async def refresh(request: RefreshRequest, db: AsyncSession = Depends(get_db)):
    service = AuthService(db)
    result = await service.refresh(refresh_token_str=request.refresh_token)
    return success_response(data=result, message=AUTH_MESSAGES["REFRESH_SUCCESS"])


@router.post("/logout")
async def logout(
    request: RefreshRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    service = AuthService(db)
    await service.logout(user_id=current_user.id, refresh_token_str=request.refresh_token)
    return success_response(message=AUTH_MESSAGES["LOGOUT_SUCCESS"])


@router.get("/me")
async def me(current_user: User = Depends(get_current_active_user)):
    return success_response(
        data={
            "id": current_user.id,
            "email": current_user.email,
            "name": current_user.name,
            "avatar": current_user.avatar,
            "status": current_user.status,
            "is_superadmin": current_user.is_superadmin,
        },
        message=COMMON_MESSAGES["SUCCESS"],
    )
```

- [ ] **Step 2: Commit**

```bash
git add backend/app/api/v1/auth.py
git commit -m "feat: update auth API with message constants and standard responses"
```

---

## Task 10: Update Auth Service with Messages and Error Handling

**Files:**
- Modify: `backend/app/services/auth_service.py`

- [ ] **Step 1: Replace auth_service.py**

```python
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.repositories.user_repository import UserRepository
from app.repositories.workspace_repository import WorkspaceRepository
from app.repositories.role_repository import RoleRepository
from app.core.security import hash_password, verify_password, create_access_token, create_refresh_token, decode_token, hash_token
from app.core.exceptions import ConflictException, UnauthorizedException, NotFoundException, ValidationException, DatabaseException
from app.constants.messages import AUTH_MESSAGES
from app.constants.error_codes import (
    AUTH_INVALID_CREDENTIALS, AUTH_EMAIL_ALREADY_EXISTS,
    AUTH_PASSWORD_VALIDATION_FAILED, AUTH_TOKEN_EXPIRED,
)
from app.models.refresh_token import RefreshToken
from app.models.user import User
from app.utils.datetime import utcnow
from datetime import timedelta
from typing import Optional
from uuid import UUID
import logging

logger = logging.getLogger(__name__)


class AuthService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.user_repo = UserRepository(db)
        self.workspace_repo = WorkspaceRepository(db)
        self.role_repo = RoleRepository(db)

    async def signup(self, email: str, password: str, name: str, workspace_name: Optional[str] = None, workspace_type: str = "individual") -> dict:
        existing = await self.user_repo.get_by_email(email)
        if existing:
            raise ConflictException(
                message=AUTH_MESSAGES["EMAIL_ALREADY_EXISTS"],
                code=AUTH_EMAIL_ALREADY_EXISTS,
            )

        try:
            user = await self.user_repo.create(email=email, name=name, password_hash=hash_password(password))
            ws_name = workspace_name or f"{name}'s Workspace"
            workspace = await self.workspace_repo.create(name=ws_name, workspace_type=workspace_type, owner_id=user.id)
            await self.workspace_repo.add_member(workspace_id=workspace.id, user_id=user.id, role="owner")
            admin_role = await self.role_repo.create(workspace_id=workspace.id, name="Admin", description="Full access", is_system=True)
            await self.role_repo.add_permissions(admin_role, Permissions.ALL)

            access_token = create_access_token(data={"sub": str(user.id)})
            refresh_token = create_refresh_token(data={"sub": str(user.id)})
            await self._save_refresh_token(user.id, refresh_token)

            await self.db.commit()

            return {
                "access_token": access_token,
                "refresh_token": refresh_token,
                "token_type": "bearer",
                "user": {
                    "id": user.id,
                    "email": user.email,
                    "name": user.name,
                    "avatar": user.avatar,
                    "status": user.status,
                    "is_superadmin": user.is_superadmin,
                },
            }
        except ConflictException:
            raise
        except Exception as e:
            await self.db.rollback()
            logger.exception("Signup failed")
            raise DatabaseException()

    async def login(self, email: str, password: str) -> dict:
        user = await self.user_repo.get_by_email(email)
        if not user or not verify_password(password, user.password_hash):
            raise UnauthorizedException(
                message=AUTH_MESSAGES["INVALID_CREDENTIALS"],
                code=AUTH_INVALID_CREDENTIALS,
            )

        if user.status != "active":
            from app.constants.error_codes import AUTH_ACCOUNT_INACTIVE
            raise UnauthorizedException(
                message=AUTH_MESSAGES["ACCOUNT_INACTIVE"],
                code=AUTH_ACCOUNT_INACTIVE,
            )

        user.last_login_at = utcnow()
        await self.db.flush()

        access_token = create_access_token(data={"sub": str(user.id)})
        refresh_token = create_refresh_token(data={"sub": str(user.id)})
        await self._save_refresh_token(user.id, refresh_token)

        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "user": {
                "id": user.id,
                "email": user.email,
                "name": user.name,
                "avatar": user.avatar,
                "status": user.status,
                "is_superadmin": user.is_superadmin,
            },
        }

    async def refresh(self, refresh_token_str: str) -> dict:
        payload = decode_token(refresh_token_str)
        if payload is None or payload.get("type") != "refresh":
            from app.constants.error_codes import AUTH_INVALID_TOKEN
            raise UnauthorizedException(
                message=AUTH_MESSAGES["INVALID_TOKEN"],
                code=AUTH_INVALID_TOKEN,
            )

        user_id = payload.get("sub")
        token_hash = hash_token(refresh_token_str)

        result = await self.db.execute(
            select(RefreshToken).where(
                RefreshToken.user_id == UUID(user_id),
                RefreshToken.token_hash == token_hash,
                RefreshToken.revoked_at.is_(None),
            )
        )
        db_token = result.scalar_one_or_none()
        if not db_token:
            from app.constants.error_codes import AUTH_INVALID_TOKEN
            raise UnauthorizedException(
                message=AUTH_MESSAGES["INVALID_TOKEN"],
                code=AUTH_INVALID_TOKEN,
            )

        if db_token.expires_at < utcnow():
            raise UnauthorizedException(
                message=AUTH_MESSAGES["TOKEN_EXPIRED"],
                code=AUTH_TOKEN_EXPIRED,
            )

        db_token.revoked_at = utcnow()
        await self.db.flush()

        new_access = create_access_token(data={"sub": user_id})
        new_refresh = create_refresh_token(data={"sub": user_id})
        await self._save_refresh_token(UUID(user_id), new_refresh)

        user = await self.user_repo.get_by_id(UUID(user_id))
        return {
            "access_token": new_access,
            "refresh_token": new_refresh,
            "token_type": "bearer",
            "user": {
                "id": user.id,
                "email": user.email,
                "name": user.name,
                "avatar": user.avatar,
                "status": user.status,
                "is_superadmin": user.is_superadmin,
            },
        }

    async def logout(self, user_id: UUID, refresh_token_str: str) -> None:
        token_hash = hash_token(refresh_token_str)
        result = await self.db.execute(
            select(RefreshToken).where(
                RefreshToken.user_id == user_id,
                RefreshToken.token_hash == token_hash,
            )
        )
        db_token = result.scalar_one_or_none()
        if db_token:
            db_token.revoked_at = utcnow()
            await self.db.flush()

    async def get_me(self, user_id: UUID) -> dict:
        user = await self.user_repo.get_by_id(user_id)
        if not user:
            raise NotFoundException(
                AUTH_MESSAGES["USER_NOT_FOUND"],
                code="AUTH_USER_NOT_FOUND",
            )
        return {
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "avatar": user.avatar,
            "status": user.status,
            "is_superadmin": user.is_superadmin,
        }

    async def _save_refresh_token(self, user_id: UUID, refresh_token_str: str) -> None:
        from app.core.config import settings
        token_hash = hash_token(refresh_token_str)
        expires_at = utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
        db_token = RefreshToken(user_id=user_id, token_hash=token_hash, expires_at=expires_at)
        self.db.add(db_token)
        await self.db.flush()
```

- [ ] **Step 2: Commit**

```bash
git add backend/app/services/auth_service.py
git commit -m "feat: update auth service with message constants and transaction handling"
```

---

## Task 11: Update Auth Dependencies to Use Messages

**Files:**
- Modify: `backend/app/dependencies/auth.py`

- [ ] **Step 1: Replace auth.py**

```python
from fastapi import Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.database import get_db
from app.core.security import decode_token
from app.core.exceptions import UnauthorizedException, ForbiddenException
from app.constants.messages import AUTH_MESSAGES
from app.constants.error_codes import AUTH_INVALID_TOKEN, AUTH_USER_NOT_FOUND, AUTH_ACCOUNT_INACTIVE
from app.models.user import User

security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db),
) -> User:
    token = credentials.credentials
    payload = decode_token(token)
    if payload is None or payload.get("type") != "access":
        raise UnauthorizedException(
            message=AUTH_MESSAGES["INVALID_TOKEN"],
            code=AUTH_INVALID_TOKEN,
        )
    user_id = payload.get("sub")
    if user_id is None:
        raise UnauthorizedException(
            message=AUTH_MESSAGES["INVALID_TOKEN"],
            code=AUTH_INVALID_TOKEN,
        )
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if user is None:
        raise UnauthorizedException(
            message=AUTH_MESSAGES["USER_NOT_FOUND"],
            code=AUTH_USER_NOT_FOUND,
        )
    return user


async def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    if current_user.status != "active":
        raise ForbiddenException(
            message=AUTH_MESSAGES["ACCOUNT_INACTIVE"],
            code=AUTH_ACCOUNT_INACTIVE,
        )
    return current_user
```

- [ ] **Step 2: Commit**

```bash
git add backend/app/dependencies/auth.py
git commit -m "feat: update auth dependencies with message constants"
```

---

## Task 12: Update Permission Dependencies to Use Messages

**Files:**
- Modify: `backend/app/dependencies/permissions.py`

- [ ] **Step 1: Replace permissions.py**

```python
from fastapi import Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.database import get_db
from app.dependencies.auth import get_current_active_user
from app.core.exceptions import ForbiddenException
from app.constants.messages import COMMON_MESSAGES, PERMISSION_MESSAGES
from app.constants.error_codes import PERMISSION_DENIED
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
        raise ForbiddenException(
            message=PERMISSION_MESSAGES["FORBIDDEN"],
            code=PERMISSION_DENIED,
        )
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
        raise ForbiddenException(
            message=PERMISSION_MESSAGES["FORBIDDEN"],
            code=PERMISSION_DENIED,
        )
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
        raise ForbiddenException(
            message=PERMISSION_MESSAGES["FORBIDDEN"],
            code=PERMISSION_DENIED,
        )
    return member
```

- [ ] **Step 2: Commit**

```bash
git add backend/app/dependencies/permissions.py
git commit -m "feat: update permission dependencies with message constants"
```

---

## Task 13: Update All Remaining API Endpoints

Update each API file to use `success_response()` from `app.utils.response` and message constants from `app.constants.messages`. Each endpoint must return the standard envelope.

**Files:**
- Modify: `backend/app/api/v1/users.py`
- Modify: `backend/app/api/v1/roles.py`
- Modify: `backend/app/api/v1/permissions.py`
- Modify: `backend/app/api/v1/projects.py`
- Modify: `backend/app/api/v1/project_members.py`
- Modify: `backend/app/api/v1/project_statuses.py`
- Modify: `backend/app/api/v1/tasks.py`
- Modify: `backend/app/api/v1/comments.py`
- Modify: `backend/app/api/v1/board.py`
- Modify: `backend/app/api/v1/dashboard.py`
- Modify: `backend/app/api/v1/audit_logs.py`

For each file, the pattern is:
1. Add imports: `from app.utils.response import success_response` and relevant message constants
2. Replace every `return {"success": True, "data": ...}` with `return success_response(data=..., message=MESSAGES["KEY"])`
3. Replace every `return {"success": True, "message": "..."}` with `return success_response(message=MESSAGES["KEY"])`

Example for `users.py`:

```python
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.database import get_db
from app.schemas.user import UserCreateRequest, UserUpdateRequest, UserStatusUpdate
from app.services.user_service import UserService
from app.dependencies.permissions import require_permission
from app.models.workspace_member import WorkspaceMember
from app.utils.response import success_response, paginated_response
from app.constants.messages import USER_MESSAGES

router = APIRouter(prefix="/users", tags=["users"])


@router.get("")
async def list_users(
    search: str = Query(None),
    status: str = Query(None),
    page: int = Query(1),
    limit: int = Query(20),
    workspace_member: WorkspaceMember = Depends(require_permission("users.manage")),
    db: AsyncSession = Depends(get_db),
):
    service = UserService(db)
    result = await service.list_users(search=search, status=status, page=page, limit=limit)
    data = [{"id": str(u.id), "email": u.email, "name": u.name, "avatar": u.avatar, "status": u.status, "is_superadmin": u.is_superadmin} for u in result["items"]]
    return paginated_response(data=data, pagination=result["pagination"], message=USER_MESSAGES["LIST_SUCCESS"])


@router.get("/{user_id}")
async def get_user(user_id: str, workspace_member: WorkspaceMember = Depends(require_permission("users.manage")), db: AsyncSession = Depends(get_db)):
    from uuid import UUID
    service = UserService(db)
    user = await service.get_user(UUID(user_id))
    return success_response(
        data={"id": str(user.id), "email": user.email, "name": user.name, "avatar": user.avatar, "status": user.status, "is_superadmin": user.is_superadmin},
        message=USER_MESSAGES["GET_SUCCESS"],
    )


@router.put("/{user_id}")
async def update_user(user_id: str, request: UserUpdateRequest, workspace_member: WorkspaceMember = Depends(require_permission("users.manage")), db: AsyncSession = Depends(get_db)):
    from uuid import UUID
    service = UserService(db)
    user = await service.update_user(UUID(user_id), **request.model_dump(exclude_unset=True))
    return success_response(
        data={"id": str(user.id), "email": user.email, "name": user.name, "avatar": user.avatar, "status": user.status},
        message=USER_MESSAGES["UPDATED"],
    )


@router.patch("/{user_id}/status")
async def toggle_status(user_id: str, request: UserStatusUpdate, workspace_member: WorkspaceMember = Depends(require_permission("users.manage")), db: AsyncSession = Depends(get_db)):
    from uuid import UUID
    service = UserService(db)
    user = await service.toggle_status(UUID(user_id), request.status)
    return success_response(
        data={"id": str(user.id), "status": user.status},
        message=USER_MESSAGES["STATUS_UPDATED"],
    )
```

Apply the same pattern to ALL remaining API files. The specific message keys for each module are defined in `app/constants/messages.py`.

- [ ] **Step 1: Update users.py** (as shown above)
- [ ] **Step 2: Update roles.py** (use ROLE_MESSAGES)
- [ ] **Step 3: Update permissions.py** (use PERMISSION_MESSAGES)
- [ ] **Step 4: Update projects.py** (use PROJECT_MESSAGES)
- [ ] **Step 5: Update project_members.py** (use PROJECT_MEMBER_MESSAGES)
- [ ] **Step 6: Update project_statuses.py** (use PROJECT_STATUS_MESSAGES)
- [ ] **Step 7: Update tasks.py** (use TASK_MESSAGES)
- [ ] **Step 8: Update comments.py** (use COMMENT_MESSAGES)
- [ ] **Step 9: Update board.py** (use BOARD_MESSAGES)
- [ ] **Step 10: Update dashboard.py** (use DASHBOARD_MESSAGES)
- [ ] **Step 11: Update audit_logs.py** (use AUDIT_MESSAGES)
- [ ] **Step 12: Commit**

```bash
git add backend/app/api/v1/
git commit -m "feat: update all API endpoints with standard response format and messages"
```

---

## Task 14: Update Service Layer with Message Constants

**Files:**
- Modify: `backend/app/services/user_service.py`
- Modify: `backend/app/services/role_service.py`
- Modify: `backend/app/services/project_service.py`
- Modify: `backend/app/services/project_status_service.py`
- Modify: `backend/app/services/task_service.py`
- Modify: `backend/app/services/comment_service.py`

Replace all hardcoded exception messages with message constants. Example for `user_service.py`:

```python
from app.core.exceptions import NotFoundException, ConflictException
from app.constants.messages import USER_MESSAGES
from app.constants.error_codes import USER_NOT_FOUND

# In get_user:
raise NotFoundException(USER_MESSAGES["NOT_FOUND"], code=USER_NOT_FOUND)
```

Apply the same pattern to all services.

- [ ] **Step 1: Update user_service.py**
- [ ] **Step 2: Update role_service.py**
- [ ] **Step 3: Update project_service.py**
- [ ] **Step 4: Update project_status_service.py**
- [ ] **Step 5: Update task_service.py**
- [ ] **Step 6: Update comment_service.py**
- [ ] **Step 7: Commit**

```bash
git add backend/app/services/
git commit -m "feat: update service layer with message constants"
```

---

## Task 15: Create Frontend ToastContext

**Files:**
- Create: `frontend/src/context/ToastContext.tsx`

- [ ] **Step 1: Create ToastContext.tsx**

```typescript
import { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import { ToastContainer } from '../components/common/Toast';
import type { Toast, ToastType } from '../types';

interface ToastContextType {
  toast: (type: ToastType, message: string, duration?: number) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  warning: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((type: ToastType, message: string, duration?: number) => {
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, type, message, duration }]);
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((type: ToastType, message: string, duration?: number) => {
    addToast(type, message, duration);
  }, [addToast]);

  const success = useCallback((message: string) => addToast('success', message), [addToast]);
  const error = useCallback((message: string) => addToast('error', message), [addToast]);
  const warning = useCallback((message: string) => addToast('warning', message), [addToast]);
  const info = useCallback((message: string) => addToast('info', message), [addToast]);

  return (
    <ToastContext.Provider value={{ toast, success, error, warning, info }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
}
```

- [ ] **Step 2: Wrap App with ToastProvider**

In `frontend/src/App.tsx` or `frontend/src/main.tsx`, wrap the app root with `<ToastProvider>`.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/context/ToastContext.tsx
git commit -m "feat: create centralized ToastContext with useToast hook"
```

---

## Task 16: Update apiClient to Handle Standard Responses

**Files:**
- Modify: `frontend/src/api/apiClient.ts`

- [ ] **Step 1: Replace apiClient.ts**

The key change: add response interceptor that extracts `response.data.message` and makes it available. Also add a helper to get error messages from backend responses.

```typescript
import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';

const apiClient = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
});

let isRefreshing = false;
let failedQueue: Array<{ resolve: (value: unknown) => void; reject: (reason?: unknown) => void }> = [];

const processQueue = (error: AxiosError | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return apiClient(originalRequest);
        });
      }
      originalRequest._retry = true;
      isRefreshing = true;
      const refreshToken = localStorage.getItem('refresh_token');
      if (!refreshToken) {
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(error);
      }
      try {
        const { data } = await axios.post('http://localhost:3000/api/v1/auth/refresh', { refresh_token: refreshToken });
        const newToken = data.data?.access_token || data.access_token;
        const newRefresh = data.data?.refresh_token || data.refresh_token;
        localStorage.setItem('access_token', newToken);
        localStorage.setItem('refresh_token', newRefresh);
        processQueue(null, newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError as AxiosError, null);
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error) && error.response?.data) {
    const data = error.response.data as Record<string, unknown>;
    if (typeof data.message === 'string') return data.message;
  }
  return 'An unexpected error occurred.';
}

export function getErrorDetails(error: unknown): { code: string; details: unknown } | null {
  if (axios.isAxiosError(error) && error.response?.data) {
    const data = error.response.data as Record<string, unknown>;
    if (data.error && typeof data.error === 'object') {
      return data.error as { code: string; details: unknown };
    }
  }
  return null;
}

export default apiClient;
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/api/apiClient.ts
git commit -m "feat: update apiClient with getErrorMessage and getErrorDetails helpers"
```

---

## Task 17: Update AuthContext to Return Error Info

**Files:**
- Modify: `frontend/src/context/AuthContext.tsx`

- [ ] **Step 1: Update login and signup to return error messages**

Change the `login` and `signup` functions to return `{ success: boolean; message?: string }` instead of just `boolean`:

```typescript
const login = async (email: string, password: string) => {
  try {
    const res = await authService.login(email, password);
    const data = res.data.data || res.data;
    localStorage.setItem('access_token', data.access_token);
    localStorage.setItem('refresh_token', data.refresh_token);
    const u = data.user;
    setUser({ id: u.id, name: u.name, email: u.email, avatar: u.avatar, status: u.status, createdAt: new Date().toISOString() });
    setRole({ id: '1', name: 'Admin', description: 'Full access', permissions: [], isSystem: true, createdAt: new Date().toISOString() });
    return { success: true, message: res.data.message };
  } catch (err: any) {
    const message = err.response?.data?.message || 'Login failed.';
    return { success: false, message };
  }
};

const signup = async (email: string, password: string, name: string, workspaceName?: string) => {
  try {
    const res = await authService.signup({ email, password, name, workspace_name: workspaceName });
    const data = res.data.data || res.data;
    localStorage.setItem('access_token', data.access_token);
    localStorage.setItem('refresh_token', data.refresh_token);
    const u = data.user;
    setUser({ id: u.id, name: u.name, email: u.email, avatar: u.avatar, status: u.status, createdAt: new Date().toISOString() });
    setRole({ id: '1', name: 'Admin', description: 'Full access', permissions: [], isSystem: true, createdAt: new Date().toISOString() });
    return { success: true, message: res.data.message };
  } catch (err: any) {
    const message = err.response?.data?.message || 'Signup failed.';
    return { success: false, message };
  }
};
```

- [ ] **Step 2: Update the interface type**

```typescript
interface AuthContextType {
  user: User | null;
  role: Role | null;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  signup: (email: string, password: string, name: string, workspaceName?: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean;
}
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/context/AuthContext.tsx
git commit -m "feat: update AuthContext to return backend messages from login/signup"
```

---

## Task 18: Update SignupPage to Use Backend Messages

**Files:**
- Modify: `frontend/src/pages/auth/SignupPage.tsx`

- [ ] **Step 1: Update error handling**

Replace the hardcoded `'Failed to create account'` message with the backend response message:

```typescript
// Before:
setErrors({ email: 'Failed to create account' });

// After - use useToast and backend message:
const { error: showError } = useToast();
// ...
const result = await signup(email, password, name, workspaceName);
if (result.success) {
  navigate('/dashboard');
} else {
  showError(result.message || 'Signup failed.');
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/pages/auth/SignupPage.tsx
git commit -m "feat: update SignupPage to use backend messages via toast"
```

---

## Task 19: Update LoginPage to Use Backend Messages

**Files:**
- Modify: `frontend/src/pages/auth/LoginPage.tsx`

- [ ] **Step 1: Update error handling**

Replace the hardcoded `'Invalid email or password'` with the backend message:

```typescript
// Before:
setErrors({ auth: 'Invalid email or password' });

// After:
const result = await login(email, password);
if (result.success) {
  navigate('/dashboard');
} else {
  setErrors({ auth: result.message || 'Login failed.' });
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/pages/auth/LoginPage.tsx
git commit -m "feat: update LoginPage to use backend messages"
```

---

## Task 20: Update CreateProjectPage to Use Backend Messages

**Files:**
- Modify: `frontend/src/pages/projects/CreateProjectPage.tsx`

- [ ] **Step 1: Update error handling**

Replace `setErrors({ name: 'Failed to create project' })` with toast using backend message:

```typescript
// Use useToast hook
const { error: showError } = useToast();

// In catch block:
catch {
  showError('Failed to create project. Please try again.');
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/pages/projects/CreateProjectPage.tsx
git commit -m "feat: update CreateProjectPage to use toast for errors"
```

---

## Task 21: Update CreateTaskPage to Use Backend Messages

**Files:**
- Modify: `frontend/src/pages/tasks/CreateTaskPage.tsx`

- [ ] **Step 1: Update error handling**

Replace `setErrors({ title: 'Failed to create task' })` with toast.

- [ ] **Step 2: Commit**

```bash
git add frontend/src/pages/tasks/CreateTaskPage.tsx
git commit -m "feat: update CreateTaskPage to use toast for errors"
```

---

## Task 22: Update ProfilePage to Use Backend Messages

**Files:**
- Modify: `frontend/src/pages/settings/ProfilePage.tsx`

- [ ] **Step 1: Replace inline success/error messages with toast**

Replace:
```typescript
setSuccessMsg('Profile updated successfully.');
```

With:
```typescript
const { success: showSuccess } = useToast();
showSuccess('Profile updated successfully.');
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/pages/settings/ProfilePage.tsx
git commit -m "feat: update ProfilePage to use toast instead of inline messages"
```

---

## Task 23: Verify Backend Builds and Imports

**Files:** None (verification only)

- [ ] **Step 1: Verify all imports**

```bash
cd F:/SAVTech/Study/Project/TaskManager/backend
venv/Scripts/python.exe -c "from app.main import app; print('Backend imports OK')"
```

Expected: `Backend imports OK`

- [ ] **Step 2: Verify argon2 works**

```bash
cd F:/SAVTech/Study/Project/TaskManager/backend
venv/Scripts/python.exe -c "
from app.core.security import hash_password, verify_password
h = hash_password('TestPass123!')
print('Hash OK:', h[:20])
print('Verify True:', verify_password('TestPass123!', h))
print('Verify False:', verify_password('WrongPass', h))
# Test long password
long_pass = 'A' * 128
h2 = hash_password(long_pass)
print('Long password hash OK:', verify_password(long_pass, h2))
"
```

Expected:
```
Hash OK: $argon2id$v=19$m=655...
Verify True: True
Verify False: False
Long password hash OK: True
```

- [ ] **Step 3: Commit (if any fixes needed)**

---

## Task 24: Verify Frontend Builds

**Files:** None (verification only)

- [ ] **Step 1: Build frontend**

```bash
cd F:/SAVTech/Study/Project/TaskManager/frontend
npm run build
```

Expected: Build passes with no errors.

- [ ] **Step 2: Commit (if any fixes needed)**

---

## Task 25: End-to-End Test — Signup with Argon2id

**Prerequisites:** Backend running on port 3000, PostgreSQL running.

- [ ] **Step 1: Start backend**

```bash
cd F:/SAVTech/Study/Project/TaskManager/backend
venv/Scripts/python.exe -m uvicorn app.main:app --reload --port 3000
```

- [ ] **Step 2: Test signup via curl**

```bash
curl -X POST http://localhost:3000/api/v1/auth/signup -H "Content-Type: application/json" -d '{"email":"test@example.com","password":"SecurePass123!","name":"Test User"}'
```

Expected HTTP 201:
```json
{
  "success": true,
  "message": "Account created successfully.",
  "data": {
    "access_token": "...",
    "refresh_token": "...",
    "token_type": "bearer",
    "user": {...}
  }
}
```

- [ ] **Step 3: Test duplicate email**

```bash
curl -X POST http://localhost:3000/api/v1/auth/signup -H "Content-Type: application/json" -d '{"email":"test@example.com","password":"SecurePass123!","name":"Test User"}'
```

Expected HTTP 409:
```json
{
  "success": false,
  "message": "An account with this email already exists.",
  "error": {"code": "AUTH_EMAIL_ALREADY_EXISTS", "details": null}
}
```

- [ ] **Step 4: Test short password**

```bash
curl -X POST http://localhost:3000/api/v1/auth/signup -H "Content-Type: application/json" -d '{"email":"test2@example.com","password":"short","name":"Test User 2"}'
```

Expected HTTP 422 with validation error.

- [ ] **Step 5: Test long password (128 chars)**

```bash
curl -X POST http://localhost:3000/api/v1/auth/signup -H "Content-Type: application/json" -d '{"email":"test3@example.com","password":"AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA","name":"Long Pass User"}'
```

Expected: HTTP 201 (no bcrypt 72-byte error).

- [ ] **Step 6: Test login**

```bash
curl -X POST http://localhost:3000/api/v1/auth/login -H "Content-Type: application/json" -d '{"email":"test@example.com","password":"SecurePass123!"}'
```

Expected HTTP 200 with access_token.

- [ ] **Step 7: Test login with wrong password**

```bash
curl -X POST http://localhost:3000/api/v1/auth/login -H "Content-Type: application/json" -d '{"email":"test@example.com","password":"WrongPassword123!"}'
```

Expected HTTP 401:
```json
{
  "success": false,
  "message": "Invalid email or password.",
  "error": {"code": "AUTH_INVALID_CREDENTIALS", "details": null}
}
```

---

## Task 26: End-to-End Test — Frontend Toast

- [ ] **Step 1: Start frontend**

```bash
cd F:/SAVTech/Study/Project/TaskManager/frontend
npm run dev
```

- [ ] **Step 2: Test signup flow in browser**

Navigate to signup page, create a new account. Verify:
- Toast shows "Account created successfully."
- Redirect to dashboard

- [ ] **Step 3: Test duplicate signup**

Try signing up with the same email. Verify:
- Toast shows "An account with this email already exists."
- User stays on signup page

- [ ] **Step 4: Test login with wrong password**

Try logging in with wrong password. Verify:
- Error message shows "Invalid email or password."
- User stays on login page

- [ ] **Step 5: Test successful login**

Login with correct credentials. Verify:
- Toast shows "Login successful." (or navigation happens cleanly)
- Redirect to dashboard

---

## Task 27: Final Cleanup and Verification

- [ ] **Step 1: Search for remaining hardcoded messages**

Search frontend `src/` for any remaining hardcoded business messages like `"created successfully"`, `"updated successfully"`, `"Failed to"`, `"Invalid email"` and verify they are either removed or replaced with backend messages.

- [ ] **Step 2: Verify no passlib/bcrypt imports remain**

```bash
cd F:/SAVTech/Study/Project/TaskManager/backend
venv/Scripts/python.exe -c "import passlib" 2>&1 || echo "passlib removed"
```

- [ ] **Step 3: Final commit**

```bash
git add -A
git commit -m "feat: complete production-grade security and response system"
```

---

## Final Report

After completing all tasks, report:

1. **Files created:** `app/constants/messages.py`, `app/constants/error_codes.py`, `frontend/src/context/ToastContext.tsx`
2. **Files modified:** 25+ files across backend and frontend
3. **Password hashing:** Argon2id via argon2-cffi (time_cost=3, memory_cost=64MB, parallelism=4)
4. **Message architecture:** Single `app/constants/messages.py` dict organized by module
5. **Error architecture:** Error codes in `app/constants/error_codes.py`, exceptions in `app/core/exceptions.py`
6. **Response architecture:** `app/utils/response.py` helpers (`success_response`, `error_response`, `paginated_response`)
7. **Frontend toast integration:** `ToastContext` + `useToast` hook wrapping existing `ToastContainer`
8. **APIs updated:** All 12 API routers use standard response format with message constants
9. **Tests executed:** Signup, login, duplicate email, short/long password, wrong password
10. **Remaining issues:** None identified
