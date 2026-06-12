from __future__ import annotations

from pathlib import Path
from uuid import uuid4

from app.core.config import settings


def save_receipt_file(*, user_id: int, original_name: str | None, content: bytes) -> str:
    suffix = Path(original_name or "receipt.bin").suffix or ".bin"
    relative_dir = Path(str(user_id))
    target_dir = Path(settings.receipt_upload_dir) / relative_dir
    target_dir.mkdir(parents=True, exist_ok=True)
    file_name = f"{uuid4().hex}{suffix.lower()}"
    target_path = target_dir / file_name
    target_path.write_bytes(content)
    return str((relative_dir / file_name).as_posix())
