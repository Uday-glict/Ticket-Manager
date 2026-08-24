# Frontend API Integration & Dummy Data Removal — Design

**Date:** 2026-08-24
**Status:** Approved

## Goal

Replace all remaining mock/dummy data bindings in the frontend with real backend API calls, and delete the `frontend/src/mocks/` directory. Every page must render live data from the FastAPI backend.

## Current State

- All pages except three already use real services (`src/services/*` via `src/api/apiClient.ts`).
- Mock usage is confined to exactly:
  - `pages/calendar/CalendarPage.tsx` (`calendarMockService`, `mockProjects`, hardcoded team filter options, hardcoded initial month `new Date(2026, 7, 1)`)
  - `pages/sprints/SprintListPage.tsx` (`sprintMockService`, `mockProjects`, `mockTeams`)
  - `pages/teams/TeamListPage.tsx` (`teamMockService`, `mockProjects`, `mockUsers`)
- Real services already exist and match backend routes: `sprintService`, `teamService`, `ticketService`, plus mappers `mapSprint` / `mapTeam` / `mapProject` / `mapUser` in `src/utils/mappers.ts`.
- Backend has full CRUD for sprints (`/projects/{id}/sprints`, `/sprints/{id}` + `/start` + `/complete`) and teams (`/projects/{id}/teams`, `/teams/{id}`, `/teams/{id}/members`). There is **no calendar endpoint**.

## Decisions (confirmed with user)

1. **Calendar:** add a new backend endpoint rather than deriving events client-side.
2. **Team creation with members:** keep the member MultiSelect in the create form; create the team first, then loop `POST /teams/{id}/members` per selected user.
3. **Approach:** follow the existing `TicketListPage` integration pattern (direct service calls + mappers + toasts). No React Query, no adapter layer.

## Backend Changes

### New endpoint: project calendar

New file `backend/app/api/v1/calendar.py`:

```
GET /projects/{project_id}/calendar?team_id=&sprint_id=&assignee_id=
```

- Permission: `tasks.view` via `require_permission`.
- Loads the project's tasks (with `team_id`, `sprint_id`, `start_date`, `due_date`, `status_id`, ticket key if present) and sprints from the DB; filters by optional query params.
- Derives events (same semantics as the removed `calendarMockService`):
  - Task with `start_date` → `{ id: "cal_t_{task}_start", type: "ticket", title: "{key} {title}", color: default blue }`
  - Task with `due_date` → `{ id: "cal_t_{task}_due", type: "ticket", title: "{key} Due", color: "#ef4444" }`
  - Sprint → `{ title: "{name} starts", color: "#3b82f6" }` and `{ title: "{name} ends", color: "#22c55e" }`
- Each event: `{ id, type: "ticket"|"sprint", title, start, end, project_id, sprint_id?, team_id?, status_id?, task_id?, color? }` — `type` stays `"ticket"` because tasks are presented as tickets throughout the UI, matching the existing `CalendarEvent` union.
- Response uses the standard `success_response(data=..., message=...)` envelope.
- Register the router in `app/api/v1/router.py`; add messages to `app/constants/messages.py`.
- Add a `mapCalendarEvent` helper in `src/utils/mappers.ts` converting snake_case payloads to the existing camelCase `CalendarEvent` type (unchanged).

## Frontend Changes

### New service: `src/services/calendarService.ts`

```ts
getEvents(projectId, filters?: { team_id?, sprint_id?, assignee_id? }) → GET /projects/{id}/calendar
```

### SprintListPage rewiring

- Project selector: `projectService.list()`; defaults to route param or first project.
- Team options: `teamService.list(projectId)` mapped through `mapTeam`.
- CRUD: `sprintService.create/update/delete`; Start/Complete call `POST /sprints/{id}/start|complete`.
- Map responses with `mapSprint`. Loading state, toasts on success/error via `useToast` + `getErrorMessage` — identical conventions to TicketListPage.

### TeamListPage rewiring

- Projects: `projectService.list()`. User options: `userService.list()` mapped with `mapUser`.
- Create: `teamService.create(projectId, {...})` → then sequential `teamService.addMember(teamId, userId)` for each selected user (backend accepts one user per call). Surface partial-failure errors via toast but keep the team.
- Update/delete via `teamService.update/delete`.
- View modal members resolved via `teamService.listMembers(teamId)` joined against loaded users; add/remove wired to members endpoints.

### CalendarPage rewiring

- Project selector and team filter fed by real services.
- Events fetched from `calendarService.getEvents(projectId, { team_id })`.
- Initial month = current date (removes hardcoded Aug 2026).
- Keep existing grid UI, event detail popup, and `CalendarEvent` type.

### Cleanup

- Delete `src/mocks/` entirely (`mockData.ts`, `calendarMockService.ts`, `ticketMockService.ts`, `sprintMockService.ts`, `teamMockService.ts`).
- Grep to confirm zero remaining references.

## Error Handling

All pages follow the established pattern: try/catch around service calls, `showError(getErrorMessage(e))` toasts, optimistic-free refetch after mutations, empty states when lists are empty, loading indicators during fetches.

## Testing & Verification

1. Backend: smoke test for `GET /projects/{id}/calendar` (auth + seeded project/tasks/sprints asserts event derivation and filters), run with existing pytest setup.
2. Frontend: `tsc` typecheck and lint pass with mocks deleted.
3. Manual checklist: login → create/edit/start/complete sprint → create team with members → add/remove member in view modal → calendar renders real events filtered by team.
