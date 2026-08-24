from pydantic import BaseModel, Field, field_validator
from typing import Optional
from uuid import UUID
from datetime import date

class SprintCreateRequest(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    description: Optional[str] = None
    goal: Optional[str] = None
    team_id: Optional[UUID] = None
    start_date: date
    end_date: date

    @field_validator("end_date")
    @classmethod
    def validate_dates(cls, v, info):
        start = info.data.get("start_date")
        if start and v < start:
            raise ValueError("End date cannot be before start date")
        return v

class SprintUpdateRequest(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=255)
    description: Optional[str] = None
    goal: Optional[str] = None
    team_id: Optional[UUID] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    status: Optional[str] = Field(default=None, pattern="^(PLANNED|ACTIVE|COMPLETED|CANCELLED)$")
