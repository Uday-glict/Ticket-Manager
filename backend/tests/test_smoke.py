import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app


@pytest.mark.asyncio
async def test_health():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/health")
        assert response.status_code == 200
        assert response.json() == {"status": "ok"}


@pytest.mark.asyncio
async def test_app_import():
    from app.main import app as imported_app
    assert imported_app.title == "TaskManager API"


def test_imports():
    from app.core.config import settings
    from app.db.database import engine, async_session_factory
    from app.api.v1.router import api_router
    assert settings.DATABASE_URL is not None
