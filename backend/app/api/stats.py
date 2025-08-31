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
    from app.main import app  # Tomar la conexión Mongo ya definida
    db = app.mongodb
    pipeline = [
        {"$group": {"_id": "$user_id", "total": {"$sum": "$amount"}}}
    ]
    result = await db.transactions.aggregate(pipeline).to_list(length=None)
    if not result:
        raise HTTPException(status_code=404, detail="No stats found")
    return [{"user_id": r["_id"], "total": r["total"]} for r in result]

@router.get("/by-category", response_model=list[StatsByCategory])
async def stats_by_category():
    from app.main import app
    db = app.mongodb
    pipeline = [
        {"$group": {"_id": "$category_id", "total": {"$sum": "$amount"}}}
    ]
    result = await db.transactions.aggregate(pipeline).to_list(length=None)
    if not result:
        raise HTTPException(status_code=404, detail="No stats found")
    return [{"category_id": r["_id"], "total": r["total"]} for r in result]

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
