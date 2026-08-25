from pydantic_settings import BaseSettings
from typing import List
import json


class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    CORS_ORIGINS: str = '["http://localhost:5173"]'
    ENVIRONMENT: str = "development"
    MAX_AVATAR_SIZE_MB: int = 5
    ALLOWED_AVATAR_TYPES: str = '["image/jpeg","image/jpg","image/png","image/gif","image/webp","image/bmp","image/x-ms-bmp","image/svg+xml","image/tiff","image/x-tiff","image/avif","image/heic","image/heif","image/x-icon","image/vnd.microsoft.icon","image/apng"]'
    AVATAR_STORAGE_DIR: str = "uploads/avatars"

    @property
    def cors_origins_list(self) -> List[str]:
        return json.loads(self.CORS_ORIGINS)

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
