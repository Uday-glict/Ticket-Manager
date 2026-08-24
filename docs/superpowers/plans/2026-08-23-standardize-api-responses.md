# Standardize API Response Format Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Update all backend API endpoint files in `backend/app/api/v1/` to use the standard response format (`success_response`, `paginated_response`) with message constants.

**Architecture:** Each API file will import `success_response`, `paginated_response` from `app.utils.response` and the relevant message constants from `app.constants.messages`. Return statements will be replaced to use these utilities while preserving all data serialization logic.

**Tech Stack:** Python, FastAPI, SQLAlchemy async

## Global Constraints

- Keep exact same data serialization logic (dict comprehensions)
- Only change the return format, not the endpoint logic
- Use message constants from `app.constants/messages.py`
- Preserve all existing imports and function signatures

---

## File Structure

| File | Endpoints | Messages Constant |
|------|-----------|-------------------|
| users.py | 4 | USER_MESSAGES |
| roles.py | 4 | ROLE_MESSAGES |
| permissions.py | 1 | PERMISSION_MESSAGES |
| projects.py | 5 | PROJECT_MESSAGES |
| project_members.py | 4 | PROJECT_MEMBER_MESSAGES |
| project_statuses.py | 4 | PROJECT_STATUS_MESSAGES |
| tasks.py | 7 | TASK_MESSAGES |
| comments.py | 4 | COMMENT_MESSAGES |
| board.py | 1 | BOARD_MESSAGES |
| dashboard.py | 2 | DASHBOARD_MESSAGES |
| audit_logs.py | 1 | AUDIT_MESSAGES |

---

### Task 1: Update users.py

**Files:**
- Modify: `backend/app/api/v1/users.py:1-47`

**Message Mapping:**
- GET list → `USER_MESSAGES["LIST_SUCCESS"]`
- GET single → `USER_MESSAGES["GET_SUCCESS"]`
- PUT update → `USER_MESSAGES["UPDATED"]`
- PATCH status → `USER_MESSAGES["STATUS_UPDATED"]`

**Endpoints to update:**
1. `list_users` (line 12-23): Paginated → use `paginated_response`
2. `get_user` (line 26-31): Single → use `success_response`
3. `update_user` (line 34-39): Single → use `success_response`
4. `toggle_status` (line 42-47): Single → use `success_response`

- [ ] **Step 1: Add imports and update endpoint returns**

Add to imports:
```python
from app.utils.response import success_response, paginated_response
from app.constants.messages import USER_MESSAGES
```

Update returns:
- `list_users`: `return paginated_response(data=[...], pagination=result["pagination"], message=USER_MESSAGES["LIST_SUCCESS"])`
- `get_user`: `return success_response(data={...}, message=USER_MESSAGES["GET_SUCCESS"])`
- `update_user`: `return success_response(data={...}, message=USER_MESSAGES["UPDATED"])`
- `toggle_status`: `return success_response(data={...}, message=USER_MESSAGES["STATUS_UPDATED"])`

- [ ] **Step 2: Verify syntax**

Run: `python -m py_compile backend/app/api/v1/users.py`

---

### Task 2: Update roles.py

**Files:**
- Modify: `backend/app/api/v1/roles.py:1-39`

**Message Mapping:**
- GET list → `ROLE_MESSAGES["LIST_SUCCESS"]`
- POST create → `ROLE_MESSAGES["CREATED"]`
- PUT update → `ROLE_MESSAGES["UPDATED"]`
- DELETE → `ROLE_MESSAGES["DELETED"]`

**Endpoints to update:**
1. `list_roles` (line 12-16): Single → use `success_response`
2. `create_role` (line 19-23): Single → use `success_response`
3. `update_role` (line 26-31): Single → use `success_response`
4. `delete_role` (line 34-39): Message only → use `success_response`

- [ ] **Step 1: Add imports and update endpoint returns**

Add to imports:
```python
from app.utils.response import success_response
from app.constants.messages import ROLE_MESSAGES
```

Update returns:
- `list_roles`: `return success_response(data=[...], message=ROLE_MESSAGES["LIST_SUCCESS"])`
- `create_role`: `return success_response(data={...}, message=ROLE_MESSAGES["CREATED"])`
- `update_role`: `return success_response(data={...}, message=ROLE_MESSAGES["UPDATED"])`
- `delete_role`: `return success_response(message=ROLE_MESSAGES["DELETED"])`

