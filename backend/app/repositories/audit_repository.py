from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.audit_log import AuditLog
from typing import Optional, List, Dict, Any
from uuid import UUID
from datetime import datetime, timezone


class AuditRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, workspace_id: UUID, user_id: UUID, action: str, entity_type: str, entity_id: UUID, entity_name: str = None, previous_value: Any = None, new_value: Any = None) -> AuditLog:
        log = AuditLog(workspace_id=workspace_id, user_id=user_id, action=action, entity_type=entity_type, entity_id=entity_id, entity_name=entity_name, previous_value=previous_value, new_value=new_value, created_at=datetime.now(timezone.utc))
        self.db.add(log)
        await self.db.flush()
        return log

    async def list_logs(self, workspace_id: UUID, entity_type: str = None, user_id: UUID = None, page: int = 1, limit: int = 20) -> List[AuditLog]:
        query = select(AuditLog).where(AuditLog.workspace_id == workspace_id)
        if entity_type:
            query = query.where(AuditLog.entity_type == entity_type)
        if user_id:
            query = query.where(AuditLog.user_id == user_id)
        query = query.order_by(AuditLog.created_at.desc())
        offset = (page - 1) * limit
        query = query.offset(offset).limit(limit)
        result = await self.db.execute(query)
        return list(result.scalars().all())
