from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.database import get_db
from app.schemas.comment import CommentCreateRequest, CommentUpdateRequest
from app.services.comment_service import CommentService
from app.dependencies.permissions import require_permission
from app.models.workspace_member import WorkspaceMember
from app.utils.response import success_response
from app.constants.messages import COMMENT_MESSAGES
from uuid import UUID

router = APIRouter(prefix="/comments", tags=["comments"])


@router.get("/task/{task_id}")
async def get_comments(task_id: str, workspace_member: WorkspaceMember = Depends(require_permission("tasks.view")), db: AsyncSession = Depends(get_db)):
    service = CommentService(db)
    comments = await service.get_comments(UUID(task_id))
    return success_response(
        data=[{"id": str(c.id), "task_id": str(c.task_id), "user_id": str(c.user_id), "content": c.content, "parent_id": str(c.parent_id) if c.parent_id else None, "created_at": str(c.created_at)} for c in comments],
        message=COMMENT_MESSAGES["LIST_SUCCESS"],
    )


@router.post("")
async def create_comment(request: CommentCreateRequest, workspace_member: WorkspaceMember = Depends(require_permission("comments.add")), db: AsyncSession = Depends(get_db)):
    service = CommentService(db)
    comment = await service.create_comment(request.task_id, workspace_member.user_id, request.content, request.parent_id)
    return success_response(
        data={"id": str(comment.id), "task_id": str(comment.task_id), "content": comment.content, "parent_id": str(comment.parent_id) if comment.parent_id else None},
        message=COMMENT_MESSAGES["CREATED"],
    )


@router.put("/{comment_id}")
async def update_comment(comment_id: str, request: CommentUpdateRequest, workspace_member: WorkspaceMember = Depends(require_permission("comments.add")), db: AsyncSession = Depends(get_db)):
    service = CommentService(db)
    comment = await service.update_comment(UUID(comment_id), workspace_member.user_id, request.content)
    return success_response(
        data={"id": str(comment.id), "content": comment.content},
        message=COMMENT_MESSAGES["UPDATED"],
    )


@router.delete("/{comment_id}")
async def delete_comment(comment_id: str, workspace_member: WorkspaceMember = Depends(require_permission("comments.add")), db: AsyncSession = Depends(get_db)):
    service = CommentService(db)
    await service.delete_comment(UUID(comment_id), workspace_member.user_id)
    return success_response(message=COMMENT_MESSAGES["DELETED"])
