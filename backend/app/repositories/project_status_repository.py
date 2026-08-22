from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.project_status import ProjectStatus
from typing import Optional, List
from uuid import UUID


class ProjectStatusRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_project(self, project_id: UUID) -> List[ProjectStatus]:
        result = await self.db.execute(select(ProjectStatus).where(ProjectStatus.project_id == project_id).order_by(ProjectStatus.display_order))
        return list(result.scalars().all())

    async def create(self, project_id: UUID, name: str, color: str = "#6B7280", display_order: int = 0) -> ProjectStatus:
        status = ProjectStatus(project_id=project_id, name=name, color=color, display_order=display_order)
        self.db.add(status)
        await self.db.flush()
        return status

    async def get_by_id(self, status_id: UUID) -> Optional[ProjectStatus]:
        result = await self.db.execute(select(ProjectStatus).where(ProjectStatus.id == status_id))
        return result.scalar_one_or_none()

    async def update(self, status_id: UUID, **kwargs) -> Optional[ProjectStatus]:
        status = await self.get_by_id(status_id)
        if status:
            for key, value in kwargs.items():
                if value is not None:
                    setattr(status, key, value)
            await self.db.flush()
        return status

    async def delete(self, status_id: UUID) -> bool:
        status = await self.get_by_id(status_id)
        if status:
            await self.db.delete(status)
            await self.db.flush()
            return True
        return False
