from fastapi import FastAPI
from app.api import users, categories, transactions
from app.config import settings
from motor.motor_asyncio import AsyncIOMotorClient

app = FastAPI(title="Finanzas Personales Backend")

# Conexión a MongoDB
@app.on_event("startup")
async def startup_db_client():
    app.mongodb_client = AsyncIOMotorClient(settings.mongo_uri)
    app.mongodb = app.mongodb_client[settings.db_name]
    print("MongoDB connected!")

# Cerrar conexión a MongoDB
@app.on_event("shutdown")
async def shutdown_db_client():
    app.mongodb_client.close()

# Incluir routers
app.include_router(users.router)
app.include_router(categories.router)
app.include_router(transactions.router)

# Endpoint de prueba
@app.get("/test")
async def test():
    return {"status": "ok"}

