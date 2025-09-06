from fastapi import APIRouter, Depends, HTTPException
from typing import List
from app.schemas import TransactionCreate, TransactionOut
from app.crud import (
    create_transaction, 
    get_transactions,     
    update_transaction,
    delete_transaction,
    get_users_from_postgres,
    get_categories,
)
from app.core.auth import verify_token

router = APIRouter(prefix="/transactions", tags=["transactions"])

# GET todas las transacciones
@router.get("/", response_model=List[TransactionOut])
async def list_transactions(decoded=Depends(verify_token)):
    transactions = await get_transactions(decoded)
    
    # Obtener datos de Postgres y Mongo
    pg_users = await get_users_from_postgres()
    categories = await get_categories(decoded)
    
    print(f"Usuarios de Postgres: {pg_users}")
    
    # Crear mapeos
    user_map = {str(user['id']): user['username'] for user in pg_users}  # ← ID como string
    category_map = {str(cat['_id']): cat['name'] for cat in categories}
    
    print(f"User map: {user_map}")

    return [
        {
            "id": str(tx["_id"]),
            "user_id": tx["user_id"],
            "category_id": str(tx["category_id"]),
            "username": user_map.get(str(tx["user_id"]), "Unknown"),
            "category_name": category_map.get(str(tx["category_id"]), "Unknown"),
            "amount": tx["amount"],
            "description": tx.get("description"),
            "date": tx["date"].isoformat() + 'Z'  # ← Convertir T en TZ para el manejo de fechas.
        }
        for tx in transactions
    ]

# POST crear transacción
@router.post("/", response_model=TransactionOut)
async def create_new_transaction(transaction: TransactionCreate, decoded=Depends(verify_token)):
    new_tx = await create_transaction({
        "user_id": transaction.user_id,
        "category_id": transaction.category_id,
        "amount": transaction.amount,
        "description": transaction.description,
        "date": transaction.date,
    }, decoded)
    return {
        "id": str(new_tx["_id"]),
        "user_id": new_tx["user_id"],
        "category_id": new_tx["category_id"],
        "amount": new_tx["amount"],
        "description": new_tx.get("description"),        
        "date": new_tx["date"].isoformat() + 'Z'  # ← Convertir T en TZ para el manejo de fechas.
    }

# PUT actualizar transacción
@router.put("/{tx_id}", response_model=TransactionOut)
async def update_existing_transaction(tx_id: str, transaction: TransactionCreate, decoded=Depends(verify_token)):
    updated = await update_transaction(tx_id, {
        "user_id": transaction.user_id,
        "category_id": transaction.category_id,
        "amount": transaction.amount,
        "description": transaction.description,
        "date": transaction.date
    }, decoded)
    return {
        "id": str(updated["_id"]),
        "user_id": updated["user_id"],
        "category_id": updated["category_id"],
        "amount": updated["amount"],
        "description": updated.get("description"),        
        "date": updated["date"].isoformat() + 'Z'  # ← Convertir T en TZ para el manejo de fechas.
    }

# DELETE eliminar transacción
@router.delete("/{tx_id}")
async def delete_existing_transaction(tx_id: str, decoded=Depends(verify_token)):
    await delete_transaction(tx_id, decoded)
    return {"message": "Transacción eliminada"}