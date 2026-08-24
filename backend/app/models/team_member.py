from sqlalchemy import Column, ForeignKey, DateTime, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.base import Base, UUIDMixin, TimestampMixin


class TeamMember(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "team_members"
    team_id = Column(UUID(as_uuid=True), ForeignKey("teams.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    joined_at = Column(DateTime(timezone=True), nullable=True)
    team = relationship("Team", back_populates="members")
    user = relationship("User")
    __table_args__ = (UniqueConstraint("team_id", "user_id", name="uq_team_members_team_user"),)
