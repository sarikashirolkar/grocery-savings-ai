REGION_METADATA = {
    "india": {"currency_code": "INR", "currency_symbol": "₹", "locale": "en-IN"},
    "australia": {"currency_code": "AUD", "currency_symbol": "A$", "locale": "en-AU"},
}


def region_metadata(region: str) -> dict[str, str]:
    return REGION_METADATA.get(region, {"currency_code": "USD", "currency_symbol": "$", "locale": "en-US"})
