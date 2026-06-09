from datetime import date, timedelta

from sqlalchemy import delete
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import get_password_hash
from app.models.prediction import PredictedBasket, PredictedBasketItem
from app.models.pricing import SavingsRecommendation, Store, StorePrice, UserPurchasePattern
from app.models.receipt import Receipt, ReceiptItem
from app.models.user import User
from app.services.analytics import analyze_patterns, current_prediction_month, generate_prediction, generate_recommendation
from app.services.parser import normalize_name

DEMO_STORES = ["Dmart", "JioMart", "BigBasket", "Blinkit", "Reliance Fresh"]

DEMO_ITEMS = [
    {"item_name": "Amul Gold Milk 1L", "brand": "Amul", "category": "Dairy", "unit": "packet", "pack_size": "1L", "base_price": 68},
    {"item_name": "Nandini Curd 400g", "brand": "Nandini", "category": "Dairy", "unit": "cup", "pack_size": "400g", "base_price": 54},
    {"item_name": "Country Delight Paneer 200g", "brand": "Country Delight", "category": "Dairy", "unit": "pack", "pack_size": "200g", "base_price": 95},
    {"item_name": "Britannia Bread 400g", "brand": "Britannia", "category": "Bakery", "unit": "loaf", "pack_size": "400g", "base_price": 48},
    {"item_name": "Eggs 12 pcs", "brand": "Farm Fresh", "category": "Protein", "unit": "tray", "pack_size": "12 pcs", "base_price": 86},
    {"item_name": "Chicken Breast 500g", "brand": "Fresh Cuts", "category": "Protein", "unit": "pack", "pack_size": "500g", "base_price": 185},
    {"item_name": "Fortune Sona Masoori Rice 5kg", "brand": "Fortune", "category": "Grains", "unit": "bag", "pack_size": "5kg", "base_price": 365},
    {"item_name": "India Gate Basmati Rice 10kg", "brand": "India Gate", "category": "Grains", "unit": "bag", "pack_size": "10kg", "base_price": 920},
    {"item_name": "Aashirvaad Atta 10kg", "brand": "Aashirvaad", "category": "Grains", "unit": "bag", "pack_size": "10kg", "base_price": 468},
    {"item_name": "Poha 1kg", "brand": "24 Mantra", "category": "Breakfast", "unit": "pack", "pack_size": "1kg", "base_price": 82},
    {"item_name": "Corn Flakes 475g", "brand": "Kellogg's", "category": "Breakfast", "unit": "box", "pack_size": "475g", "base_price": 188},
    {"item_name": "Oats 1kg", "brand": "Saffola", "category": "Breakfast", "unit": "pack", "pack_size": "1kg", "base_price": 179},
    {"item_name": "Toor Dal 2kg", "brand": "Tata Sampann", "category": "Pulses", "unit": "pack", "pack_size": "2kg", "base_price": 338},
    {"item_name": "Moong Dal 1kg", "brand": "Tata Sampann", "category": "Pulses", "unit": "pack", "pack_size": "1kg", "base_price": 142},
    {"item_name": "Chana Dal 1kg", "brand": "Fortune", "category": "Pulses", "unit": "pack", "pack_size": "1kg", "base_price": 104},
    {"item_name": "Rajma 1kg", "brand": "Organic Tattva", "category": "Pulses", "unit": "pack", "pack_size": "1kg", "base_price": 159},
    {"item_name": "Fortune Sunflower Oil 5L", "brand": "Fortune", "category": "Cooking Essentials", "unit": "jar", "pack_size": "5L", "base_price": 745},
    {"item_name": "Groundnut Oil 1L", "brand": "Dhara", "category": "Cooking Essentials", "unit": "bottle", "pack_size": "1L", "base_price": 168},
    {"item_name": "Ghee 1L", "brand": "Amul", "category": "Cooking Essentials", "unit": "jar", "pack_size": "1L", "base_price": 645},
    {"item_name": "Sugar 1kg", "brand": "Madhur", "category": "Kitchen Staples", "unit": "pack", "pack_size": "1kg", "base_price": 48},
    {"item_name": "Salt 1kg", "brand": "Tata", "category": "Kitchen Staples", "unit": "pack", "pack_size": "1kg", "base_price": 24},
    {"item_name": "Tea 1kg", "brand": "Taj Mahal", "category": "Beverages", "unit": "pack", "pack_size": "1kg", "base_price": 512},
    {"item_name": "Coffee 200g", "brand": "Nescafe", "category": "Beverages", "unit": "jar", "pack_size": "200g", "base_price": 365},
    {"item_name": "Biscuits 300g", "brand": "Parle", "category": "Snacks", "unit": "pack", "pack_size": "300g", "base_price": 42},
    {"item_name": "Chips 150g", "brand": "Lays", "category": "Snacks", "unit": "pack", "pack_size": "150g", "base_price": 35},
    {"item_name": "Detergent Powder 2kg", "brand": "Surf Excel", "category": "Home Care", "unit": "pack", "pack_size": "2kg", "base_price": 329},
    {"item_name": "Dishwash Gel 750ml", "brand": "Vim", "category": "Home Care", "unit": "bottle", "pack_size": "750ml", "base_price": 96},
    {"item_name": "Floor Cleaner 1L", "brand": "Lizol", "category": "Home Care", "unit": "bottle", "pack_size": "1L", "base_price": 182},
    {"item_name": "Handwash 750ml", "brand": "Dettol", "category": "Personal Care", "unit": "bottle", "pack_size": "750ml", "base_price": 99},
    {"item_name": "Bath Soap 4 Pack", "brand": "Dove", "category": "Personal Care", "unit": "pack", "pack_size": "4 bars", "base_price": 228},
    {"item_name": "Shampoo 650ml", "brand": "Clinic Plus", "category": "Personal Care", "unit": "bottle", "pack_size": "650ml", "base_price": 342},
    {"item_name": "Toothpaste 200g", "brand": "Colgate", "category": "Personal Care", "unit": "tube", "pack_size": "200g", "base_price": 118},
    {"item_name": "Tomato 1kg", "brand": "Fresh", "category": "Vegetables", "unit": "kg", "pack_size": "1kg", "base_price": 38},
    {"item_name": "Potato 1kg", "brand": "Fresh", "category": "Vegetables", "unit": "kg", "pack_size": "1kg", "base_price": 32},
    {"item_name": "Onion 1kg", "brand": "Fresh", "category": "Vegetables", "unit": "kg", "pack_size": "1kg", "base_price": 36},
    {"item_name": "Carrot 500g", "brand": "Fresh", "category": "Vegetables", "unit": "pack", "pack_size": "500g", "base_price": 28},
    {"item_name": "Beans 500g", "brand": "Fresh", "category": "Vegetables", "unit": "pack", "pack_size": "500g", "base_price": 42},
    {"item_name": "Spinach Bunch", "brand": "Fresh", "category": "Vegetables", "unit": "bunch", "pack_size": "1 bunch", "base_price": 22},
    {"item_name": "Banana Robusta 12 pcs", "brand": "Fresh", "category": "Fruits", "unit": "dozen", "pack_size": "12 pcs", "base_price": 72},
    {"item_name": "Apple 1kg", "brand": "Fresh", "category": "Fruits", "unit": "kg", "pack_size": "1kg", "base_price": 148},
    {"item_name": "Orange 1kg", "brand": "Fresh", "category": "Fruits", "unit": "kg", "pack_size": "1kg", "base_price": 96},
    {"item_name": "Mango 1kg", "brand": "Fresh", "category": "Fruits", "unit": "kg", "pack_size": "1kg", "base_price": 124},
    {"item_name": "Paneer Tikka Masala 100g", "brand": "Everest", "category": "Spices", "unit": "pack", "pack_size": "100g", "base_price": 68},
    {"item_name": "Turmeric Powder 200g", "brand": "Everest", "category": "Spices", "unit": "pack", "pack_size": "200g", "base_price": 54},
    {"item_name": "Red Chilli Powder 200g", "brand": "Everest", "category": "Spices", "unit": "pack", "pack_size": "200g", "base_price": 66},
    {"item_name": "Coriander Powder 200g", "brand": "MDH", "category": "Spices", "unit": "pack", "pack_size": "200g", "base_price": 58},
    {"item_name": "Pasta 500g", "brand": "Sunfeast", "category": "Packaged Food", "unit": "pack", "pack_size": "500g", "base_price": 88},
    {"item_name": "Noodles 560g", "brand": "Maggi", "category": "Packaged Food", "unit": "pack", "pack_size": "560g", "base_price": 74},
    {"item_name": "Peanut Butter 1kg", "brand": "Pintola", "category": "Breakfast", "unit": "jar", "pack_size": "1kg", "base_price": 325},
    {"item_name": "Jam 500g", "brand": "Kissan", "category": "Breakfast", "unit": "jar", "pack_size": "500g", "base_price": 132},
]


