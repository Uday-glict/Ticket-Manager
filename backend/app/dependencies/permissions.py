from fastapi import Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.database import get_db
from app.dependencies.auth import get_current_active_user
from app.models.user import User
from app.models.workspace_member import WorkspaceMember
from app.models.project_member import ProjectMember
from app.models.role import Role


async def get_current_workspace_member(
    user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> WorkspaceMember:
    result = await db.execute(select(WorkspaceMember).where(WorkspaceMember.user_id == user.id))
    member = result.scalar_one_or_none()
    if not member:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not a workspace member")
    return member


def require_permission(permission: str):
    async def checker(
        workspace_member: WorkspaceMember = Depends(get_current_workspace_member),
        db: AsyncSession = Depends(get_db),
    ) -> WorkspaceMember:
        if workspace_member.role in ("owner", "admin"):
            return workspace_member
        result = await db.execute(
            select(Role).join(Role.permissions).where(Role.workspace_id == workspace_member.workspace_id)
        )
        for role in result.scalars().all():
            for perm in role.permissions:
                if perm.name == permission:
                    return workspace_member
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=f"Permission denied: {permission}")
    return checker


async def require_project_member(
    project_id: str,
    user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> ProjectMember:
    from uuid import UUID
    result = await db.execute(
        select(ProjectMember).where(ProjectMember.project_id == UUID(project_id), ProjectMember.user_id == user.id)
    )
    member = result.scalar_one_or_none()
    if not member:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not a project member")
    return member
