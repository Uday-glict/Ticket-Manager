from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from uuid import UUID


class UserCreateRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    name: str = Field(min_length=1, max_length=255)


class UserUpdateRequest(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    avatar: Optional[str] = None


class UserStatusUpdate(BaseModel):
    status: str


class UserListItem(BaseModel):
    id: UUID
    email: str
    name: str
    avatar: Optional[str] = None
    status: str
    is_superadmin: bool = False
    model_config = {"from_attributes": True}
