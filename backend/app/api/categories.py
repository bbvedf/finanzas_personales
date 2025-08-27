from fastapi import APIRouter, HTTPException
from app.crud import create_category, get_categories, get_category, update_category, delete_category
from app.schemas import CategoryCreate, CategoryOut

router = APIRouter(prefix="/categories", tags=["categories"])

def fix_id(cat):
    cat["id"] = str(cat["_id"])
    del cat["_id"]
    return cat

@router.post("/", response_model=CategoryOut)
async def add_category(category: CategoryCreate):
    created = await create_category(category.model_dump())
    return fix_id(created)

@router.get("/", response_model=list[CategoryOut])
async def list_categories():
    cats = await get_categories()
    return [fix_id(c) for c in cats]

@router.get("/{cat_id}", response_model=CategoryOut)
async def get_category_by_id(cat_id: str):
    cat = await get_category(cat_id)
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
    return fix_id(cat)

@router.put("/{cat_id}", response_model=CategoryOut)
async def update_category_by_id(cat_id: str, category: CategoryCreate):
    updated = await update_category(cat_id, category.model_dump())
    if not updated:
        raise HTTPException(status_code=404, detail="Category not found")
    return fix_id(updated)

@router.delete("/{cat_id}")
async def delete_category_by_id(cat_id: str):
    deleted = await delete_category(cat_id)
    if deleted == 0:
        raise HTTPException(status_code=404, detail="Category not found")
    return {"status": "deleted"}
