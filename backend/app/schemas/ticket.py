from pydantic import BaseModel, Field
from typing import Optional, List
from uuid import UUID
from datetime import date

class TicketCreateRequest(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    description: Optional[str] = None
    project_id: UUID
    team_id: Optional[UUID] = None
    sprint_id: Optional[UUID] = None
    status_id: UUID
    priority: str = Field(default="medium", pattern="^(low|medium|high|urgent)$")
    assignee_ids: List[UUID] = Field(default_factory=list)
    start_date: Optional[date] = None
    due_date: Optional[date] = None

class TicketUpdateRequest(BaseModel):
    title: Optional[str] = Field(default=None, min_length=1, max_length=255)
    description: Optional[str] = None
    team_id: Optional[UUID] = None
    sprint_id: Optional[UUID] = None
    status_id: Optional[UUID] = None
    priority: Optional[str] = Field(default=None, pattern="^(low|medium|high|urgent)$")
    assignee_ids: Optional[List[UUID]] = None
    start_date: Optional[date] = None
    due_date: Optional[date] = None

class TicketAssigneeUpdateRequest(BaseModel):
    assignee_ids: List[UUID]
