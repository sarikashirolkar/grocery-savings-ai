from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.receipt import Receipt, ReceiptItem
from app.models.user import User
from app.schemas.receipt import ReceiptItemCreate, ReceiptItemUpdate, ReceiptOut, ReceiptUpload
from app.services.ocr import extract_text_from_file
from app.services.parser import parse_receipt_text

router = APIRouter(prefix="/receipts", tags=["receipts"])


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
    if file is not None:
        file_name = file.filename
        extracted_text = await extract_text_from_file(file)

    items = parse_receipt_text(extracted_text or "", store_name=store_name, purchase_date=parsed_date)
    receipt = Receipt(
        user_id=current_user.id,
        store_name=store_name,
        purchase_date=parsed_date,
        receipt_number=receipt_number,
        upload_type=upload_type,
        total_amount=total_amount,
        raw_text=extracted_text,
        file_name=file_name,
    )
    db.add(receipt)
    db.flush()
    for item in items:
        db.add(ReceiptItem(receipt_id=receipt.id, **item.model_dump()))
    db.commit()
    db.refresh(receipt)
    return receipt


@router.post("", response_model=ReceiptOut)
def create_receipt(
    payload: ReceiptUpload,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    receipt = Receipt(
        user_id=current_user.id,
        store_name=payload.store_name,
        purchase_date=payload.purchase_date,
        receipt_number=payload.receipt_number,
        upload_type=payload.upload_type,
        raw_text=payload.raw_text,
        total_amount=payload.total_amount,
    )
    db.add(receipt)
    db.flush()
    for item in payload.items:
        db.add(ReceiptItem(receipt_id=receipt.id, **item.model_dump()))
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
