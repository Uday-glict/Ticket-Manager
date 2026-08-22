from pydantic import BaseModel
from typing import Optional, List
from uuid import UUID


class RoleCreateRequest(BaseModel):
    name: str
    description: Optional[str] = None
    permissions: List[str] = []


class RoleUpdateRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    permissions: Optional[List[str]] = None


class RoleResponse(BaseModel):
    id: UUID
    name: str
    description: Optional[str] = None
    is_system: bool = False
    model_config = {"from_attributes": True}
