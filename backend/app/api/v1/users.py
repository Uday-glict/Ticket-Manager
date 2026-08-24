from fastapi import APIRouter, Depends, Query, status, Request, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.database import get_db
from app.schemas.user import UserCreateRequest, UserUpdateRequest, UserStatusUpdate
from app.services.user_service import UserService
from app.dependencies.permissions import require_permission
from app.dependencies.auth import get_current_active_user
from app.models.workspace_member import WorkspaceMember
from app.models.user import User
from app.utils.response import success_response, paginated_response
from app.constants.messages import USER_MESSAGES
from app.core.exceptions import ValidationException
from app.constants.error_codes import VALIDATION_ERROR
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/users", tags=["users"])


@router.get("")
async def list_users(
    search: str = Query(None, max_length=100),
    status: str = Query(None, pattern="^(active|inactive)$"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    workspace_member: WorkspaceMember = Depends(require_permission("users.manage")),
    db: AsyncSession = Depends(get_db),
):
    service = UserService(db)
    result = await service.list_users(search=search, status=status, page=page, limit=limit)
    data = [
        {
            "id": str(u.id),
            "email": u.email,
            "name": u.name,
            "avatar": u.avatar,
            "status": u.status,
            "is_superadmin": u.is_superadmin,
        }
        for u in result["items"]
    ]
    return paginated_response(data=data, pagination=result["pagination"], message=USER_MESSAGES["LIST_SUCCESS"])


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_user(
    request: Request,
    workspace_member: WorkspaceMember = Depends(require_permission("users.manage")),
    db: AsyncSession = Depends(get_db),
):
    content_type = request.headers.get("content-type", "")
    avatar_url = None
    temp_avatar_path = None
    service = UserService(db)

    if "multipart/form-data" in content_type:
        form = await request.form()
        email = form.get("email")
        password = form.get("password")
        name = form.get("name")
        avatar_file = form.get("avatar")
        # avatar could be string 'null' or UploadFile
        if avatar_file and hasattr(avatar_file, "filename"):
            if avatar_file.filename:
                try:
                    from app.utils.storage import validate_avatar_file, save_avatar
                    import uuid
                    # need user_id for path, generate temp uuid then rename after user creation? Instead save after user creation with user_id
                    # For create, we don't have user_id yet, so save to temp then move after creation, or save with generated uuid and use that path
                    # Simplify: validate now, save after user creation using user.id
                    temp_data, temp_ext = validate_avatar_file(avatar_file)
                    # store temp for later save
                    temp_avatar_path = (temp_data, temp_ext, avatar_file)
                except ValidationException:
                    raise
                except ValueError as ve:
                    raise ValidationException(str(ve), code=VALIDATION_ERROR)
                except Exception:
                    logger.exception("Avatar validation failed during user creation")
                    raise ValidationException(USER_MESSAGES["AVATAR_INVALID_TYPE"], code=VALIDATION_ERROR)
            else:
                avatar_file = None
        else:
            avatar_file = None
        if not email or not password or not name:
            raise ValidationException("Email, password and name are required")
        email = str(email).strip()
        name = str(name).strip()
        password = str(password).strip()
        if "@" not in email:
            raise ValidationException("Invalid email format")
        if len(password) < 8:
            raise ValidationException("Password must be at least 8 characters")
        if len(name) < 1 or len(name) > 255:
            raise ValidationException("Name must be 1-255 characters")
    else:
        try:
            body = await request.json()
        except Exception:
            raise ValidationException("Invalid request body")
        try:
            req = UserCreateRequest(**body)
        except Exception as e:
            raise ValidationException(str(e))
        email = req.email
        password = req.password
        name = req.name
        avatar_url = req.avatar
        avatar_file = None

    # handle avatar file save for multipart case
    if temp_avatar_path:
        temp_data, temp_ext, orig_file = temp_avatar_path
        try:
            user = await service.create_user(email=email, password=password, name=name, workspace_id=workspace_member.workspace_id, avatar=None)
        except Exception:
            raise
        try:
            from app.utils.storage import save_avatar
            avatar_url = save_avatar(orig_file, str(user.id), temp_ext, temp_data)
            user.avatar = avatar_url
            await db.flush()
            logger.info("Avatar saved for new user | user_id=%s | url=%s", user.id, avatar_url)
        except Exception:
            logger.exception("Failed to save avatar for new user | user_id=%s", user.id)
            pass
        return success_response(
            data={"id": str(user.id), "email": user.email, "name": user.name, "avatar": user.avatar, "status": user.status, "is_superadmin": user.is_superadmin},
            message=USER_MESSAGES["CREATE_SUCCESS"],
        )
    else:
        user = await service.create_user(email=email, password=password, name=name, workspace_id=workspace_member.workspace_id, avatar=avatar_url)
        return success_response(
            data={"id": str(user.id), "email": user.email, "name": user.name, "avatar": user.avatar, "status": user.status, "is_superadmin": user.is_superadmin},
            message=USER_MESSAGES["CREATE_SUCCESS"],
        )


@router.get("/{user_id}")
async def get_user(user_id: str, workspace_member: WorkspaceMember = Depends(require_permission("users.manage")), db: AsyncSession = Depends(get_db)):
    from uuid import UUID
    service = UserService(db)
    user = await service.get_user(UUID(user_id))
    return success_response(
        data={"id": str(user.id), "email": user.email, "name": user.name, "avatar": user.avatar, "status": user.status, "is_superadmin": user.is_superadmin},
        message=USER_MESSAGES["GET_SUCCESS"],
    )


@router.put("/{user_id}")
async def update_user(user_id: str, request: UserUpdateRequest, workspace_member: WorkspaceMember = Depends(require_permission("users.manage")), db: AsyncSession = Depends(get_db)):
    from uuid import UUID
    service = UserService(db)
    user = await service.update_user(UUID(user_id), **request.model_dump(exclude_unset=True))
    return success_response(
        data={"id": str(user.id), "email": user.email, "name": user.name, "avatar": user.avatar, "status": user.status},
        message=USER_MESSAGES["UPDATED"],
    )


@router.patch("/{user_id}/status")
async def toggle_status(user_id: str, request: UserStatusUpdate, workspace_member: WorkspaceMember = Depends(require_permission("users.manage")), db: AsyncSession = Depends(get_db)):
    from uuid import UUID
    service = UserService(db)
    user = await service.toggle_status(UUID(user_id), request.status)
    return success_response(data={"id": str(user.id), "status": user.status}, message=USER_MESSAGES["STATUS_UPDATED"])


@router.delete("/{user_id}")
async def delete_user(user_id: str, workspace_member: WorkspaceMember = Depends(require_permission("users.manage")), db: AsyncSession = Depends(get_db)):
    from uuid import UUID
    service = UserService(db)
    await service.delete_user(UUID(user_id))
    return success_response(message=USER_MESSAGES["DELETE_SUCCESS"])


@router.patch("/{user_id}/avatar")
async def update_avatar(
    user_id: str,
    request: Request,
    file: UploadFile = File(None),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    from uuid import UUID
    if not file or not getattr(file, "filename", None):
        form = await request.form()
        file = form.get("file") or form.get("avatar") or form.get("image")
    if not file or not hasattr(file, "filename") or not file.filename:
        raise ValidationException("Avatar file is required", code=VALIDATION_ERROR)
    service = UserService(db)
    result = await service.update_avatar(UUID(user_id), file, current_user)
    return success_response(data=result, message=USER_MESSAGES["AVATAR_UPLOAD_SUCCESS"])


@router.delete("/{user_id}/avatar")
async def remove_avatar(
    user_id: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    from uuid import UUID
    service = UserService(db)
    result = await service.remove_avatar(UUID(user_id), current_user)
    return success_response(data=result, message=USER_MESSAGES["AVATAR_REMOVE_SUCCESS"])
