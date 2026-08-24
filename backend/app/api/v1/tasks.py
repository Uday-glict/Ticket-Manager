from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.database import get_db
from app.schemas.task import TaskCreateRequest, TaskUpdateRequest, TaskAssignRequest, TaskReassignRequest
from app.services.task_service import TaskService
from app.dependencies.permissions import require_permission
from app.models.workspace_member import WorkspaceMember
from app.utils.response import success_response, paginated_response
from app.constants.messages import TASK_MESSAGES
from uuid import UUID

router = APIRouter(prefix="/tasks", tags=["tasks"])


@router.get("")
async def list_tasks(
    project_id: UUID = Query(None),
    assigned_to: UUID = Query(None),
    priority: str = Query(None),
    status_id: UUID = Query(None),
    page: int = Query(1),
    limit: int = Query(20),
    workspace_member: WorkspaceMember = Depends(require_permission("tasks.view")),
    db: AsyncSession = Depends(get_db),
):
    service = TaskService(db)
    items, pagination = await service.list_tasks(project_id=project_id, assigned_to=assigned_to, priority=priority, status_id=status_id, page=page, limit=limit)
    data = [{"id": str(t.id), "title": t.title, "description": t.description, "project_id": str(t.project_id), "assigned_to": str(t.assigned_to) if t.assigned_to else None, "created_by": str(t.created_by), "priority": t.priority, "status_id": str(t.status_id), "start_date": str(t.start_date) if t.start_date else None, "due_date": str(t.due_date) if t.due_date else None} for t in items]
    return paginated_response(data=data, pagination=pagination, message=TASK_MESSAGES["LIST_SUCCESS"])


@router.post("")
async def create_task(request: TaskCreateRequest, workspace_member: WorkspaceMember = Depends(require_permission("tasks.create")), db: AsyncSession = Depends(get_db)):
    service = TaskService(db)
    task = await service.create_task(request.project_id, request.title, workspace_member.user_id, description=request.description, assigned_to=request.assigned_to, priority=request.priority, status_id=request.status_id, start_date=request.start_date, due_date=request.due_date)
    return success_response(
        data={"id": str(task.id), "title": task.title, "project_id": str(task.project_id), "priority": task.priority, "status_id": str(task.status_id)},
        message=TASK_MESSAGES["CREATED"],
    )


@router.get("/{task_id}")
async def get_task(task_id: str, workspace_member: WorkspaceMember = Depends(require_permission("tasks.view")), db: AsyncSession = Depends(get_db)):
    service = TaskService(db)
    task = await service.get_task(UUID(task_id))
    return success_response(
        data={"id": str(task.id), "title": task.title, "description": task.description, "project_id": str(task.project_id), "assigned_to": str(task.assigned_to) if task.assigned_to else None, "created_by": str(task.created_by), "priority": task.priority, "status_id": str(task.status_id), "start_date": str(task.start_date) if task.start_date else None, "due_date": str(task.due_date) if task.due_date else None},
        message=TASK_MESSAGES["GET_SUCCESS"],
    )


@router.put("/{task_id}")
async def update_task(task_id: str, request: TaskUpdateRequest, workspace_member: WorkspaceMember = Depends(require_permission("tasks.update")), db: AsyncSession = Depends(get_db)):
    service = TaskService(db)
    task = await service.update_task(UUID(task_id), **request.model_dump(exclude_unset=True))
    return success_response(
        data={"id": str(task.id), "title": task.title, "priority": task.priority, "status_id": str(task.status_id)},
        message=TASK_MESSAGES["UPDATED"],
    )


@router.post("/{task_id}/assign")
async def assign_task(task_id: str, request: TaskAssignRequest, workspace_member: WorkspaceMember = Depends(require_permission("tasks.assign")), db: AsyncSession = Depends(get_db)):
    service = TaskService(db)
    assignment = await service.assign_task(UUID(task_id), request.user_id, workspace_member.user_id, request.reason)
    return success_response(
        data={"id": str(assignment.id), "task_id": str(assignment.task_id), "user_id": str(assignment.user_id)},
        message=TASK_MESSAGES["ASSIGNED"],
    )


@router.post("/{task_id}/reassign")
async def reassign_task(task_id: str, request: TaskReassignRequest, workspace_member: WorkspaceMember = Depends(require_permission("tasks.reassign")), db: AsyncSession = Depends(get_db)):
    service = TaskService(db)
    assignment = await service.reassign_task(UUID(task_id), request.user_id, workspace_member.user_id, request.reason)
    return success_response(
        data={"id": str(assignment.id), "task_id": str(assignment.task_id), "user_id": str(assignment.user_id)},
        message=TASK_MESSAGES["REASSIGNED"],
    )


@router.get("/{task_id}/assignments")
async def get_assignments(task_id: str, workspace_member: WorkspaceMember = Depends(require_permission("tasks.view")), db: AsyncSession = Depends(get_db)):
    service = TaskService(db)
    assignments = await service.get_assignment_history(UUID(task_id))
    return success_response(
        data=[{"id": str(a.id), "user_id": str(a.user_id), "assigned_by": str(a.assigned_by), "assigned_at": str(a.assigned_at), "unassigned_at": str(a.unassigned_at) if a.unassigned_at else None, "reason": a.reason} for a in assignments],
        message=TASK_MESSAGES["ASSIGNMENTS_SUCCESS"],
    )
