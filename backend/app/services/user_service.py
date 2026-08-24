from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from app.repositories.user_repository import UserRepository
from app.core.exceptions import NotFoundException, ConflictException, DatabaseException, ForbiddenException, ValidationException
from app.core.security import hash_password
from app.utils.pagination import paginate
from app.constants.messages import USER_MESSAGES
from app.constants.error_codes import USER_NOT_FOUND, USER_EMAIL_ALREADY_EXISTS, USER_CREATE_FAILED, USER_UPDATE_FAILED, USER_DELETE_FAILED, USER_AVATAR_INVALID_TYPE, USER_AVATAR_TOO_LARGE, USER_AVATAR_INVALID_FILE, USER_AVATAR_UPLOAD_FAILED, USER_AVATAR_NOT_FOUND, USER_AVATAR_REMOVE_FAILED
from app.models.user import User
from app.models.workspace_member import WorkspaceMember
from app.models.role import Role
from typing import Optional
from uuid import UUID
from fastapi import UploadFile
import logging

logger = logging.getLogger(__name__)


class UserService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.user_repo = UserRepository(db)

    async def list_users(self, search: str = None, status: str = None, page: int = 1, limit: int = 20):
        logger.info("Listing users | search=%s | status=%s | page=%s | limit=%s", search, status, page, limit)
        if page < 1:
            page = 1
        if limit < 1:
            limit = 20
        if limit > 100:
            limit = 100
        if status and status not in ("active", "inactive"):
            from app.core.exceptions import ValidationException
            raise ValidationException("Invalid status value")
        try:
            logger.debug("Building user query")
            query = select(User)
            if search:
                safe_search = search.strip()
                if safe_search:
                    logger.debug("Applying search filter")
                    query = query.where(User.name.ilike(f"%{safe_search}%"))
            if status:
                logger.debug("Applying status filter")
                query = query.where(User.status == status)
            query = query.order_by(User.name)
            logger.debug("Executing user query")
            result = await paginate(self.db, query, page, limit)
            logger.info("User list completed | count=%s | total=%s", len(result["items"]), result["pagination"]["total"])
            return result
        except ValidationException:
            raise
        except SQLAlchemyError:
            logger.exception("Database error while listing users")
            raise DatabaseException(USER_MESSAGES["NOT_FOUND"], code=USER_NOT_FOUND)
        except Exception:
            logger.exception("Unexpected error while listing users")
            raise

    async def get_user(self, user_id: UUID):
        try:
            user = await self.user_repo.get_by_id(user_id)
            if not user:
                raise NotFoundException(USER_MESSAGES["NOT_FOUND"], code=USER_NOT_FOUND)
            return user
        except NotFoundException:
            raise
        except SQLAlchemyError:
            logger.exception("Database error while getting user | id=%s", user_id)
            raise DatabaseException(code=USER_NOT_FOUND)
        except Exception:
            logger.exception("Unexpected error while getting user | id=%s", user_id)
            raise

    async def create_user(self, email: str, password: str, name: str, workspace_id: Optional[UUID] = None, avatar: Optional[str] = None):
        logger.info("Creating user | email=%s | workspace=%s", email, workspace_id)
        normalized_email = email.strip().lower()
        trimmed_name = name.strip()
        if not trimmed_name:
            from app.core.exceptions import ValidationException
            raise ValidationException("Name is required")
        try:
            existing = await self.user_repo.get_by_email(normalized_email)
            if existing:
                raise ConflictException(USER_MESSAGES["EMAIL_ALREADY_EXISTS"], code=USER_EMAIL_ALREADY_EXISTS)
            password_hash = hash_password(password)
            user = await self.user_repo.create(email=normalized_email, name=trimmed_name, password_hash=password_hash, avatar=avatar)
            await self.db.flush()
            if workspace_id:
                from app.models.workspace_member import WorkspaceMember
                member = WorkspaceMember(workspace_id=workspace_id, user_id=user.id, role="member")
                self.db.add(member)
                await self.db.flush()
                logger.info("Workspace membership created | user_id=%s | workspace=%s", user.id, workspace_id)
            logger.info("User created successfully | id=%s | email=%s", user.id, normalized_email)
            return user
        except (ConflictException, NotFoundException):
            raise
        except IntegrityError:
            await self.db.rollback()
            logger.exception("Integrity error while creating user | email=%s", normalized_email)
            raise ConflictException(USER_MESSAGES["EMAIL_ALREADY_EXISTS"], code=USER_EMAIL_ALREADY_EXISTS)
        except SQLAlchemyError:
            await self.db.rollback()
            logger.exception("Database error while creating user | email=%s", normalized_email)
            raise DatabaseException(USER_MESSAGES["CREATE_FAILED"], code=USER_CREATE_FAILED)
        except Exception:
            await self.db.rollback()
            logger.exception("Unexpected error while creating user | email=%s", normalized_email)
            raise

    async def update_user(self, user_id: UUID, **kwargs):
        logger.info("Updating user | id=%s | fields=%s", user_id, list(kwargs.keys()))
        try:
            user = await self.user_repo.get_by_id(user_id)
            if not user:
                raise NotFoundException(USER_MESSAGES["NOT_FOUND"], code=USER_NOT_FOUND)
            if "email" in kwargs and kwargs["email"] is not None:
                normalized = kwargs["email"].strip().lower()
                if await self.user_repo.email_exists(normalized, exclude_id=user_id):
                    raise ConflictException(USER_MESSAGES["EMAIL_ALREADY_EXISTS"], code=USER_EMAIL_ALREADY_EXISTS)
                kwargs["email"] = normalized
            if "name" in kwargs and kwargs["name"] is not None:
                trimmed = kwargs["name"].strip()
                if not trimmed:
                    from app.core.exceptions import ValidationException
                    raise ValidationException("Name cannot be empty")
                kwargs["name"] = trimmed
            if "is_superadmin" in kwargs:
                kwargs.pop("is_superadmin", None)
            for key, value in kwargs.items():
                if value is not None:
                    setattr(user, key, value)
            await self.db.flush()
            logger.info("User updated successfully | id=%s", user_id)
            return user
        except (NotFoundException, ConflictException):
            raise
        except IntegrityError:
            await self.db.rollback()
            logger.exception("Integrity error while updating user | id=%s", user_id)
            raise ConflictException(USER_MESSAGES["EMAIL_ALREADY_EXISTS"], code=USER_EMAIL_ALREADY_EXISTS)
        except SQLAlchemyError:
            await self.db.rollback()
            logger.exception("Database error while updating user | id=%s", user_id)
            raise DatabaseException(USER_MESSAGES["UPDATE_FAILED"], code=USER_UPDATE_FAILED)
        except Exception:
            await self.db.rollback()
            logger.exception("Unexpected error while updating user | id=%s", user_id)
            raise

    async def toggle_status(self, user_id: UUID, status: str):
        logger.info("Toggling user status | id=%s | status=%s", user_id, status)
        if status not in ("active", "inactive"):
            from app.core.exceptions import ValidationException
            raise ValidationException("Invalid status value")
        try:
            user = await self.user_repo.get_by_id(user_id)
            if not user:
                raise NotFoundException(USER_MESSAGES["NOT_FOUND"], code=USER_NOT_FOUND)
            user.status = status
            await self.db.flush()
            logger.info("User status updated | id=%s | status=%s", user_id, status)
            return user
        except NotFoundException:
            raise
        except SQLAlchemyError:
            await self.db.rollback()
            logger.exception("Database error while toggling status | id=%s", user_id)
            raise DatabaseException(USER_MESSAGES["UPDATE_FAILED"], code=USER_UPDATE_FAILED)
        except Exception:
            await self.db.rollback()
            logger.exception("Unexpected error while toggling status | id=%s", user_id)
            raise

    async def delete_user(self, user_id: UUID):
        logger.info("Deleting user | id=%s", user_id)
        try:
            user = await self.user_repo.get_by_id(user_id)
            if not user:
                raise NotFoundException(USER_MESSAGES["NOT_FOUND"], code=USER_NOT_FOUND)
            await self.db.delete(user)
            await self.db.flush()
            logger.info("User deleted successfully | id=%s", user_id)
            return True
        except NotFoundException:
            raise
        except IntegrityError:
            await self.db.rollback()
            logger.exception("Foreign key conflict while deleting user | id=%s", user_id)
            raise DatabaseException(USER_MESSAGES["DELETE_FAILED"], code=USER_DELETE_FAILED)
        except SQLAlchemyError:
            await self.db.rollback()
            logger.exception("Database error while deleting user | id=%s", user_id)
            raise DatabaseException(USER_MESSAGES["DELETE_FAILED"], code=USER_DELETE_FAILED)
        except Exception:
            await self.db.rollback()
            logger.exception("Unexpected error while deleting user | id=%s", user_id)
            raise

    async def _check_avatar_permission(self, target_user_id: UUID, current_user: User):
        if current_user.id == target_user_id:
            return
        if current_user.is_superadmin:
            return
        result = await self.db.execute(select(WorkspaceMember).where(WorkspaceMember.user_id == current_user.id))
        current_member = result.scalar_one_or_none()
        if not current_member:
            from app.core.exceptions import ForbiddenException
            from app.constants.messages import COMMON_MESSAGES
            from app.constants.error_codes import PERMISSION_DENIED
            raise ForbiddenException(COMMON_MESSAGES["FORBIDDEN"], code=PERMISSION_DENIED)
        result = await self.db.execute(select(WorkspaceMember).where(WorkspaceMember.user_id == target_user_id))
        target_member = result.scalar_one_or_none()
        if not target_member or target_member.workspace_id != current_member.workspace_id:
            from app.core.exceptions import ForbiddenException
            from app.constants.messages import COMMON_MESSAGES
            from app.constants.error_codes import PERMISSION_DENIED
            raise ForbiddenException(COMMON_MESSAGES["FORBIDDEN"], code=PERMISSION_DENIED)
        if current_member.role in ("owner", "admin"):
            return
        result = await self.db.execute(select(Role).join(Role.permissions).where(Role.workspace_id == current_member.workspace_id))
        for role in result.scalars().all():
            for perm in role.permissions:
                if perm.name == "users.manage":
                    return
        from app.core.exceptions import ForbiddenException
        from app.constants.messages import COMMON_MESSAGES
        from app.constants.error_codes import PERMISSION_DENIED
        raise ForbiddenException(COMMON_MESSAGES["FORBIDDEN"], code=PERMISSION_DENIED)

    async def update_avatar(self, user_id: UUID, file: UploadFile, current_user: User):
        logger.info("Avatar upload requested | user_id=%s | current_user=%s", user_id, current_user.id)
        await self._check_avatar_permission(user_id, current_user)
        user = await self.user_repo.get_by_id(user_id)
        if not user:
            raise NotFoundException(USER_MESSAGES["NOT_FOUND"], code=USER_NOT_FOUND)
        old_avatar = user.avatar
        new_avatar_url = None
        try:
            from app.utils.storage import validate_avatar_file, save_avatar, delete_avatar_file
            from app.core.exceptions import ForbiddenException, ValidationException
            try:
                data, ext = validate_avatar_file(file)
            except ValidationException:
                raise
            except ValueError as ve:
                msg = str(ve)
                if "exceeds" in msg.lower():
                    raise ValidationException(USER_MESSAGES["AVATAR_TOO_LARGE"], code=USER_AVATAR_TOO_LARGE)
                elif "allowed" in msg.lower() or "unsupported" in msg.lower():
                    raise ValidationException(USER_MESSAGES["AVATAR_INVALID_TYPE"], code=USER_AVATAR_INVALID_TYPE)
                elif "empty" in msg.lower():
                    raise ValidationException(USER_MESSAGES["AVATAR_INVALID_TYPE"], code=USER_AVATAR_INVALID_FILE)
                else:
                    raise ValidationException(USER_MESSAGES["AVATAR_INVALID_TYPE"], code=USER_AVATAR_INVALID_FILE)
            except Exception as e:
                logger.exception("Validation error during avatar upload | user_id=%s", user_id)
                raise ValidationException(USER_MESSAGES["AVATAR_INVALID_TYPE"], code=USER_AVATAR_INVALID_FILE)
            try:
                new_avatar_url = save_avatar(file, str(user_id), ext, data)
            except Exception:
                logger.exception("Storage failure during avatar upload | user_id=%s", user_id)
                raise DatabaseException(USER_MESSAGES["AVATAR_UPLOAD_FAILED"], code=USER_AVATAR_UPLOAD_FAILED)
            user.avatar = new_avatar_url
            await self.db.flush()
            logger.info("Avatar uploaded successfully | user_id=%s | url=%s", user_id, new_avatar_url)
            if old_avatar:
                try:
                    delete_avatar_file(old_avatar)
                except Exception:
                    logger.exception("Failed to cleanup old avatar | user_id=%s", user_id)
            return {"user_id": str(user.id), "avatar_url": new_avatar_url, "avatar": new_avatar_url}
        except (NotFoundException, ValidationException, ForbiddenException):
            if new_avatar_url:
                try:
                    from app.utils.storage import delete_avatar_file
                    delete_avatar_file(new_avatar_url)
                except Exception:
                    pass
            raise
        except DatabaseException:
            if new_avatar_url:
                try:
                    from app.utils.storage import delete_avatar_file
                    delete_avatar_file(new_avatar_url)
                except Exception:
                    pass
            raise
        except Exception:
            if new_avatar_url:
                try:
                    from app.utils.storage import delete_avatar_file
                    delete_avatar_file(new_avatar_url)
                except Exception:
                    pass
            logger.exception("Unexpected error during avatar upload | user_id=%s", user_id)
            raise DatabaseException(USER_MESSAGES["AVATAR_UPLOAD_FAILED"], code=USER_AVATAR_UPLOAD_FAILED)

    async def remove_avatar(self, user_id: UUID, current_user: User):
        logger.info("Avatar remove requested | user_id=%s | current_user=%s", user_id, current_user.id)
        await self._check_avatar_permission(user_id, current_user)
        user = await self.user_repo.get_by_id(user_id)
        if not user:
            raise NotFoundException(USER_MESSAGES["NOT_FOUND"], code=USER_NOT_FOUND)
        if not user.avatar:
            raise NotFoundException(USER_MESSAGES["AVATAR_NOT_FOUND"], code=USER_AVATAR_NOT_FOUND)
        old_avatar = user.avatar
        try:
            user.avatar = None
            await self.db.flush()
            from app.utils.storage import delete_avatar_file
            delete_avatar_file(old_avatar)
            logger.info("Avatar removed successfully | user_id=%s", user_id)
            return {"user_id": str(user.id), "avatar_url": None}
        except (NotFoundException, ForbiddenException):
            raise
        except SQLAlchemyError:
            await self.db.rollback()
            logger.exception("Database error while removing avatar | user_id=%s", user_id)
            raise DatabaseException(USER_MESSAGES["AVATAR_REMOVE_FAILED"], code=USER_AVATAR_REMOVE_FAILED)
        except Exception:
            await self.db.rollback()
            logger.exception("Unexpected error while removing avatar | user_id=%s", user_id)
            raise DatabaseException(USER_MESSAGES["AVATAR_REMOVE_FAILED"], code=USER_AVATAR_REMOVE_FAILED)
