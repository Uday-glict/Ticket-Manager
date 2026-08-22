from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.repositories.user_repository import UserRepository
from app.core.exceptions import NotFoundException, ConflictException
from app.utils.pagination import paginate
from typing import Optional
from uuid import UUID


class UserService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.user_repo = UserRepository(db)

    async def list_users(self, search: str = None, status: str = None, page: int = 1, limit: int = 20):
        query = select(self.user_repo.db.bind.url.dialect.name)  # placeholder
        from app.models.user import User
        query = select(User)
        if search:
            query = query.where(User.name.ilike(f"%{search}%"))
        if status:
            query = query.where(User.status == status)
        return await paginate(self.db, query, page, limit)

    async def get_user(self, user_id: UUID):
        user = await self.user_repo.get_by_id(user_id)
        if not user:
            raise NotFoundException("User")
        return user

    async def update_user(self, user_id: UUID, **kwargs):
        user = await self.user_repo.get_by_id(user_id)
        if not user:
            raise NotFoundException("User")
        for key, value in kwargs.items():
            if value is not None:
                setattr(user, key, value)
        await self.db.flush()
        return user

    async def toggle_status(self, user_id: UUID, status: str):
        user = await self.user_repo.get_by_id(user_id)
        if not user:
            raise NotFoundException("User")
        user.status = status
        await self.db.flush()
        return user
