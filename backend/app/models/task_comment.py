from sqlalchemy import Column, Text, Boolean, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.base import Base, UUIDMixin, TimestampMixin


class TaskComment(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "task_comments"
    task_id = Column(UUID(as_uuid=True), ForeignKey("tasks.id"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    content = Column(Text, nullable=False)
    parent_id = Column(UUID(as_uuid=True), ForeignKey("task_comments.id"), nullable=True)
    is_deleted = Column(Boolean, default=False)
    task = relationship("Task", back_populates="comments")
    user = relationship("User")
    parent = relationship("TaskComment", remote_side="TaskComment.id")
    replies = relationship("TaskComment", back_populates="parent")