- [ ] **Step 2: Verify syntax**

Run: `python -m py_compile backend/app/api/v1/roles.py`

---

### Task 3: Update permissions.py

**Files:**
- Modify: `backend/app/api/v1/permissions.py:1-15`

**Message Mapping:**
- GET list → `PERMISSION_MESSAGES["LIST_SUCCESS"]`

**Endpoints to update:**
1. `list_permissions` (line 11-15): Single → use `success_response`

- [ ] **Step 1: Add imports and update endpoint returns**

Add to imports:
```python
from app.utils.response import success_response
from app.constants.messages import PERMISSION_MESSAGES
```

Update return:
- `list_permissions`: `return success_response(data=[...], message=PERMISSION_MESSAGES["LIST_SUCCESS"])`

- [ ] **Step 2: Verify syntax**

Run: `python -m py_compile backend/app/api/v1/permissions.py`

---

### Task 4: Update projects.py

**Files:**
- Modify: `backend/app/api/v1/projects.py:1-85`

**Message Mapping:**
- GET list → `PROJECT_MESSAGES["LIST_SUCCESS"]`
- POST create → `PROJECT_MESSAGES["CREATED"]`
- GET single → `PROJECT_MESSAGES["GET_SUCCESS"]`
- PUT update → `PROJECT_MESSAGES["UPDATED"]`
- DELETE → `PROJECT_MESSAGES["DELETED"]`

**Endpoints to update:**
1. `list_projects` (line 29-48): Paginated → use `paginated_response`
2. `create_project` (line 51-58): Single → use `success_response`
3. `get_project` (line 61-68): Single → use `success_response`
4. `update_project` (line 71-78): Single → use `success_response`
5. `delete_project` (line 81-85): Message only → use `success_response`

- [ ] **Step 1: Add imports and update endpoint returns**

Add to imports:
```python
from app.utils.response import success_response, paginated_response
from app.constants.messages import PROJECT_MESSAGES
```

Update returns:
- `list_projects`: `return paginated_response(data=data, pagination=pagination, message=PROJECT_MESSAGES["LIST_SUCCESS"])`
- `create_project`: `return success_response(data=serialize_project(...), message=PROJECT_MESSAGES["CREATED"])`
- `get_project`: `return success_response(data=serialize_project(...), message=PROJECT_MESSAGES["GET_SUCCESS"])`
- `update_project`: `return success_response(data=serialize_project(...), message=PROJECT_MESSAGES["UPDATED"])`
- `delete_project`: `return success_response(message=PROJECT_MESSAGES["DELETED"])`

- [ ] **Step 2: Verify syntax**

Run: `python -m py_compile backend/app/api/v1/projects.py`

---

### Task 5: Update project_members.py

**Files:**
- Modify: `backend/app/api/v1/project_members.py:1-38`

**Message Mapping:**
- GET list → `PROJECT_MEMBER_MESSAGES["LIST_SUCCESS"]`
- POST add → `PROJECT_MEMBER_MESSAGES["ADDED"]`
- PUT update → `PROJECT_MEMBER_MESSAGES["UPDATED"]`
- DELETE remove → `PROJECT_MEMBER_MESSAGES["REMOVED"]`

**Endpoints to update:**
1. `list_members` (line 13-17): Single → use `success_response`
2. `add_member` (line 20-24): Single → use `success_response`
3. `update_member` (line 27-31): Single → use `success_response`
4. `remove_member` (line 34-38): Message only → use `success_response`

- [ ] **Step 1: Add imports and update endpoint returns**

Add to imports:
```python
from app.utils.response import success_response
from app.constants.messages import PROJECT_MEMBER_MESSAGES
```

Update returns:
- `list_members`: `return success_response(data=[...], message=PROJECT_MEMBER_MESSAGES["LIST_SUCCESS"])`
- `add_member`: `return success_response(data={...}, message=PROJECT_MEMBER_MESSAGES["ADDED"])`
- `update_member`: `return success_response(data={...}, message=PROJECT_MEMBER_MESSAGES["UPDATED"])`
- `remove_member`: `return success_response(message=PROJECT_MEMBER_MESSAGES["REMOVED"])`

- [ ] **Step 2: Verify syntax**

Run: `python -m py_compile backend/app/api/v1/project_members.py`

---

### Task 6: Update project_statuses.py

**Files:**
- Modify: `backend/app/api/v1/project_statuses.py:1-38`

