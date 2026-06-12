"""Receipt line-item extraction.

Primary path uses Claude to turn messy OCR text into structured line items.
Falls back to the regex parser when no API key is configured or the call fails,
so local/demo runs keep working without credentials.
"""
import logging
import os
from datetime import date
from functools import lru_cache

import anthropic
from pydantic import BaseModel

from app.core.config import settings
from app.schemas.receipt import ReceiptItemCreate
from app.services.parser import normalize_name, parse_receipt_text

logger = logging.getLogger(__name__)


class _ExtractedItem(BaseModel):
    item_name: str
    brand: str | None = None
    category: str
    quantity: float
    unit: str | None = None
    pack_size: str | None = None
    unit_price: float
    total_price: float | None = None
    discount: float = 0
    offer_applied: str | None = None


class _ExtractedReceipt(BaseModel):
    items: list[_ExtractedItem]


class _ExtractedReceiptDocument(BaseModel):
    store_name: str
    purchase_date: str
    receipt_number: str | None = None
    total_amount: float | None = None
    items: list[_ExtractedItem]


class _ExtractedReceiptBatch(BaseModel):
    receipts: list[_ExtractedReceiptDocument]


_SYSTEM_PROMPT = (
    "You extract grocery purchases from receipt text produced by OCR. The text may be "
    "noisy, misaligned, or contain header/footer/tax lines. Return one entry per purchased "
    "product. Ignore subtotals, taxes, totals, store metadata, payment lines, and loyalty "
    "messages. Infer a concise category (e.g. Dairy, Grains, Pulses, Vegetables, Fruits, "
    "Bakery, Protein, Cooking Essentials, Home Care, Beverages, Snacks, Other). Quantities "
    "and prices must be numbers. If a line shows only a line total, set unit_price to the "
    "per-unit price and total_price to the line total; if quantity is absent assume 1. "
    "Use null for fields you cannot determine."
)

_BATCH_SYSTEM_PROMPT = (
    "You extract multiple grocery receipts from OCR text produced from a PDF bundle. "
    "The text may include several receipts, page breaks, and noisy OCR. Return one structured "
    "receipt object per real receipt. For each receipt, infer store_name, purchase_date in "
    "YYYY-MM-DD format when possible, receipt_number if visible, total_amount, and purchased "
    "items only. Ignore subtotals, tax rows, loyalty messages, and payment metadata. "
    "Infer categories using concise grocery categories. If a field is missing, use null."
)


def _api_key() -> str | None:
    return settings.anthropic_api_key or os.getenv("ANTHROPIC_API_KEY")


@lru_cache(maxsize=1)
def _client() -> anthropic.Anthropic:
    return anthropic.Anthropic(api_key=_api_key())


def _to_create(item: _ExtractedItem, store_name: str, purchase_date: date) -> ReceiptItemCreate:
    quantity = item.quantity or 1
    total_price = item.total_price if item.total_price is not None else quantity * item.unit_price
    return ReceiptItemCreate(
        item_name=item.item_name,
        normalized_item_name=normalize_name(item.item_name),
        brand=item.brand or (item.item_name.split()[0] if item.item_name.split() else None),
        category=item.category,
        quantity=quantity,
        unit=item.unit or "unit",
        pack_size=item.pack_size,
        unit_price=item.unit_price,
        total_price=round(total_price, 2),
        discount=item.discount,
        offer_applied=item.offer_applied,
        store_name=store_name,
        purchase_date=purchase_date,
    )


def _extract_with_llm(raw_text: str, store_name: str, purchase_date: date) -> list[ReceiptItemCreate]:
    response = _client().messages.parse(
        model=settings.receipt_extraction_model,
        max_tokens=8000,
        system=_SYSTEM_PROMPT,
        messages=[
            {
                "role": "user",
                "content": (
                    f"Store: {store_name}\nPurchase date: {purchase_date.isoformat()}\n\n"
                    f"Receipt text:\n{raw_text}"
                ),
            }
        ],
        output_format=_ExtractedReceipt,
    )
    parsed = response.parsed_output
    if parsed is None:
        return []
    return [_to_create(item, store_name, purchase_date) for item in parsed.items]


def extract_receipt_items(raw_text: str, store_name: str, purchase_date: date) -> list[ReceiptItemCreate]:
    """Return structured line items, preferring Claude and falling back to regex parsing."""
    if not raw_text or not raw_text.strip():
        return []
    if not _api_key():
        return parse_receipt_text(raw_text, store_name=store_name, purchase_date=purchase_date)
    try:
        return _extract_with_llm(raw_text, store_name, purchase_date)
    except Exception:  # noqa: BLE001 - never fail a receipt upload on extraction issues
        logger.exception("LLM receipt extraction failed; falling back to regex parser")
        return parse_receipt_text(raw_text, store_name=store_name, purchase_date=purchase_date)


def _extract_batch_with_llm(raw_text: str, fallback_purchase_date: date | None = None) -> list[dict]:
    response = _client().messages.parse(
        model=settings.receipt_extraction_model,
        max_tokens=8000,
        system=_BATCH_SYSTEM_PROMPT,
        messages=[
            {
                "role": "user",
                "content": (
                    "Extract every grocery receipt in this PDF text bundle.\n"
                    f"Fallback purchase date if completely missing: {fallback_purchase_date.isoformat() if fallback_purchase_date else 'unknown'}\n\n"
                    f"PDF OCR text:\n{raw_text}"
                ),
            }
        ],
        output_format=_ExtractedReceiptBatch,
    )
    parsed = response.parsed_output
    if parsed is None:
        return []
    results: list[dict] = []
    for receipt in parsed.receipts:
        try:
            purchase_date = date.fromisoformat(receipt.purchase_date)
        except Exception:
            purchase_date = fallback_purchase_date or date.today()
        items = [_to_create(item, receipt.store_name, purchase_date) for item in receipt.items]
        results.append(
            {
                "store_name": receipt.store_name,
                "purchase_date": purchase_date,
                "receipt_number": receipt.receipt_number,
                "total_amount": round(receipt.total_amount or sum(item.total_price for item in items), 2),
                "items": items,
            }
        )
    return results


def extract_receipt_batch(raw_text: str, fallback_purchase_date: date | None = None) -> list[dict]:
    if not raw_text or not raw_text.strip():
        return []
    if _api_key():
        try:
            return _extract_batch_with_llm(raw_text, fallback_purchase_date=fallback_purchase_date)
        except Exception:  # noqa: BLE001
            logger.exception("LLM batch receipt extraction failed; falling back to page split")
    chunks = [chunk.strip() for chunk in raw_text.split("\f") if chunk.strip()]
    results: list[dict] = []
    for index, chunk in enumerate(chunks, start=1):
        purchase_date = fallback_purchase_date or date.today()
        store_name = f"Imported PDF Receipt {index}"
        items = parse_receipt_text(chunk, store_name=store_name, purchase_date=purchase_date)
        if not items:
            continue
        results.append(
            {
                "store_name": store_name,
                "purchase_date": purchase_date,
                "receipt_number": None,
                "total_amount": round(sum(item.total_price for item in items), 2),
                "items": items,
            }
        )
    return results
