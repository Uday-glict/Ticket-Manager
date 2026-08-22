from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.database import get_db
from app.schemas.project_member import ProjectMemberAddRequest, ProjectMemberUpdateRequest
from app.services.project_service import ProjectService
from app.dependencies.permissions import require_permission
from app.models.workspace_member import WorkspaceMember
from uuid import UUID

router = APIRouter(prefix="/projects/{project_id}/members", tags=["project-members"])


@router.get("")
async def list_members(project_id: str, workspace_member: WorkspaceMember = Depends(require_permission("projects.view")), db: AsyncSession = Depends(get_db)):
    service = ProjectService(db)
    members = await service.get_members(UUID(project_id))
    return {"success": True, "data": [{"id": str(m.id), "user_id": str(m.user_id), "role_id": str(m.role_id)} for m in members]}


@router.post("")
async def add_member(project_id: str, request: ProjectMemberAddRequest, workspace_member: WorkspaceMember = Depends(require_permission("projects.update")), db: AsyncSession = Depends(get_db)):
    service = ProjectService(db)
    member = await service.add_member(UUID(project_id), request.user_id, request.role_id)
    return {"success": True, "data": {"id": str(member.id), "user_id": str(member.user_id), "role_id": str(member.role_id)}}


@router.put("/{user_id}")
async def update_member(project_id: str, user_id: str, request: ProjectMemberUpdateRequest, workspace_member: WorkspaceMember = Depends(require_permission("projects.update")), db: AsyncSession = Depends(get_db)):
    service = ProjectService(db)
    member = await service.update_member(UUID(project_id), UUID(user_id), request.role_id)
    return {"success": True, "data": {"id": str(member.id), "user_id": str(member.user_id), "role_id": str(member.role_id)}}


@router.delete("/{user_id}")
async def remove_member(project_id: str, user_id: str, workspace_member: WorkspaceMember = Depends(require_permission("projects.update")), db: AsyncSession = Depends(get_db)):
    service = ProjectService(db)
    await service.remove_member(UUID(project_id), UUID(user_id))
    return {"success": True, "message": "Member removed"}
