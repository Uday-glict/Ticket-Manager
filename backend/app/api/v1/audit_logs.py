from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.database import get_db
from app.services.audit_service import AuditService
from app.dependencies.permissions import require_permission
from app.models.workspace_member import WorkspaceMember
from uuid import UUID

router = APIRouter(prefix="/audit-logs", tags=["audit-logs"])


@router.get("")
async def list_audit_logs(
    entity_type: str = Query(None),
    user_id: UUID = Query(None),
    page: int = Query(1),
    limit: int = Query(20),
    workspace_member: WorkspaceMember = Depends(require_permission("settings.view_audit_log")),
    db: AsyncSession = Depends(get_db),
):
    service = AuditService(db)
    logs = await service.list_logs(workspace_member.workspace_id, entity_type, user_id, page, limit)
    return {"success": True, "data": [{"id": str(l.id), "user_id": str(l.user_id), "action": l.action, "entity_type": l.entity_type, "entity_id": str(l.entity_id), "entity_name": l.entity_name, "previous_value": l.previous_value, "new_value": l.new_value, "created_at": str(l.created_at)} for l in logs]}
