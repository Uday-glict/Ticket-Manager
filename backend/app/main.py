from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from fastapi.staticfiles import StaticFiles
from pathlib import Path
from contextlib import asynccontextmanager
from app.api.v1.router import api_router
from app.core.exceptions import AppException
from app.constants.messages import COMMON_MESSAGES
from app.constants.error_codes import INTERNAL_SERVER_ERROR, VALIDATION_ERROR
import logging

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        from app.db.database import async_session_factory
        from app.models.permission import Permission
        from app.constants.permissions import Permissions
        from sqlalchemy import select
        async with async_session_factory() as session:
            result = await session.execute(select(Permission.name))
            existing_names = {row[0] for row in result.all()}
            missing = [n for n in Permissions.ALL if n not in existing_names]
            if missing:
                for name in missing:
                    group = name.split(".")[0] if "." in name else "general"
                    session.add(Permission(name=name, group_name=group))
                await session.commit()
                logger.info("Seeded %d missing permissions", len(missing))
    except Exception:
        logger.exception("Permission seeding failed")
    yield


app = FastAPI(title="TaskManager API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

uploads_path = Path(__file__).resolve().parent.parent / "uploads"
uploads_path.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(uploads_path)), name="uploads")


@app.exception_handler(AppException)
async def app_exception_handler(request: Request, exc: AppException):
    content = {
        "success": False,
        "message": exc.message,
        "error": {"code": exc.code, "details": exc.details},
    }
    return JSONResponse(status_code=exc.status_code, content=content)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    details = []
    for error in exc.errors():
        field = ".".join(str(loc) for loc in error["loc"] if loc != "body")
        details.append({"field": field, "message": error["msg"]})
    return JSONResponse(
        status_code=422,
        content={
            "success": False,
            "message": COMMON_MESSAGES["VALIDATION_ERROR"],
            "error": {"code": VALIDATION_ERROR, "details": details},
        },
    )


@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled exception")
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "message": COMMON_MESSAGES["INTERNAL_ERROR"],
            "error": {"code": INTERNAL_SERVER_ERROR, "details": None},
        },
    )


app.include_router(api_router)


@app.get("/health")
async def health():
    return {"status": "ok"}
