from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from uuid import UUID


class SignupRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    name: str = Field(min_length=1, max_length=255)
    workspace_name: Optional[str] = None
    workspace_type: str = "individual"


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RefreshRequest(BaseModel):
    refresh_token: str


class UserResponse(BaseModel):
    id: UUID
    email: str
    name: str
    avatar: Optional[str] = None
    status: str
    is_superadmin: bool = False
    model_config = {"from_attributes": True}


class AuthResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserResponse
