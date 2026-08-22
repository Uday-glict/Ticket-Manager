from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.task_assignment import TaskAssignment
from typing import Optional, List
from uuid import UUID
from datetime import datetime, timezone


class TaskAssignmentRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, task_id: UUID, user_id: UUID, assigned_by: UUID, reason: str = None) -> TaskAssignment:
        assignment = TaskAssignment(task_id=task_id, user_id=user_id, assigned_by=assigned_by, assigned_at=datetime.now(timezone.utc), reason=reason)
        self.db.add(assignment)
        await self.db.flush()
        return assignment

    async def get_active_assignment(self, task_id: UUID) -> Optional[TaskAssignment]:
        result = await self.db.execute(select(TaskAssignment).where(TaskAssignment.task_id == task_id, TaskAssignment.unassigned_at.is_(None)))
        return result.scalar_one_or_none()

    async def close_assignment(self, task_id: UUID) -> None:
        assignment = await self.get_active_assignment(task_id)
        if assignment:
            assignment.unassigned_at = datetime.now(timezone.utc)
            await self.db.flush()

    async def get_history(self, task_id: UUID) -> List[TaskAssignment]:
        result = await self.db.execute(select(TaskAssignment).where(TaskAssignment.task_id == task_id).order_by(TaskAssignment.assigned_at.desc()))
        return list(result.scalars().all())
