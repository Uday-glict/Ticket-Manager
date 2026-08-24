from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.user import User
from typing import Optional
from uuid import UUID


class UserRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_email(self, email: str) -> Optional[User]:
        result = await self.db.execute(select(User).where(User.email == email.strip().lower()))
        return result.scalar_one_or_none()

    async def get_by_id(self, user_id: UUID) -> Optional[User]:
        result = await self.db.execute(select(User).where(User.id == user_id))
        return result.scalar_one_or_none()

    async def create(self, email: str, name: str, password_hash: str, avatar: Optional[str] = None) -> User:
        user = User(email=email.strip().lower(), name=name.strip(), password_hash=password_hash, avatar=avatar)
        self.db.add(user)
        await self.db.flush()
        return user

    async def email_exists(self, email: str, exclude_id: Optional[UUID] = None) -> bool:
        query = select(User).where(User.email == email.strip().lower())
        if exclude_id:
            query = query.where(User.id != exclude_id)
        result = await self.db.execute(query)
        return result.scalar_one_or_none() is not None
