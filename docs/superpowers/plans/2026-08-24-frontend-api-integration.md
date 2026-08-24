# Frontend API Integration & Mock Removal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bind every remaining frontend page to live backend APIs and delete all mock data.

**Architecture:** Follow the existing integration pattern used by `TicketListPage`: direct service calls via the axios `apiClient`, snake_case→camelCase conversion in `src/utils/mappers.ts`, toasts via `useToast`, loading/error states per page. One new backend endpoint (`GET /projects/{project_id}/calendar`) built like `board.py` (direct SQLAlchemy selects in the route + a pure event-derivation function for unit testing).

**Tech Stack:** FastAPI + SQLAlchemy (async) + pytest/httpx; React 19 + TypeScript + Vite + axios + Tailwind; oxlint.

## Global Constraints

- API base URL: `http://localhost:8000/api/v1` (already configured in `frontend/src/api/apiClient.ts` — do not change).
- Backend responses use the envelope `{ success, message, data }` (from `app.utils.response.success_response`). Access lists as `res.data.data || res.data`.
- All new backend data returns snake_case; convert with mappers in `frontend/src/utils/mappers.ts`. Never consume raw snake_case in components.
- Error handling everywhere: `try/catch` + `showError(getErrorMessage(e))`; success feedback via `showSuccess((res.data as any)?.message || '<fallback>')`.
- Do not modify any other working pages. Scope is exactly: router registration fix, one new backend endpoint, `sprintService` additions, one new frontend service, one mapper addition, 3 page rewires, mocks deletion.
- Verification commands: backend `python -m pytest tests/ -v` (from `backend/` with venv active); frontend `npm run build` and `npm run lint` (from `frontend/`).
- Commit after every task with the exact message given.

---

### Task 1: Backend — mount sprints router + calendar endpoint

The sprints endpoints exist (`app/api/v1/sprints.py`) but were **never registered** in `router.py` — the frontend's existing `sprintService` currently 404s. Fix that and add the calendar endpoint.

**Files:**
- Modify: `backend/app/api/v1/router.py`
- Create: `backend/app/api/v1/calendar.py`
- Test: `backend/tests/test_calendar.py`

**Interfaces:**
- Consumes: `success_response` from `app.utils.response`, `CALENDAR_MESSAGES` (already exists in `app/constants/messages.py`), models `Task`, `Sprint`, `TicketAssignee`, `require_permission` from `app.dependencies.permissions`.
- Produces: `GET /api/v1/projects/{project_id}/calendar?team_id&sprint_id&assignee_id` returning `{ success, message, data: Event[] }` where each Event is `{ id, type: "ticket"|"sprint", title, start, end, project_id, sprint_id?, team_id?, status_id?, task_id?, color? }`. Mounted routers: `/projects/{id}/sprints`, `/sprints/{id}`, `/sprints/{id}/start`, `/sprints/{id}/complete`.

- [ ] **Step 1: Write failing tests**

Create `backend/tests/test_calendar.py`:

```python
from types import SimpleNamespace

import pytest
from httpx import AsyncClient, ASGITransport

from app.api.v1.calendar import build_calendar_events


def _task(id="11111111-1111-1111-1111-111111111111", title="Login bug", ticket_key="PROJ-12",
          start_date=None, due_date=None, sprint_id=None, team_id=None, status_id="22222222-2222-2222-2222-222222222222"):
    return SimpleNamespace(id=id, title=title, ticket_key=ticket_key, start_date=start_date,
                           due_date=due_date, sprint_id=sprint_id, team_id=team_id, status_id=status_id,
                           project_id="33333333-3333-3333-3333-333333333333")


def _sprint(id="44444444-4444-4444-4444-444444444444", name="Sprint 1",
            start_date="2026-09-01", end_date="2026-09-14", team_id=None):
    return SimpleNamespace(id=id, name=name, start_date=start_date, end_date=end_date, team_id=team_id,
                           project_id="33333333-3333-3333-3333-333333333333")


def test_build_events_task_start_and_due():
    events = build_calendar_events([_task(start_date="2026-09-02", due_date="2026-09-05")], [])
    assert len(events) == 2
    start_ev = next(e for e in events if e["id"].endswith("_start"))
    due_ev = next(e for e in events if e["id"].endswith("_due"))
    assert start_ev["type"] == "ticket"
    assert start_ev["title"] == "PROJ-12 Login bug"
    assert start_ev["color"] == "#3b82f6"
    assert due_ev["title"] == "PROJ-12 Due"
    assert due_ev["color"] == "#ef4444"
    assert due_ev["task_id"] == "11111111-1111-1111-1111-111111111111"


def test_build_events_sprint_boundaries():
    events = build_calendar_events([], [_sprint()])
    assert len(events) == 2
    titles = {e["title"]: e for e in events}
    assert titles["Sprint 1 starts"]["start"] == "2026-09-01"
    assert titles["Sprint 1 starts"]["color"] == "#3b82f6"
    assert titles["Sprint 1 ends"]["start"] == "2026-09-14"
    assert titles["Sprint 1 ends"]["color"] == "#22c55e"
    assert all(e["type"] == "sprint" for e in events)


def test_build_events_skips_missing_dates_and_key():
    events = build_calendar_events([_task(ticket_key=None)], [_sprint(name="S", start_date="", end_date="")])
    assert len(events) == 0


@pytest.mark.asyncio
async def test_calendar_route_requires_auth():
    from app.main import app
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/v1/projects/33333333-3333-3333-3333-333333333333/calendar")
        assert response.status_code in (401, 403)


@pytest.mark.asyncio
async def test_sprint_routes_are_mounted():
    from app.main import app
    paths = {getattr(r, "path", "") for r in app.routes}
    assert "/api/v1/projects/{project_id}/sprints" in paths
    assert "/api/v1/sprints/{sprint_id}" in paths
    assert "/api/v1/sprints/{sprint_id}/start" in paths
    assert "/api/v1/sprints/{sprint_id}/complete" in paths
```

