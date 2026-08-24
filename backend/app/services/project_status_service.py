from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.project_status_repository import ProjectStatusRepository
from app.core.exceptions import NotFoundException
from app.constants.messages import PROJECT_STATUS_MESSAGES
from app.constants.error_codes import PROJECT_STATUS_NOT_FOUND


class ProjectStatusService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.status_repo = ProjectStatusRepository(db)

    async def list_statuses(self, project_id):
        return await self.status_repo.get_by_project(project_id)

    async def create_status(self, project_id, name, color="#6B7280", display_order=None):
        if display_order is None:
            existing = await self.status_repo.get_by_project(project_id)
            display_order = len(existing)
        return await self.status_repo.create(project_id, name, color, display_order)

    async def update_status(self, status_id, **kwargs):
        status = await self.status_repo.update(status_id, **kwargs)
        if not status:
            raise NotFoundException(PROJECT_STATUS_MESSAGES["NOT_FOUND"], code=PROJECT_STATUS_NOT_FOUND)
        return status

    async def delete_status(self, status_id):
        return await self.status_repo.delete(status_id)
