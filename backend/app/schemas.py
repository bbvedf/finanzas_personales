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
    user_id: str
    
    class Config:
        from_attributes = True

# Transacción
class TransactionCreate(BaseModel):
    user_id: int
    category_id: str
    amount: float
    description: str | None = None
    date: datetime

class TransactionOut(BaseModel):
    id: str
    user_id: int
    category_id: str
    username: Optional[str] = None
    category_name: Optional[str] = None
    amount: float
    description: Optional[str] = None
    date: datetime


# Estadísticas
class StatsByUser(BaseModel):
    user_id: str
    username: str
    total: float

class StatsByCategory(BaseModel):
    category_id: str
    category_name: str
    total: float

class StatsOverTime(BaseModel):
    year: int
    month: int
    total: float
