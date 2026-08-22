from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.project_repository import ProjectRepository
from app.repositories.project_member_repository import ProjectMemberRepository
from app.core.exceptions import NotFoundException
from uuid import UUID


class ProjectService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.project_repo = ProjectRepository(db)
        self.member_repo = ProjectMemberRepository(db)

    async def create_project(self, workspace_id: UUID, name: str, description: str = None, manager_id: UUID = None, start_date=None, end_date=None):
        return await self.project_repo.create(workspace_id=workspace_id, name=name, description=description, manager_id=manager_id, start_date=start_date, end_date=end_date)

    async def get_project(self, project_id: UUID):
        project = await self.project_repo.get_by_id(project_id)
        if not project:
            raise NotFoundException("Project")
        return project

    async def list_projects(self, workspace_id: UUID, search: str = None, status: str = None, page: int = 1, limit: int = 20):
        return await self.project_repo.list_projects(workspace_id=workspace_id, search=search, status=status, page=page, limit=limit)

    async def update_project(self, project_id: UUID, **kwargs):
        project = await self.project_repo.update(project_id, **kwargs)
        if not project:
            raise NotFoundException("Project")
        return project

    async def get_members(self, project_id: UUID):
        return await self.member_repo.get_members(project_id)

    async def add_member(self, project_id: UUID, user_id: UUID, role_id: UUID):
        return await self.member_repo.add_member(project_id, user_id, role_id)

    async def update_member(self, project_id: UUID, user_id: UUID, role_id: UUID):
        return await self.member_repo.update_member(project_id, user_id, role_id)

    async def remove_member(self, project_id: UUID, user_id: UUID):
        return await self.member_repo.remove_member(project_id, user_id)
