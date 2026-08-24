from fastapi import Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.database import get_db
from app.core.security import decode_token
from app.core.exceptions import UnauthorizedException, ForbiddenException
from app.constants.messages import AUTH_MESSAGES
from app.constants.error_codes import AUTH_INVALID_TOKEN, AUTH_USER_NOT_FOUND, AUTH_ACCOUNT_INACTIVE
from app.models.user import User

security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db),
) -> User:
    token = credentials.credentials
    payload = decode_token(token)
    if payload is None or payload.get("type") != "access":
        raise UnauthorizedException(
            message=AUTH_MESSAGES["INVALID_TOKEN"],
            code=AUTH_INVALID_TOKEN,
        )
    user_id = payload.get("sub")
    if user_id is None:
        raise UnauthorizedException(
            message=AUTH_MESSAGES["INVALID_TOKEN"],
            code=AUTH_INVALID_TOKEN,
        )
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if user is None:
        raise UnauthorizedException(
            message=AUTH_MESSAGES["USER_NOT_FOUND"],
            code=AUTH_USER_NOT_FOUND,
        )
    return user


async def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    if current_user.status != "active":
        raise ForbiddenException(
            message=AUTH_MESSAGES["ACCOUNT_INACTIVE"],
            code=AUTH_ACCOUNT_INACTIVE,
        )
    return current_user
