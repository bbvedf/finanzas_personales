from fastapi import APIRouter, HTTPException
from app.crud import create_user, get_users, get_user, update_user, delete_user
from app.schemas import UserCreate, UserOut
from bson import ObjectId

router = APIRouter(prefix="/users", tags=["users"])

def fix_id(user):
    user["id"] = str(user["_id"])
    del user["_id"]
    return user

@router.post("/", response_model=UserOut)
async def add_user(user: UserCreate):
    user_dict = user.model_dump()
    created = await create_user(user_dict)
    return fix_id(created)

@router.get("/", response_model=list[UserOut])
async def list_users():
    users = await get_users()
    return [fix_id(u) for u in users]

@router.get("/{user_id}", response_model=UserOut)
async def get_user_by_id(user_id: str):
    user = await get_user(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return fix_id(user)

@router.put("/{user_id}", response_model=UserOut)
async def update_user_by_id(user_id: str, user: UserCreate):
    user_dict = user.model_dump()
    updated = await update_user(user_id, user_dict)
    if not updated:
        raise HTTPException(status_code=404, detail="User not found")
    return fix_id(updated)

@router.delete("/{user_id}")
async def delete_user_by_id(user_id: str):
    deleted = await delete_user(user_id)
    if deleted == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return {"status": "deleted"}
