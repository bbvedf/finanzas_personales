from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime

# Usuario
class UserCreate(BaseModel):
    username: str
    email: EmailStr

class UserOut(BaseModel):
    id: str
    username: str
    email: str

# Categoría
class CategoryCreate(BaseModel):
    name: str
    description: Optional[str] = None

class CategoryOut(BaseModel):
    id: str
    name: str
    description: Optional[str] = None

# Transacción
class TransactionCreate(BaseModel):
    user_id: str
    category_id: str
    amount: float
    description: str | None = None
    date: datetime = Field(default_factory=datetime.utcnow)


class TransactionOut(BaseModel):
    id: str
    user_id: str
    category_id: str
    amount: float
    description: Optional[str] = None
    date: datetime

