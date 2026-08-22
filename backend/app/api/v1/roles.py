from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.database import get_db
from app.schemas.role import RoleCreateRequest, RoleUpdateRequest
from app.services.role_service import RoleService
from app.dependencies.permissions import require_permission
from app.models.workspace_member import WorkspaceMember

router = APIRouter(prefix="/roles", tags=["roles"])


@router.get("")
async def list_roles(workspace_member: WorkspaceMember = Depends(require_permission("roles.manage")), db: AsyncSession = Depends(get_db)):
    service = RoleService(db)
    roles = await service.list_roles(workspace_member.workspace_id)
    return {"success": True, "data": [{"id": str(r.id), "name": r.name, "description": r.description, "is_system": r.is_system} for r in roles]}


@router.post("")
async def create_role(request: RoleCreateRequest, workspace_member: WorkspaceMember = Depends(require_permission("roles.manage")), db: AsyncSession = Depends(get_db)):
    service = RoleService(db)
    role = await service.create_role(workspace_member.workspace_id, request.name, request.description, request.permissions)
    return {"success": True, "data": {"id": str(role.id), "name": role.name, "description": role.description, "is_system": role.is_system}}


@router.put("/{role_id}")
async def update_role(role_id: str, request: RoleUpdateRequest, workspace_member: WorkspaceMember = Depends(require_permission("roles.manage")), db: AsyncSession = Depends(get_db)):
    from uuid import UUID
    service = RoleService(db)
    role = await service.update_role(UUID(role_id), request.name, request.description, request.permissions)
    return {"success": True, "data": {"id": str(role.id), "name": role.name, "description": role.description}}


@router.delete("/{role_id}")
async def delete_role(role_id: str, workspace_member: WorkspaceMember = Depends(require_permission("roles.manage")), db: AsyncSession = Depends(get_db)):
    from uuid import UUID
    service = RoleService(db)
    await service.delete_role(UUID(role_id))
    return {"success": True, "message": "Role deleted"}
