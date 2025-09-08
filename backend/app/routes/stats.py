from fastapi import APIRouter, HTTPException
from app.schemas import StatsByUser, StatsByCategory, StatsOverTime

router = APIRouter(prefix="/stats", tags=["stats"])

# --- Helpers ---
def fix_id(doc):
    doc["id"] = str(doc["_id"])
    del doc["_id"]
    return doc

# --- Endpoints ---
@router.get("/by-user", response_model=list[StatsByUser])
async def stats_by_user():
    from app.main import app
    db = app.mongodb
    
    # 1. Obtener transacciones agrupadas por user_id de MongoDB
    pipeline = [
        {"$group": {"_id": "$user_id", "total": {"$sum": "$amount"}}}
    ]
    
    transaction_totals = await db.transactions.aggregate(pipeline).to_list(length=None)
    
    if not transaction_totals:
        raise HTTPException(status_code=404, detail="No stats found")
    
    # 2. Obtener usuarios de PostgreSQL
    from app.crud import get_users_from_postgres
    pg_users = await get_users_from_postgres()
    
    # Crear mapeo de usuarios
    user_map = {str(user['id']): user['username'] for user in pg_users}
    
    # 3. Combinar datos
    result = []
    for tx in transaction_totals:
        user_id = str(tx["_id"])
        username = user_map.get(user_id, "Usuario Desconocido")
        
        result.append({
            "user_id": user_id,
            "username": username,
            "total": tx["total"]
        })
    result = sorted(result, key=lambda x: x["username"].lower())    
    return result

@router.get("/by-category", response_model=list[StatsByCategory])
async def stats_by_category():
    from app.main import app
    db = app.mongodb
    pipeline = [
    {
        "$addFields": {
            "category_id_obj": {"$toObjectId": "$category_id"}  # convierte string a ObjectId
        }
    },
    {
        "$group": {
            "_id": "$category_id_obj",
            "total": {"$sum": "$amount"}
        }
    },
    {
        "$lookup": {
            "from": "categories",
            "localField": "_id",
            "foreignField": "_id",
            "as": "category"
        }
    },
    {"$unwind": "$category"},
    {
        "$project": {
            "category_id": "$_id",
            "category_name": "$category.name",
            "total": 1
        }
    }
]
    result = await db.transactions.aggregate(pipeline).to_list(length=None)
    if not result:
        raise HTTPException(status_code=404, detail="No stats found")
    
    result = sorted(result, key=lambda x: x["category_name"].lower())
    return [
        {
            "category_id": str(r["category_id"]),
            "category_name": r["category_name"],
            "total": r["total"]
        }
        for r in result
    ]

@router.get("/over-time", response_model=list[StatsOverTime])
async def stats_over_time(start: str = None, end: str = None):
    from app.main import app
    from datetime import datetime, timezone
    db = app.mongodb

    match_stage = {}
    if start:
        match_stage["$gte"] = datetime.fromisoformat(start).replace(tzinfo=timezone.utc)
    if end:
        match_stage["$lte"] = datetime.fromisoformat(end).replace(tzinfo=timezone.utc)

    pipeline = []
    if match_stage:
        pipeline.append({"$match": {"date": match_stage}})

    pipeline.append({
        "$group": {
            "_id": {"year": {"$year": "$date"}, "month": {"$month": "$date"}},
            "total": {"$sum": "$amount"}
        }
    })
    pipeline.append({"$sort": {"_id.year": 1, "_id.month": 1}})

    result = await db.transactions.aggregate(pipeline).to_list(length=None)
    if not result:
        raise HTTPException(status_code=404, detail="No stats found")    
    return [
        {"year": r["_id"]["year"], "month": r["_id"]["month"], "total": r["total"]}
        for r in result
    ]
