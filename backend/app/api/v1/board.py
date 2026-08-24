from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.database import get_db
from app.models.project_status import ProjectStatus
from app.models.task import Task
from app.dependencies.permissions import require_permission, require_project_member
from app.utils.response import success_response
from app.constants.messages import BOARD_MESSAGES
from uuid import UUID

router = APIRouter(prefix="/board", tags=["board"])


@router.get("/{project_id}")
async def get_board(
    project_id: str,
    workspace_member=Depends(require_project_member),
    db: AsyncSession = Depends(get_db),
):
    project_id_uuid = UUID(project_id)
    statuses_result = await db.execute(select(ProjectStatus).where(ProjectStatus.project_id == project_id_uuid, ProjectStatus.is_enabled == True).order_by(ProjectStatus.display_order))
    statuses = statuses_result.scalars().all()

    tasks_result = await db.execute(select(Task).where(Task.project_id == project_id_uuid))
    all_tasks = tasks_result.scalars().all()

    tasks_by_status = {}
    for task in all_tasks:
        sid = str(task.status_id)
        if sid not in tasks_by_status:
            tasks_by_status[sid] = []
        tasks_by_status[sid].append({
            "id": str(task.id), "title": task.title, "description": task.description,
            "assigned_to": str(task.assigned_to) if task.assigned_to else None,
            "created_by": str(task.created_by), "priority": task.priority,
            "start_date": str(task.start_date) if task.start_date else None,
            "due_date": str(task.due_date) if task.due_date else None,
        })

    columns = []
    for status in statuses:
        sid = str(status.id)
        columns.append({
            "status": {"id": sid, "name": status.name, "color": status.color, "display_order": status.display_order},
            "tasks": tasks_by_status.get(sid, []),
        })

    return success_response(data=columns, message=BOARD_MESSAGES["GET_SUCCESS"])
