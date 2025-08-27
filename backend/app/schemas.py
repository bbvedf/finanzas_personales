from pydantic import BaseModel, EmailStr
from typing import Optional

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
    description: Optional[str] = None

class TransactionOut(BaseModel):
    id: str
    user_id: str
    category_id: str
    amount: float
    description: Optional[str] = None

