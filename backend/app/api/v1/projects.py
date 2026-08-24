from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.database import get_db
from app.schemas.project import ProjectCreateRequest, ProjectUpdateRequest
from app.services.project_service import ProjectService
from app.services.project_status_service import ProjectStatusService
from app.dependencies.permissions import require_permission
from app.models.workspace_member import WorkspaceMember
from app.utils.response import success_response, paginated_response
from app.constants.messages import PROJECT_MESSAGES
from uuid import UUID

router = APIRouter(prefix="/projects", tags=["projects"])


def serialize_project(p, members=None, statuses=None):
    return {
        "id": str(p.id),
        "name": p.name,
        "description": p.description or "",
        "status": p.status,
        "manager_id": str(p.manager_id) if p.manager_id else None,
        "members": [{"user_id": str(m.user_id), "role_id": str(m.role_id)} for m in (members or [])],
        "statuses": [{"id": str(s.id), "name": s.name, "color": s.color, "order": s.display_order, "enabled": s.is_enabled} for s in (statuses or [])],
        "start_date": str(p.start_date) if p.start_date else None,
        "end_date": str(p.end_date) if p.end_date else None,
        "created_at": str(p.created_at) if hasattr(p, 'created_at') and p.created_at else None,
    }


@router.get("")
async def list_projects(
    search: str = Query(None),
    status: str = Query(None),
    page: int = Query(1),
    limit: int = Query(20),
    workspace_member: WorkspaceMember = Depends(require_permission("projects.view")),
    db: AsyncSession = Depends(get_db),
):
    service = ProjectService(db)
    status_service = ProjectStatusService(db)
    items, pagination = await service.list_projects(workspace_member, search=search, status=status, page=page, limit=limit)

    data = []
    for p in items:
        members = await service.get_members(p.id)
        statuses = await status_service.list_statuses(p.id)
        data.append(serialize_project(p, members, statuses))

    return paginated_response(data=data, pagination=pagination, message=PROJECT_MESSAGES["LIST_SUCCESS"])


@router.post("")
async def create_project(request: ProjectCreateRequest, workspace_member: WorkspaceMember = Depends(require_permission("projects.create")), db: AsyncSession = Depends(get_db)):
    service = ProjectService(db)
    project = await service.create_project(workspace_member.workspace_id, request.name, request.description, request.manager_id, request.start_date, request.end_date)
    members = await service.get_members(project.id)
    status_service = ProjectStatusService(db)
    statuses = await status_service.list_statuses(project.id)
    return success_response(data=serialize_project(project, members, statuses), message=PROJECT_MESSAGES["CREATED"])


@router.get("/{project_id}")
async def get_project(project_id: str, workspace_member: WorkspaceMember = Depends(require_permission("projects.view")), db: AsyncSession = Depends(get_db)):
    service = ProjectService(db)
    status_service = ProjectStatusService(db)
    project = await service.get_project_with_access(UUID(project_id), workspace_member)
    members = await service.get_members(project.id)
    statuses = await status_service.list_statuses(project.id)
    return success_response(data=serialize_project(project, members, statuses), message=PROJECT_MESSAGES["GET_SUCCESS"])


@router.put("/{project_id}")
async def update_project(project_id: str, request: ProjectUpdateRequest, workspace_member: WorkspaceMember = Depends(require_permission("projects.update")), db: AsyncSession = Depends(get_db)):
    service = ProjectService(db)
    project = await service.update_project(UUID(project_id), **request.model_dump(exclude_unset=True))
    members = await service.get_members(project.id)
    status_service = ProjectStatusService(db)
    statuses = await status_service.list_statuses(project.id)
    return success_response(data=serialize_project(project, members, statuses), message=PROJECT_MESSAGES["UPDATED"])


@router.delete("/{project_id}")
async def delete_project(project_id: str, workspace_member: WorkspaceMember = Depends(require_permission("projects.delete")), db: AsyncSession = Depends(get_db)):
    service = ProjectService(db)
    await service.delete_project(UUID(project_id))
    return success_response(message=PROJECT_MESSAGES["DELETED"])
