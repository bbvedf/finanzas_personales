from fastapi import APIRouter, HTTPException
from app.crud import create_transaction, get_transactions, get_transaction, update_transaction, delete_transaction, transactions_collection
from app.schemas import TransactionCreate, TransactionOut
from datetime import datetime
from bson import ObjectId


router = APIRouter(prefix="/transactions", tags=["transactions"])

def fix_id(tx):
    tx["id"] = str(tx["_id"])
    del tx["_id"]
    return tx

@router.post("/", response_model=TransactionOut)
async def add_transaction(tx: TransactionCreate):
    created = await create_transaction(tx.model_dump())
    return fix_id(created)

@router.get("/", response_model=list[TransactionOut])
async def list_transactions():
    txs = await get_transactions()
    return [fix_id(t) for t in txs]

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
    query = {}
    if user_id:
        query["user_id"] = user_id
    if category_id:
        query["category_id"] = category_id
    if start_date or end_date:
        query["date"] = {}
        if start_date:
            query["date"]["$gte"] = datetime.fromisoformat(start_date)
        if end_date:
            query["date"]["$lte"] = datetime.fromisoformat(end_date)
    
    if query:
        txs = await transactions_collection.find(query).to_list(length=100)
    else:
        txs = await get_transactions()

    return [fix_id(t) for t in txs]

@router.put("/{tx_id}", response_model=TransactionOut)
async def update_transaction_by_id(tx_id: str, tx: TransactionCreate):
    updated = await update_transaction(tx_id, tx.model_dump())
    if not updated:
        raise HTTPException(status_code=404, detail="Transaction not found")
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