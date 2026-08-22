from fastapi import HTTPException


class AppException(HTTPException):
    def __init__(self, status_code: int, message: str, code: str):
        super().__init__(status_code=status_code, detail=message)
        self.code = code
        self.message = message


class NotFoundException(AppException):
    def __init__(self, resource: str = "Resource"):
        super().__init__(404, f"{resource} not found", "NOT_FOUND")


class BadRequestException(AppException):
    def __init__(self, message: str = "Bad request"):
        super().__init__(400, message, "BAD_REQUEST")


class UnauthorizedException(AppException):
    def __init__(self, message: str = "Unauthorized"):
        super().__init__(401, message, "UNAUTHORIZED")


class ForbiddenException(AppException):
    def __init__(self, message: str = "Forbidden"):
        super().__init__(403, message, "FORBIDDEN")


class ConflictException(AppException):
    def __init__(self, message: str = "Resource already exists"):
        super().__init__(409, message, "CONFLICT")
