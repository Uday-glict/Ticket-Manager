from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.sprint import Sprint
from typing import List, Optional
from uuid import UUID
from datetime import date

class SprintRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, project_id: UUID, name: str, start_date: date, end_date: date, created_by: UUID, team_id: Optional[UUID] = None, description: Optional[str] = None, goal: Optional[str] = None) -> Sprint:
        sprint = Sprint(project_id=project_id, team_id=team_id, name=name.strip(), description=description, goal=goal, start_date=start_date, end_date=end_date, created_by=created_by)
        self.db.add(sprint)
        await self.db.flush()
        return sprint

    async def get_by_id(self, sprint_id: UUID) -> Optional[Sprint]:
        result = await self.db.execute(select(Sprint).where(Sprint.id == sprint_id))
        return result.scalar_one_or_none()

    async def list_by_project(self, project_id: UUID) -> List[Sprint]:
        result = await self.db.execute(select(Sprint).where(Sprint.project_id == project_id).order_by(Sprint.start_date))
        return list(result.scalars().all())

    async def update(self, sprint: Sprint, **kwargs) -> Sprint:
        for k, v in kwargs.items():
            if v is not None:
                setattr(sprint, k, v)
        await self.db.flush()
        return sprint

    async def delete(self, sprint_id: UUID) -> bool:
        sprint = await self.get_by_id(sprint_id)
        if sprint:
            await self.db.delete(sprint)
            await self.db.flush()
            return True
        return False
