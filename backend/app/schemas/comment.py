from pydantic import BaseModel
from typing import Optional
from uuid import UUID


class CommentCreateRequest(BaseModel):
    task_id: UUID
    content: str
    parent_id: Optional[UUID] = None


class CommentUpdateRequest(BaseModel):
    content: str
