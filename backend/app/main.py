from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
from app.api.v1.router import api_router
from app.core.exceptions import AppException


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield


app = FastAPI(title="TaskManager API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(AppException)
async def app_exception_handler(request: Request, exc: AppException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"success": False, "message": exc.message, "error": {"code": exc.code}},
    )


app.include_router(api_router)


@app.get("/health")
async def health():
    return {"status": "ok"}
