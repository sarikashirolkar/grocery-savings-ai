from fastapi.testclient import TestClient
from unittest.mock import patch

from app.main import app


def _auth_headers(client: TestClient) -> dict[str, str]:
    response = client.post("/auth/login", json={"email": "demo@grocerysavings.ai", "password": "Demo@12345"})
    assert response.status_code == 200
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_auth_login_and_me() -> None:
    with TestClient(app) as client:
        headers = _auth_headers(client)
        response = client.get("/auth/me", headers=headers)
        assert response.status_code == 200
        assert response.json()["email"] == "demo@grocerysavings.ai"


def test_cookie_auth_login_logout_flow() -> None:
    with TestClient(app) as client:
        login = client.post("/auth/login", json={"email": "demo@grocerysavings.ai", "password": "Demo@12345"})
        assert login.status_code == 200
        assert "grocery_access_token" in login.cookies
        me = client.get("/auth/me")
        assert me.status_code == 200
        logout = client.post("/auth/logout")
        assert logout.status_code == 200


def test_prediction_and_price_compare() -> None:
    with TestClient(app) as client:
        headers = _auth_headers(client)
        prediction = client.post("/prediction/generate", headers=headers)
        assert prediction.status_code == 200
        compare = client.get("/prices/compare", headers=headers)
        assert compare.status_code == 200
        payload = compare.json()
        assert isinstance(payload, list)
        assert "options" in payload[0]


def test_recommendation_and_shopping_plan() -> None:
    with TestClient(app) as client:
        headers = _auth_headers(client)
        client.post("/prediction/generate", headers=headers)
        recommendation = client.post("/recommendations/generate", headers=headers)
        assert recommendation.status_code == 200
        sync = client.post("/shopping/sync", headers=headers)
        assert sync.status_code == 200
        plan = client.get("/shopping/plan", headers=headers)
        assert plan.status_code == 200
        assert "shopping_list" in plan.json()


def test_demo_region_switch_to_australia() -> None:
    with TestClient(app) as client:
        headers = _auth_headers(client)
        region_before = client.get("/demo/region", headers=headers)
        assert region_before.status_code == 200
        switched = client.post("/demo/region", headers=headers, json={"region": "australia"})
        assert switched.status_code == 200
        assert switched.json()["active_region"] == "australia"
        receipts = client.get("/receipts", headers=headers)
        assert receipts.status_code == 200
        assert any(receipt["store_name"] == "Woolworths" for receipt in receipts.json())


def test_batch_pdf_import_creates_multiple_receipts() -> None:
    with TestClient(app) as client:
        headers = _auth_headers(client)
        mocked_receipts = [
            {
                "store_name": "Blinkit",
                "purchase_date": "2026-06-01",
                "receipt_number": "R1",
                "total_amount": 120,
                "items": [],
            },
            {
                "store_name": "Dmart",
                "purchase_date": "2026-06-02",
                "receipt_number": "R2",
                "total_amount": 240,
                "items": [],
            },
        ]
        with patch("app.api.receipts.extract_text_from_file", return_value="pdf text"), patch(
            "app.api.receipts.extract_receipt_batch", return_value=mocked_receipts
        ), patch("app.api.receipts.analyze_patterns"), patch("app.api.receipts.generate_prediction") as generate_prediction:
            generate_prediction.return_value.prediction_month = "2026-06"
            response = client.post(
                "/receipts/upload-batch-pdf",
                headers=headers,
                files={"file": ("receipts.pdf", b"%PDF-1.4 fake", "application/pdf")},
            )
        assert response.status_code == 200
        payload = response.json()
        assert payload["imported_count"] == 2
        assert payload["extracted_receipt_count"] == 2
