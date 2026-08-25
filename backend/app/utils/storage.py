import os
import uuid
import logging
from pathlib import Path
from typing import Tuple
from fastapi import UploadFile
from PIL import Image, UnidentifiedImageError
import io

from app.core.config import settings

logger = logging.getLogger(__name__)

ALLOWED_MIME_TO_EXT = {
    "image/jpeg": ".jpg",
    "image/jpg": ".jpg",
    "image/png": ".png",
    "image/gif": ".gif",
    "image/webp": ".webp",
    "image/bmp": ".bmp",
    "image/x-ms-bmp": ".bmp",
    "image/svg+xml": ".svg",
    "image/tiff": ".tiff",
    "image/x-tiff": ".tiff",
    "image/avif": ".avif",
    "image/heic": ".heic",
    "image/heif": ".heif",
    "image/x-icon": ".ico",
    "image/vnd.microsoft.icon": ".ico",
    "image/apng": ".png",
}

MAX_SIZE_BYTES = settings.MAX_AVATAR_SIZE_MB * 1024 * 1024


def _get_storage_root() -> Path:
    base = Path(__file__).resolve().parents[2]
    root = base / settings.AVATAR_STORAGE_DIR
    root.mkdir(parents=True, exist_ok=True)
    return root


def validate_avatar_file(file: UploadFile) -> Tuple[bytes, str]:
    if not file or not file.filename:
        raise ValueError("No file provided")
    content_type = (file.content_type or "").lower().strip()
    allowed = []
    try:
        import json
        allowed = json.loads(settings.ALLOWED_AVATAR_TYPES)
    except Exception:
        allowed = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp", "image/bmp", "image/svg+xml", "image/tiff", "image/avif", "image/x-icon"]
    if content_type not in allowed:
        raise ValueError(f"Image format not supported. Supported formats: JPEG, PNG, GIF, WEBP, BMP, SVG, TIFF, AVIF, HEIC, ICO")
    ext = ALLOWED_MIME_TO_EXT.get(content_type)
    if not ext:
        raise ValueError("Unsupported image type")
    file.file.seek(0, os.SEEK_END)
    size = file.file.tell()
    file.file.seek(0)
    if size == 0:
        raise ValueError("Empty file not allowed")
    if size > MAX_SIZE_BYTES:
        raise ValueError(f"File size exceeds {settings.MAX_AVATAR_SIZE_MB}MB limit")
    try:
        data = file.file.read()
        file.file.seek(0)
        if content_type == "image/svg+xml":
            if b"<svg" not in data.lower() and b"<?xml" not in data.lower():
                raise ValueError("Invalid SVG file")
            return data, ext
        img = Image.open(io.BytesIO(data))
        img.verify()
        img = Image.open(io.BytesIO(data))
        if img.format not in ("JPEG", "JPG", "PNG", "GIF", "WEBP", "BMP", "TIFF", "TIF", "ICO", "AVIF", "HEIF", "HEIC", "PNG"):
            raise ValueError("Invalid image content")
        if img.mode not in ("RGB", "RGBA", "L", "P", "LA", "PA", "CMYK", "YCbCr"):
            raise ValueError("Invalid image mode")
    except UnidentifiedImageError:
        raise ValueError("Corrupted or invalid image file")
    except ValueError:
        raise
    except Exception:
        logger.exception("Image validation failed")
        raise ValueError("Invalid image file")
    return data, ext


def save_avatar(file: UploadFile, user_id: str, ext: str, data: bytes) -> str:
    try:
        if ext == ".svg":
            safe_name = f"{uuid.uuid4().hex}{ext}"
            user_dir = _get_storage_root() / str(user_id)
            user_dir.mkdir(parents=True, exist_ok=True)
            save_path = user_dir / safe_name
            save_path.write_bytes(data)
        elif ext in (".gif", ".ico"):
            safe_name = f"{uuid.uuid4().hex}{ext}"
            user_dir = _get_storage_root() / str(user_id)
            user_dir.mkdir(parents=True, exist_ok=True)
            save_path = user_dir / safe_name
            save_path.write_bytes(data)
        else:
            img = Image.open(io.BytesIO(data))
            if img.mode in ("RGBA", "P", "LA", "PA"):
                bg = Image.new("RGB", img.size, (255, 255, 255))
                if img.mode == "P":
                    img = img.convert("RGBA")
                if img.mode == "RGBA":
                    bg.paste(img, mask=img.split()[3])
                elif img.mode in ("LA", "PA"):
                    bg.paste(img, mask=img.split()[-1] if len(img.split()) > 1 else None)
                else:
                    bg.paste(img)
                img = bg
            elif img.mode not in ("RGB",):
                try:
                    img = img.convert("RGB")
                except Exception:
                    img = img.convert("RGB")
            max_dim = 512
            if max(img.size) > max_dim:
                img.thumbnail((max_dim, max_dim), Image.LANCZOS)
            safe_name = f"{uuid.uuid4().hex}{ext}"
            user_dir = _get_storage_root() / str(user_id)
            user_dir.mkdir(parents=True, exist_ok=True)
            save_path = user_dir / safe_name
            if ext == ".png":
                img.save(save_path, format="PNG", optimize=True)
            elif ext == ".webp":
                img.save(save_path, format="WEBP", quality=85)
            elif ext == ".bmp":
                img.save(save_path, format="BMP")
            elif ext in (".tiff",):
                img.save(save_path, format="TIFF")
            elif ext in (".avif",):
                try:
                    img.save(save_path, format="AVIF", quality=85)
                except Exception:
                    img.save(save_path, format="JPEG", quality=85, optimize=True)
                    save_path = save_path.with_suffix(".jpg")
                    safe_name = safe_name.replace(".avif", ".jpg")
            elif ext in (".heic", ".heif"):
                try:
                    img.save(save_path, format="HEIF", quality=85)
                except Exception:
                    img.save(save_path, format="JPEG", quality=85, optimize=True)
                    save_path = save_path.with_suffix(".jpg")
                    safe_name = safe_name.replace(ext, ".jpg")
            else:
                img.save(save_path, format="JPEG", quality=85, optimize=True)
        rel = f"/{settings.AVATAR_STORAGE_DIR}/{user_id}/{safe_name}"
        rel = rel.replace("//", "/")
        if not rel.startswith("/"):
            rel = "/" + rel
        logger.info("Avatar stored | user_id=%s | path=%s", user_id, rel)
        return rel
    except Exception:
        logger.exception("Failed to store avatar | user_id=%s", user_id)
        raise


def delete_avatar_file(avatar_url: str) -> None:
    if not avatar_url:
        return
    try:
        rel = avatar_url.lstrip("/")
        if ".." in rel or rel.startswith("/"):
            rel = rel.lstrip("/")
        base = Path(__file__).resolve().parents[2]
        full = base / rel
        storage_root = _get_storage_root().resolve()
        try:
            full.resolve().relative_to(storage_root)
        except ValueError:
            logger.warning("Blocked path traversal attempt | url=%s", avatar_url)
            return
        if full.exists() and full.is_file():
            full.unlink()
            logger.info("Old avatar deleted | url=%s", avatar_url)
            try:
                parent = full.parent
                if parent != storage_root and not any(parent.iterdir()):
                    parent.rmdir()
            except Exception:
                pass
    except Exception:
        logger.exception("Failed to delete old avatar | url=%s", avatar_url)
