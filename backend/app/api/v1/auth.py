from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.database import get_db
from app.schemas.auth import SignupRequest, LoginRequest, RefreshRequest
from app.services.auth_service import AuthService
from app.dependencies.auth import get_current_active_user
from app.models.user import User
from app.utils.response import success_response
from app.constants.messages import AUTH_MESSAGES, COMMON_MESSAGES

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/signup", status_code=status.HTTP_201_CREATED)
async def signup(request: SignupRequest, db: AsyncSession = Depends(get_db)):
    service = AuthService(db)
    result = await service.signup(
        email=request.email,
        password=request.password,
        name=request.name,
        workspace_name=request.workspace_name,
        workspace_type=request.workspace_type,
    )
    return success_response(data=result, message=AUTH_MESSAGES["SIGNUP_SUCCESS"])


@router.post("/login")
async def login(request: LoginRequest, db: AsyncSession = Depends(get_db)):
    service = AuthService(db)
    result = await service.login(email=request.email, password=request.password)
    return success_response(data=result, message=AUTH_MESSAGES["LOGIN_SUCCESS"])


@router.post("/refresh")
async def refresh(request: RefreshRequest, db: AsyncSession = Depends(get_db)):
    service = AuthService(db)
    result = await service.refresh(refresh_token_str=request.refresh_token)
    return success_response(data=result, message=AUTH_MESSAGES["REFRESH_SUCCESS"])


@router.post("/logout")
async def logout(
    request: RefreshRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    service = AuthService(db)
    await service.logout(user_id=current_user.id, refresh_token_str=request.refresh_token)
    return success_response(message=AUTH_MESSAGES["LOGOUT_SUCCESS"])


@router.get("/me")
async def me(current_user: User = Depends(get_current_active_user), db: AsyncSession = Depends(get_db)):
    service = AuthService(db)
    data = await service.get_me(current_user.id)
    return success_response(data=data, message=COMMON_MESSAGES["SUCCESS"])
