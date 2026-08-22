from pydantic import BaseModel
from uuid import UUID


class ProjectMemberAddRequest(BaseModel):
    user_id: UUID
    role_id: UUID


class ProjectMemberUpdateRequest(BaseModel):
    role_id: UUID
