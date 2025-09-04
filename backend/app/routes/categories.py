# app/routes/categories.py
from fastapi import APIRouter, Depends
from typing import List
from app.schemas import CategoryCreate, CategoryOut
from app.crud import (
    create_category, get_categories,  
    update_category, delete_category
)
from app.core.auth import verify_token

router = APIRouter(prefix="/categories", tags=["categories"])

# GET todas las categorías
@router.get("/", response_model=List[CategoryOut])
async def list_categories(decoded=Depends(verify_token)):
    cats = await get_categories(decoded)
    return [
        {"id": str(cat["_id"]), "name": cat["name"], "description": cat.get("description")}
        for cat in cats
    ]

# POST crear categoría
@router.post("/", response_model=CategoryOut)
async def create_new_category(category: CategoryCreate, decoded=Depends(verify_token)):
    new_cat = await create_category({
        "name": category.name,
        "description": category.description
    }, decoded)
    return {"id": str(new_cat["_id"]), "name": new_cat["name"], "description": new_cat.get("description")}

# PUT actualizar categoría
@router.put("/{cat_id}", response_model=CategoryOut)
async def update_existing_category(cat_id: str, category: CategoryCreate, decoded=Depends(verify_token)):
    updated = await update_category(cat_id, {
        "name": category.name,
        "description": category.description
    }, decoded)
    return {"id": str(updated["_id"]), "name": updated["name"], "description": updated.get("description")}

# DELETE eliminar categoría
@router.delete("/{cat_id}")
async def delete_existing_category(cat_id: str, decoded=Depends(verify_token)):
    await delete_category(cat_id, decoded)
    return {"message": "Categoría eliminada"}
