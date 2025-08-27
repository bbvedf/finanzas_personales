from fastapi import FastAPI
from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings

app = FastAPI(title="Finanzas Personales")

@app.on_event("startup")
async def startup_db_client():
    app.mongodb_client = AsyncIOMotorClient(settings.mongo_uri)
    app.mongodb = app.mongodb_client[settings.db_name]
    print("MongoDB connected!")

@app.on_event("shutdown")
async def shutdown_db_client():
    app.mongodb_client.close()

@app.get("/test")
async def test():
    return {"status": "ok"}
