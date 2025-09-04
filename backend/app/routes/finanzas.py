from fastapi import APIRouter, Depends
from app.core.auth import admin_required

router = APIRouter(prefix="/finanzas", tags=["finanzas"])

@router.get("/dashboard")
def get_dashboard(user=Depends(admin_required)):
    return {"message": f"Acceso permitido a {user['email']}"}

