from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.team_member import TeamMember
from typing import List, Optional
from uuid import UUID


class TeamMemberRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def list_by_team(self, team_id: UUID) -> List[TeamMember]:
        result = await self.db.execute(select(TeamMember).where(TeamMember.team_id == team_id))
        return list(result.scalars().all())

    async def is_member(self, team_id: UUID, user_id: UUID) -> bool:
        result = await self.db.execute(select(TeamMember).where(TeamMember.team_id == team_id, TeamMember.user_id == user_id))
        return result.scalar_one_or_none() is not None

    async def add(self, team_id: UUID, user_id: UUID) -> TeamMember:
        member = TeamMember(team_id=team_id, user_id=user_id)
        self.db.add(member)
        await self.db.flush()
        return member

    async def remove(self, team_id: UUID, user_id: UUID) -> bool:
        result = await self.db.execute(select(TeamMember).where(TeamMember.team_id == team_id, TeamMember.user_id == user_id))
        m = result.scalar_one_or_none()
        if m:
            await self.db.delete(m)
            await self.db.flush()
            return True
        return False