**Message Mapping:**
- GET list → `PROJECT_STATUS_MESSAGES["LIST_SUCCESS"]`
- POST create → `PROJECT_STATUS_MESSAGES["CREATED"]`
- PUT update → `PROJECT_STATUS_MESSAGES["UPDATED"]`
- DELETE → `PROJECT_STATUS_MESSAGES["DELETED"]`

**Endpoints to update:**
1. `list_statuses` (line 13-17): Single → use `success_response`
2. `create_status` (line 20-24): Single → use `success_response`
3. `update_status` (line 27-31): Single → use `success_response`
4. `delete_status` (line 34-38): Message only → use `success_response`

- [ ] **Step 1: Add imports and update endpoint returns**

Add to imports:
```python
from app.utils.response import success_response
from app.constants.messages import PROJECT_STATUS_MESSAGES
```

Update returns:
- `list_statuses`: `return success_response(data=[...], message=PROJECT_STATUS_MESSAGES["LIST_SUCCESS"])`
- `create_status`: `return success_response(data={...}, message=PROJECT_STATUS_MESSAGES["CREATED"])`
- `update_status`: `return success_response(data={...}, message=PROJECT_STATUS_MESSAGES["UPDATED"])`
- `delete_status`: `return success_response(message=PROJECT_STATUS_MESSAGES["DELETED"])`

- [ ] **Step 2: Verify syntax**

Run: `python -m py_compile backend/app/api/v1/project_statuses.py`

---

### Task 7: Update tasks.py

**Files:**
- Modify: `backend/app/api/v1/tasks.py:1-69`

**Message Mapping:**
- GET list → `TASK_MESSAGES["LIST_SUCCESS"]`
- POST create → `TASK_MESSAGES["CREATED"]`
- GET single → `TASK_MESSAGES["GET_SUCCESS"]`
- PUT update → `TASK_MESSAGES["UPDATED"]`
- POST assign → `TASK_MESSAGES["ASSIGNED"]`
- POST reassign → `TASK_MESSAGES["REASSIGNED"]`
- GET assignments → `TASK_MESSAGES["ASSIGNMENTS_SUCCESS"]`

**Endpoints to update:**
1. `list_tasks` (line 13-26): Paginated → use `paginated_response`
2. `create_task` (line 29-34): Single → use `success_response`
3. `get_task` (line 37-41): Single → use `success_response`
4. `update_task` (line 44-48): Single → use `success_response`
5. `assign_task` (line 51-55): Single → use `success_response`
6. `reassign_task` (line 58-62): Single → use `success_response`
7. `get_assignments` (line 65-69): Single → use `success_response`

- [ ] **Step 1: Add imports and update endpoint returns**

Add to imports:
```python
from app.utils.response import success_response, paginated_response
from app.constants.messages import TASK_MESSAGES
```

Update returns:
- `list_tasks`: `return paginated_response(data=[...], pagination=pagination, message=TASK_MESSAGES["LIST_SUCCESS"])`
- `create_task`: `return success_response(data={...}, message=TASK_MESSAGES["CREATED"])`
- `get_task`: `return success_response(data={...}, message=TASK_MESSAGES["GET_SUCCESS"])`
- `update_task`: `return success_response(data={...}, message=TASK_MESSAGES["UPDATED"])`
- `assign_task`: `return success_response(data={...}, message=TASK_MESSAGES["ASSIGNED"])`
- `reassign_task`: `return success_response(data={...}, message=TASK_MESSAGES["REASSIGNED"])`
- `get_assignments`: `return success_response(data=[...], message=TASK_MESSAGES["ASSIGNMENTS_SUCCESS"])`

- [ ] **Step 2: Verify syntax**

Run: `python -m py_compile backend/app/api/v1/tasks.py`

---

### Task 8: Update comments.py

**Files:**
- Modify: `backend/app/api/v1/comments.py:1-38`

**Message Mapping:**
- GET list → `COMMENT_MESSAGES["LIST_SUCCESS"]`
- POST create → `COMMENT_MESSAGES["CREATED"]`
- PUT update → `COMMENT_MESSAGES["UPDATED"]`
- DELETE → `COMMENT_MESSAGES["DELETED"]`

**Endpoints to update:**
1. `get_comments` (line 13-17): Single → use `success_response`
2. `create_comment` (line 20-24): Single → use `success_response`
3. `update_comment` (line 27-31): Single → use `success_response`
4. `delete_comment` (line 34-38): Message only → use `success_response`

