from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from app.repositories.team_repository import TeamRepository
from app.repositories.team_member_repository import TeamMemberRepository
from app.repositories.project_repository import ProjectRepository
from app.core.exceptions import NotFoundException, ConflictException, DatabaseException, ForbiddenException
from app.constants.messages import TEAM_MESSAGES
from app.constants.error_codes import TEAM_NOT_FOUND, TEAM_ALREADY_EXISTS, TEAM_CREATE_FAILED, TEAM_UPDATE_FAILED, TEAM_DELETE_FAILED, TEAM_MEMBER_ALREADY_EXISTS, TEAM_MEMBER_NOT_FOUND, PERMISSION_DENIED
from typing import List, Optional
from uuid import UUID
import logging

logger = logging.getLogger(__name__)


class TeamService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.team_repo = TeamRepository(db)
        self.member_repo = TeamMemberRepository(db)
        self.project_repo = ProjectRepository(db)

    async def _ensure_project_access(self, project_id: UUID, workspace_id: UUID):
        project = await self.project_repo.get_by_id(project_id)
        if not project or project.workspace_id != workspace_id:
            raise NotFoundException("Project not found", code=TEAM_NOT_FOUND)
        return project

    async def create_team(self, project_id: UUID, name: str, description: Optional[str], created_by: UUID, workspace_id: UUID):
        logger.info("Creating team | project=%s | name=%s", project_id, name)
        await self._ensure_project_access(project_id, workspace_id)
        if await self.team_repo.exists_name(project_id, name):
            raise ConflictException(TEAM_MESSAGES["ALREADY_EXISTS"], code=TEAM_ALREADY_EXISTS)
        try:
            team = await self.team_repo.create(project_id, name, description, created_by)
            logger.info("Team created | id=%s", team.id)
            return team
        except IntegrityError:
            await self.db.rollback()
            raise ConflictException(TEAM_MESSAGES["ALREADY_EXISTS"], code=TEAM_ALREADY_EXISTS)
        except SQLAlchemyError:
            await self.db.rollback()
            logger.exception("DB error creating team")
            raise DatabaseException(TEAM_MESSAGES["CREATE_FAILED"], code=TEAM_CREATE_FAILED)

    async def list_teams(self, project_id: UUID, workspace_id: UUID):
        await self._ensure_project_access(project_id, workspace_id)
        return await self.team_repo.list_by_project(project_id)

    async def get_team(self, team_id: UUID):
        team = await self.team_repo.get_by_id(team_id)
        if not team:
            raise NotFoundException(TEAM_MESSAGES["NOT_FOUND"], code=TEAM_NOT_FOUND)
        return team

    async def update_team(self, team_id: UUID, **kwargs):
        team = await self.get_team(team_id)
        if "name" in kwargs and kwargs["name"]:
            if await self.team_repo.exists_name(team.project_id, kwargs["name"], exclude_id=team_id):
                raise ConflictException(TEAM_MESSAGES["ALREADY_EXISTS"], code=TEAM_ALREADY_EXISTS)
        try:
            updated = await self.team_repo.update(team, **kwargs)
            logger.info("Team updated | id=%s", team_id)
            return updated
        except SQLAlchemyError:
            await self.db.rollback()
            logger.exception("DB error updating team")
            raise DatabaseException(TEAM_MESSAGES["UPDATE_FAILED"], code=TEAM_UPDATE_FAILED)

    async def delete_team(self, team_id: UUID):
        team = await self.get_team(team_id)
        try:
            await self.team_repo.delete(team_id)
            logger.info("Team deleted | id=%s", team_id)
            return True
        except SQLAlchemyError:
            await self.db.rollback()
            logger.exception("DB error deleting team")
            raise DatabaseException(TEAM_MESSAGES["DELETE_FAILED"], code=TEAM_DELETE_FAILED)

    async def add_member(self, team_id: UUID, user_id: UUID, workspace_id: UUID):
        team = await self.get_team(team_id)
        await self._ensure_project_access(team.project_id, workspace_id)
        from app.models.user import User
        from sqlalchemy import select
        result = await self.db.execute(select(User).where(User.id == user_id))
        if not result.scalar_one_or_none():
            raise NotFoundException("User not found", code=TEAM_MEMBER_NOT_FOUND)
        # check project membership
        from app.models.project_member import ProjectMember
        result = await self.db.execute(select(ProjectMember).where(ProjectMember.project_id == team.project_id, ProjectMember.user_id == user_id))
        if not result.scalar_one_or_none():
            raise ForbiddenException("User is not a member of this project", code=TEAM_MEMBER_NOT_FOUND)
        if await self.member_repo.is_member(team_id, user_id):
            raise ConflictException("User already in team", code=TEAM_MEMBER_ALREADY_EXISTS)
        try:
            member = await self.member_repo.add(team_id, user_id)
            logger.info("Team member added | team=%s | user=%s", team_id, user_id)
            return member
        except IntegrityError:
            await self.db.rollback()
            raise ConflictException("User already in team", code=TEAM_MEMBER_ALREADY_EXISTS)

    async def remove_member(self, team_id: UUID, user_id: UUID):
        if not await self.member_repo.is_member(team_id, user_id):
            raise NotFoundException("Team member not found", code=TEAM_MEMBER_NOT_FOUND)
        await self.member_repo.remove(team_id, user_id)
        logger.info("Team member removed | team=%s | user=%s", team_id, user_id)
        return True

    async def list_members(self, team_id: UUID):
        await self.get_team(team_id)
        return await self.member_repo.list_by_team(team_id)
