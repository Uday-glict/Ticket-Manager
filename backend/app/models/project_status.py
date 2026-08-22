from sqlalchemy import Column, String, Integer, Boolean, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.base import Base, UUIDMixin, TimestampMixin


class ProjectStatus(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "project_statuses"
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id"), nullable=False)
    name = Column(String(100), nullable=False)
    color = Column(String(7), default="#6B7280")
    display_order = Column(Integer, nullable=False)
    is_enabled = Column(Boolean, default=True)
    project = relationship("Project", back_populates="statuses")
    tasks = relationship("Task", back_populates="status")