- [ ] **Step 2: Run tests to verify they fail**

Run (from `backend/`, venv active): `python -m pytest tests/test_calendar.py -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'app.api.v1.calendar'` (and mounted-route assertions fail).

- [ ] **Step 3: Create `backend/app/api/v1/calendar.py`**

```python
from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID

from app.db.database import get_db
from app.models.task import Task
from app.models.sprint import Sprint
from app.models.ticket_assignee import TicketAssignee
from app.dependencies.permissions import require_permission
from app.models.workspace_member import WorkspaceMember
from app.utils.response import success_response
from app.constants.messages import CALENDAR_MESSAGES

router = APIRouter(prefix="/projects", tags=["calendar"])

TASK_START_COLOR = "#3b82f6"
TASK_DUE_COLOR = "#ef4444"
SPRINT_START_COLOR = "#3b82f6"
SPRINT_END_COLOR = "#22c55e"


def build_calendar_events(tasks, sprints) -> list[dict]:
    events: list[dict] = []
    for t in tasks:
        label = f"{t.ticket_key} {t.title}" if t.ticket_key else t.title
        base = {
            "type": "ticket",
            "title": label,
            "project_id": str(t.project_id),
            "sprint_id": str(t.sprint_id) if t.sprint_id else None,
            "team_id": str(t.team_id) if t.team_id else None,
            "status_id": str(t.status_id),
            "task_id": str(t.id),
        }
        if t.start_date:
            events.append({**base, "id": f"cal_t_{t.id}_start", "title": label,
                           "start": str(t.start_date), "end": str(t.start_date),
                           "color": TASK_START_COLOR})
        if t.due_date:
            due_label = f"{t.ticket_key} Due" if t.ticket_key else f"{t.title} Due"
            events.append({**base, "id": f"cal_t_{t.id}_due", "title": due_label,
                           "start": str(t.due_date), "end": str(t.due_date),
                           "color": TASK_DUE_COLOR})
    for s in sprints:
        if not s.start_date or not s.end_date:
            continue
        common = {"type": "sprint", "project_id": str(s.project_id),
                  "sprint_id": str(s.id), "task_id": None, "status_id": None,
                  "team_id": str(s.team_id) if s.team_id else None}
        events.append({**common, "id": f"cal_s_{s.id}_start", "title": f"{s.name} starts",
                       "start": str(s.start_date), "end": str(s.start_date),
                       "color": SPRINT_START_COLOR})
        events.append({**common, "id": f"cal_s_{s.id}_end", "title": f"{s.name} ends",
                       "start": str(s.end_date), "end": str(s.end_date),
                       "color": SPRINT_END_COLOR})
    return events


@router.get("/{project_id}/calendar")
async def get_project_calendar(
    project_id: str,
    team_id: UUID = Query(None),
    sprint_id: UUID = Query(None),
    assignee_id: UUID = Query(None),
    workspace_member: WorkspaceMember = Depends(require_permission("tasks.view")),
    db: AsyncSession = Depends(get_db),
):
    pid = UUID(project_id)

    task_query = select(Task).where(Task.project_id == pid)
    if team_id:
        task_query = task_query.where(Task.team_id == team_id)
    if sprint_id:
        task_query = task_query.where(Task.sprint_id == sprint_id)
    if assignee_id:
        task_query = task_query.join(TicketAssignee, TicketAssignee.ticket_id == Task.id).where(
            TicketAssignee.user_id == assignee_id
        )
    tasks = (await db.execute(task_query)).scalars().all()

    sprint_query = select(Sprint).where(Sprint.project_id == pid)
    if team_id:
        sprint_query = sprint_query.where(Sprint.team_id == team_id)
    if sprint_id:
        sprint_query = sprint_query.where(Sprint.id == sprint_id)
    sprints = (await db.execute(sprint_query)).scalars().all()

    return success_response(data=build_calendar_events(tasks, sprints), message=CALENDAR_MESSAGES["SUCCESS"])
```

