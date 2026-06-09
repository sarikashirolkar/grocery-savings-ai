import re
from datetime import date

from app.schemas.receipt import ReceiptItemCreate


CATEGORY_KEYWORDS = {
    "milk": "Dairy",
    "curd": "Dairy",
    "rice": "Grains",
    "atta": "Grains",
    "dal": "Pulses",
    "oil": "Cooking Essentials",
    "detergent": "Home Care",
    "banana": "Fruits",
    "tomato": "Vegetables",
    "potato": "Vegetables",
    "onion": "Vegetables",
    "bread": "Bakery",
    "eggs": "Protein",
}


def normalize_name(name: str) -> str:
    cleaned = re.sub(r"[^a-zA-Z0-9 ]+", " ", name).strip().lower()
    for token in ["amul", "fortune", "india gate", "aashirvaad", "surf excel", "tata sampann", "nandini"]:
        cleaned = cleaned.replace(token, "").strip()
    return re.sub(r"\s+", " ", cleaned)


def infer_category(name: str) -> str:
    lowered = name.lower()
    for keyword, category in CATEGORY_KEYWORDS.items():
        if keyword in lowered:
            return category
    return "Other"


def parse_receipt_text(raw_text: str, store_name: str, purchase_date: date) -> list[ReceiptItemCreate]:
    items: list[ReceiptItemCreate] = []
    for raw_line in raw_text.splitlines():
        line = raw_line.strip()
        if not line:
            continue
        match = re.match(r"(.+?)\s+(\d+(?:\.\d+)?)\s*x\s*(\d+(?:\.\d+)?)$", line)
        if match:
            item_name, quantity, unit_price = match.groups()
            quantity_value = float(quantity)
            unit_price_value = float(unit_price)
            items.append(
                ReceiptItemCreate(
                    item_name=item_name,
                    normalized_item_name=normalize_name(item_name),
                    brand=item_name.split()[0],
                    category=infer_category(item_name),
                    quantity=quantity_value,
                    unit="unit",
                    pack_size=None,
                    unit_price=unit_price_value,
                    total_price=quantity_value * unit_price_value,
                    discount=0,
                    offer_applied=None,
                    store_name=store_name,
                    purchase_date=purchase_date,
                )
            )
    return items
