from sqlalchemy import Column, String, Text, Date, Enum as SAEnum, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.base import Base, UUIDMixin, TimestampMixin


class Project(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "projects"
    workspace_id = Column(UUID(as_uuid=True), ForeignKey("workspaces.id"), nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    manager_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    start_date = Column(Date, nullable=True)
    end_date = Column(Date, nullable=True)
    status = Column(SAEnum("active", "archived", name="project_status"), default="active")
    workspace = relationship("Workspace", back_populates="projects")
    manager = relationship("User", foreign_keys=[manager_id])
    members = relationship("ProjectMember", back_populates="project")
    statuses = relationship("ProjectStatus", back_populates="project", order_by="ProjectStatus.display_order")
    tasks = relationship("Task", back_populates="project")
