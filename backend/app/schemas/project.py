from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import date


class ProjectCreateRequest(BaseModel):
    name: str
    description: Optional[str] = None
    manager_id: Optional[UUID] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None


class ProjectUpdateRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    manager_id: Optional[UUID] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    status: Optional[str] = None


class ProjectStatusCreateRequest(BaseModel):
    name: str
    color: str = "#6B7280"
    display_order: Optional[int] = None


class ProjectStatusUpdateRequest(BaseModel):
    name: Optional[str] = None
    color: Optional[str] = None
    display_order: Optional[int] = None
    is_enabled: Optional[bool] = None
