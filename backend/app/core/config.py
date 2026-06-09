from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Grocery Savings AI API"
    secret_key: str = "change-me-for-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24
    database_url: str = "sqlite:///./grocery_savings.db"
    demo_user_email: str = "demo@grocerysavings.ai"
    demo_user_password: str = "Demo@12345"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")


settings = Settings()
