from typing import Any, Dict, Optional


def success_response(data: Any = None, message: str = "Success", pagination: Optional[Dict] = None) -> Dict:
    response: Dict[str, Any] = {"success": True, "message": message, "data": data}
    if pagination:
        response["pagination"] = pagination
    return response


def error_response(message: str = "Error", code: str = "ERROR", details: Any = None) -> Dict:
    return {"success": False, "message": message, "error": {"code": code, "details": details}}


def paginated_response(data: Any, pagination: Dict, message: str = "Success") -> Dict:
    return {"success": True, "message": message, "data": data, "pagination": pagination}
