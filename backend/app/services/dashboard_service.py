from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.models.project_status import ProjectStatus
from app.models.task import Task
from app.core.exceptions import NotFoundException
from uuid import UUID


class DashboardService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_summary(self, workspace_id: UUID):
        from app.models.project import Project
        total_projects = (await self.db.execute(select(func.count()).select_from(Project).where(Project.workspace_id == workspace_id))).scalar()
        total_tasks = (await self.db.execute(select(func.count()).select_from(Task))).scalar()

        done_statuses = await self.db.execute(select(ProjectStatus.id).where(ProjectStatus.name.in_(["Done", "Completed", "Closed"])))
        done_ids = [r[0] for r in done_statuses.fetchall()]
        completed_tasks = (await self.db.execute(select(func.count()).select_from(Task).where(Task.status_id.in_(done_ids)))).scalar() if done_ids else 0

        in_progress_statuses = await self.db.execute(select(ProjectStatus.id).where(ProjectStatus.name.in_(["In Progress", "In Review"])))
        in_progress_ids = [r[0] for r in in_progress_statuses.fetchall()]
        in_progress_tasks = (await self.db.execute(select(func.count()).select_from(Task).where(Task.status_id.in_(in_progress_ids)))).scalar() if in_progress_ids else 0

        from datetime import date
        overdue_tasks = (await self.db.execute(select(func.count()).select_from(Task).where(Task.due_date < date.today(), Task.status_id.notin_(done_ids)))).scalar() if done_ids else 0

        return {
            "total_projects": total_projects or 0,
            "total_tasks": total_tasks or 0,
            "completed_tasks": completed_tasks,
            "in_progress_tasks": in_progress_tasks,
            "overdue_tasks": overdue_tasks,
        }

    async def get_project_summaries(self, workspace_id: UUID):
        from app.models.project import Project
        projects = (await self.db.execute(select(Project).where(Project.workspace_id == workspace_id))).scalars().all()
        summaries = []
        for p in projects:
            total = (await self.db.execute(select(func.count()).select_from(Task).where(Task.project_id == p.id))).scalar()
            done_statuses = await self.db.execute(select(ProjectStatus.id).where(ProjectStatus.project_id == p.id, ProjectStatus.name.in_(["Done", "Completed", "Closed"])))
            done_ids = [r[0] for r in done_statuses.fetchall()]
            completed = (await self.db.execute(select(func.count()).select_from(Task).where(Task.project_id == p.id, Task.status_id.in_(done_ids)))).scalar() if done_ids else 0
            in_prog_statuses = await self.db.execute(select(ProjectStatus.id).where(ProjectStatus.project_id == p.id, ProjectStatus.name.in_(["In Progress"])))
            in_prog_ids = [r[0] for r in in_prog_statuses.fetchall()]
            in_progress = (await self.db.execute(select(func.count()).select_from(Task).where(Task.project_id == p.id, Task.status_id.in_(in_prog_ids)))).scalar() if in_prog_ids else 0
            summaries.append({"id": p.id, "name": p.name, "total_tasks": total or 0, "completed_tasks": completed, "in_progress_tasks": in_progress})
        return summaries
