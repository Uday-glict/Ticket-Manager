class TaskPriority:
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"


class ProjectStatusType:
    ACTIVE = "active"
    ARCHIVED = "archived"


class UserStatus:
    ACTIVE = "active"
    INACTIVE = "inactive"


class WorkspaceType:
    INDIVIDUAL = "individual"
    COMPANY = "company"


class WorkspaceMemberRole:
    OWNER = "owner"
    ADMIN = "admin"
    MEMBER = "member"


DEFAULT_PROJECT_STATUSES = [
    {"name": "To Do", "color": "#6B7280", "display_order": 0},
    {"name": "In Progress", "color": "#3B82F6", "display_order": 1},
    {"name": "Done", "color": "#22C55E", "display_order": 2},
]
