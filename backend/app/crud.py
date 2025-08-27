from app.config import settings
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId

client = AsyncIOMotorClient(settings.mongo_uri)
db = client[settings.db_name]
users_collection = db["users"]

# Usuarios
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

async def create_category(cat_data: dict):
    result = await categories_collection.insert_one(cat_data)
    return await categories_collection.find_one({"_id": result.inserted_id})

async def get_categories():
    return await categories_collection.find().to_list(length=100)

async def get_category(cat_id: str):
    return await categories_collection.find_one({"_id": ObjectId(cat_id)})

async def update_category(cat_id: str, cat_data: dict):
    await categories_collection.update_one({"_id": ObjectId(cat_id)}, {"$set": cat_data})
    return await get_category(cat_id)

async def delete_category(cat_id: str):
    result = await categories_collection.delete_one({"_id": ObjectId(cat_id)})
    return result.deleted_count


# Transacciones
transactions_collection = db["transactions"]

async def create_transaction(tx_data: dict):
    result = await transactions_collection.insert_one(tx_data)
    return await transactions_collection.find_one({"_id": result.inserted_id})

async def get_transactions():
    return await transactions_collection.find().to_list(length=100)

async def get_transaction(tx_id: str):
    return await transactions_collection.find_one({"_id": ObjectId(tx_id)})

async def update_transaction(tx_id: str, tx_data: dict):
    await transactions_collection.update_one({"_id": ObjectId(tx_id)}, {"$set": tx_data})
    return await get_transaction(tx_id)

async def delete_transaction(tx_id: str):
    result = await transactions_collection.delete_one({"_id": ObjectId(tx_id)})
    return result.deleted_count