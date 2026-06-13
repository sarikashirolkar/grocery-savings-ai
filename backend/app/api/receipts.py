import json

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.receipt import Receipt, ReceiptItem
from app.models.user import User
from app.schemas.receipt import BatchReceiptImportOut, ReceiptItemCreate, ReceiptItemUpdate, ReceiptOut, ReceiptUpload
from app.services.analytics import analyze_patterns, current_prediction_month, generate_prediction
from app.services.extraction import extract_receipt_batch, extract_receipt_items
from app.services.file_storage import save_receipt_file
from app.services.ocr import extract_text_from_file, validate_upload
from app.services.parser import infer_category, normalize_name

router = APIRouter(prefix="/receipts", tags=["receipts"])


async def _read_validated_upload(file: UploadFile) -> tuple[bytes, str | None]:
    content = await file.read()
    try:
        validate_upload(file_name=file.filename, content_type=file.content_type, size_bytes=len(content))
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return content, file.content_type


def _normalize_extracted_batch_entry(entry: dict) -> dict:
    purchase_date = entry.get("purchase_date")
    if not hasattr(purchase_date, "isoformat"):
        purchase_date = ReceiptUpload.model_validate(
            {
                "store_name": entry.get("store_name") or "Imported PDF",
                "purchase_date": purchase_date or "2026-01-01",
                "receipt_number": entry.get("receipt_number"),
                "upload_type": "batch_pdf",
                "raw_text": "",
                "total_amount": entry.get("total_amount") or 0,
                "items": [],
            }
        ).purchase_date
    return {
        **entry,
        "purchase_date": purchase_date,
    }


def _persist_receipt(
    *,
    db: Session,
    current_user: User,
    store_name: str,
    purchase_date,
    receipt_number: str | None,
    upload_type: str,
    total_amount: float,
    raw_text: str | None,
    file_name: str | None = None,
    file_path: str | None = None,
    mime_type: str | None = None,
    file_size_bytes: int | None = None,
    extraction_method: str | None = None,
    items: list[ReceiptItemCreate],
) -> Receipt:
    receipt = Receipt(
        user_id=current_user.id,
        store_name=store_name,
        purchase_date=purchase_date,
        receipt_number=receipt_number,
        upload_type=upload_type,
        total_amount=total_amount,
        raw_text=raw_text,
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
    if not receipt.total_amount:
        receipt.total_amount = round(sum(item.total_price for item in items), 2)
    return receipt


def _validated_receipt_items(items_payload: list[dict] | None, *, store_name: str, purchase_date) -> list[ReceiptItemCreate] | None:
    if not items_payload:
        return None
    return [
        ReceiptItemCreate.model_validate(
            {
                **item,
                "normalized_item_name": item.get("normalized_item_name") or normalize_name(item.get("item_name") or ""),
                "category": item.get("category") or infer_category(item.get("item_name") or ""),
                "store_name": item.get("store_name") or store_name,
                "purchase_date": item.get("purchase_date") or purchase_date,
            }
        )
        for item in items_payload
    ]


@router.post("/upload", response_model=ReceiptOut)
async def upload_receipt(
    store_name: str = Form(...),
    purchase_date: str = Form(...),
    receipt_number: str | None = Form(default=None),
    upload_type: str = Form(default="manual"),
    raw_text: str | None = Form(default=None),
    total_amount: float = Form(default=0),
    items_json: str | None = Form(default=None),
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

    provided_items = None
    if items_json:
        try:
            provided_items = json.loads(items_json)
        except json.JSONDecodeError as exc:
            raise HTTPException(status_code=400, detail="Invalid reviewed receipt items payload.") from exc
    items = _validated_receipt_items(provided_items, store_name=store_name, purchase_date=parsed_date) or extract_receipt_items(
        extracted_text or "", store_name=store_name, purchase_date=parsed_date
    )
    receipt = _persist_receipt(
        db=db,
        current_user=current_user,
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
        items=items,
    )
    db.commit()
    db.refresh(receipt)
    return receipt


@router.post("/upload-batch-pdf", response_model=BatchReceiptImportOut)
async def upload_receipt_batch_pdf(
    purchase_date_fallback: str | None = Form(default=None),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not (file.filename or "").lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Batch import requires a PDF file.")
    file_content, mime_type = await _read_validated_upload(file)
    file_path = save_receipt_file(user_id=current_user.id, original_name=file.filename, content=file_content)
    extracted_text = await extract_text_from_file(file_name=file.filename, content=file_content)
    fallback_date = ReceiptUpload.model_validate(
        {
            "store_name": "Imported PDF",
            "purchase_date": purchase_date_fallback or "2026-01-01",
            "upload_type": "batch_pdf",
            "raw_text": "",
            "total_amount": 0,
            "items": [],
        }
    ).purchase_date if purchase_date_fallback else None
    extracted_receipts = extract_receipt_batch(extracted_text, fallback_purchase_date=fallback_date)
    if not extracted_receipts:
        raise HTTPException(status_code=400, detail="No receipts could be extracted from the PDF.")
    receipts: list[Receipt] = []
    for raw_entry in extracted_receipts:
        entry = _normalize_extracted_batch_entry(raw_entry)
        receipt = _persist_receipt(
            db=db,
            current_user=current_user,
            store_name=entry["store_name"],
            purchase_date=entry["purchase_date"],
            receipt_number=entry["receipt_number"],
            upload_type="batch_pdf",
            total_amount=entry["total_amount"],
            raw_text=extracted_text,
            file_name=file.filename,
            file_path=file_path,
            mime_type=mime_type,
            file_size_bytes=len(file_content),
            extraction_method="pdf_batch_llm",
            items=entry["items"],
        )
        receipts.append(receipt)
    db.commit()
    for receipt in receipts:
        db.refresh(receipt)

    analyze_patterns(db, current_user.id)
    prediction = generate_prediction(db, current_user.id, current_prediction_month())
    return BatchReceiptImportOut(
        imported_count=len(receipts),
        receipts=receipts,
        extracted_receipt_count=len(extracted_receipts),
        prediction_month=prediction.prediction_month,
    )


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
    receipt = _persist_receipt(
        db=db,
        current_user=current_user,
        store_name=payload.store_name,
        purchase_date=payload.purchase_date,
        receipt_number=payload.receipt_number,
        upload_type=payload.upload_type,
        raw_text=payload.raw_text,
        total_amount=payload.total_amount,
        extraction_method="manual",
        items=items,
    )
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
