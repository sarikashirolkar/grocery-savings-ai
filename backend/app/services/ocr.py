from fastapi import UploadFile


async def extract_text_from_file(file: UploadFile) -> str:
    content = await file.read()
    try:
        return content.decode("utf-8")
    except UnicodeDecodeError:
        return f"OCR placeholder for {file.filename}. Install Tesseract and replace this adapter for real OCR."
