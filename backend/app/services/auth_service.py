from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.repositories.user_repository import UserRepository
from app.repositories.workspace_repository import WorkspaceRepository
from app.repositories.role_repository import RoleRepository
from app.core.security import hash_password, verify_password, create_access_token, create_refresh_token, decode_token, hash_token
from app.core.exceptions import ConflictException, UnauthorizedException, NotFoundException
from app.constants.permissions import Permissions
from app.models.refresh_token import RefreshToken
from app.models.user import User
from app.utils.datetime import utcnow
from datetime import timedelta, timezone
from typing import Optional
from uuid import UUID


class AuthService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.user_repo = UserRepository(db)
        self.workspace_repo = WorkspaceRepository(db)
        self.role_repo = RoleRepository(db)

    async def signup(self, email: str, password: str, name: str, workspace_name: Optional[str] = None, workspace_type: str = "individual") -> dict:
        existing = await self.user_repo.get_by_email(email)
        if existing:
            raise ConflictException("Email already registered")

        user = await self.user_repo.create(email=email, name=name, password_hash=hash_password(password))
        ws_name = workspace_name or f"{name}'s Workspace"
        workspace = await self.workspace_repo.create(name=ws_name, workspace_type=workspace_type, owner_id=user.id)
        await self.workspace_repo.add_member(workspace_id=workspace.id, user_id=user.id, role="owner")
        admin_role = await self.role_repo.create(workspace_id=workspace.id, name="Admin", description="Full access", is_system=True)
        await self.role_repo.add_permissions(admin_role, Permissions.ALL)

        access_token = create_access_token(data={"sub": str(user.id)})
        refresh_token = create_refresh_token(data={"sub": str(user.id)})
        await self._save_refresh_token(user.id, refresh_token)

        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "user": {
                "id": user.id,
                "email": user.email,
                "name": user.name,
                "avatar": user.avatar,
                "status": user.status,
                "is_superadmin": user.is_superadmin,
            },
        }

    async def login(self, email: str, password: str) -> dict:
        user = await self.user_repo.get_by_email(email)
        if not user or not verify_password(password, user.password_hash):
            raise UnauthorizedException("Invalid email or password")

        user.last_login_at = utcnow()
        await self.db.flush()

        access_token = create_access_token(data={"sub": str(user.id)})
        refresh_token = create_refresh_token(data={"sub": str(user.id)})
        await self._save_refresh_token(user.id, refresh_token)

        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "user": {
                "id": user.id,
                "email": user.email,
                "name": user.name,
                "avatar": user.avatar,
                "status": user.status,
                "is_superadmin": user.is_superadmin,
            },
        }

    async def refresh(self, refresh_token_str: str) -> dict:
        payload = decode_token(refresh_token_str)
        if payload is None or payload.get("type") != "refresh":
            raise UnauthorizedException("Invalid refresh token")

        user_id = payload.get("sub")
        token_hash = hash_token(refresh_token_str)

        result = await self.db.execute(
            select(RefreshToken).where(
                RefreshToken.user_id == UUID(user_id),
                RefreshToken.token_hash == token_hash,
                RefreshToken.revoked_at.is_(None),
            )
        )
        db_token = result.scalar_one_or_none()
        if not db_token:
            raise UnauthorizedException("Refresh token not found or revoked")

        if db_token.expires_at < utcnow():
            raise UnauthorizedException("Refresh token expired")

        db_token.revoked_at = utcnow()
        await self.db.flush()

        new_access = create_access_token(data={"sub": user_id})
        new_refresh = create_refresh_token(data={"sub": user_id})
        await self._save_refresh_token(UUID(user_id), new_refresh)

        user = await self.user_repo.get_by_id(UUID(user_id))
        return {
            "access_token": new_access,
            "refresh_token": new_refresh,
            "token_type": "bearer",
            "user": {
                "id": user.id,
                "email": user.email,
                "name": user.name,
                "avatar": user.avatar,
                "status": user.status,
                "is_superadmin": user.is_superadmin,
            },
        }

    async def logout(self, user_id: UUID, refresh_token_str: str) -> None:
        token_hash = hash_token(refresh_token_str)
        result = await self.db.execute(
            select(RefreshToken).where(
                RefreshToken.user_id == user_id,
                RefreshToken.token_hash == token_hash,
            )
        )
        db_token = result.scalar_one_or_none()
        if db_token:
            db_token.revoked_at = utcnow()
            await self.db.flush()

    async def get_me(self, user_id: UUID) -> dict:
        user = await self.user_repo.get_by_id(user_id)
        if not user:
            raise NotFoundException("User")
        return {
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "avatar": user.avatar,
            "status": user.status,
            "is_superadmin": user.is_superadmin,
        }

    async def _save_refresh_token(self, user_id: UUID, refresh_token_str: str) -> None:
        from app.core.config import settings
        token_hash = hash_token(refresh_token_str)
        expires_at = utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
        db_token = RefreshToken(user_id=user_id, token_hash=token_hash, expires_at=expires_at)
        self.db.add(db_token)
        await self.db.flush()
