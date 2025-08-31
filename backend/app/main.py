from fastapi import FastAPI
from app.api import users, categories, transactions, stats
from app.config import settings
from motor.motor_asyncio import AsyncIOMotorClient
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Finanzas Personales Backend")

# Configuración CORS
origins = [
    "http://localhost:4200",  # Angular dev server
    
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],       # GET, POST, PUT, DELETE
    allow_headers=["*"],       # Content-Type, Authorization...
)

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
app.include_router(stats.router)

# Endpoint de prueba
@app.get("/test")
async def test():
    return {"status": "ok"}

