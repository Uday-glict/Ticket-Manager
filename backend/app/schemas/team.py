from pydantic import BaseModel, Field
from typing import Optional
from uuid import UUID


class TeamCreateRequest(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    description: Optional[str] = Field(default=None, max_length=1000)


class TeamUpdateRequest(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=255)
    description: Optional[str] = Field(default=None, max_length=1000)
    status: Optional[str] = Field(default=None, pattern="^(active|archived)$")


class TeamMemberAddRequest(BaseModel):
    user_id: UUID
