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
