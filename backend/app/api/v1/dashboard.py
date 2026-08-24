from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.database import get_db
from app.services.dashboard_service import DashboardService
from app.dependencies.permissions import require_permission
from app.models.workspace_member import WorkspaceMember
from app.utils.response import success_response
from app.constants.messages import DASHBOARD_MESSAGES

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/summary")
async def get_summary(workspace_member: WorkspaceMember = Depends(require_permission("projects.view")), db: AsyncSession = Depends(get_db)):
    service = DashboardService(db)
    summary = await service.get_summary(workspace_member.workspace_id)
    return success_response(data=summary, message=DASHBOARD_MESSAGES["SUMMARY_SUCCESS"])


@router.get("/projects")
async def get_project_summaries(workspace_member: WorkspaceMember = Depends(require_permission("projects.view")), db: AsyncSession = Depends(get_db)):
    service = DashboardService(db)
    summaries = await service.get_project_summaries(workspace_member.workspace_id)
    return success_response(data=summaries, message=DASHBOARD_MESSAGES["PROJECTS_SUCCESS"])
