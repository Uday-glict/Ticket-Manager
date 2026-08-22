from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.role import Role
from app.models.permission import Permission
from app.models.role_permission import RolePermission
from typing import List
from uuid import UUID


class RoleRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, workspace_id: UUID, name: str, description: str = None, is_system: bool = False) -> Role:
        role = Role(workspace_id=workspace_id, name=name, description=description, is_system=is_system)
        self.db.add(role)
        await self.db.flush()
        return role

    async def add_permissions(self, role: Role, permission_names: List[str]) -> None:
        result = await self.db.execute(select(Permission).where(Permission.name.in_(permission_names)))
        permissions = result.scalars().all()
        for perm in permissions:
            rp = RolePermission(role_id=role.id, permission_id=perm.id)
            self.db.add(rp)
        await self.db.flush()