- [ ] **Step 4: Register routers — modify `backend/app/api/v1/router.py`**

Replace lines 1–18 with:

```python
from fastapi import APIRouter
from app.api.v1 import auth, users, roles, permissions, projects, project_members, project_statuses, tasks, comments, board, dashboard, audit_logs, teams, sprints, calendar

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(roles.router)
api_router.include_router(permissions.router)
api_router.include_router(projects.router)
api_router.include_router(project_members.router)
api_router.include_router(project_statuses.router)
api_router.include_router(tasks.router)
api_router.include_router(comments.router)
api_router.include_router(board.router)
api_router.include_router(dashboard.router)
api_router.include_router(audit_logs.router)
api_router.include_router(teams.router)
api_router.include_router(teams.team_router)
api_router.include_router(sprints.router)
api_router.include_router(sprints.sprint_router)
api_router.include_router(calendar.router)
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `python -m pytest tests/test_calendar.py -v`
Expected: PASS (all 5 tests).

- [ ] **Step 6: Run full backend suite**

Run: `python -m pytest tests/ -v`
Expected: PASS including existing `tests/test_smoke.py`.

- [ ] **Step 7: Commit**

```bash
git add backend/app/api/v1/calendar.py backend/app/api/v1/router.py backend/tests/test_calendar.py
git commit -m "feat: mount sprints router and add project calendar endpoint"
```

---

### Task 2: Frontend — calendarService + mapCalendarEvent mapper

**Files:**
- Create: `frontend/src/services/calendarService.ts`
- Modify: `frontend/src/utils/mappers.ts` (append at end of file)

**Interfaces:**
- Consumes: `apiClient` from `../api/apiClient`; backend event shape from Task 1; `CalendarEvent` type in `src/types/index.ts` (unchanged: `{ id, type: 'ticket'|'sprint'|'project', title, start, end, projectId, sprintId?, teamId?, status?, ticketId?, color? }`).
- Produces: `calendarService.getEvents(projectId: string, params?: { team_id?: string; sprint_id?: string; assignee_id?: string })` returning Axios response whose `data.data` is `RawCalendarEvent[]`; `mapCalendarEvent(raw: any): CalendarEvent`.

- [ ] **Step 1: Create `frontend/src/services/calendarService.ts`**

```ts
import apiClient from '../api/apiClient';

export const calendarService = {
  getEvents: (projectId: string, params?: { team_id?: string; sprint_id?: string; assignee_id?: string }) =>
    apiClient.get(`/projects/${projectId}/calendar`, { params }),
};
```

- [ ] **Step 2: Append mapper to `frontend/src/utils/mappers.ts`**

Add at the end of the file:

```ts
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
```

- [ ] **Step 3: Typecheck**

Run (from `frontend/`): `npm run build`
Expected: compiles with no TS errors.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/services/calendarService.ts frontend/src/utils/mappers.ts
git commit -m "feat: add calendar service and event mapper"
```

---

### Task 3: Rewire SprintListPage (+ sprintService start/complete)

`sprintService` is missing Start/Complete methods the backend provides. Add them, then replace the page's mock wiring with real services following the TicketListPage conventions.

**Files:**
- Modify: `frontend/src/services/sprintService.ts`
- Rewrite: `frontend/src/pages/sprints/SprintListPage.tsx`

**Interfaces:**
- Consumes: `projectService.list()` → `{ data: { data: Project[] } }`; `teamService.list(projectId)`; `sprintService.*`; mappers `mapProject`, `mapTeam`, `mapSprint`; `useToast()` from `../../context/ToastContext`; `getErrorMessage` from `../../api/apiClient`.
- Produces: fully dynamic Sprint page — project selector, team-linked create/edit modal, Start (PLANNED→ACTIVE), Complete (ACTIVE→COMPLETED), Delete.

- [ ] **Step 1: Extend `frontend/src/services/sprintService.ts`**

```ts
import apiClient from '../api/apiClient';
export const sprintService = {
  list: (projectId: string) => apiClient.get('/projects/' + projectId + '/sprints'),
  get: (id: string) => apiClient.get('/sprints/' + id),
  create: (projectId: string, data: Record<string, unknown>) => apiClient.post('/projects/' + projectId + '/sprints', data),
  update: (id: string, data: Record<string, unknown>) => apiClient.patch('/sprints/' + id, data),
  delete: (id: string) => apiClient.delete('/sprints/' + id),
  start: (id: string) => apiClient.post('/sprints/' + id + '/start'),
  complete: (id: string) => apiClient.post('/sprints/' + id + '/complete'),
};
```

- [ ] **Step 2: Rewrite `frontend/src/pages/sprints/SprintListPage.tsx`**