- [ ] **Step 1: Add imports and update endpoint returns**

Add to imports:
```python
from app.utils.response import success_response
from app.constants.messages import COMMENT_MESSAGES
```

Update returns:
- `get_comments`: `return success_response(data=[...], message=COMMENT_MESSAGES["LIST_SUCCESS"])`
- `create_comment`: `return success_response(data={...}, message=COMMENT_MESSAGES["CREATED"])`
- `update_comment`: `return success_response(data={...}, message=COMMENT_MESSAGES["UPDATED"])`
- `delete_comment`: `return success_response(message=COMMENT_MESSAGES["DELETED"])`

- [ ] **Step 2: Verify syntax**

Run: `python -m py_compile backend/app/api/v1/comments.py`

---

### Task 9: Update board.py

**Files:**
- Modify: `backend/app/api/v1/board.py:1-47`

**Message Mapping:**
- GET → `BOARD_MESSAGES["GET_SUCCESS"]`

**Endpoints to update:**
1. `get_board` (line 13-47): Single → use `success_response`

- [ ] **Step 1: Add imports and update endpoint returns**

Add to imports:
```python
from app.utils.response import success_response
from app.constants.messages import BOARD_MESSAGES
```

Update return:
- `get_board`: `return success_response(data=columns, message=BOARD_MESSAGES["GET_SUCCESS"])`

- [ ] **Step 2: Verify syntax**

Run: `python -m py_compile backend/app/api/v1/board.py`

---

### Task 10: Update dashboard.py

**Files:**
- Modify: `backend/app/api/v1/dashboard.py:1-22`

**Message Mapping:**
- GET summary → `DASHBOARD_MESSAGES["SUMMARY_SUCCESS"]`
- GET projects → `DASHBOARD_MESSAGES["PROJECTS_SUCCESS"]`

**Endpoints to update:**
1. `get_summary` (line 11-15): Single → use `success_response`
2. `get_project_summaries` (line 18-22): Single → use `success_response`

- [ ] **Step 1: Add imports and update endpoint returns**

Add to imports:
```python
from app.utils.response import success_response
from app.constants.messages import DASHBOARD_MESSAGES
```

Update returns:
- `get_summary`: `return success_response(data=summary, message=DASHBOARD_MESSAGES["SUMMARY_SUCCESS"])`
- `get_project_summaries`: `return success_response(data=summaries, message=DASHBOARD_MESSAGES["PROJECTS_SUCCESS"])`

- [ ] **Step 2: Verify syntax**

Run: `python -m py_compile backend/app/api/v1/dashboard.py`

---

### Task 11: Update audit_logs.py

**Files:**
- Modify: `backend/app/api/v1/audit_logs.py:1-23`

**Message Mapping:**
- GET list → `AUDIT_MESSAGES["LIST_SUCCESS"]`

**Endpoints to update:**
1. `list_audit_logs` (line 12-23): Single → use `success_response`

- [ ] **Step 1: Add imports and update endpoint returns**

Add to imports:
```python
from app.utils.response import success_response
from app.constants.messages import AUDIT_MESSAGES
```

Update return:
- `list_audit_logs`: `return success_response(data=[...], message=AUDIT_MESSAGES["LIST_SUCCESS"])`

- [ ] **Step 2: Verify syntax**

Run: `python -m py_compile backend/app/api/v1/audit_logs.py`

---

### Task 12: Final Verification

- [ ] **Step 1: Run syntax check on all modified files**

```bash
python -m py_compile backend/app/api/v1/users.py
python -m py_compile backend/app/api/v1/roles.py
python -m py_compile backend/app/api/v1/permissions.py
python -m py_compile backend/app/api/v1/projects.py
python -m py_compile backend/app/api/v1/project_members.py
python -m py_compile backend/app/api/v1/project_statuses.py
python -m py_compile backend/app/api/v1/tasks.py
python -m py_compile backend/app/api/v1/comments.py
python -m py_compile backend/app/api/v1/board.py
python -m py_compile backend/app/api/v1/dashboard.py
python -m py_compile backend/app/api/v1/audit_logs.py
```

- [ ] **Step 2: Verify imports are correct**

Check that each file imports the correct utilities and message constants.

- [ ] **Step 3: Run linter/typecheck if available**

Check for any linting or type checking commands in the project.
