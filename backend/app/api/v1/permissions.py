from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.database import get_db
from app.services.role_service import RoleService
from app.dependencies.permissions import require_permission
from app.models.workspace_member import WorkspaceMember
from app.utils.response import success_response
from app.constants.messages import PERMISSION_MESSAGES

router = APIRouter(prefix="/permissions", tags=["permissions"])


@router.get("")
async def list_permissions(workspace_member: WorkspaceMember = Depends(require_permission("roles.manage")), db: AsyncSession = Depends(get_db)):
    service = RoleService(db)
    permissions = await service.list_permissions()
    return success_response(
        data=[{"id": str(p.id), "name": p.name, "group_name": p.group_name, "description": p.description} for p in permissions],
        message=PERMISSION_MESSAGES["LIST_SUCCESS"],
    )
