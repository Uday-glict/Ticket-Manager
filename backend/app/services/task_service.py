from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.task_repository import TaskRepository
from app.repositories.task_assignment_repository import TaskAssignmentRepository
from app.core.exceptions import NotFoundException
from uuid import UUID


class TaskService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.task_repo = TaskRepository(db)
        self.assignment_repo = TaskAssignmentRepository(db)

    async def create_task(self, project_id: UUID, title: str, created_by: UUID, **kwargs):
        return await self.task_repo.create(project_id=project_id, title=title, created_by=created_by, **kwargs)

    async def get_task(self, task_id: UUID):
        task = await self.task_repo.get_by_id(task_id)
        if not task:
            raise NotFoundException("Task")
        return task

    async def list_tasks(self, project_id: UUID = None, assigned_to: UUID = None, priority: str = None, status_id: UUID = None, page: int = 1, limit: int = 20):
        return await self.task_repo.list_tasks(project_id=project_id, assigned_to=assigned_to, priority=priority, status_id=status_id, page=page, limit=limit)

    async def update_task(self, task_id: UUID, **kwargs):
        task = await self.task_repo.update(task_id, **kwargs)
        if not task:
            raise NotFoundException("Task")
        return task

    async def assign_task(self, task_id: UUID, user_id: UUID, assigned_by: UUID, reason: str = None):
        await self.assignment_repo.close_assignment(task_id)
        assignment = await self.assignment_repo.create(task_id, user_id, assigned_by, reason)
        await self.task_repo.update(task_id, assigned_to=user_id)
        return assignment

    async def reassign_task(self, task_id: UUID, user_id: UUID, assigned_by: UUID, reason: str = None):
        await self.assignment_repo.close_assignment(task_id)
        assignment = await self.assignment_repo.create(task_id, user_id, assigned_by, reason)
        await self.task_repo.update(task_id, assigned_to=user_id)
        return assignment

    async def get_assignment_history(self, task_id: UUID):
        return await self.assignment_repo.get_history(task_id)
