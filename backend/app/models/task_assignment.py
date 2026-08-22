from sqlalchemy import Column, Text, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.base import Base, UUIDMixin


class TaskAssignment(Base, UUIDMixin):
    __tablename__ = "task_assignments"
    task_id = Column(UUID(as_uuid=True), ForeignKey("tasks.id"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    assigned_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    assigned_at = Column(DateTime(timezone=True), nullable=False)
    unassigned_at = Column(DateTime(timezone=True), nullable=True)
    reason = Column(Text, nullable=True)
    task = relationship("Task", back_populates="assignments")
    assignee = relationship("User", foreign_keys=[user_id])
    assigner = relationship("User", foreign_keys=[assigned_by])
