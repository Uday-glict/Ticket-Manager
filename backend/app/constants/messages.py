AUTH_MESSAGES = {
    "SIGNUP_SUCCESS": "Account created successfully.",
    "LOGIN_SUCCESS": "Login successful.",
    "LOGOUT_SUCCESS": "Logged out successfully.",
    "REFRESH_SUCCESS": "Token refreshed successfully.",
    "INVALID_CREDENTIALS": "Invalid email or password.",
    "EMAIL_ALREADY_EXISTS": "An account with this email already exists.",
    "PASSWORD_VALIDATION_FAILED": "Password must be between 8 and 128 characters.",
    "ACCOUNT_INACTIVE": "Your account is inactive.",
    "TOKEN_EXPIRED": "Your session has expired.",
    "INVALID_TOKEN": "Invalid authentication token.",
    "USER_NOT_FOUND": "User not found.",
}

USER_MESSAGES = {
    "LIST_SUCCESS": "Users retrieved successfully.",
    "GET_SUCCESS": "User retrieved successfully.",
    "CREATE_SUCCESS": "User created successfully.",
    "UPDATED": "User updated successfully.",
    "STATUS_UPDATED": "User status updated successfully.",
    "DELETE_SUCCESS": "User deleted successfully.",
    "NOT_FOUND": "User not found.",
    "ALREADY_EXISTS": "User already exists.",
    "EMAIL_ALREADY_EXISTS": "User with this email already exists.",
    "CREATE_FAILED": "Unable to create user.",
    "UPDATE_FAILED": "Unable to update user.",
    "DELETE_FAILED": "Unable to delete user.",
    "AVATAR_UPLOAD_SUCCESS": "Profile avatar updated successfully.",
    "AVATAR_REMOVE_SUCCESS": "Profile avatar removed successfully.",
    "AVATAR_NOT_FOUND": "Avatar not found.",
    "AVATAR_INVALID_TYPE": "Only supported image formats are allowed.",
    "AVATAR_TOO_LARGE": "Avatar image size exceeds the allowed limit.",
    "AVATAR_UPLOAD_FAILED": "Unable to upload avatar.",
    "AVATAR_REMOVE_FAILED": "Unable to remove avatar.",
}

ROLE_MESSAGES = {
    "LIST_SUCCESS": "Roles retrieved successfully.",
    "CREATED": "Role created successfully.",
    "UPDATED": "Role updated successfully.",
    "DELETED": "Role deleted successfully.",
    "NOT_FOUND": "Role not found.",
    "ALREADY_EXISTS": "A role with this name already exists.",
    "CANNOT_MODIFY_SYSTEM": "Cannot modify a system role.",
    "CANNOT_DELETE_SYSTEM": "Cannot delete a system role.",
}

PERMISSION_MESSAGES = {
    "LIST_SUCCESS": "Permissions retrieved successfully.",
    "UPDATED": "Permissions updated successfully.",
    "FORBIDDEN": "You do not have permission to perform this action.",
}

PROJECT_MESSAGES = {
    "LIST_SUCCESS": "Projects retrieved successfully.",
    "GET_SUCCESS": "Project retrieved successfully.",
    "CREATED": "Project created successfully.",
    "UPDATED": "Project updated successfully.",
    "DELETED": "Project deleted successfully.",
    "NOT_FOUND": "Project not found.",
}

PROJECT_MEMBER_MESSAGES = {
    "LIST_SUCCESS": "Project members retrieved successfully.",
    "ADDED": "Member added to project successfully.",
    "UPDATED": "Member role updated successfully.",
    "REMOVED": "Member removed from project successfully.",
    "NOT_FOUND": "Project member not found.",
}

PROJECT_STATUS_MESSAGES = {
    "LIST_SUCCESS": "Project statuses retrieved successfully.",
    "CREATED": "Project status created successfully.",
    "UPDATED": "Project status updated successfully.",
    "DELETED": "Project status deleted successfully.",
    "NOT_FOUND": "Project status not found.",
}

