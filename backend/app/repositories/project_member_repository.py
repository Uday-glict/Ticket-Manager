from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.project_member import ProjectMember
from typing import Optional, List
from uuid import UUID


class ProjectMemberRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_members(self, project_id: UUID) -> List[ProjectMember]:
        result = await self.db.execute(select(ProjectMember).where(ProjectMember.project_id == project_id))
        return list(result.scalars().all())

    async def add_member(self, project_id: UUID, user_id: UUID, role_id: UUID) -> ProjectMember:
        member = ProjectMember(project_id=project_id, user_id=user_id, role_id=role_id)
        self.db.add(member)
        await self.db.flush()
        return member

    async def update_member(self, project_id: UUID, user_id: UUID, role_id: UUID) -> Optional[ProjectMember]:
        result = await self.db.execute(select(ProjectMember).where(ProjectMember.project_id == project_id, ProjectMember.user_id == user_id))
        member = result.scalar_one_or_none()
        if member:
            member.role_id = role_id
            await self.db.flush()
        return member

    async def remove_member(self, project_id: UUID, user_id: UUID) -> bool:
        result = await self.db.execute(select(ProjectMember).where(ProjectMember.project_id == project_id, ProjectMember.user_id == user_id))
        member = result.scalar_one_or_none()
        if member:
            await self.db.delete(member)
            await self.db.flush()
            return True
        return False
