from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional
from uuid import UUID


class UserCreateRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    name: str = Field(min_length=1, max_length=255)
    avatar: Optional[str] = Field(default=None, max_length=500)

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Name is required")
        return v

    @field_validator("email")
    @classmethod
    def normalize_email(cls, v: str) -> str:
        return v.strip().lower()


class UserUpdateRequest(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=255)
    email: Optional[EmailStr] = None
    avatar: Optional[str] = Field(default=None, max_length=500)

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            v = v.strip()
            if not v:
                raise ValueError("Name cannot be empty")
            return v
        return v

    @field_validator("email")
    @classmethod
    def normalize_email(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            return v.strip().lower()
        return v


class UserStatusUpdate(BaseModel):
    status: str = Field(description="User status: active or inactive")

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: str) -> str:
        if v not in ("active", "inactive"):
            raise ValueError("Status must be 'active' or 'inactive'")
        return v


class UserListItem(BaseModel):
    id: UUID
    email: str
    name: str
    avatar: Optional[str] = None
    status: str
    is_superadmin: bool = False
    model_config = {"from_attributes": True}
