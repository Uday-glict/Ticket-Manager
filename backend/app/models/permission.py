from sqlalchemy import Column, String, Text
from sqlalchemy.orm import relationship
from app.db.base import Base, UUIDMixin


class Permission(Base, UUIDMixin):
    __tablename__ = "permissions"
    name = Column(String(100), unique=True, nullable=False)
    group_name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    roles = relationship("Role", secondary="role_permissions", back_populates="permissions")
