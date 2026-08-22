from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.database import get_db
from app.schemas.auth import SignupRequest, LoginRequest, RefreshRequest, AuthResponse
from app.services.auth_service import AuthService
from app.dependencies.auth import get_current_active_user
from app.models.user import User

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/signup", response_model=AuthResponse)
async def signup(request: SignupRequest, db: AsyncSession = Depends(get_db)):
    service = AuthService(db)
    result = await service.signup(
        email=request.email,
        password=request.password,
        name=request.name,
        workspace_name=request.workspace_name,
        workspace_type=request.workspace_type,
    )
    return result


@router.post("/login", response_model=AuthResponse)
async def login(request: LoginRequest, db: AsyncSession = Depends(get_db)):
    service = AuthService(db)
    result = await service.login(email=request.email, password=request.password)
    return result


@router.post("/refresh", response_model=AuthResponse)
async def refresh(request: RefreshRequest, db: AsyncSession = Depends(get_db)):
    service = AuthService(db)
    result = await service.refresh(refresh_token_str=request.refresh_token)
    return result


@router.post("/logout")
async def logout(
    request: RefreshRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    service = AuthService(db)
    await service.logout(user_id=current_user.id, refresh_token_str=request.refresh_token)
    return {"success": True, "message": "Logged out"}


@router.get("/me")
async def me(current_user: User = Depends(get_current_active_user)):
    service = AuthService(current_user._session if hasattr(current_user, '_session') else None)
    return {
        "id": current_user.id,
        "email": current_user.email,
        "name": current_user.name,
        "avatar": current_user.avatar,
        "status": current_user.status,
        "is_superadmin": current_user.is_superadmin,
    }
