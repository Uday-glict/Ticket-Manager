from sqlalchemy import Column, String, Text, Date, Enum as SAEnum, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.base import Base, UUIDMixin, TimestampMixin


class Team(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "teams"
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String(20), default="active")
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    project = relationship("Project", back_populates="teams")
    members = relationship("TeamMember", back_populates="team", cascade="all, delete-orphan")
    sprints = relationship("Sprint", back_populates="team")
