from sqlalchemy import Column, ForeignKey, PrimaryKeyConstraint
from sqlalchemy.dialects.postgresql import UUID
from app.db.base import Base


class RolePermission(Base):
    __tablename__ = "role_permissions"
    __table_args__ = (PrimaryKeyConstraint("role_id", "permission_id"),)
    role_id = Column(UUID(as_uuid=True), ForeignKey("roles.id"), nullable=False)
    permission_id = Column(UUID(as_uuid=True), ForeignKey("permissions.id"), nullable=False)
