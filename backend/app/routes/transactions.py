from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Response
from typing import List, Optional
from app.schemas import TransactionCreate, TransactionOut
from app.crud import (
    create_transaction,
    get_transactions,
    update_transaction,
    delete_transaction,
    get_users_from_postgres,
    get_categories,
    get_transactions_filtered
)
from app.core.auth import verify_token
from app.utils.email_sender import send_email


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
    user_map = {str(user['id']): user['username']
                for user in pg_users}  # ← ID como string
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
            # ← Convertir T en TZ para el manejo de fechas.
            "date": tx["date"].isoformat() + 'Z'
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
        # ← Convertir T en TZ para el manejo de fechas.
        "date": new_tx["date"].isoformat() + 'Z'
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
        # ← Convertir T en TZ para el manejo de fechas.
        "date": updated["date"].isoformat() + 'Z'
    }

# DELETE eliminar transacción


@router.delete("/{tx_id}")
async def delete_existing_transaction(tx_id: str, decoded=Depends(verify_token)):
    await delete_transaction(tx_id, decoded)
    return {"message": "Transacción eliminada"}


# EXPORTS
@router.get("/export/csv")
async def export_transactions_csv(
    decoded=Depends(verify_token),
    user_id: Optional[int] = None,
    category_id: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None
):

    # Construir filtros
    filters = {}
    if user_id is not None:
        filters["user_id"] = user_id
    if category_id:
        filters["category_id"] = category_id
    if start_date:
        filters["date"] = {"$gte": datetime.fromisoformat(
            start_date.replace('Z', ''))}
    if end_date:
        if "date" in filters:
            filters["date"]["$lte"] = datetime.fromisoformat(
                end_date.replace('Z', ''))
        else:
            filters["date"] = {"$lte": datetime.fromisoformat(
                end_date.replace('Z', ''))}

    # Usar la nueva función filtrada
    transactions = await get_transactions_filtered(decoded, filters)

    # Obtener datos de Postgres y Mongo
    pg_users = await get_users_from_postgres()
    categories = await get_categories(decoded)

    # Crear mapeos
    user_map = {str(user['id']): user['username'] for user in pg_users}
    category_map = {str(cat['_id']): cat['name'] for cat in categories}

    csv_data = "Usuario,Categoría,Monto,Fecha,Descripción\n"
    for tx in transactions:
        username = user_map.get(str(tx["user_id"]), "Unknown")
        category_name = category_map.get(str(tx["category_id"]), "Unknown")

        csv_data += f'"{username}","{category_name}",{tx["amount"]},{tx["date"]},"{tx.get("description", "")}"\n'

    filename = f"finanzas_transacciones_{datetime.now().strftime('%Y%m%d')}.csv"
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@router.post("/export/email")
async def export_transactions_email(request: dict, decoded=Depends(verify_token)):
    try:
        csv_data = request.get("csv_data", "")
        total = request.get("total_transactions", 0)
        summary_data = request.get("summary_data", [])

# Generar filas de resumen - TRANSACCIONES INDIVIDUALES
        summary_rows = ""
        if summary_data:
            max_summary_rows = 20
            display_transactions = summary_data[:min(max_summary_rows, len(summary_data))]

            for tx in display_transactions:
                # Formatear fecha
                tx_date = tx.get('fecha', '')
                if isinstance(tx_date, str) and 'T' in tx_date:
                    tx_date = tx_date.split('T')[0]  # Solo la parte de la fecha
                
                summary_rows += f"""
                <tr style="border-bottom: 1px solid #ddd;">
                    <td style="padding: 8px;">{tx['username']}</td>
                    <td style="padding: 8px;">{tx['category_name']}</td>
                    <td style="padding: 8px; text-align: right;">{tx['cantidad']:.2f} €</td>
                    <td style="padding: 8px;">{tx.get('description', '')}</td>
                    <td style="padding: 8px;">{tx_date}</td>
                </tr>
                """
            
            # Mensaje si hay más de 20 transacciones
            if len(summary_data) > max_summary_rows:
                summary_rows += f"""
                <tr>
                    <td colspan="5" style="padding: 8px; text-align: center; font-style: italic;">
                        ... y {len(summary_data) - max_summary_rows} transacciones más (ver CSV adjunto)
                    </td>
                </tr>
                """

        html_body = f"""
        <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #333;">
            <h2 style="background-color: #4F81BD; color: white; padding: 8px;">
                Reporte de Transacciones Finanzas
            </h2>
            <p><strong>Generado:</strong> {datetime.now().strftime('%d/%m/%Y %H:%M')}</p>
            <p><strong>Total de transacciones:</strong> {total}</p>
            
            <h3 style="color: #4F81BD;">Resumen</h3>
            <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
                <thead>
                    <tr style="background-color: #4F81BD; color: white;">
                        <th style="padding: 8px; text-align: left;">Usuario</th>
                        <th style="padding: 8px; text-align: left;">Categoría</th>
                        <th style="padding: 8px; text-align: right;">Cantidad</th>
                        <th style="padding: 8px; text-align: left;">Descripción</th>
                        <th style="padding: 8px; text-align: left;">Fecha</th>
                    </tr>
                </thead>
                <tbody>
                    {summary_rows}
                </tbody>
            </table>
            
            <p style="margin-top: 20px;">
                <em>Se adjunta archivo CSV con el detalle completo de transacciones.</em>
            </p>
        </div>
        """

        await send_email(decoded["email"], "Reporte de Transacciones Finanzas", html_body, csv_data)
        return {"status": "success", "message": f"Email enviado a {decoded['email']}"}

    except Exception as e:
        print(f"❌ Error completo: {repr(e)}")
        raise HTTPException(status_code=500, detail=f"Error generando reporte: {str(e)}")