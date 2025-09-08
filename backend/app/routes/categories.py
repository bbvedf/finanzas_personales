# app/routes/categories.py
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Response, Query
from typing import List, Optional
from app.schemas import CategoryCreate, CategoryOut
from app.crud import (
    create_category, get_categories,  
    update_category, delete_category, get_categories_filtered
)
from app.core.auth import verify_token
from app.utils.email_sender import send_email


router = APIRouter(prefix="/categories", tags=["categories"])

@router.get("/", response_model=List[CategoryOut])
async def list_categories(
    name: Optional[str] = Query(None),
    description: Optional[str] = Query(None),
    decoded=Depends(verify_token)
):
    # Construir filtros
    filters = {}
    if name:
        filters['name'] = name
    if description:
        filters['description'] = description
    
    # Obtener categorías filtradas
    cats = await get_categories_filtered(decoded, filters)
    
    return [
        {
            "id": str(cat["_id"]), 
            "name": cat["name"], 
            "description": cat.get("description", ""),
            "user_id": cat.get("user_id", "")
        }
        for cat in cats
    ]

# POST crear categoría
@router.post("/", response_model=CategoryOut)
async def create_new_category(category: CategoryCreate, decoded=Depends(verify_token)):
    new_cat = await create_category({
        "name": category.name,
        "description": category.description
    }, decoded)
    return {"id": str(new_cat["_id"]), "name": new_cat["name"], "description": new_cat.get("description")}

# PUT actualizar categoría
@router.put("/{cat_id}", response_model=CategoryOut)
async def update_existing_category(cat_id: str, category: CategoryCreate, decoded=Depends(verify_token)):
    updated = await update_category(cat_id, {
        "name": category.name,
        "description": category.description
    }, decoded)
    return {"id": str(updated["_id"]), "name": updated["name"], "description": updated.get("description")}

# DELETE eliminar categoría
@router.delete("/{cat_id}")
async def delete_existing_category(cat_id: str, decoded=Depends(verify_token)):
    await delete_category(cat_id, decoded)
    return {"message": "Categoría eliminada"}

# EXPORTS
@router.get("/export/csv")
async def export_categories_csv(
    decoded=Depends(verify_token),
    name: Optional[str] = None,
    description: Optional[str] = None
):
    try:
        # Construir filtros
        filters = {}
        if name:
            filters["name"] = {"$regex": name, "$options": "i"}
        if description:
            filters["description"] = {"$regex": description, "$options": "i"}

        # Usar función filtrada
        categories = await get_categories_filtered(decoded, filters)

        csv_data = "Nombre,Descripción,Usuario\n"
        for cat in categories:
            csv_data += f'"{cat["name"]}","{cat.get("description", "")}","{cat["user_id"]}"\n'

        filename = f"categorias_{datetime.now().strftime('%Y%m%d')}.csv"
        return Response(
            content=csv_data,
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error exportando categorías: {str(e)}")

@router.post("/export/email")
async def export_categories_email(request: dict, decoded=Depends(verify_token)):
    try:
        csv_data = request.get("csv_data", "")
        total = request.get("total_categories", 0)
        summary_data = request.get("summary_data", [])

        # Generar filas de resumen
        summary_rows = ""
        if summary_data:
            max_summary_rows = 20
            display_categories = summary_data[:min(max_summary_rows, len(summary_data))]
            for cat in display_categories:
                summary_rows += f"""
                <tr style="border-bottom: 1px solid #ddd;">
                    <td style="padding: 8px;">{cat['name']}</td>
                    <td style="padding: 8px;">{cat.get('description', '')}</td>
                    <td style="padding: 8px;">{cat['user_id']}</td>
                </tr>
                """
            if len(summary_data) > max_summary_rows:
                summary_rows += f"""
                <tr>
                    <td colspan="3" style="padding: 8px; text-align: center; font-style: italic;">
                        ... y {len(summary_data) - max_summary_rows} categorías más (ver CSV adjunto)
                    </td>
                </tr>
                """

        html_body = f"""
        <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #333;">
            <h2 style="background-color: #4F81BD; color: white; padding: 8px;">
                Reporte de Categorías Finanzas
            </h2>
            <p><strong>Generado:</strong> {datetime.now().strftime('%d/%m/%Y %H:%M')}</p>
            <p><strong>Total de categorías:</strong> {total}</p>
            <h3 style="color: #4F81BD;">Resumen</h3>
            <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
                <thead>
                    <tr style="background-color: #4F81BD; color: white;">
                        <th style="padding: 8px; text-align: left;">Nombre</th>
                        <th style="padding: 8px; text-align: left;">Descripción</th>
                        <th style="padding: 8px; text-align: left;">Usuario</th>
                    </tr>
                </thead>
                <tbody>
                    {summary_rows}
                </tbody>
            </table>
            <p style="margin-top: 20px;">
                <em>Se adjunta archivo CSV con el detalle completo de categorías.</em>
            </p>
        </div>
        """

        await send_email(
            decoded["email"],
            "Reporte de Categorías Finanzas",
            html_body,
            csv_data
        )
        
        return {"status": "success", "message": f"Email enviado a {decoded['email']}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error enviando email: {str(e)}")
    