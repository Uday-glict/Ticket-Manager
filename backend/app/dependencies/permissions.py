from fastapi import Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.database import get_db
from app.dependencies.auth import get_current_active_user
from app.core.exceptions import ForbiddenException
from app.constants.messages import COMMON_MESSAGES, PERMISSION_MESSAGES
from app.constants.error_codes import PERMISSION_DENIED
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
        raise ForbiddenException(
            message=PERMISSION_MESSAGES["FORBIDDEN"],
            code=PERMISSION_DENIED,
        )
    return member


_PERM_ALIASES: dict[str, str] = {
    "tickets.view": "tasks.view", "tasks.view": "tickets.view",
    "tickets.create": "tasks.create", "tasks.create": "tickets.create",
    "tickets.update": "tasks.update", "tasks.update": "tickets.update",
    "tickets.delete": "tasks.delete", "tasks.delete": "tickets.delete",
    "tickets.assign": "tasks.assign", "tasks.assign": "tickets.assign",
}

def _perm_matches(required: str, actual: str) -> bool:
    return actual == required or _PERM_ALIASES.get(required) == actual


def require_permission(permission: str):
    async def checker(
        workspace_member: WorkspaceMember = Depends(get_current_workspace_member),
        db: AsyncSession = Depends(get_db),
    ) -> WorkspaceMember:
        if workspace_member.role in ("owner", "admin"):
            return workspace_member
        if permission in ("projects.view", "tasks.view", "tickets.view", "board.view"):
            # allow any workspace member to view projects/tasks/tickets/board; data-level will filter; create/update/delete still requires explicit permission
            return workspace_member
        # check project-specific roles for permission
        result = await db.execute(select(ProjectMember).where(ProjectMember.user_id == workspace_member.user_id))
        pms = result.scalars().all()
        role_ids = [pm.role_id for pm in pms]
        if role_ids:
            result = await db.execute(select(Role).where(Role.id.in_(role_ids)))
            for role in result.scalars().all():
                await db.refresh(role, attribute_names=["permissions"])
                for perm in role.permissions:
                    if _perm_matches(permission, perm.name):
                        return workspace_member
        # fallback check workspace roles (global)
        result = await db.execute(
            select(Role).join(Role.permissions).where(Role.workspace_id == workspace_member.workspace_id)
        )
        for role in result.scalars().all():
            await db.refresh(role, attribute_names=["permissions"])
            for perm in role.permissions:
                if _perm_matches(permission, perm.name):
                    return workspace_member
        raise ForbiddenException(
            message=PERMISSION_MESSAGES["FORBIDDEN"],
            code=PERMISSION_DENIED,
        )
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
        raise ForbiddenException(
            message=PERMISSION_MESSAGES["FORBIDDEN"],
            code=PERMISSION_DENIED,
        )
    return member
