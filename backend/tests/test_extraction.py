from datetime import date
from unittest.mock import patch

from app.services import extraction
from app.services.extraction import (
    _ExtractedItem,
    _ExtractedReceipt,
    _ExtractedReceiptBatch,
    _ExtractedReceiptDocument,
    extract_receipt_batch,
    extract_receipt_items,
)


def test_empty_text_returns_no_items() -> None:
    assert extract_receipt_items("", "BigBazaar", date(2026, 6, 1)) == []


def test_falls_back_to_regex_parser_without_api_key() -> None:
    with patch.object(extraction, "_api_key", return_value=None):
        items = extract_receipt_items(
            "Amul Milk 2 x 50", "BigBazaar", date(2026, 6, 1)
        )
    assert len(items) == 1
    assert items[0].quantity == 2
    assert items[0].unit_price == 50
    assert items[0].store_name == "BigBazaar"


def test_uses_llm_extraction_when_key_present() -> None:
    fake = _ExtractedReceipt(
        items=[
            _ExtractedItem(
                item_name="Aashirvaad Atta",
                category="Grains",
                quantity=1,
                unit_price=240,
                total_price=240,
            )
        ]
    )

    class _Response:
        parsed_output = fake

    with patch.object(extraction, "_api_key", return_value="sk-test"), patch.object(
        extraction, "_extract_with_llm", wraps=extraction._extract_with_llm
    ):
        with patch.object(extraction, "_client") as client:
            client.return_value.messages.parse.return_value = _Response()
            items = extract_receipt_items(
                "messy ocr text", "BigBazaar", date(2026, 6, 1)
            )

    assert len(items) == 1
    assert items[0].item_name == "Aashirvaad Atta"
    assert items[0].category == "Grains"
    # normalized name is derived consistently with seeded store prices
    assert items[0].normalized_item_name == "atta"


def test_batch_extraction_returns_multiple_receipts() -> None:
    fake = _ExtractedReceiptBatch(
        receipts=[
            _ExtractedReceiptDocument(
                store_name="Blinkit",
                purchase_date="2026-06-01",
                receipt_number="A1",
                total_amount=120,
                items=[
                    _ExtractedItem(
                        item_name="Amul Milk",
                        category="Dairy",
                        quantity=1,
                        unit_price=60,
                        total_price=60,
                    )
                ],
            ),
            _ExtractedReceiptDocument(
                store_name="Dmart",
                purchase_date="2026-06-02",
                receipt_number="A2",
                total_amount=240,
                items=[
                    _ExtractedItem(
                        item_name="Aashirvaad Atta",
                        category="Grains",
                        quantity=1,
                        unit_price=240,
                        total_price=240,
                    )
                ],
            ),
        ]
    )

    class _Response:
        parsed_output = fake

    with patch.object(extraction, "_api_key", return_value="sk-test"):
        with patch.object(extraction, "_client") as client:
            client.return_value.messages.parse.return_value = _Response()
            receipts = extract_receipt_batch("multi receipt ocr text", fallback_purchase_date=date(2026, 6, 1))

    assert len(receipts) == 2
    assert receipts[0]["store_name"] == "Blinkit"
    assert receipts[1]["items"][0].normalized_item_name == "atta"
