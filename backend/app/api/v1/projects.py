from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.database import get_db
from app.schemas.project import ProjectCreateRequest, ProjectUpdateRequest
from app.services.project_service import ProjectService
from app.dependencies.permissions import require_permission
from app.models.workspace_member import WorkspaceMember
from uuid import UUID

router = APIRouter(prefix="/projects", tags=["projects"])


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
    items, pagination = await service.list_projects(workspace_member.workspace_id, search=search, status=status, page=page, limit=limit)
    return {"success": True, "data": [{"id": str(p.id), "name": p.name, "description": p.description, "status": p.status, "manager_id": str(p.manager_id), "start_date": str(p.start_date) if p.start_date else None, "end_date": str(p.end_date) if p.end_date else None} for p in items], "pagination": pagination}


@router.post("")
async def create_project(request: ProjectCreateRequest, workspace_member: WorkspaceMember = Depends(require_permission("projects.create")), db: AsyncSession = Depends(get_db)):
    service = ProjectService(db)
    project = await service.create_project(workspace_member.workspace_id, request.name, request.description, request.manager_id, request.start_date, request.end_date)
    return {"success": True, "data": {"id": str(project.id), "name": project.name, "description": project.description, "status": project.status}}


@router.get("/{project_id}")
async def get_project(project_id: str, workspace_member: WorkspaceMember = Depends(require_permission("projects.view")), db: AsyncSession = Depends(get_db)):
    service = ProjectService(db)
    project = await service.get_project(UUID(project_id))
    return {"success": True, "data": {"id": str(project.id), "name": project.name, "description": project.description, "status": project.status, "manager_id": str(project.manager_id), "start_date": str(project.start_date) if project.start_date else None, "end_date": str(project.end_date) if project.end_date else None}}


@router.put("/{project_id}")
async def update_project(project_id: str, request: ProjectUpdateRequest, workspace_member: WorkspaceMember = Depends(require_permission("projects.update")), db: AsyncSession = Depends(get_db)):
    service = ProjectService(db)
    project = await service.update_project(UUID(project_id), **request.model_dump(exclude_unset=True))
    return {"success": True, "data": {"id": str(project.id), "name": project.name, "description": project.description, "status": project.status}}
