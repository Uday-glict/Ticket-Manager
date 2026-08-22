from pydantic import BaseModel
from typing import Optional, Any
from uuid import UUID
from datetime import datetime


class AuditLogResponse(BaseModel):
    id: UUID
    user_id: UUID
    action: str
    entity_type: str
    entity_id: UUID
    entity_name: Optional[str] = None
    previous_value: Optional[Any] = None
    new_value: Optional[Any] = None
    created_at: datetime
    model_config = {"from_attributes": True}
