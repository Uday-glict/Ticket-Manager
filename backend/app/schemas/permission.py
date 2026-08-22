from pydantic import BaseModel
from typing import Optional
from uuid import UUID


class PermissionResponse(BaseModel):
    id: UUID
    name: str
    group_name: str
    description: Optional[str] = None
    model_config = {"from_attributes": True}
