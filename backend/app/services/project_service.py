from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.project_repository import ProjectRepository
from app.repositories.project_member_repository import ProjectMemberRepository
from app.core.exceptions import NotFoundException
from app.constants.messages import PROJECT_MESSAGES
from app.constants.error_codes import PROJECT_NOT_FOUND
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
            raise NotFoundException(PROJECT_MESSAGES["NOT_FOUND"], code=PROJECT_NOT_FOUND)
        return project

    async def list_projects(self, workspace_id_or_member, search: str = None, status: str = None, page: int = 1, limit: int = 20):
        from app.models.workspace_member import WorkspaceMember
        if isinstance(workspace_id_or_member, WorkspaceMember):
            member = workspace_id_or_member
            if member.role in ("owner", "admin"):
                return await self.project_repo.list_projects(workspace_id=member.workspace_id, search=search, status=status, page=page, limit=limit)
            user_projects = await self.member_repo.get_by_user(member.user_id)
            allowed_ids = [m.project_id for m in user_projects]
            if not allowed_ids:
                return [], {"page": page, "limit": limit, "total": 0, "total_pages": 0}
            # reuse repo but filter to allowed ids
            from sqlalchemy import select
            from app.models.project import Project
            from sqlalchemy import func
            query = select(Project).where(Project.workspace_id == member.workspace_id, Project.id.in_(allowed_ids))
            if search:
                query = query.where(Project.name.ilike(f"%{search}%"))
            if status:
                query = query.where(Project.status == status)
            total_q = select(func.count()).select_from(query.subquery())
            total = (await self.db.execute(total_q)).scalar()
            offset = (page - 1) * limit
            query = query.offset(offset).limit(limit)
            result = await self.db.execute(query)
            items = list(result.scalars().all())
            return items, {"page": page, "limit": limit, "total": total, "total_pages": (total + limit - 1) // limit if total else 0}
        else:
            return await self.project_repo.list_projects(workspace_id=workspace_id_or_member, search=search, status=status, page=page, limit=limit)

    async def get_project_with_access(self, project_id: UUID, workspace_member):
        project = await self.project_repo.get_by_id(project_id)
        if not project:
            raise NotFoundException(PROJECT_MESSAGES["NOT_FOUND"], code=PROJECT_NOT_FOUND)
        if workspace_member.role in ("owner", "admin"):
            return project
        is_mem = await self.member_repo.is_member(project_id, workspace_member.user_id)
        if not is_mem:
            from app.core.exceptions import ForbiddenException
            from app.constants.messages import COMMON_MESSAGES
            from app.constants.error_codes import PERMISSION_DENIED
            raise ForbiddenException(COMMON_MESSAGES["FORBIDDEN"], code=PERMISSION_DENIED)
        return project

    async def update_project(self, project_id: UUID, **kwargs):
        project = await self.project_repo.update(project_id, **kwargs)
        if not project:
            raise NotFoundException(PROJECT_MESSAGES["NOT_FOUND"], code=PROJECT_NOT_FOUND)
        return project

    async def delete_project(self, project_id: UUID):
        deleted = await self.project_repo.delete(project_id)
        if not deleted:
            raise NotFoundException(PROJECT_MESSAGES["NOT_FOUND"], code=PROJECT_NOT_FOUND)

    async def get_members(self, project_id: UUID):
        return await self.member_repo.get_members(project_id)

    async def add_member(self, project_id: UUID, user_id: UUID, role_id: UUID):
        return await self.member_repo.add_member(project_id, user_id, role_id)

    async def update_member(self, project_id: UUID, user_id: UUID, role_id: UUID):
        return await self.member_repo.update_member(project_id, user_id, role_id)

    async def remove_member(self, project_id: UUID, user_id: UUID):
        return await self.member_repo.remove_member(project_id, user_id)
