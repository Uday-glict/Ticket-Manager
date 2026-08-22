from typing import Any, Dict, Optional


def success_response(data: Any = None, message: str = "Success", pagination: Optional[Dict] = None) -> Dict:
    response = {"success": True, "message": message, "data": data}
    if pagination:
        response["pagination"] = pagination
    return response


def error_response(message: str = "Error", code: str = "ERROR") -> Dict:
    return {"success": False, "message": message, "error": {"code": code}}