def _store_multiplier(index: int) -> float:
    return [0.97, 0.99, 1.0, 1.05, 1.02][index]


def _discount_for(item_index: int, store_index: int) -> float:
    return [4, 7, 10, 5, 8][(item_index + store_index) % 5]


def _quantity_for(item_name: str, month_offset: int) -> float:
    frequent = {
        "milk": 8 + month_offset,
        "curd": 3,
        "bread": 2,
        "egg": 2,
        "tomato": 2,
        "potato": 3,
        "onion": 2,
        "banana": 2,
    }
    lowered = item_name.lower()
    for key, qty in frequent.items():
        if key in lowered:
            return qty
    return 1


def seed_store_prices(db: Session) -> int:
    existing = db.query(StorePrice).count()
    if existing:
        return existing

    today = date.today()
    for item_index, item in enumerate(DEMO_ITEMS):
        normalized = normalize_name(item["item_name"])
        for store_index, store_name in enumerate(DEMO_STORES):
            regular_price = round(item["base_price"] * _store_multiplier(store_index), 2)
            discount = _discount_for(item_index, store_index)
            offer_price = round(regular_price * (1 - discount / 100), 2)
            db.add(
                StorePrice(
                    store_name=store_name,
                    item_name=item["item_name"],
                    normalized_item_name=normalized,
                    brand=item["brand"],
                    pack_size=item["pack_size"],
                    regular_price=regular_price,
                    offer_price=offer_price,
                    discount_percentage=discount,
                    offer_description=f"{discount}% off promo",
                    valid_from=today - timedelta(days=7),
                    valid_to=today + timedelta(days=21),
                )
            )
    db.commit()
    return len(DEMO_ITEMS) * len(DEMO_STORES)


