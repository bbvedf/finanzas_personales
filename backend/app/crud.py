from app.config import settings
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
from fastapi import HTTPException
import asyncpg 
import os
from dotenv import load_dotenv
load_dotenv()

client = AsyncIOMotorClient(settings.mongo_uri)
db = client[settings.db_name]

# Comun. Conexion con Postgres.
async def get_users_from_postgres():
    conn = None
    try:
        conn = await asyncpg.connect(
            host=os.getenv('POSTGRES_HOST'),
            port=int(os.getenv('POSTGRES_PORT')),
            user=os.getenv('POSTGRES_USER'),
            password=os.getenv('POSTGRES_PASSWORD'),
            database=os.getenv('POSTGRES_DATABASE')
        )
        users = await conn.fetch("SELECT id, username FROM users")
        return users
    except Exception as e:
        print(f"Error conectando a Postgres: {e}")
        return []
    finally:
        if conn:
            await conn.close()


# Usuarios
users_collection = db["users"]

async def create_user(user_data: dict):
    result = await users_collection.insert_one(user_data)
    return await users_collection.find_one({"_id": result.inserted_id})

async def get_users():
    return await users_collection.find().to_list(length=100)

async def get_user(user_id: str):
    return await users_collection.find_one({"_id": ObjectId(user_id)})

async def update_user(user_id: str, user_data: dict):
    await users_collection.update_one({"_id": ObjectId(user_id)}, {"$set": user_data})
    return await get_user(user_id)

async def delete_user(user_id: str):
    result = await users_collection.delete_one({"_id": ObjectId(user_id)})
    return result.deleted_count


# Categorías
categories_collection = db["categories"]

async def create_category(cat_data: dict, user: dict):
    cat_data["user_id"] = user["userId"]
    result = await categories_collection.insert_one(cat_data)
    return await categories_collection.find_one({"_id": result.inserted_id})

async def get_categories(user: dict):
    query = {}
    if user["role"] != "admin":
        query["user_id"] = user["userId"]
    return await categories_collection.find(query).to_list(length=100)

async def get_category(cat_id: str, user: dict):
    query = {"_id": ObjectId(cat_id)}
    if user["role"] != "admin":
        query["user_id"] = user["userId"]

    category = await categories_collection.find_one(query)
    if not category:
        raise HTTPException(status_code=404, detail="Categoría no encontrada o sin permisos")
    return category

async def update_category(cat_id: str, cat_data: dict, user: dict):
    query = {"_id": ObjectId(cat_id)}
    if user["role"] != "admin":
        query["user_id"] = user["userId"]

    result = await categories_collection.update_one(query, {"$set": cat_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="No tienes permisos para actualizar esta categoría")

    return await categories_collection.find_one({"_id": ObjectId(cat_id)})

async def delete_category(cat_id: str, user: dict):
    query = {"_id": ObjectId(cat_id)}
    if user["role"] != "admin":
        query["user_id"] = user["userId"]

    result = await categories_collection.delete_one(query)
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="No tienes permisos para eliminar esta categoría")

    return {"deleted": True}


# Transacciones
transactions_collection = db["transactions"]

async def create_transaction(tx_data: dict, user: dict):
    # Si viene user_id en los datos y es diferente al usuario logueado
    if "user_id" in tx_data and tx_data["user_id"] != user["userId"]:
        # Verificar si es admin
        if user.get("role") != "admin":
            raise HTTPException(
                status_code=403, 
                detail="Solo administradores pueden crear transacciones para otros usuarios"
            )
    else:
        # Usar el user_id del usuario logueado
        tx_data["user_id"] = user["userId"]
    
    # Mover la conversión de fecha FUERA del else
    if "date" in tx_data and isinstance(tx_data["date"], str):
        tx_data["date"] = datetime.fromisoformat(tx_data["date"].replace('Z', ''))
    
    result = await transactions_collection.insert_one(tx_data)
    return await transactions_collection.find_one({"_id": result.inserted_id})

async def get_transactions(user: dict):
    query = {}
    if user["role"] != "admin":
        query["user_id"] = user["userId"]  # ← Filtrar por usuario
    return await transactions_collection.find(query).to_list(length=1000)

async def get_transaction(tx_id: str, user: dict):
    query = {"_id": ObjectId(tx_id)}
    if user["role"] != "admin":
        query["user_id"] = user["userId"]
    
    transaction = await transactions_collection.find_one(query)
    if not transaction:
        raise HTTPException(status_code=404, detail="Transacción no encontrada")
    return transaction

async def update_transaction(tx_id: str, tx_data: dict, user: dict):
    query = {"_id": ObjectId(tx_id)}
    if user["role"] != "admin":
        query["user_id"] = user["userId"]
    
    # Corregir indentación
    if "date" in tx_data and isinstance(tx_data["date"], str):
        tx_data["date"] = datetime.fromisoformat(tx_data["date"].replace('Z', ''))
    
    result = await transactions_collection.update_one(query, {"$set": tx_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Transacción no encontrada")
    return await get_transaction(tx_id, user)


async def delete_transaction(tx_id: str, user: dict):
    query = {"_id": ObjectId(tx_id)}
    if user["role"] != "admin":
        query["user_id"] = user["userId"]
    
    result = await transactions_collection.delete_one(query)
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Transacción no encontrada")
    return result.deleted_count

async def get_transactions_filtered(user: dict, filters: dict = None):
    query = {}
    if user["role"] != "admin":
        query["user_id"] = user["userId"]
    
    # Aplicar filtros adicionales si existen
    if filters:
        query.update(filters)
    
    return await transactions_collection.find(query).to_list(length=1000)