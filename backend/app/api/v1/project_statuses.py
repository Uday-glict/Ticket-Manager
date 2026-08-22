from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.database import get_db
from app.schemas.project import ProjectStatusCreateRequest, ProjectStatusUpdateRequest
from app.services.project_status_service import ProjectStatusService
from app.dependencies.permissions import require_permission
from app.models.workspace_member import WorkspaceMember
from uuid import UUID

router = APIRouter(prefix="/projects/{project_id}/statuses", tags=["project-statuses"])


@router.get("")
async def list_statuses(project_id: str, workspace_member: WorkspaceMember = Depends(require_permission("projects.view")), db: AsyncSession = Depends(get_db)):
    service = ProjectStatusService(db)
    statuses = await service.list_statuses(UUID(project_id))
    return {"success": True, "data": [{"id": str(s.id), "name": s.name, "color": s.color, "display_order": s.display_order, "is_enabled": s.is_enabled} for s in statuses]}


@router.post("")
async def create_status(project_id: str, request: ProjectStatusCreateRequest, workspace_member: WorkspaceMember = Depends(require_permission("projects.update")), db: AsyncSession = Depends(get_db)):
    service = ProjectStatusService(db)
    status = await service.create_status(UUID(project_id), request.name, request.color, request.display_order)
    return {"success": True, "data": {"id": str(status.id), "name": status.name, "color": status.color, "display_order": status.display_order}}


@router.put("/{status_id}")
async def update_status(project_id: str, status_id: str, request: ProjectStatusUpdateRequest, workspace_member: WorkspaceMember = Depends(require_permission("projects.update")), db: AsyncSession = Depends(get_db)):
    service = ProjectStatusService(db)
    status = await service.update_status(UUID(status_id), **request.model_dump(exclude_unset=True))
    return {"success": True, "data": {"id": str(status.id), "name": status.name, "color": status.color, "display_order": status.display_order, "is_enabled": status.is_enabled}}


@router.delete("/{status_id}")
async def delete_status(project_id: str, status_id: str, workspace_member: WorkspaceMember = Depends(require_permission("projects.update")), db: AsyncSession = Depends(get_db)):
    service = ProjectStatusService(db)
    await service.delete_status(UUID(status_id))
    return {"success": True, "message": "Status deleted"}
