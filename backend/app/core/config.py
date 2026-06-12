from secrets import token_urlsafe

from pydantic import Field, PrivateAttr, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    _debug_secret_key: str | None = PrivateAttr(default=None)

    app_name: str = "Grocery Savings AI API"
    debug: bool = True
    secret_key: str | None = None
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24
    database_url: str = "sqlite:///./grocery_savings.db"
    demo_user_email: str = "demo@grocerysavings.ai"
    demo_user_password: str = "Demo@12345"
    demo_region: str = "india"
    cors_origins: list[str] = Field(default_factory=lambda: ["http://localhost:3000", "http://127.0.0.1:3000"])
    max_upload_size_bytes: int = 10 * 1024 * 1024
    allowed_upload_content_types: list[str] = Field(
        default_factory=lambda: ["image/jpeg", "image/png", "image/webp", "application/pdf", "text/plain"]
    )
    receipt_upload_dir: str = "./storage/receipts"
    auth_cookie_name: str = "grocery_access_token"
    auth_cookie_secure: bool = False
    auth_cookie_samesite: str = "lax"
    # Receipt line-item extraction via Claude. When no API key is configured
    # (env or this setting), the parser falls back to the regex extractor.
    anthropic_api_key: str | None = None
    receipt_extraction_model: str = "claude-opus-4-8"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    @field_validator("cors_origins", mode="before")
    @classmethod
    def _parse_cors_origins(cls, value: object) -> object:
        if isinstance(value, str):
            return [origin.strip() for origin in value.split(",") if origin.strip()]
        return value

    @field_validator("debug", mode="before")
    @classmethod
    def _parse_debug(cls, value: object) -> object:
        if isinstance(value, str):
            normalized = value.strip().lower()
            if normalized in {"1", "true", "yes", "on", "debug", "development"}:
                return True
            if normalized in {"0", "false", "no", "off", "release", "production"}:
                return False
        return value

    @field_validator("allowed_upload_content_types", mode="before")
    @classmethod
    def _parse_upload_types(cls, value: object) -> object:
        if isinstance(value, str):
            return [item.strip() for item in value.split(",") if item.strip()]
        return value

    def validate_runtime(self) -> None:
        if not self.debug and not self.secret_key:
            raise ValueError("SECRET_KEY must be set when DEBUG is false.")
        if not self.cors_origins:
            raise ValueError("CORS_ORIGINS must contain at least one explicit frontend origin.")

    def signing_secret(self) -> str:
        if self.secret_key:
            return self.secret_key
        if self._debug_secret_key is None:
            self._debug_secret_key = token_urlsafe(32)
        return self._debug_secret_key


settings = Settings()
