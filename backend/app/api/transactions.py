from fastapi import APIRouter, HTTPException
from app.crud import create_transaction, get_transactions, get_transaction, update_transaction, delete_transaction
from app.schemas import TransactionCreate, TransactionOut

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