TASK_MESSAGES = {
    "LIST_SUCCESS": "Tasks retrieved successfully.",
    "GET_SUCCESS": "Task retrieved successfully.",
    "CREATED": "Task created successfully.",
    "UPDATED": "Task updated successfully.",
    "ASSIGNED": "Task assigned successfully.",
    "REASSIGNED": "Task reassigned successfully.",
    "NOT_FOUND": "Task not found.",
    "ASSIGNMENTS_SUCCESS": "Assignment history retrieved successfully.",
}

COMMENT_MESSAGES = {
    "LIST_SUCCESS": "Comments retrieved successfully.",
    "CREATED": "Comment added successfully.",
    "UPDATED": "Comment updated successfully.",
    "DELETED": "Comment deleted successfully.",
    "NOT_FOUND": "Comment not found.",
    "FORBIDDEN": "You can only modify your own comments.",
}

BOARD_MESSAGES = {
    "GET_SUCCESS": "Board data retrieved successfully.",
}

DASHBOARD_MESSAGES = {
    "SUMMARY_SUCCESS": "Dashboard summary retrieved successfully.",
    "PROJECTS_SUCCESS": "Project summaries retrieved successfully.",
}

AUDIT_MESSAGES = {
    "LIST_SUCCESS": "Audit logs retrieved successfully.",
}

TEAM_MESSAGES = {
    "LIST_SUCCESS": "Teams retrieved successfully.",
    "GET_SUCCESS": "Team retrieved successfully.",
    "CREATED": "Team created successfully.",
    "UPDATED": "Team updated successfully.",
    "DELETED": "Team deleted successfully.",
    "NOT_FOUND": "Team not found.",
    "ALREADY_EXISTS": "A team with this name already exists.",
    "PROJECT_NOT_FOUND": "Project not found.",
    "MEMBER_ADDED": "Team member added successfully.",
    "MEMBER_REMOVED": "Team member removed successfully.",
    "MEMBER_NOT_FOUND": "Team member not found.",
    "CREATE_FAILED": "Unable to create team.",
    "UPDATE_FAILED": "Unable to update team.",
    "DELETE_FAILED": "Unable to delete team.",
}

SPRINT_MESSAGES = {
    "LIST_SUCCESS": "Sprints retrieved successfully.",
    "GET_SUCCESS": "Sprint retrieved successfully.",
    "CREATED": "Sprint created successfully.",
    "UPDATED": "Sprint updated successfully.",
    "DELETED": "Sprint deleted successfully.",
    "NOT_FOUND": "Sprint not found.",
    "STARTED": "Sprint started successfully.",
    "COMPLETED": "Sprint completed successfully.",
    "CREATE_FAILED": "Unable to create sprint.",
    "UPDATE_FAILED": "Unable to update sprint.",
    "DELETE_FAILED": "Unable to delete sprint.",
    "INVALID_DATES": "Sprint end date cannot be before start date.",
}

TICKET_MESSAGES = {
    "LIST_SUCCESS": "Tickets retrieved successfully.",
    "GET_SUCCESS": "Ticket retrieved successfully.",
    "CREATED": "Ticket created successfully.",
    "UPDATED": "Ticket updated successfully.",
    "DELETED": "Ticket deleted successfully.",
    "NOT_FOUND": "Ticket not found.",
    "ASSIGNED": "Ticket assigned successfully.",
    "ASSIGNEE_INVALID": "One or more assignees are not part of the project team.",
    "SPRINT_INVALID": "Sprint does not belong to this project.",
    "STATUS_INVALID": "Status does not belong to this project.",
    "CREATE_FAILED": "Unable to create ticket.",
    "UPDATE_FAILED": "Unable to update ticket.",
    "DELETE_FAILED": "Unable to delete ticket.",
}

CALENDAR_MESSAGES = {
    "SUCCESS": "Calendar data retrieved successfully.",
}

COMMON_MESSAGES = {
    "SUCCESS": "Operation completed successfully.",
    "VALIDATION_ERROR": "Please check the provided information.",
    "UNAUTHORIZED": "Authentication is required.",
    "FORBIDDEN": "You do not have permission to perform this action.",
    "NOT_FOUND": "Requested resource was not found.",
    "CONFLICT": "The requested operation conflicts with existing data.",
    "INTERNAL_ERROR": "An unexpected error occurred. Please try again later.",
    "DATABASE_ERROR": "A database error occurred. Please try again later.",
}
