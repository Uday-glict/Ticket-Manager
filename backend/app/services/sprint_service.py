from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from app.repositories.sprint_repository import SprintRepository
from app.repositories.project_repository import ProjectRepository
from app.core.exceptions import NotFoundException, ConflictException, DatabaseException, ValidationException
from app.constants.messages import SPRINT_MESSAGES
from app.constants.error_codes import SPRINT_NOT_FOUND, SPRINT_CREATE_FAILED, SPRINT_UPDATE_FAILED, SPRINT_DELETE_FAILED, SPRINT_INVALID_DATES
from typing import Optional
from uuid import UUID
from datetime import date
import logging

logger = logging.getLogger(__name__)

class SprintService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.sprint_repo = SprintRepository(db)
        self.project_repo = ProjectRepository(db)

    async def _ensure_project(self, project_id: UUID, workspace_id: UUID):
        project = await self.project_repo.get_by_id(project_id)
        if not project or project.workspace_id != workspace_id:
            raise NotFoundException("Project not found", code=SPRINT_NOT_FOUND)
        return project

    async def create_sprint(self, project_id: UUID, name: str, start_date: date, end_date: date, created_by: UUID, workspace_id: UUID, team_id: Optional[UUID] = None, description: Optional[str] = None, goal: Optional[str] = None):
        logger.info("Creating sprint | project=%s | name=%s", project_id, name)
        await self._ensure_project(project_id, workspace_id)
        if team_id:
            from app.models.team import Team
            from sqlalchemy import select
            result = await self.db.execute(select(Team).where(Team.id == team_id, Team.project_id == project_id))
            if not result.scalar_one_or_none():
                raise ValidationException("Team does not belong to this project")
        if end_date < start_date:
            raise ValidationException(SPRINT_MESSAGES["INVALID_DATES"], code=SPRINT_INVALID_DATES)
        try:
            sprint = await self.sprint_repo.create(project_id, name, start_date, end_date, created_by, team_id, description, goal)
            logger.info("Sprint created | id=%s", sprint.id)
            return sprint
        except SQLAlchemyError:
            await self.db.rollback()
            logger.exception("DB error creating sprint")
            raise DatabaseException(SPRINT_MESSAGES["CREATE_FAILED"], code=SPRINT_CREATE_FAILED)

    async def list_sprints(self, project_id: UUID, workspace_id: UUID):
        await self._ensure_project(project_id, workspace_id)
        return await self.sprint_repo.list_by_project(project_id)

    async def get_sprint(self, sprint_id: UUID):
        sprint = await self.sprint_repo.get_by_id(sprint_id)
        if not sprint:
            raise NotFoundException(SPRINT_MESSAGES["NOT_FOUND"], code=SPRINT_NOT_FOUND)
        return sprint

    async def update_sprint(self, sprint_id: UUID, **kwargs):
        sprint = await self.get_sprint(sprint_id)
        if "start_date" in kwargs and "end_date" in kwargs and kwargs["start_date"] and kwargs["end_date"]:
            if kwargs["end_date"] < kwargs["start_date"]:
                raise ValidationException(SPRINT_MESSAGES["INVALID_DATES"], code=SPRINT_INVALID_DATES)
        try:
            updated = await self.sprint_repo.update(sprint, **kwargs)
            logger.info("Sprint updated | id=%s", sprint_id)
            return updated
        except SQLAlchemyError:
            await self.db.rollback()
            logger.exception("DB error updating sprint")
            raise DatabaseException(SPRINT_MESSAGES["UPDATE_FAILED"], code=SPRINT_UPDATE_FAILED)

    async def delete_sprint(self, sprint_id: UUID):
        await self.get_sprint(sprint_id)
        try:
            await self.sprint_repo.delete(sprint_id)
            logger.info("Sprint deleted | id=%s", sprint_id)
            return True
        except SQLAlchemyError:
            await self.db.rollback()
            logger.exception("DB error deleting sprint")
            raise DatabaseException(SPRINT_MESSAGES["DELETE_FAILED"], code=SPRINT_DELETE_FAILED)

    async def start_sprint(self, sprint_id: UUID):
        return await self.update_sprint(sprint_id, status="ACTIVE")

    async def complete_sprint(self, sprint_id: UUID):
        return await self.update_sprint(sprint_id, status="COMPLETED")
