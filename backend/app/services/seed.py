from datetime import date, timedelta

from sqlalchemy import delete
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.pantry import PantryItem
from app.core.security import get_password_hash
from app.models.prediction import PredictedBasket, PredictedBasketItem
from app.models.pricing import SavingsRecommendation, Store, StorePrice, UserPurchasePattern
from app.models.receipt import Receipt, ReceiptItem
from app.models.shopping import ShoppingList, ShoppingListItem, UserSelectedStoreItem
from app.models.system import AppSetting
from app.models.user import User
from app.services.analytics import analyze_patterns, current_prediction_month, generate_prediction, generate_recommendation
from app.services.parser import normalize_name

INDIA_ITEMS = [
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

AUSTRALIA_ITEMS = [
    {"item_name": "A2 Milk Full Cream 2L", "brand": "A2 Milk", "category": "Dairy", "unit": "bottle", "pack_size": "2L", "base_price": 4.9},
    {"item_name": "Chobani Greek Yogurt 907g", "brand": "Chobani", "category": "Dairy", "unit": "tub", "pack_size": "907g", "base_price": 6.8},
    {"item_name": "Bega Tasty Cheese 500g", "brand": "Bega", "category": "Dairy", "unit": "block", "pack_size": "500g", "base_price": 7.2},
    {"item_name": "Tip Top The One Bread 700g", "brand": "Tip Top", "category": "Bakery", "unit": "loaf", "pack_size": "700g", "base_price": 4.1},
    {"item_name": "Free Range Eggs 12 Pack", "brand": "Sunny Queen", "category": "Protein", "unit": "carton", "pack_size": "12 pcs", "base_price": 6.9},
    {"item_name": "Chicken Breast Fillets 1kg", "brand": "Macro", "category": "Protein", "unit": "pack", "pack_size": "1kg", "base_price": 13.5},
    {"item_name": "SunRice Jasmine Rice 5kg", "brand": "SunRice", "category": "Grains", "unit": "bag", "pack_size": "5kg", "base_price": 13.0},
    {"item_name": "Woolworths Long Grain Rice 5kg", "brand": "Woolworths", "category": "Grains", "unit": "bag", "pack_size": "5kg", "base_price": 10.5},
    {"item_name": "Helga's Wraps 8 Pack", "brand": "Helga's", "category": "Grains", "unit": "pack", "pack_size": "8 wraps", "base_price": 4.8},
    {"item_name": "Uncle Tobys Oats 1kg", "brand": "Uncle Tobys", "category": "Breakfast", "unit": "pack", "pack_size": "1kg", "base_price": 3.9},
    {"item_name": "Weet-Bix 1.2kg", "brand": "Sanitarium", "category": "Breakfast", "unit": "box", "pack_size": "1.2kg", "base_price": 6.0},
    {"item_name": "Carman's Muesli 500g", "brand": "Carman's", "category": "Breakfast", "unit": "bag", "pack_size": "500g", "base_price": 5.9},
    {"item_name": "Red Lentils 1kg", "brand": "McKenzie's", "category": "Pulses", "unit": "pack", "pack_size": "1kg", "base_price": 4.7},
    {"item_name": "Chickpeas 500g", "brand": "McKenzie's", "category": "Pulses", "unit": "pack", "pack_size": "500g", "base_price": 2.9},
    {"item_name": "Black Beans 400g", "brand": "Edgell", "category": "Pulses", "unit": "can", "pack_size": "400g", "base_price": 1.8},
    {"item_name": "Brown Lentils 500g", "brand": "Macro", "category": "Pulses", "unit": "pack", "pack_size": "500g", "base_price": 3.4},
    {"item_name": "Cobram Estate Olive Oil 1L", "brand": "Cobram Estate", "category": "Cooking Essentials", "unit": "bottle", "pack_size": "1L", "base_price": 15.0},
    {"item_name": "Canola Oil 2L", "brand": "Woolworths", "category": "Cooking Essentials", "unit": "bottle", "pack_size": "2L", "base_price": 6.8},
    {"item_name": "Western Star Butter 500g", "brand": "Western Star", "category": "Cooking Essentials", "unit": "pack", "pack_size": "500g", "base_price": 7.5},
    {"item_name": "CSR White Sugar 1kg", "brand": "CSR", "category": "Kitchen Staples", "unit": "pack", "pack_size": "1kg", "base_price": 2.0},
    {"item_name": "Saxa Table Salt 750g", "brand": "Saxa", "category": "Kitchen Staples", "unit": "pack", "pack_size": "750g", "base_price": 1.4},
    {"item_name": "Twinings English Breakfast 100 Pack", "brand": "Twinings", "category": "Beverages", "unit": "box", "pack_size": "100 bags", "base_price": 8.9},
    {"item_name": "Moccona Coffee 400g", "brand": "Moccona", "category": "Beverages", "unit": "jar", "pack_size": "400g", "base_price": 15.0},
    {"item_name": "Arnott's Tim Tam 200g", "brand": "Arnott's", "category": "Snacks", "unit": "pack", "pack_size": "200g", "base_price": 3.5},
    {"item_name": "Smith's Chips 170g", "brand": "Smith's", "category": "Snacks", "unit": "pack", "pack_size": "170g", "base_price": 4.0},
    {"item_name": "Omo Laundry Liquid 2L", "brand": "Omo", "category": "Home Care", "unit": "bottle", "pack_size": "2L", "base_price": 12.0},
    {"item_name": "Morning Fresh Dishwashing Liquid 900ml", "brand": "Morning Fresh", "category": "Home Care", "unit": "bottle", "pack_size": "900ml", "base_price": 4.5},
    {"item_name": "Dettol Surface Spray 500ml", "brand": "Dettol", "category": "Home Care", "unit": "bottle", "pack_size": "500ml", "base_price": 5.2},
    {"item_name": "Palmolive Hand Wash 500ml", "brand": "Palmolive", "category": "Personal Care", "unit": "bottle", "pack_size": "500ml", "base_price": 3.8},
    {"item_name": "Dove Beauty Bar 4 Pack", "brand": "Dove", "category": "Personal Care", "unit": "pack", "pack_size": "4 bars", "base_price": 7.0},
    {"item_name": "Pantene Shampoo 700ml", "brand": "Pantene", "category": "Personal Care", "unit": "bottle", "pack_size": "700ml", "base_price": 10.0},
    {"item_name": "Colgate Total Toothpaste 200g", "brand": "Colgate", "category": "Personal Care", "unit": "tube", "pack_size": "200g", "base_price": 5.5},
    {"item_name": "Tomatoes 1kg", "brand": "Fresh", "category": "Vegetables", "unit": "kg", "pack_size": "1kg", "base_price": 4.5},
    {"item_name": "Potatoes 2kg", "brand": "Fresh", "category": "Vegetables", "unit": "bag", "pack_size": "2kg", "base_price": 4.0},
    {"item_name": "Brown Onions 1kg", "brand": "Fresh", "category": "Vegetables", "unit": "kg", "pack_size": "1kg", "base_price": 2.8},
    {"item_name": "Carrots 1kg", "brand": "Fresh", "category": "Vegetables", "unit": "kg", "pack_size": "1kg", "base_price": 2.4},
    {"item_name": "Broccoli Head", "brand": "Fresh", "category": "Vegetables", "unit": "each", "pack_size": "1 head", "base_price": 2.5},
    {"item_name": "Baby Spinach 120g", "brand": "Fresh", "category": "Vegetables", "unit": "bag", "pack_size": "120g", "base_price": 3.2},
    {"item_name": "Bananas 1kg", "brand": "Fresh", "category": "Fruits", "unit": "kg", "pack_size": "1kg", "base_price": 4.2},
    {"item_name": "Pink Lady Apples 1kg", "brand": "Fresh", "category": "Fruits", "unit": "kg", "pack_size": "1kg", "base_price": 5.8},
    {"item_name": "Navel Oranges 1kg", "brand": "Fresh", "category": "Fruits", "unit": "kg", "pack_size": "1kg", "base_price": 4.9},
    {"item_name": "Avocados 2 Pack", "brand": "Fresh", "category": "Fruits", "unit": "pack", "pack_size": "2 pcs", "base_price": 4.6},
    {"item_name": "MasterFoods Garlic Powder 100g", "brand": "MasterFoods", "category": "Spices", "unit": "jar", "pack_size": "100g", "base_price": 3.2},
    {"item_name": "Ground Paprika 100g", "brand": "MasterFoods", "category": "Spices", "unit": "jar", "pack_size": "100g", "base_price": 3.0},
    {"item_name": "Italian Herbs 20g", "brand": "Hoyts", "category": "Spices", "unit": "jar", "pack_size": "20g", "base_price": 2.3},
    {"item_name": "Wholemeal Pasta 500g", "brand": "San Remo", "category": "Packaged Food", "unit": "pack", "pack_size": "500g", "base_price": 2.4},
    {"item_name": "2 Minute Noodles 5 Pack", "brand": "Maggi", "category": "Packaged Food", "unit": "pack", "pack_size": "5 pack", "base_price": 4.1},
    {"item_name": "Bega Peanut Butter 500g", "brand": "Bega", "category": "Breakfast", "unit": "jar", "pack_size": "500g", "base_price": 4.7},
    {"item_name": "Beerenberg Strawberry Jam 300g", "brand": "Beerenberg", "category": "Breakfast", "unit": "jar", "pack_size": "300g", "base_price": 5.2},
]

DATASETS = {
    "india": {
        "user": {"full_name": "Demo Family India", "city": "Bengaluru", "preferred_store": "Dmart", "monthly_budget": 18000, "household_size": 4},
        "stores": ["Dmart", "JioMart", "BigBasket", "Blinkit", "Reliance Fresh"],
        "store_meta": {
            "Dmart": {"delivery_fee": 0.0, "travel_cost": 60.0, "convenience_index": 0.58},
            "JioMart": {"delivery_fee": 25.0, "travel_cost": 20.0, "convenience_index": 0.7},
            "BigBasket": {"delivery_fee": 35.0, "travel_cost": 10.0, "convenience_index": 0.82},
            "Blinkit": {"delivery_fee": 45.0, "travel_cost": 0.0, "convenience_index": 0.95},
            "Reliance Fresh": {"delivery_fee": 20.0, "travel_cost": 28.0, "convenience_index": 0.68},
        },
        "items": INDIA_ITEMS,
        "store_multipliers": [0.97, 0.99, 1.0, 1.05, 1.02],
        "discounts": [4, 7, 10, 5, 8],
        "frequent_keywords": {"milk": 8, "curd": 3, "bread": 2, "egg": 2, "tomato": 2, "potato": 3, "onion": 2, "banana": 2},
        "receipt_templates": [(78, 0, (0, 18)), (44, 1, (5, 23)), (12, 2, (10, 28))],
    },
    "australia": {
        "user": {"full_name": "Demo Family Australia", "city": "Sydney", "preferred_store": "Woolworths", "monthly_budget": 1400, "household_size": 4},
        "stores": ["Woolworths", "Coles", "ALDI", "IGA", "Amazon Fresh"],
        "store_meta": {
            "Woolworths": {"delivery_fee": 11.0, "travel_cost": 8.0, "convenience_index": 0.86},
            "Coles": {"delivery_fee": 10.0, "travel_cost": 10.0, "convenience_index": 0.84},
            "ALDI": {"delivery_fee": 0.0, "travel_cost": 18.0, "convenience_index": 0.62},
            "IGA": {"delivery_fee": 0.0, "travel_cost": 14.0, "convenience_index": 0.68},
            "Amazon Fresh": {"delivery_fee": 9.0, "travel_cost": 0.0, "convenience_index": 0.92},
        },
        "items": AUSTRALIA_ITEMS,
        "store_multipliers": [1.0, 1.01, 0.94, 1.06, 1.03],
        "discounts": [8, 6, 10, 4, 7],
        "frequent_keywords": {"milk": 4, "yogurt": 2, "bread": 2, "egg": 2, "tomatoes": 1, "potatoes": 1, "bananas": 1, "apples": 1},
        "receipt_templates": [(76, 0, (0, 18)), (41, 1, (8, 28)), (9, 2, (18, 38))],
    },
}


def available_demo_regions() -> list[str]:
    return sorted(DATASETS.keys())


def get_active_demo_region(db: Session) -> str:
    setting = db.query(AppSetting).filter_by(key="demo_region").first()
    if setting and setting.value in DATASETS:
        return setting.value
    return settings.demo_region if settings.demo_region in DATASETS else "india"


def set_active_demo_region(db: Session, region: str) -> str:
    if region not in DATASETS:
        raise ValueError(f"Unsupported demo region: {region}")
    setting = db.query(AppSetting).filter_by(key="demo_region").first()
    if setting is None:
        db.add(AppSetting(key="demo_region", value=region))
    else:
        setting.value = region
    db.commit()
    return region


def _quantity_for(item_name: str, month_offset: int, frequent_keywords: dict[str, int]) -> float:
    lowered = item_name.lower()
    for key, qty in frequent_keywords.items():
        if key in lowered:
            return qty + month_offset if key == "milk" else qty
    return 1


def seed_store_prices(db: Session, region: str) -> int:
    dataset = DATASETS[region]
    today = date.today()
    for item_index, item in enumerate(dataset["items"]):
        normalized = normalize_name(item["item_name"])
        for store_index, store_name in enumerate(dataset["stores"]):
            regular_price = round(item["base_price"] * dataset["store_multipliers"][store_index], 2)
            discount = dataset["discounts"][(item_index + store_index) % len(dataset["discounts"])]
            offer_price = round(regular_price * (1 - discount / 100), 2)
            in_stock = not ((item_index + store_index) % 11 == 0)
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
                    valid_to=today + timedelta(days=7 + ((item_index + store_index) % 14)),
                    in_stock=in_stock,
                    stock_status="in_stock" if in_stock else "out_of_stock",
                    source="seeded_demo",
                    captured_at=today,
                )
            )
    db.commit()
    return len(dataset["items"]) * len(dataset["stores"])


