from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.repositories.role_repository import RoleRepository
from app.repositories.permission_repository import PermissionRepository
from app.models.role import Role
from app.core.exceptions import NotFoundException, ConflictException, ForbiddenException
from app.constants.messages import ROLE_MESSAGES
from app.constants.error_codes import ROLE_NOT_FOUND, ROLE_ALREADY_EXISTS, ROLE_CANNOT_MODIFY_SYSTEM, ROLE_CANNOT_DELETE_SYSTEM
from typing import Optional, List
from uuid import UUID


class RoleService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.role_repo = RoleRepository(db)
        self.permission_repo = PermissionRepository(db)

    async def list_roles(self, workspace_id: UUID):
        result = await self.db.execute(select(Role).where(Role.workspace_id == workspace_id))
        return list(result.scalars().all())

    async def create_role(self, workspace_id: UUID, name: str, description: str = None, permissions: List[str] = None):
        existing = await self.db.execute(select(Role).where(Role.workspace_id == workspace_id, Role.name == name))
        if existing.scalar_one_or_none():
            raise ConflictException(ROLE_MESSAGES["ALREADY_EXISTS"], code=ROLE_ALREADY_EXISTS)
        role = await self.role_repo.create(workspace_id=workspace_id, name=name, description=description)
        if permissions:
            await self.role_repo.add_permissions(role, permissions)
        return role

    async def get_role(self, role_id: UUID):
        result = await self.db.execute(select(Role).where(Role.id == role_id))
        role = result.scalar_one_or_none()
        if not role:
            raise NotFoundException(ROLE_MESSAGES["NOT_FOUND"], code=ROLE_NOT_FOUND)
        return role

    async def update_role(self, role_id: UUID, name: str = None, description: str = None, permissions: List[str] = None):
        role = await self.get_role(role_id)
        if role.is_system:
            raise ForbiddenException(ROLE_MESSAGES["CANNOT_MODIFY_SYSTEM"], code=ROLE_CANNOT_MODIFY_SYSTEM)
        if name:
            existing = await self.db.execute(select(Role).where(Role.workspace_id == role.workspace_id, Role.name == name, Role.id != role_id))
            if existing.scalar_one_or_none():
                raise ConflictException(ROLE_MESSAGES["ALREADY_EXISTS"], code=ROLE_ALREADY_EXISTS)
            role.name = name
        if description is not None:
            role.description = description
        if permissions is not None:
            from app.models.role_permission import RolePermission
            from sqlalchemy import delete
            await self.db.execute(delete(RolePermission).where(RolePermission.role_id == role_id))
            if permissions:
                await self.role_repo.add_permissions(role, permissions)
        await self.db.flush()
        await self.db.refresh(role, attribute_names=["permissions"])
        return role

    async def delete_role(self, role_id: UUID):
        role = await self.get_role(role_id)
        if role.is_system:
            raise ForbiddenException(ROLE_MESSAGES["CANNOT_DELETE_SYSTEM"], code=ROLE_CANNOT_DELETE_SYSTEM)
        await self.db.delete(role)
        await self.db.flush()
        return True

    async def list_permissions(self):
        return await self.permission_repo.get_all()
