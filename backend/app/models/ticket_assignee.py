from sqlalchemy import Column, ForeignKey, DateTime, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.base import Base, UUIDMixin, TimestampMixin
from app.utils.datetime import utcnow


class TicketAssignee(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "ticket_assignees"
    ticket_id = Column(UUID(as_uuid=True), ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    assigned_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    assigned_at = Column(DateTime(timezone=True), nullable=False, default=utcnow)
    ticket = relationship("Task", back_populates="ticket_assignees")
    user = relationship("User", foreign_keys=[user_id])
    assigner = relationship("User", foreign_keys=[assigned_by])
    __table_args__ = (UniqueConstraint("ticket_id", "user_id", name="uq_ticket_assignees_ticket_user"),)