def seed_demo_data(db: Session) -> None:
    if db.query(User).filter(User.email == settings.demo_user_email).first():
        return

    db.execute(delete(PredictedBasketItem))
    db.execute(delete(PredictedBasket))
    db.execute(delete(SavingsRecommendation))
    db.execute(delete(UserPurchasePattern))
    db.execute(delete(ReceiptItem))
    db.execute(delete(Receipt))
    db.execute(delete(StorePrice))
    db.execute(delete(Store))
    db.execute(delete(User))
    db.commit()

    demo_user = User(
        full_name="Demo Family",
        email=settings.demo_user_email,
        hashed_password=get_password_hash(settings.demo_user_password),
        household_size=4,
        city="Bengaluru",
        preferred_store="Dmart",
        monthly_budget=18000,
    )
    db.add(demo_user)
    db.flush()

    for store_name in DEMO_STORES:
        db.add(Store(store_name=store_name, city="Bengaluru"))
    db.commit()

    seed_store_prices(db)

    today = date.today()
    receipt_templates = [
        (today - timedelta(days=78), "Dmart", DEMO_ITEMS[0:18]),
        (today - timedelta(days=44), "JioMart", DEMO_ITEMS[5:23]),
        (today - timedelta(days=12), "BigBasket", DEMO_ITEMS[10:28]),
    ]

    for month_offset, (purchase_date, store_name, items) in enumerate(receipt_templates):
        receipt = Receipt(
            user_id=demo_user.id,
            store_name=store_name,
            receipt_number=f"{store_name[:3].upper()}-{purchase_date.strftime('%Y%m%d')}",
            purchase_date=purchase_date,
            total_amount=0,
            upload_type="seed",
            raw_text="Synthetic seeded receipt",
            file_name=None,
        )
        db.add(receipt)
        db.flush()

        total_amount = 0.0
        for item in items:
            normalized_name = normalize_name(item["item_name"])
            quantity = _quantity_for(item["item_name"], month_offset)
            unit_price = round(item["base_price"] * (0.98 + month_offset * 0.02), 2)
            line_total = round(quantity * unit_price, 2)
            total_amount += line_total
            db.add(
                ReceiptItem(
                    receipt_id=receipt.id,
                    item_name=item["item_name"],
                    normalized_item_name=normalized_name,
                    brand=item["brand"],
                    category=item["category"],
                    quantity=quantity,
                    unit=item["unit"],
                    pack_size=item["pack_size"],
                    unit_price=unit_price,
                    total_price=line_total,
                    discount=round(max(item["base_price"] - unit_price, 0), 2),
                    offer_applied="Seeded household offer" if month_offset == 2 else None,
                    store_name=store_name,
                    purchase_date=purchase_date,
                )
            )
        receipt.total_amount = round(total_amount, 2)

    db.commit()

    analyze_patterns(db, demo_user.id)
    basket = generate_prediction(db, demo_user.id, current_prediction_month())
    generate_recommendation(db, demo_user.id, basket)
