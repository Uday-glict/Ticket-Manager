from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.team import Team
from app.models.team_member import TeamMember
from typing import List, Optional
from uuid import UUID


class TeamRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, project_id: UUID, name: str, description: Optional[str], created_by: UUID) -> Team:
        team = Team(project_id=project_id, name=name.strip(), description=description.strip() if description else None, created_by=created_by)
        self.db.add(team)
        await self.db.flush()
        return team

    async def get_by_id(self, team_id: UUID) -> Optional[Team]:
        result = await self.db.execute(select(Team).where(Team.id == team_id))
        return result.scalar_one_or_none()

    async def list_by_project(self, project_id: UUID) -> List[Team]:
        result = await self.db.execute(select(Team).where(Team.project_id == project_id).order_by(Team.created_at))
        return list(result.scalars().all())

    async def update(self, team: Team, **kwargs) -> Team:
        for k, v in kwargs.items():
            if v is not None:
                setattr(team, k, v.strip() if isinstance(v, str) else v)
        await self.db.flush()
        return team

    async def delete(self, team_id: UUID) -> bool:
        team = await self.get_by_id(team_id)
        if team:
            await self.db.delete(team)
            await self.db.flush()
            return True
        return False

    async def exists_name(self, project_id: UUID, name: str, exclude_id: Optional[UUID] = None) -> bool:
        q = select(Team).where(Team.project_id == project_id, Team.name == name.strip())
        if exclude_id:
            q = q.where(Team.id != exclude_id)
        result = await self.db.execute(q)
        return result.scalar_one_or_none() is not None
