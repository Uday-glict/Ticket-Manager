from fastapi import HTTPException
from typing import Any


class AppException(HTTPException):
    def __init__(self, status_code: int, message: str, code: str, details: Any = None):
        super().__init__(status_code=status_code, detail=message)
        self.code = code
        self.message = message
        self.details = details


class NotFoundException(AppException):
    def __init__(self, resource: str = "Resource", code: str = "RESOURCE_NOT_FOUND", message: str = None):
        if message:
            msg = message
        elif "not found" in resource.lower():
            msg = resource
        else:
            msg = f"{resource} not found"
        super().__init__(404, msg, code)


class BadRequestException(AppException):
    def __init__(self, message: str = "Bad request", code: str = "BAD_REQUEST"):
        super().__init__(400, message, code)


class UnauthorizedException(AppException):
    def __init__(self, message: str = "Unauthorized", code: str = "UNAUTHORIZED"):
        super().__init__(401, message, code)


class ForbiddenException(AppException):
    def __init__(self, message: str = "Forbidden", code: str = "PERMISSION_DENIED"):
        super().__init__(403, message, code)


class ConflictException(AppException):
    def __init__(self, message: str = "Resource already exists", code: str = "RESOURCE_CONFLICT"):
        super().__init__(409, message, code)


class ValidationException(AppException):
    def __init__(self, message: str = "Validation error", code: str = "VALIDATION_ERROR", details: Any = None):
        super().__init__(422, message, code, details)


class DatabaseException(AppException):
    def __init__(self, message: str = "A database error occurred", code: str = "DATABASE_ERROR"):
        super().__init__(500, message, code)
