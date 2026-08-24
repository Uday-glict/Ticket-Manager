class Permissions:
    PROJECT_VIEW = "projects.view"
    PROJECT_CREATE = "projects.create"
    PROJECT_UPDATE = "projects.update"
    PROJECT_DELETE = "projects.delete"
    TASK_VIEW = "tasks.view"
    TASK_CREATE = "tasks.create"
    TASK_UPDATE = "tasks.update"
    TASK_DELETE = "tasks.delete"
    TASK_ASSIGN = "tasks.assign"
    TASK_REASSIGN = "tasks.reassign"
    BOARD_VIEW = "board.view"
    BOARD_MOVE_TASK = "board.move_task"
    COMMENT_ADD = "comments.add"
    COMMENT_REPLY = "comments.reply"
    USER_MANAGE = "users.manage"
    ROLE_MANAGE = "roles.manage"
    AUDIT_VIEW = "settings.view_audit_log"
    SETTINGS_MANAGE = "settings.manage_settings"
    TEAM_VIEW = "teams.view"
    TEAM_CREATE = "teams.create"
    TEAM_UPDATE = "teams.update"
    TEAM_DELETE = "teams.delete"
    TEAM_MEMBERS_MANAGE = "teams.members.manage"
    SPRINT_VIEW = "sprints.view"
    SPRINT_CREATE = "sprints.create"
    SPRINT_UPDATE = "sprints.update"
    SPRINT_DELETE = "sprints.delete"
    SPRINT_MANAGE = "sprints.manage"
    TICKET_VIEW = "tickets.view"
    TICKET_CREATE = "tickets.create"
    TICKET_UPDATE = "tickets.update"
    TICKET_DELETE = "tickets.delete"
    TICKET_ASSIGN = "tickets.assign"
    CALENDAR_VIEW = "calendar.view"
    ALL = [
        "projects.view", "projects.create", "projects.update", "projects.delete",
        "tasks.view", "tasks.create", "tasks.update", "tasks.delete", "tasks.assign", "tasks.reassign",
        "board.view", "board.move_task",
        "comments.add", "comments.reply",
        "users.manage", "roles.manage",
        "settings.view_audit_log", "settings.manage_settings",
        "teams.view", "teams.create", "teams.update", "teams.delete", "teams.members.manage",
        "sprints.view", "sprints.create", "sprints.update", "sprints.delete", "sprints.manage",
        "tickets.view", "tickets.create", "tickets.update", "tickets.delete", "tickets.assign",
        "calendar.view",
    ]
