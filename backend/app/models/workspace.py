from sqlalchemy import Column, String, Text, Enum as SAEnum, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.base import Base, UUIDMixin, TimestampMixin


class Workspace(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "workspaces"
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    type = Column(SAEnum("individual", "company", name="workspace_type"), nullable=False)
    owner_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    owner = relationship("User", back_populates="workspaces")
    members = relationship("WorkspaceMember", back_populates="workspace")
    roles = relationship("Role", back_populates="workspace")
    projects = relationship("Project", back_populates="workspace")
    audit_logs = relationship("AuditLog", back_populates="workspace")
