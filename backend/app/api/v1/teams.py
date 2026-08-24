from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.database import get_db
from app.schemas.team import TeamCreateRequest, TeamUpdateRequest, TeamMemberAddRequest
from app.services.team_service import TeamService
from app.dependencies.permissions import require_permission
from app.models.workspace_member import WorkspaceMember
from app.utils.response import success_response
from app.constants.messages import TEAM_MESSAGES
from uuid import UUID

router = APIRouter(prefix="/projects", tags=["teams"])
team_router = APIRouter(prefix="/teams", tags=["teams"])


@router.post("/{project_id}/teams", status_code=status.HTTP_201_CREATED)
async def create_team(project_id: str, request: TeamCreateRequest, workspace_member: WorkspaceMember = Depends(require_permission("teams.create")), db: AsyncSession = Depends(get_db)):
    service = TeamService(db)
    team = await service.create_team(UUID(project_id), request.name, request.description, workspace_member.user_id, workspace_member.workspace_id)
    return success_response(data={"id": str(team.id), "project_id": str(team.project_id), "name": team.name, "description": team.description, "status": team.status}, message=TEAM_MESSAGES["CREATED"])


@router.get("/{project_id}/teams")
async def list_teams(project_id: str, workspace_member: WorkspaceMember = Depends(require_permission("teams.view")), db: AsyncSession = Depends(get_db)):
    service = TeamService(db)
    teams = await service.list_teams(UUID(project_id), workspace_member.workspace_id)
    data = [{"id": str(t.id), "project_id": str(t.project_id), "name": t.name, "description": t.description, "status": t.status, "created_by": str(t.created_by) if t.created_by else None} for t in teams]
    return success_response(data=data, message=TEAM_MESSAGES["LIST_SUCCESS"])


@team_router.get("/{team_id}")
async def get_team(team_id: str, workspace_member: WorkspaceMember = Depends(require_permission("teams.view")), db: AsyncSession = Depends(get_db)):
    service = TeamService(db)
    team = await service.get_team(UUID(team_id))
    return success_response(data={"id": str(team.id), "project_id": str(team.project_id), "name": team.name, "description": team.description, "status": team.status}, message=TEAM_MESSAGES["GET_SUCCESS"])


@team_router.patch("/{team_id}")
async def update_team(team_id: str, request: TeamUpdateRequest, workspace_member: WorkspaceMember = Depends(require_permission("teams.update")), db: AsyncSession = Depends(get_db)):
    service = TeamService(db)
    team = await service.update_team(UUID(team_id), **request.model_dump(exclude_unset=True))
    return success_response(data={"id": str(team.id), "name": team.name, "description": team.description, "status": team.status}, message=TEAM_MESSAGES["UPDATED"])


@team_router.delete("/{team_id}")
async def delete_team(team_id: str, workspace_member: WorkspaceMember = Depends(require_permission("teams.delete")), db: AsyncSession = Depends(get_db)):
    service = TeamService(db)
    await service.delete_team(UUID(team_id))
    return success_response(message=TEAM_MESSAGES["DELETED"])


@team_router.get("/{team_id}/members")
async def list_team_members(team_id: str, workspace_member: WorkspaceMember = Depends(require_permission("teams.view")), db: AsyncSession = Depends(get_db)):
    service = TeamService(db)
    members = await service.list_members(UUID(team_id))
    data = [{"id": str(m.id), "team_id": str(m.team_id), "user_id": str(m.user_id)} for m in members]
    return success_response(data=data, message=TEAM_MESSAGES["LIST_SUCCESS"])


@team_router.post("/{team_id}/members", status_code=status.HTTP_201_CREATED)
async def add_team_member(team_id: str, request: TeamMemberAddRequest, workspace_member: WorkspaceMember = Depends(require_permission("teams.members.manage")), db: AsyncSession = Depends(get_db)):
    service = TeamService(db)
    member = await service.add_member(UUID(team_id), request.user_id, workspace_member.workspace_id)
    return success_response(data={"id": str(member.id), "team_id": str(member.team_id), "user_id": str(member.user_id)}, message=TEAM_MESSAGES["MEMBER_ADDED"])


@team_router.delete("/{team_id}/members/{user_id}")
async def remove_team_member(team_id: str, user_id: str, workspace_member: WorkspaceMember = Depends(require_permission("teams.members.manage")), db: AsyncSession = Depends(get_db)):
    service = TeamService(db)
    await service.remove_member(UUID(team_id), UUID(user_id))
    return success_response(message=TEAM_MESSAGES["MEMBER_REMOVED"])