```tsx
import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Plus, Calendar, Edit, Trash2, Play, CheckCircle } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { DatePicker } from '../../components/common/DatePicker';
import { Badge } from '../../components/common/Badge';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { projectService } from '../../services/projectService';
import { teamService } from '../../services/teamService';
import { sprintService } from '../../services/sprintService';
import { useToast } from '../../context/ToastContext';
import { getErrorMessage } from '../../api/apiClient';
import { mapProject, mapTeam, mapSprint } from '../../utils/mappers';
import type { Sprint, Project, Team } from '../../types';

export default function SprintListPage() {
  const { projectId: paramId } = useParams();
  const { success: showSuccess, error: showError } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState(paramId || '');
  const [teams, setTeams] = useState<Team[]>([]);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<Sprint | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Sprint | null>(null);
  const [form, setForm] = useState({ name: '', goal: '', teamId: '', startDate: '', endDate: '' });

  useEffect(() => {
    projectService.list().then(res => {
      const list = (res.data.data || res.data || []).map(mapProject);
      setProjects(list);
      if (!paramId && list[0]) setProjectId(list[0].id);
    }).catch(e => showError(getErrorMessage(e)));
  }, []);

  const fetchSprints = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const [spRes, tmRes] = await Promise.all([
        sprintService.list(projectId),
        teamService.list(projectId).catch(() => ({ data: { data: [] } })),
      ]);
      setSprints((spRes.data.data || spRes.data || []).map(mapSprint));
      setTeams((tmRes.data.data || tmRes.data || []).map(mapTeam));
    } catch (e) { showError(getErrorMessage(e)); } finally { setLoading(false); }
  }, [projectId]);

  useEffect(() => { fetchSprints(); }, [fetchSprints]);

  const openCreate = () => { setEditing(null); setForm({ name: '', goal: '', teamId: '', startDate: '', endDate: '' }); setShowCreate(true); };
  const openEdit = (s: Sprint) => { setEditing(s); setForm({ name: s.name, goal: s.goal || '', teamId: s.teamId || '', startDate: s.startDate, endDate: s.endDate }); setShowCreate(true); };

  const handleSave = async () => {
    if (!form.name || !form.startDate || !form.endDate) { showError('Name, start date and end date are required'); return; }
    if (new Date(form.endDate) < new Date(form.startDate)) { showError('End date cannot be before start date'); return; }
    try {
      const payload = { name: form.name, goal: form.goal || undefined, team_id: form.teamId || undefined, start_date: form.startDate, end_date: form.endDate };
      const res = editing ? await sprintService.update(editing.id, payload) : await sprintService.create(projectId, payload);
      showSuccess((res.data as any)?.message || (editing ? 'Sprint updated' : 'Sprint created'));
      setShowCreate(false); setEditing(null);
      fetchSprints();
    } catch (e) { showError(getErrorMessage(e)); }
  };

  const handleStart = async (s: Sprint) => {
    try { const res = await sprintService.start(s.id); showSuccess((res.data as any)?.message || 'Sprint started'); fetchSprints(); }
    catch (e) { showError(getErrorMessage(e)); }
  };
  const handleComplete = async (s: Sprint) => {
    try { const res = await sprintService.complete(s.id); showSuccess((res.data as any)?.message || 'Sprint completed'); fetchSprints(); }
    catch (e) { showError(getErrorMessage(e)); }
  };
  const handleDelete = async () => {
    if (!deleteTarget) return;
    try { const res = await sprintService.delete(deleteTarget.id); showSuccess((res.data as any)?.message || 'Sprint deleted'); setDeleteTarget(null); fetchSprints(); }
    catch (e) { showError(getErrorMessage(e)); }
  };

  const project = projects.find(p => p.id === projectId);
  const teamOptions = teams.map(t => ({ value: t.id, label: t.name }));
  const teamName = (id?: string | null) => teams.find(t => t.id === id)?.name;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Sprints</h1>
          <p className="text-sm text-slate-500">Project: {project?.name || '—'}</p>
        </div>
        <div className="flex gap-3">
          <Select options={projects.map(p => ({ value: p.id, label: p.name }))} value={projectId} onChange={e => setProjectId(e.target.value)} className="w-56" />
          <Button onClick={openCreate}><Plus className="h-4 w-4" />Create Sprint</Button>
        </div>
      </div>

      {loading ? <div className="py-20 text-center text-slate-400">Loading sprints...</div> :
        sprints.length === 0 ? <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 py-12 text-center text-slate-400">No sprints found</div> :
        <div className="grid gap-4">
          {sprints.map(s => (
            <div key={s.id} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">{s.name} <Badge variant={s.status === 'ACTIVE' ? 'info' : s.status === 'COMPLETED' ? 'success' : 'default'}>{s.status}</Badge></h3>
                  <p className="text-sm text-slate-500 flex items-center gap-1"><Calendar className="h-3 w-3" />{s.startDate} → {s.endDate}{s.teamId ? ` • ${teamName(s.teamId)}` : ''}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">{s.goal}</p>
                </div>
                <div className="flex gap-2">
                  {s.status === 'PLANNED' && <Button size="sm" variant="outline" onClick={() => handleStart(s)}><Play className="h-4 w-4" />Start</Button>}
                  {s.status === 'ACTIVE' && <Button size="sm" variant="outline" onClick={() => handleComplete(s)}><CheckCircle className="h-4 w-4" />Complete</Button>}
                  <Button size="sm" variant="ghost" onClick={() => openEdit(s)}><Edit className="h-4 w-4" /></Button>
                  <Button size="sm" variant="ghost" onClick={() => setDeleteTarget(s)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      }

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title={editing ? 'Edit Sprint' : 'Create Sprint'}>
        <div className="space-y-4">
          <Input label="Sprint Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
          <Input label="Goal" value={form.goal} onChange={e => setForm({ ...form, goal: e.target.value })} placeholder="Complete payment module" />
          <Select label="Team" options={teamOptions} value={form.teamId} onChange={e => setForm({ ...form, teamId: e.target.value })} placeholder="Select team" />
          <div className="grid grid-cols-2 gap-4">
            <DatePicker label="Start Date" value={form.startDate} onChange={v => setForm({ ...form, startDate: v })} />
            <DatePicker label="End Date" value={form.endDate} onChange={v => setForm({ ...form, endDate: v })} />
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={handleSave}>{editing ? 'Save' : 'Create Sprint'}</Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} title="Delete Sprint" message={`Delete "${deleteTarget?.name}"?`} confirmLabel="Delete" />
    </div>
  );
}
```

