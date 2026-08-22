from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.comment_repository import CommentRepository
from app.core.exceptions import NotFoundException, ForbiddenException
from uuid import UUID


class CommentService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.comment_repo = CommentRepository(db)

    async def get_comments(self, task_id: UUID):
        return await self.comment_repo.get_by_task(task_id)

    async def create_comment(self, task_id: UUID, user_id: UUID, content: str, parent_id: UUID = None):
        return await self.comment_repo.create(task_id, user_id, content, parent_id)

    async def update_comment(self, comment_id: UUID, user_id: UUID, content: str):
        comment = await self.comment_repo.get_by_id(comment_id)
        if not comment:
            raise NotFoundException("Comment")
        if comment.user_id != user_id:
            raise ForbiddenException("Can only edit your own comments")
        return await self.comment_repo.update(comment_id, content)

    async def delete_comment(self, comment_id: UUID, user_id: UUID):
        comment = await self.comment_repo.get_by_id(comment_id)
        if not comment:
            raise NotFoundException("Comment")
        if comment.user_id != user_id:
            raise ForbiddenException("Can only delete your own comments")
        return await self.comment_repo.soft_delete(comment_id)
