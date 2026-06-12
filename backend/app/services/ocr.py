import mimetypes
import shutil
import subprocess
import tempfile
from pathlib import Path

from app.core.config import settings

class OCRAdapter:
    async def extract_text(self, *, file_name: str | None, content: bytes) -> str:
        raise NotImplementedError


class TesseractOCRAdapter(OCRAdapter):
    async def extract_text(self, *, file_name: str | None, content: bytes) -> str:
        suffix = Path(file_name or "upload.txt").suffix or ".bin"
        with tempfile.TemporaryDirectory() as tmpdir:
            input_path = Path(tmpdir) / f"upload{suffix}"
            output_base = Path(tmpdir) / "ocr_output"
            input_path.write_bytes(content)
            subprocess.run(
                ["tesseract", str(input_path), str(output_base)],
                check=True,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
            )
            txt_path = output_base.with_suffix(".txt")
            return txt_path.read_text(encoding="utf-8", errors="ignore")


class PDFTextAdapter(OCRAdapter):
    async def extract_text(self, *, file_name: str | None, content: bytes) -> str:
        with tempfile.TemporaryDirectory() as tmpdir:
            input_path = Path(tmpdir) / (file_name or "upload.pdf")
            output_path = Path(tmpdir) / "output.txt"
            input_path.write_bytes(content)
            subprocess.run(
                ["pdftotext", "-layout", str(input_path), str(output_path)],
                check=True,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
            )
            return output_path.read_text(encoding="utf-8", errors="ignore")


class PlainTextFallbackAdapter(OCRAdapter):
    async def extract_text(self, *, file_name: str | None, content: bytes) -> str:
        try:
            return content.decode("utf-8")
        except UnicodeDecodeError:
            return f"OCR preview unavailable for {file_name}. Install Tesseract for image and PDF extraction."


def _adapter() -> OCRAdapter:
    return TesseractOCRAdapter() if shutil.which("tesseract") else PlainTextFallbackAdapter()


def validate_upload(*, file_name: str | None, content_type: str | None, size_bytes: int) -> None:
    inferred_type = content_type or mimetypes.guess_type(file_name or "")[0]
    if inferred_type not in settings.allowed_upload_content_types:
        allowed = ", ".join(settings.allowed_upload_content_types)
        raise ValueError(f"Unsupported file type. Allowed types: {allowed}")
    if size_bytes > settings.max_upload_size_bytes:
        raise ValueError(f"File exceeds maximum allowed size of {settings.max_upload_size_bytes // (1024 * 1024)} MB")


async def extract_text_from_file(*, file_name: str | None, content: bytes) -> str:
    suffix = Path(file_name or "").suffix.lower()
    if suffix == ".pdf" and shutil.which("pdftotext"):
        return await PDFTextAdapter().extract_text(file_name=file_name, content=content)
    return await _adapter().extract_text(file_name=file_name, content=content)
