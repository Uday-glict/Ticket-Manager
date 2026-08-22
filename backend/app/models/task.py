from sqlalchemy import Column, String, Text, Date, Enum as SAEnum, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.base import Base, UUIDMixin, TimestampMixin


class Task(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "tasks"
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id"), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    assigned_to = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    priority = Column(SAEnum("low", "medium", "high", "urgent", name="task_priority"), default="medium")
    status_id = Column(UUID(as_uuid=True), ForeignKey("project_statuses.id"), nullable=False)
    start_date = Column(Date, nullable=True)
    due_date = Column(Date, nullable=True)
    project = relationship("Project", back_populates="tasks")
    assignee = relationship("User", foreign_keys=[assigned_to])
    creator = relationship("User", foreign_keys=[created_by])
    status = relationship("ProjectStatus", back_populates="tasks")
    assignments = relationship("TaskAssignment", back_populates="task")
    comments = relationship("TaskComment", back_populates="task")
