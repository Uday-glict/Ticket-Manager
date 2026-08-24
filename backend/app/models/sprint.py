from sqlalchemy import Column, String, Text, Date, Enum as SAEnum, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.base import Base, UUIDMixin, TimestampMixin


class Sprint(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "sprints"
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    team_id = Column(UUID(as_uuid=True), ForeignKey("teams.id", ondelete="SET NULL"), nullable=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    goal = Column(Text, nullable=True)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    status = Column(SAEnum("PLANNED", "ACTIVE", "COMPLETED", "CANCELLED", name="sprint_status"), default="PLANNED")
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    project = relationship("Project", back_populates="sprints")
    team = relationship("Team", back_populates="sprints")
    tickets = relationship("Task", back_populates="sprint")