- [ ] **Step 3: Typecheck + lint**

Run (from `frontend/`): `npm run build; npm run lint`
Expected: no TS errors, no lint errors.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/services/sprintService.ts frontend/src/pages/sprints/SprintListPage.tsx
git commit -m "feat: bind sprint page to live sprint APIs"
```

---

### Task 4: Rewire TeamListPage

Backend creates teams without members (`POST /projects/{id}/teams`) and adds them one-by-one (`POST /teams/{id}/members` with `{user_id}`). List endpoints don't embed members, so fetch members per team to populate avatar stacks.

**Files:**
- Rewrite: `frontend/src/pages/teams/TeamListPage.tsx`

**Interfaces:**
- Consumes: `projectService.list()`, `userService.list()`, `teamService.{list,get,create,update,delete,listMembers}` plus two new inline calls `apiClient.post('/teams/'+id+'/members', { user_id })` and `apiClient.delete('/teams/'+id+'/members/'+userId)`; mappers `mapProject`, `mapUser`, `mapTeam`; `useToast`, `getErrorMessage`.
- Produces: dynamic Teams page — create-with-members, edit name/description, delete, View modal with add/remove member against live data.

- [ ] **Step 1: Rewrite `frontend/src/pages/teams/TeamListPage.tsx`**

```tsx
import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Plus, Users, Edit, Trash2, UserMinus } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { MultiSelect } from '../../components/common/MultiSelect';
import { Avatar } from '../../components/common/Avatar';
import { Badge } from '../../components/common/Badge';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { EmptyState } from '../../components/common/EmptyState';
import { projectService } from '../../services/projectService';
import { userService } from '../../services/userService';
import { teamService } from '../../services/teamService';
import { useToast } from '../../context/ToastContext';
import apiClient, { getErrorMessage } from '../../api/apiClient';
import { mapProject, mapUser, mapTeam } from '../../utils/mappers';
import type { Team, Project, User } from '../../types';

