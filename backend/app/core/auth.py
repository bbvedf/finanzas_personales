import os
import jwt
from fastapi import Request, HTTPException, Depends

JWT_SECRET = os.getenv("JWT_SECRET", "mi_secreto")
ALGORITHM = "HS256"

def verify_token(request: Request):
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Token requerido")

    token = auth_header.split(" ")[1]
    try:
        decoded = jwt.decode(token, JWT_SECRET, algorithms=[ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=403, detail="Token expirado")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=403, detail="Token inválido")

    # Chequear aprobación
    if not decoded.get("isApproved"):
        raise HTTPException(status_code=403, detail="Usuario pendiente de aprobación")

    return decoded

def admin_required(decoded: dict = Depends(verify_token)):
    if decoded.get("role") != "admin":
        raise HTTPException(
            status_code=403,
            detail="Se requieren privilegios de administrador"
        )
    return decoded
