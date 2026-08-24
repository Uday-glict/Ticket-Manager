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
