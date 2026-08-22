from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.database import get_db
from app.schemas.user import UserCreateRequest, UserUpdateRequest, UserStatusUpdate
from app.services.user_service import UserService
from app.dependencies.permissions import require_permission
from app.models.workspace_member import WorkspaceMember

router = APIRouter(prefix="/users", tags=["users"])


@router.get("")
async def list_users(
    search: str = Query(None),
    status: str = Query(None),
    page: int = Query(1),
    limit: int = Query(20),
    workspace_member: WorkspaceMember = Depends(require_permission("users.manage")),
    db: AsyncSession = Depends(get_db),
):
    service = UserService(db)
    result = await service.list_users(search=search, status=status, page=page, limit=limit)
    return {"success": True, "data": [{"id": str(u.id), "email": u.email, "name": u.name, "avatar": u.avatar, "status": u.status, "is_superadmin": u.is_superadmin} for u in result["items"]], "pagination": result["pagination"]}


@router.get("/{user_id}")
async def get_user(user_id: str, workspace_member: WorkspaceMember = Depends(require_permission("users.manage")), db: AsyncSession = Depends(get_db)):
    from uuid import UUID
    service = UserService(db)
    user = await service.get_user(UUID(user_id))
    return {"success": True, "data": {"id": str(user.id), "email": user.email, "name": user.name, "avatar": user.avatar, "status": user.status, "is_superadmin": user.is_superadmin}}


@router.put("/{user_id}")
async def update_user(user_id: str, request: UserUpdateRequest, workspace_member: WorkspaceMember = Depends(require_permission("users.manage")), db: AsyncSession = Depends(get_db)):
    from uuid import UUID
    service = UserService(db)
    user = await service.update_user(UUID(user_id), **request.model_dump(exclude_unset=True))
    return {"success": True, "data": {"id": str(user.id), "email": user.email, "name": user.name, "avatar": user.avatar, "status": user.status}}


@router.patch("/{user_id}/status")
async def toggle_status(user_id: str, request: UserStatusUpdate, workspace_member: WorkspaceMember = Depends(require_permission("users.manage")), db: AsyncSession = Depends(get_db)):
    from uuid import UUID
    service = UserService(db)
    user = await service.toggle_status(UUID(user_id), request.status)
    return {"success": True, "data": {"id": str(user.id), "status": user.status}}
