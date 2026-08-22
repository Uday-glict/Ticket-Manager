from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import date


class TaskCreateRequest(BaseModel):
    title: str
    description: Optional[str] = None
    project_id: UUID
    assigned_to: Optional[UUID] = None
    priority: str = "medium"
    status_id: Optional[UUID] = None
    start_date: Optional[date] = None
    due_date: Optional[date] = None


class TaskUpdateRequest(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    assigned_to: Optional[UUID] = None
    priority: Optional[str] = None
    status_id: Optional[UUID] = None
    start_date: Optional[date] = None
    due_date: Optional[date] = None


class TaskAssignRequest(BaseModel):
    user_id: UUID
    reason: Optional[str] = None


class TaskReassignRequest(BaseModel):
    user_id: UUID
    reason: Optional[str] = None
