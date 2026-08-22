from pydantic import BaseModel
from uuid import UUID


class DashboardSummary(BaseModel):
    total_projects: int
    total_tasks: int
    completed_tasks: int
    in_progress_tasks: int
    overdue_tasks: int


class ProjectSummary(BaseModel):
    id: UUID
    name: str
    total_tasks: int
    completed_tasks: int
    in_progress_tasks: int