export default function TeamListPage() {
  const { projectId: paramId } = useParams();
  const { success: showSuccess, error: showError } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState(paramId || '');
  const [users, setUsers] = useState<User[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<Team | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Team | null>(null);
  const [viewTeam, setViewTeam] = useState<Team | null>(null);
  const [viewMembers, setViewMembers] = useState<User[]>([]);
  const [form, setForm] = useState({ name: '', description: '', memberIds: [] as string[] });

  useEffect(() => {
    Promise.all([projectService.list(), userService.list().catch(() => ({ data: { data: [] } }))]).then(([pRes, uRes]) => {
      const plist = (pRes.data.data || pRes.data || []).map(mapProject);
      setProjects(plist);
      setUsers((uRes.data.data || uRes.data || []).map(mapUser));
      if (!paramId && plist[0]) setProjectId(plist[0].id);
    }).catch(e => showError(getErrorMessage(e)));
  }, []);

  const hydrateMembers = useCallback(async (list: Team[]): Promise<Team[]> => {
    return Promise.all(list.map(async t => {
      try {
        const res = await teamService.listMembers(t.id);
        const ids: string[] = (res.data.data || res.data || []).map((m: any) => m.user_id || m.userId || m.id);
        return { ...t, memberIds: ids };
      } catch { return { ...t, memberIds: [] }; }
    }));
  }, []);

  const fetchTeams = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const res = await teamService.list(projectId);
      const raw = (res.data.data || res.data || []).map(mapTeam);
      setTeams(await hydrateMembers(raw));
    } catch (e) { showError(getErrorMessage(e)); } finally { setLoading(false); }
  }, [projectId, hydrateMembers]);

  useEffect(() => { fetchTeams(); }, [fetchTeams]);

  const userById = (id: string) => users.find(u => u.id === id);

  const openCreate = () => { setEditing(null); setForm({ name: '', description: '', memberIds: [] }); setShowCreate(true); };
  const openEdit = (t: Team) => { setEditing(t); setForm({ name: t.name, description: t.description || '', memberIds: [...t.memberIds] }); setShowCreate(true); };

  const handleSave = async () => {
    if (!form.name.trim()) { showError('Team name is required'); return; }
    try {
      if (editing) {
        const res = await teamService.update(editing.id, { name: form.name, description: form.description || undefined });
        showSuccess((res.data as any)?.message || 'Team updated');
      } else {
        const res = await teamService.create(projectId, { name: form.name, description: form.description || undefined });
        const newId = (res.data.data || res.data)?.id;
        const failed: string[] = [];
        for (const uid of form.memberIds) {
          try { await apiClient.post(`/teams/${newId}/members`, { user_id: uid }); }
          catch { failed.push(userById(uid)?.name || uid); }
        }
        showSuccess(((res.data as any)?.message || 'Team created') + (failed.length ? ` (failed to add: ${failed.join(', ')})` : ''));
      }
      setShowCreate(false);
      fetchTeams();
    } catch (e) { showError(getErrorMessage(e)); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try { const res = await teamService.delete(deleteTarget.id); showSuccess((res.data as any)?.message || 'Team deleted'); setDeleteTarget(null); fetchTeams(); }
    catch (e) { showError(getErrorMessage(e)); }
  };

  const openView = async (t: Team) => {
    setViewTeam(t);
    try {
      const res = await teamService.listMembers(t.id);
      const ids: string[] = (res.data.data || res.data || []).map((m: any) => m.user_id || m.userId || m.id);
      setViewMembers(ids.map(id => userById(id)).filter(Boolean) as User[]);
    } catch { setViewMembers([]); }
  };

  const refreshView = async (teamId: string) => {
    const res = await teamService.get(teamId);
    const updated = mapTeam(res.data.data || res.data);
    const mRes = await teamService.listMembers(teamId);
    const ids: string[] = (mRes.data.data || mRes.data || []).map((m: any) => m.user_id || m.userId || m.id);
    updated.memberIds = ids;
    setViewTeam(updated);
    setViewMembers(ids.map(id => userById(id)).filter(Boolean) as User[]);
    fetchTeams();
  };

  const handleRemoveMember = async (teamId: string, userId: string) => {
    try { await apiClient.delete(`/teams/${teamId}/members/${userId}`); showSuccess('Member removed'); await refreshView(teamId); }
    catch (e) { showError(getErrorMessage(e)); }
  };

  const handleAddMember = async (teamId: string, userId: string) => {
    try { await apiClient.post(`/teams/${teamId}/members`, { user_id: userId }); showSuccess('Member added'); await refreshView(teamId); }
    catch (e) { showError(getErrorMessage(e)); }
  };

  const project = projects.find(p => p.id === projectId);
  const userOptions = users.map(u => ({ value: u.id, label: u.name }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Teams</h1>
          <p className="text-sm text-slate-500">Project: {project?.name || '—'}</p>
        </div>
        <div className="flex gap-3">
          <Select options={projects.map(p => ({ value: p.id, label: p.name }))} value={projectId} onChange={e => setProjectId(e.target.value)} className="w-56" />
          <Button onClick={openCreate}><Plus className="h-4 w-4" />Create Team</Button>
        </div>
      </div>

      {loading ? <div className="py-20 text-center text-slate-400">Loading teams...</div> :
        teams.length === 0 ? <EmptyState title="No teams" description="Create your first team" /> :
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {teams.map(team => (
            <div key={team.id} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-5 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white">{team.name}</h3>
                  <p className="text-sm text-slate-500 line-clamp-2">{team.description || 'No description'}</p>
                </div>
                <Badge variant="success">{team.status}</Badge>
              </div>
              <div className="flex -space-x-2">
                {team.memberIds.slice(0, 5).map(id => { const u = userById(id); return <Avatar key={id} name={u?.name || id} src={u?.avatar} size="sm" className="ring-2 ring-white" />; })}
                {team.memberIds.length > 5 && <span className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center text-xs">+{team.memberIds.length - 5}</span>}
                <span className="ml-3 text-sm text-slate-500 flex items-center gap-1"><Users className="h-4 w-4" />{team.memberIds.length} Members</span>
              </div>
              <div className="flex gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={() => openView(team)}>View</Button>
                <Button variant="ghost" size="sm" onClick={() => openEdit(team)}><Edit className="h-4 w-4" /></Button>
                <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(team)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
              </div>
            </div>
          ))}
        </div>
      }

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title={editing ? 'Edit Team' : 'Create Team'}>
        <div className="space-y-4">
          <Input label="Team Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required placeholder="Development Team" />
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Description</label>
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Backend and frontend team" rows={3} className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm" />
          </div>
          {!editing && <MultiSelect options={userOptions} value={form.memberIds} onChange={v => setForm({ ...form, memberIds: v })} placeholder="Select members" />}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={handleSave}>{editing ? 'Save' : 'Create Team'}</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!viewTeam} onClose={() => setViewTeam(null)} title={viewTeam?.name || 'Team Details'} size="lg">
        {viewTeam && (
          <div className="space-y-4">
            <p className="text-sm text-slate-600 dark:text-slate-400">{viewTeam.description}</p>
            <div>
              <h4 className="text-sm font-semibold mb-2">Members</h4>
              <div className="space-y-2">
                {viewMembers.map(u => (
                  <div key={u.id} className="flex items-center gap-3 p-2 rounded-lg bg-slate-50 dark:bg-slate-800">
                    <Avatar name={u.name} src={u.avatar} size="sm" />
                    <span className="flex-1 text-sm font-medium">{u.name}</span>
                    <button onClick={() => handleRemoveMember(viewTeam.id, u.id)} className="p-1 hover:text-red-500"><UserMinus className="h-4 w-4" /></button>
                  </div>
                ))}
                {viewMembers.length === 0 && <p className="text-sm text-slate-400">No members yet</p>}
              </div>
            </div>
            <div className="flex gap-2">
              <Select options={userOptions.filter(o => !viewTeam.memberIds.includes(o.value))} value="" onChange={e => { if (e.target.value) handleAddMember(viewTeam.id, e.target.value); }} placeholder="Add member..." />
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} title="Delete Team" message={`Delete "${deleteTarget?.name}"?`} confirmLabel="Delete" />
    </div>
  );
}
```

- [ ] **Step 2: Typecheck + lint**

Run (from `frontend/`): `npm run build; npm run lint`
Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/teams/TeamListPage.tsx
git commit -m "feat: bind team page to live team APIs"
```

---

### Task 5: Rewire CalendarPage

**Files:**
- Rewrite: `frontend/src/pages/calendar/CalendarPage.tsx`

**Interfaces:**
- Consumes: Task 2's `calendarService.getEvents` + `mapCalendarEvent`; `projectService.list()`; `teamService.list(projectId)`; mappers `mapProject`, `mapTeam`; `getErrorMessage`.
- Produces: dynamic month calendar fed by the backend endpoint; month defaults to today; team filter passes `team_id`.

- [ ] **Step 1: Rewrite `frontend/src/pages/calendar/CalendarPage.tsx`**

```tsx
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { Select } from '../../components/common/Select';
import { Badge } from '../../components/common/Badge';
import { projectService } from '../../services/projectService';
import { teamService } from '../../services/teamService';
import { calendarService } from '../../services/calendarService';
import { getErrorMessage } from '../../api/apiClient';
import { mapProject, mapTeam, mapCalendarEvent } from '../../utils/mappers';
import type { CalendarEvent, Project, Team } from '../../types';

export default function CalendarPage() {
  const { projectId: paramId } = useParams();
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState(paramId || '');
  const [teams, setTeams] = useState<Team[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterTeam, setFilterTeam] = useState('');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  useEffect(() => {
    projectService.list().then(res => {
      const list = (res.data.data || res.data || []).map(mapProject);
      setProjects(list);
      if (!paramId && list[0]) setProjectId(list[0].id);
    }).catch(e => setError(getErrorMessage(e)));
  }, []);

  useEffect(() => {
    if (!projectId) return;
    let cancelled = false;
    setLoading(true);
    setError('');
    Promise.all([
      calendarService.getEvents(projectId, filterTeam ? { team_id: filterTeam } : undefined),
      teamService.list(projectId).catch(() => ({ data: { data: [] } })),
    ]).then(([evRes, tmRes]) => {
      if (cancelled) return;
      setEvents((evRes.data.data || evRes.data || []).map(mapCalendarEvent));
      setTeams((tmRes.data.data || tmRes.data || []).map(mapTeam));
    }).catch(e => { if (!cancelled) setError(getErrorMessage(e)); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [projectId, filterTeam]);

  const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  const startDay = monthStart.getDay();
  const daysInMonth = monthEnd.getDate();

  const days = Array.from({ length: daysInMonth }, (_, i) => {
    const d = new Date(currentDate.getFullYear(), currentDate.getMonth(), i + 1);
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const dayEvents = events.filter(e => e.start === iso);
    return { date: d, iso, dayEvents };
  });

  const project = projects.find(p => p.id === projectId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2"><CalendarIcon className="h-6 w-6" />Calendar</h1>
          <p className="text-sm text-slate-500">Project: {project?.name || '—'}</p>
        </div>
        <div className="flex gap-3">
          <Select options={projects.map(p => ({ value: p.id, label: p.name }))} value={projectId} onChange={e => { setProjectId(e.target.value); setFilterTeam(''); }} className="w-56" />
          <Select options={[{ value: '', label: 'All Teams' }, ...teams.map(t => ({ value: t.id, label: t.name }))]} value={filterTeam} onChange={e => setFilterTeam(e.target.value)} className="w-40" />
        </div>
      </div>

      {error ? <div className="bg-white dark:bg-slate-900 rounded-xl border border-red-200 dark:border-red-800 p-8 text-center text-sm text-red-500">{error}</div> :
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">{currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h2>
          <div className="flex gap-2">
            <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"><ChevronLeft className="h-4 w-4" /></button>
            <button onClick={() => setCurrentDate(new Date())} className="px-3 py-1 text-xs rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">Today</button>
            <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"><ChevronRight className="h-4 w-4" /></button>
          </div>
        </div>
        {loading ? <div className="py-16 text-center text-sm text-slate-500">Loading events...</div> : (
          <div className="grid grid-cols-7 gap-px bg-slate-200 dark:bg-slate-700 rounded-lg overflow-hidden">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <div key={d} className="bg-slate-50 dark:bg-slate-800 p-2 text-center text-xs font-semibold text-slate-500">{d}</div>)}
            {Array.from({ length: startDay }).map((_, i) => <div key={`empty-${i}`} className="bg-white dark:bg-slate-900 h-24" />)}
            {days.map(({ date, iso, dayEvents }) => (
              <div key={iso} className={`bg-white dark:bg-slate-900 h-24 p-1 overflow-hidden ${iso === new Date().toISOString().slice(0, 10) ? 'ring-1 ring-primary-400' : ''}`}>
                <div className="text-xs font-medium text-slate-700 dark:text-slate-300">{date.getDate()}</div>
                <div className="space-y-1 mt-1">
                  {dayEvents.slice(0, 3).map(ev => (
                    <div key={ev.id} onClick={() => setSelectedEvent(ev)} className="text-[10px] px-1 py-0.5 rounded truncate cursor-pointer hover:opacity-80" style={{ backgroundColor: ev.color ? ev.color + '20' : '#3b82f620', color: ev.color || '#3b82f6' }}>
                      {ev.title}
                    </div>
                  ))}
                  {dayEvents.length > 3 && <div className="text-[10px] text-slate-400">+{dayEvents.length - 3} more</div>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>}

      {selectedEvent && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50" onClick={() => setSelectedEvent(null)}>
          <div className="bg-white dark:bg-slate-900 rounded-xl p-6 max-w-md w-full space-y-3" onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold text-slate-900 dark:text-white">{selectedEvent.title}</h3>
            <p className="text-sm text-slate-500">{selectedEvent.type} • {selectedEvent.start}</p>
            <Badge>{selectedEvent.type}</Badge>
            <div className="flex justify-end gap-2">
              <button onClick={() => setSelectedEvent(null)} className="text-sm text-slate-500">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```

Notes vs old version: local `iso` built from local date parts (not `toISOString`, which shifts by timezone); today highlighted; "Today" nav button added.

- [ ] **Step 2: Typecheck + lint**

Run (from `frontend/`): `npm run build; npm run lint`
Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/calendar/CalendarPage.tsx
git commit -m "feat: bind calendar page to live calendar API"
```

---

### Task 6: Delete mocks + final verification

**Files:**
- Delete: `frontend/src/mocks/mockData.ts`, `frontend/src/mocks/services/calendarMockService.ts`, `frontend/src/mocks/services/ticketMockService.ts`, `frontend/src/mocks/services/sprintMockService.ts`, `frontend/src/mocks/services/teamMockService.ts`

**Interfaces:**
- Consumes: nothing (pure deletion).
- Produces: zero references to `src/mocks` anywhere in `frontend/src`.

- [ ] **Step 1: Delete the mocks directory**

```bash
git rm -r frontend/src/mocks
```

- [ ] **Step 2: Verify zero references remain**

Run (from repo root): `rg -n "mocks|Mock" frontend/src --glob '!node_modules'`
Expected: no matches (if `rg` unavailable use `Get-ChildItem -Recurse` + `Select-String`). If any match appears, fix the importing file before continuing.

- [ ] **Step 3: Full frontend verification**

Run (from `frontend/`): `npm run build; npm run lint`
Expected: `tsc -b` succeeds; oxlint reports no errors.

- [ ] **Step 4: Full backend verification**

Run (from `backend/`): `python -m pytest tests/ -v`
Expected: all pass.

- [ ] **Step 5: Manual smoke checklist (requires backend running on :8000)**

1. `cd backend` → activate venv → `uvicorn app.main:app --reload`; `cd frontend` → `npm run dev`.
2. Login → Sprints page loads real projects; create sprint → appears; Start → badge ACTIVE; Complete → COMPLETED; Delete removes.
3. Teams page: create team with 2 members → avatars appear; View → remove member, add another → counts update; Delete works.
4. Calendar: current month shown; tickets with dates and sprint boundaries appear; team filter narrows events; popup shows details.
5. Tickets/Kanban/Tasks pages still work (regression check).

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: remove mock data layer - all pages bound to live APIs"
```
