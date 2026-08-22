from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.task_comment import TaskComment
from typing import Optional, List
from uuid import UUID


class CommentRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_task(self, task_id: UUID) -> List[TaskComment]:
        result = await self.db.execute(select(TaskComment).where(TaskComment.task_id == task_id, TaskComment.is_deleted == False).order_by(TaskComment.created_at))
        return list(result.scalars().all())

    async def get_by_id(self, comment_id: UUID) -> Optional[TaskComment]:
        result = await self.db.execute(select(TaskComment).where(TaskComment.id == comment_id))
        return result.scalar_one_or_none()

    async def create(self, task_id: UUID, user_id: UUID, content: str, parent_id: UUID = None) -> TaskComment:
        comment = TaskComment(task_id=task_id, user_id=user_id, content=content, parent_id=parent_id)
        self.db.add(comment)
        await self.db.flush()
        return comment

    async def update(self, comment_id: UUID, content: str) -> Optional[TaskComment]:
        comment = await self.get_by_id(comment_id)
        if comment:
            comment.content = content
            await self.db.flush()
        return comment

    async def soft_delete(self, comment_id: UUID) -> bool:
        comment = await self.get_by_id(comment_id)
        if comment:
            comment.is_deleted = True
            comment.content = "[deleted]"
            await self.db.flush()
            return True
        return False
