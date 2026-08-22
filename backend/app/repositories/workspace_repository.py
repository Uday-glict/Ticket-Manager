from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.workspace import Workspace
from app.models.workspace_member import WorkspaceMember
from typing import Optional
from uuid import UUID


class WorkspaceRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, name: str, workspace_type: str, owner_id: UUID) -> Workspace:
        workspace = Workspace(name=name, type=workspace_type, owner_id=owner_id)
        self.db.add(workspace)
        await self.db.flush()
        return workspace

    async def add_member(self, workspace_id: UUID, user_id: UUID, role: str) -> WorkspaceMember:
        member = WorkspaceMember(workspace_id=workspace_id, user_id=user_id, role=role)
        self.db.add(member)
        await self.db.flush()
        return member
