from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.models.task import Task
from typing import Optional, List, Tuple, Dict
from uuid import UUID


class TaskRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, project_id: UUID, title: str, created_by: UUID, description: str = None, assigned_to: UUID = None, priority: str = "medium", status_id: UUID = None, start_date=None, due_date=None) -> Task:
        task = Task(project_id=project_id, title=title, created_by=created_by, description=description, assigned_to=assigned_to, priority=priority, status_id=status_id, start_date=start_date, due_date=due_date)
        self.db.add(task)
        await self.db.flush()
        return task

    async def get_by_id(self, task_id: UUID) -> Optional[Task]:
        result = await self.db.execute(select(Task).where(Task.id == task_id))
        return result.scalar_one_or_none()

    async def list_tasks(self, project_id: UUID = None, assigned_to: UUID = None, priority: str = None, status_id: UUID = None, page: int = 1, limit: int = 20) -> Tuple[List[Task], Dict]:
        query = select(Task)
        if project_id:
            query = query.where(Task.project_id == project_id)
        if assigned_to:
            query = query.where(Task.assigned_to == assigned_to)
        if priority:
            query = query.where(Task.priority == priority)
        if status_id:
            query = query.where(Task.status_id == status_id)
        total_q = select(func.count()).select_from(query.subquery())
        total = (await self.db.execute(total_q)).scalar()
        offset = (page - 1) * limit
        query = query.offset(offset).limit(limit)
        result = await self.db.execute(query)
        items = list(result.scalars().all())
        return items, {"page": page, "limit": limit, "total": total, "total_pages": (total + limit - 1) // limit if total else 0}

    async def update(self, task_id: UUID, **kwargs) -> Optional[Task]:
        task = await self.get_by_id(task_id)
        if task:
            for key, value in kwargs.items():
                if value is not None:
                    setattr(task, key, value)
            await self.db.flush()
        return task
