from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.database import get_db
from app.schemas.sprint import SprintCreateRequest, SprintUpdateRequest
from app.services.sprint_service import SprintService
from app.dependencies.permissions import require_permission
from app.models.workspace_member import WorkspaceMember
from app.utils.response import success_response
from app.constants.messages import SPRINT_MESSAGES
from uuid import UUID

router = APIRouter(prefix="/projects", tags=["sprints"])
sprint_router = APIRouter(prefix="/sprints", tags=["sprints"])

@router.post("/{project_id}/sprints", status_code=status.HTTP_201_CREATED)
async def create_sprint(project_id: str, request: SprintCreateRequest, workspace_member: WorkspaceMember = Depends(require_permission("sprints.create")), db: AsyncSession = Depends(get_db)):
    service = SprintService(db)
    sprint = await service.create_sprint(UUID(project_id), request.name, request.start_date, request.end_date, workspace_member.user_id, workspace_member.workspace_id, request.team_id, request.description, request.goal)
    return success_response(data={"id": str(sprint.id), "project_id": str(sprint.project_id), "name": sprint.name, "status": sprint.status, "start_date": str(sprint.start_date), "end_date": str(sprint.end_date)}, message=SPRINT_MESSAGES["CREATED"])

@router.get("/{project_id}/sprints")
async def list_sprints(project_id: str, workspace_member: WorkspaceMember = Depends(require_permission("sprints.view")), db: AsyncSession = Depends(get_db)):
    service = SprintService(db)
    sprints = await service.list_sprints(UUID(project_id), workspace_member.workspace_id)
    data = [{"id": str(s.id), "project_id": str(s.project_id), "team_id": str(s.team_id) if s.team_id else None, "name": s.name, "goal": s.goal, "start_date": str(s.start_date), "end_date": str(s.end_date), "status": s.status} for s in sprints]
    return success_response(data=data, message=SPRINT_MESSAGES["LIST_SUCCESS"])

@sprint_router.get("/{sprint_id}")
async def get_sprint(sprint_id: str, workspace_member: WorkspaceMember = Depends(require_permission("sprints.view")), db: AsyncSession = Depends(get_db)):
    service = SprintService(db)
    sprint = await service.get_sprint(UUID(sprint_id))
    return success_response(data={"id": str(sprint.id), "name": sprint.name, "status": sprint.status, "start_date": str(sprint.start_date), "end_date": str(sprint.end_date), "team_id": str(sprint.team_id) if sprint.team_id else None}, message=SPRINT_MESSAGES["GET_SUCCESS"])

@sprint_router.patch("/{sprint_id}")
async def update_sprint(sprint_id: str, request: SprintUpdateRequest, workspace_member: WorkspaceMember = Depends(require_permission("sprints.update")), db: AsyncSession = Depends(get_db)):
    service = SprintService(db)
    sprint = await service.update_sprint(UUID(sprint_id), **request.model_dump(exclude_unset=True))
    return success_response(data={"id": str(sprint.id), "name": sprint.name, "status": sprint.status}, message=SPRINT_MESSAGES["UPDATED"])

@sprint_router.delete("/{sprint_id}")
async def delete_sprint(sprint_id: str, workspace_member: WorkspaceMember = Depends(require_permission("sprints.delete")), db: AsyncSession = Depends(get_db)):
    service = SprintService(db)
    await service.delete_sprint(UUID(sprint_id))
    return success_response(message=SPRINT_MESSAGES["DELETED"])

@sprint_router.post("/{sprint_id}/start")
async def start_sprint(sprint_id: str, workspace_member: WorkspaceMember = Depends(require_permission("sprints.update")), db: AsyncSession = Depends(get_db)):
    service = SprintService(db)
    sprint = await service.start_sprint(UUID(sprint_id))
    return success_response(data={"id": str(sprint.id), "status": sprint.status}, message=SPRINT_MESSAGES["STARTED"])

@sprint_router.post("/{sprint_id}/complete")
async def complete_sprint(sprint_id: str, workspace_member: WorkspaceMember = Depends(require_permission("sprints.update")), db: AsyncSession = Depends(get_db)):
    service = SprintService(db)
    sprint = await service.complete_sprint(UUID(sprint_id))
    return success_response(data={"id": str(sprint.id), "status": sprint.status}, message=SPRINT_MESSAGES["COMPLETED"])
