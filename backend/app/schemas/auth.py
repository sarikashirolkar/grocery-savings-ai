from pydantic import BaseModel, ConfigDict, EmailStr


class UserCreate(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    household_size: int = 1
    city: str = "Bengaluru"
    preferred_store: str | None = None
    monthly_budget: float | None = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    full_name: str
    email: EmailStr
    household_size: int
    city: str
    preferred_store: str | None = None
    monthly_budget: float | None = None
