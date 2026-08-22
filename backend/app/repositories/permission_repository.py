from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.permission import Permission
from typing import List


class PermissionRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_all(self) -> List[Permission]:
        result = await self.db.execute(select(Permission))
        return list(result.scalars().all())

    async def get_by_names(self, names: List[str]) -> List[Permission]:
        result = await self.db.execute(select(Permission).where(Permission.name.in_(names)))
        return list(result.scalars().all())