def _clear_demo_data(db: Session) -> None:
    db.execute(delete(PantryItem))
    db.execute(delete(PredictedBasketItem))
    db.execute(delete(PredictedBasket))
    db.execute(delete(SavingsRecommendation))
    db.execute(delete(UserSelectedStoreItem))
    db.execute(delete(ShoppingListItem))
    db.execute(delete(ShoppingList))
    db.execute(delete(UserPurchasePattern))
    db.execute(delete(ReceiptItem))
    db.execute(delete(Receipt))
    db.execute(delete(StorePrice))
    db.execute(delete(Store))
    db.execute(delete(User))
    db.commit()


def seed_demo_data(db: Session, region: str | None = None, force: bool = False) -> None:
    selected_region = region or get_active_demo_region(db)
    if selected_region not in DATASETS:
        selected_region = "india"
    current_region = get_active_demo_region(db)
    user_exists = db.query(User).filter(User.email == settings.demo_user_email).first() is not None
    if user_exists and current_region == selected_region and not force:
        return

    _clear_demo_data(db)
    set_active_demo_region(db, selected_region)
    dataset = DATASETS[selected_region]
    user_profile = dataset["user"]

    demo_user = User(
        full_name=user_profile["full_name"],
        email=settings.demo_user_email,
        hashed_password=get_password_hash(settings.demo_user_password),
        household_size=user_profile["household_size"],
        city=user_profile["city"],
        preferred_store=user_profile["preferred_store"],
        monthly_budget=user_profile["monthly_budget"],
    )
    db.add(demo_user)
    db.flush()

    for store_name in dataset["stores"]:
        meta = dataset["store_meta"][store_name]
        db.add(
            Store(
                store_name=store_name,
                city=user_profile["city"],
                delivery_fee=meta["delivery_fee"],
                travel_cost=meta["travel_cost"],
                convenience_index=meta["convenience_index"],
            )
        )
    db.commit()

    seed_store_prices(db, selected_region)

    today = date.today()
    for month_offset, (days_ago, store_index, slice_window) in enumerate(dataset["receipt_templates"]):
        purchase_date = today - timedelta(days=days_ago)
        store_name = dataset["stores"][store_index]
        items = dataset["items"][slice_window[0]:slice_window[1]]
        receipt = Receipt(
            user_id=demo_user.id,
            store_name=store_name,
            receipt_number=f"{store_name[:3].upper()}-{purchase_date.strftime('%Y%m%d')}",
            purchase_date=purchase_date,
            total_amount=0,
            upload_type="seed",
            raw_text=f"Synthetic seeded receipt for {selected_region}",
            file_name=None,
        )
        db.add(receipt)
        db.flush()

        total_amount = 0.0
        for item in items:
            normalized_name = normalize_name(item["item_name"])
            quantity = _quantity_for(item["item_name"], month_offset, dataset["frequent_keywords"])
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
