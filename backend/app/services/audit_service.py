from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.audit_repository import AuditRepository
from uuid import UUID


class AuditService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.audit_repo = AuditRepository(db)

    async def log(self, workspace_id: UUID, user_id: UUID, action: str, entity_type: str, entity_id: UUID, entity_name: str = None, previous_value=None, new_value=None):
        return await self.audit_repo.create(workspace_id, user_id, action, entity_type, entity_id, entity_name, previous_value, new_value)

    async def list_logs(self, workspace_id: UUID, entity_type: str = None, user_id: UUID = None, page: int = 1, limit: int = 20):
        return await self.audit_repo.list_logs(workspace_id, entity_type, user_id, page, limit)
