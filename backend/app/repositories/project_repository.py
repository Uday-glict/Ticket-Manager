from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.models.project import Project
from app.models.project_status import ProjectStatus
from typing import Optional, List, Tuple, Dict
from uuid import UUID


class ProjectRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, workspace_id: UUID, name: str, description: str = None, manager_id: UUID = None, start_date=None, end_date=None) -> Project:
        project = Project(workspace_id=workspace_id, name=name, description=description, manager_id=manager_id, start_date=start_date, end_date=end_date)
        self.db.add(project)
        await self.db.flush()
        default_statuses = [
            ProjectStatus(project_id=project.id, name="To Do", color="#6B7280", display_order=0),
            ProjectStatus(project_id=project.id, name="In Progress", color="#3B82F6", display_order=1),
            ProjectStatus(project_id=project.id, name="Done", color="#22C55E", display_order=2),
        ]
        for s in default_statuses:
            self.db.add(s)
        await self.db.flush()
        return project

    async def get_by_id(self, project_id: UUID) -> Optional[Project]:
        result = await self.db.execute(select(Project).where(Project.id == project_id))
        return result.scalar_one_or_none()

    async def list_projects(self, workspace_id: UUID, search: str = None, status: str = None, page: int = 1, limit: int = 20) -> Tuple[List[Project], Dict]:
        query = select(Project).where(Project.workspace_id == workspace_id)
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

    async def update(self, project_id: UUID, **kwargs) -> Optional[Project]:
        project = await self.get_by_id(project_id)
        if project:
            for key, value in kwargs.items():
                if value is not None:
                    setattr(project, key, value)
            await self.db.flush()
        return project

    async def delete(self, project_id: UUID) -> bool:
        project = await self.get_by_id(project_id)
        if project:
            await self.db.delete(project)
            await self.db.flush()
            return True
        return False
