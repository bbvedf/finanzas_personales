from fastapi import APIRouter, HTTPException
from app.crud import create_transaction, get_transactions, get_transaction, update_transaction, delete_transaction, transactions_collection, users_collection, categories_collection
from app.schemas import TransactionCreate, TransactionOut
from datetime import datetime, timezone
from bson import ObjectId


router = APIRouter(prefix="/transactions", tags=["transactions"])

def fix_id(tx):
    tx["id"] = str(tx["_id"])
    del tx["_id"]
    return tx

@router.post("/", response_model=TransactionOut)
async def add_transaction(tx: TransactionCreate):
    tx_dict = tx.model_dump()

    # ⚡ Convertir ambos ids a ObjectId
    tx_dict["user_id"] = ObjectId(tx_dict["user_id"])
    tx_dict["category_id"] = ObjectId(tx_dict["category_id"])

    created = await create_transaction(tx_dict)

    # fecha a string ISO
    created["date"] = created["date"].isoformat() if created.get("date") else None

    # añadir nombres
    user = await users_collection.find_one({"_id": created["user_id"]})
    category = await categories_collection.find_one({"_id": created["category_id"]})
    created["username"] = user["username"] if user else None
    created["category_name"] = category["name"] if category else None
    created["user_id"] = str(created["user_id"])
    created["category_id"] = str(created["category_id"])
    created["id"] = str(created["_id"])

    return fix_id(created)


@router.get("/{tx_id}", response_model=TransactionOut)
async def get_transaction_by_id(tx_id: str):
    tx = await get_transaction(tx_id)
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return fix_id(tx)


@router.get("/", response_model=list[TransactionOut])
async def list_transactions(
    user_id: str | None = None,
    category_id: str | None = None,
    start_date: str | None = None,
    end_date: str | None = None
):
    match_stage = {}

    # Solo convertir a ObjectId si el valor es no vacío
    if user_id and user_id.strip():
        match_stage["user_id"] = ObjectId(user_id)
    if category_id and category_id.strip():
        match_stage["category_id"] = ObjectId(category_id)

    # Solo aplicar fechas si son válidas
    date_filter = {}
    if start_date and start_date.strip():
        date_filter["$gte"] = datetime.fromisoformat(start_date).replace(tzinfo=timezone.utc)
    if end_date and end_date.strip():
        date_filter["$lte"] = datetime.fromisoformat(end_date).replace(tzinfo=timezone.utc)
    if date_filter:
        match_stage["date"] = date_filter

    pipeline = []
    if match_stage:
        pipeline.append({"$match": match_stage})

    pipeline.extend([
        {
            "$addFields": {
                "user_id_obj": {"$toObjectId": "$user_id"},
                "category_id_obj": {"$toObjectId": "$category_id"}
            }
        },
        {
            "$lookup": {
                "from": "users",
                "localField": "user_id_obj",
                "foreignField": "_id",
                "as": "user_info"
            }
        },
        {"$unwind": "$user_info"},
        {
            "$lookup": {
                "from": "categories",
                "localField": "category_id_obj",
                "foreignField": "_id",
                "as": "category"
            }
        },
        {"$unwind": "$category"},
        {
            "$project": {
                "id": {"$toString": "$_id"},
                "amount": 1,
                "description": 1,
                "date": 1,
                "user_id": {"$toString": "$user_id"},
                "username": "$user_info.username",
                "category_id": {"$toString": "$category_id"},
                "category_name": "$category.name"
            }
        }
    ])

    txs = await transactions_collection.aggregate(pipeline).to_list(length=None)

    # Convertir fechas a ISO string
    for t in txs:
        if "date" in t and t["date"]:
            t["date"] = t["date"].isoformat()

    return txs


@router.put("/{tx_id}", response_model=TransactionOut)
async def update_transaction_by_id(tx_id: str, tx: TransactionCreate):
    tx_dict = tx.model_dump()

    # Convertir los ids a ObjectId
    tx_dict["user_id"] = ObjectId(tx_dict["user_id"])
    tx_dict["category_id"] = ObjectId(tx_dict["category_id"])

    updated = await update_transaction(tx_id, tx_dict)
    if not updated:
        raise HTTPException(status_code=404, detail="Transaction not found")

    # Fecha en ISO
    updated["date"] = updated["date"].isoformat() if updated.get("date") else None

    # Añadir username y category_name para el response
    user = await users_collection.find_one({"_id": updated["user_id"]})
    category = await categories_collection.find_one({"_id": updated["category_id"]})
    updated["username"] = user["username"] if user else None
    updated["category_name"] = category["name"] if category else None
    updated["user_id"] = str(updated["user_id"])
    updated["category_id"] = str(updated["category_id"])
    updated["id"] = str(updated["_id"])

    return fix_id(updated)


@router.delete("/{tx_id}")
async def delete_transaction_by_id(tx_id: str):
    deleted = await delete_transaction(tx_id)
    if deleted == 0:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return {"status": "deleted"}

@router.get("/stats")
async def transactions_stats():
    pipeline = [
        {
            "$group": {
                "_id": "$category_id",
                "total_amount": {"$sum": "$amount"},
                "count": {"$sum": 1}
            }
        }
    ]
    stats = await transactions_collection.aggregate(pipeline).to_list(length=None)
    return stats