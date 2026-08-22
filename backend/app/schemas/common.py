from pydantic import BaseModel
from typing import Any, Optional


class PaginationMeta(BaseModel):
    page: int
    limit: int
    total: int
    total_pages: int


class SuccessResponse(BaseModel):
    success: bool = True
    message: str
    data: Any = None
    pagination: Optional[PaginationMeta] = None


class ErrorDetail(BaseModel):
    code: str


class ErrorResponse(BaseModel):
    success: bool = False
    message: str
    error: ErrorDetail
