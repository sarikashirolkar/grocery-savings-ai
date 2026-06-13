import csv
import io
from datetime import date

from sqlalchemy.orm import Session

from app.models.pricing import StorePrice
from app.services.parser import normalize_name


def import_store_prices_csv(db: Session, content: bytes, source: str) -> dict:
    decoded = content.decode("utf-8-sig")
    reader = csv.DictReader(io.StringIO(decoded))
    required = {"store_name", "item_name", "regular_price", "offer_price", "valid_from", "valid_to"}
    if not reader.fieldnames or not required.issubset(set(reader.fieldnames)):
        raise ValueError("CSV must include store_name, item_name, regular_price, offer_price, valid_from, and valid_to columns.")

    imported_count = 0
    stores_touched: set[str] = set()

    for row in reader:
        item_name = (row.get("item_name") or "").strip()
        store_name = (row.get("store_name") or "").strip()
        if not item_name or not store_name:
            continue
        regular_price = float(row.get("regular_price") or 0)
        offer_price = float(row.get("offer_price") or regular_price)
        discount_percentage = float(row.get("discount_percentage") or 0)
        if not discount_percentage and regular_price > 0:
            discount_percentage = round(max(0, ((regular_price - offer_price) / regular_price) * 100), 2)

        price = StorePrice(
            store_name=store_name,
            item_name=item_name,
            normalized_item_name=(row.get("normalized_item_name") or normalize_name(item_name)),
            brand=(row.get("brand") or None),
            pack_size=(row.get("pack_size") or None),
            regular_price=regular_price,
            offer_price=offer_price,
            discount_percentage=discount_percentage,
            offer_description=(row.get("offer_description") or None),
            valid_from=date.fromisoformat(row["valid_from"]),
            valid_to=date.fromisoformat(row["valid_to"]),
            in_stock=str(row.get("in_stock", "true")).strip().lower() not in {"false", "0", "no"},
            stock_status=(row.get("stock_status") or "in_stock"),
            source=source,
            captured_at=date.today(),
        )
        db.add(price)
        imported_count += 1
        stores_touched.add(store_name)

    db.commit()
    return {
        "imported_count": imported_count,
        "source": source,
        "stores_touched": sorted(stores_touched),
    }
