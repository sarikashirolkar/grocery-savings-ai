from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.receipt import Receipt, ReceiptItem
from app.models.user import User
from app.schemas.receipt import ReceiptItemCreate, ReceiptItemUpdate, ReceiptOut, ReceiptUpload
from app.services.extraction import extract_receipt_items
from app.services.file_storage import save_receipt_file
from app.services.ocr import extract_text_from_file, validate_upload

router = APIRouter(prefix="/receipts", tags=["receipts"])


async def _read_validated_upload(file: UploadFile) -> tuple[bytes, str | None]:
    content = await file.read()
    try:
        validate_upload(file_name=file.filename, content_type=file.content_type, size_bytes=len(content))
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return content, file.content_type


@router.post("/upload", response_model=ReceiptOut)
async def upload_receipt(
    store_name: str = Form(...),
    purchase_date: str = Form(...),
    receipt_number: str | None = Form(default=None),
    upload_type: str = Form(default="manual"),
    raw_text: str | None = Form(default=None),
    total_amount: float = Form(default=0),
    file: UploadFile | None = File(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    parsed_date = ReceiptUpload.model_validate(
        {
            "store_name": store_name,
            "purchase_date": purchase_date,
            "receipt_number": receipt_number,
            "upload_type": upload_type,
            "raw_text": raw_text,
            "total_amount": total_amount,
            "items": [],
        }
    ).purchase_date

    extracted_text = raw_text
    file_name = None
    file_path = None
    mime_type = None
    file_size_bytes = None
    extraction_method = "manual"
    if file is not None:
        file_name = file.filename
        file_content, mime_type = await _read_validated_upload(file)
        file_path = save_receipt_file(user_id=current_user.id, original_name=file.filename, content=file_content)
        file_size_bytes = len(file_content)
        extracted_text = await extract_text_from_file(file_name=file.filename, content=file_content)
        extraction_method = "ocr_upload"
    elif extracted_text:
        extraction_method = "text_manual"

    items = extract_receipt_items(extracted_text or "", store_name=store_name, purchase_date=parsed_date)
    receipt = Receipt(
        user_id=current_user.id,
        store_name=store_name,
        purchase_date=parsed_date,
        receipt_number=receipt_number,
        upload_type=upload_type,
        total_amount=total_amount,
        raw_text=extracted_text,
        file_name=file_name,
        file_path=file_path,
        mime_type=mime_type,
        file_size_bytes=file_size_bytes,
        extraction_method=extraction_method,
    )
    db.add(receipt)
    db.flush()
    for item in items:
        db.add(ReceiptItem(receipt_id=receipt.id, **item.model_dump()))
    db.commit()
    db.refresh(receipt)
    return receipt


@router.post("/preview")
async def preview_receipt(
    store_name: str = Form(...),
    purchase_date: str = Form(...),
    raw_text: str | None = Form(default=None),
    file: UploadFile | None = File(default=None),
):
    parsed_date = ReceiptUpload.model_validate(
        {
            "store_name": store_name,
            "purchase_date": purchase_date,
            "upload_type": "preview",
            "raw_text": raw_text,
            "total_amount": 0,
            "items": [],
        }
    ).purchase_date
    extracted_text = raw_text
    if file is not None:
        file_content, _ = await _read_validated_upload(file)
        extracted_text = await extract_text_from_file(file_name=file.filename, content=file_content)
    items = extract_receipt_items(extracted_text or "", store_name=store_name, purchase_date=parsed_date)
    return {"raw_text": extracted_text, "items": [item.model_dump(mode="json") for item in items]}


@router.post("", response_model=ReceiptOut)
def create_receipt(
    payload: ReceiptUpload,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    items = payload.items or extract_receipt_items(payload.raw_text or "", store_name=payload.store_name, purchase_date=payload.purchase_date)
    receipt = Receipt(
        user_id=current_user.id,
        store_name=payload.store_name,
        purchase_date=payload.purchase_date,
        receipt_number=payload.receipt_number,
        upload_type=payload.upload_type,
        raw_text=payload.raw_text,
        total_amount=payload.total_amount,
        extraction_method="manual",
    )
    db.add(receipt)
    db.flush()
    for item in items:
        db.add(ReceiptItem(receipt_id=receipt.id, **item.model_dump()))
    if not payload.total_amount:
        receipt.total_amount = round(sum(item.total_price for item in items), 2)
    db.commit()
    db.refresh(receipt)
    return receipt


@router.get("", response_model=list[ReceiptOut])
def list_receipts(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Receipt).filter_by(user_id=current_user.id).order_by(Receipt.purchase_date.desc()).all()


@router.get("/{receipt_id}", response_model=ReceiptOut)
def get_receipt(receipt_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    receipt = db.query(Receipt).filter_by(id=receipt_id, user_id=current_user.id).first()
    if not receipt:
        raise HTTPException(status_code=404, detail="Receipt not found")
    return receipt


@router.put("/{receipt_id}/items", response_model=ReceiptOut)
def update_receipt_items(
    receipt_id: int,
    items: list[ReceiptItemUpdate],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    receipt = db.query(Receipt).filter_by(id=receipt_id, user_id=current_user.id).first()
    if not receipt:
        raise HTTPException(status_code=404, detail="Receipt not found")

    receipt.items.clear()
    db.flush()
    for item in items:
        item_payload = item.model_dump(exclude={"id"})
        db.add(ReceiptItem(receipt_id=receipt.id, **item_payload))
    receipt.total_amount = round(sum(item.total_price for item in items), 2)
    db.commit()
    db.refresh(receipt)
    return receipt


@router.delete("/{receipt_id}")
def delete_receipt(receipt_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    receipt = db.query(Receipt).filter_by(id=receipt_id, user_id=current_user.id).first()
    if not receipt:
        raise HTTPException(status_code=404, detail="Receipt not found")
    db.delete(receipt)
    db.commit()
    return {"message": "Receipt deleted"}
