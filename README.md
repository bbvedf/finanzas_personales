# Finanzas Personales

Proyecto de aplicación de finanzas personales usando FastAPI + Angular.

## Stack Tecnológico

![Python](https://img.shields.io/badge/python-3.11-blue)
![FastAPI](https://img.shields.io/badge/FastAPI-0.101.0-green)
![Angular](https://img.shields.io/badge/Angular-16-red)
![MongoDB](https://img.shields.io/badge/MongoDB-6.0-brightgreen)
![Docker](https://img.shields.io/badge/Docker-enabled-blue)
![WSL](https://img.shields.io/badge/WSL-Ubuntu%2020.04-orange)

## Roadmap de desarrollo

### Fase 1: Backend y CRUD básico
- Configuración de entorno Python + virtualenv
- FastAPI: endpoints CRUD para usuarios, categorías y transacciones
- Conexión a MongoDB
- Testing básico

### Fase 2: Dashboard y análisis
- Endpoints para estadísticas y agregados
- Angular: listado de transacciones, filtros, gráficos

### Fase 3: Funcionalidades adicionales
- Exportación a CSV/Excel
- Notificaciones o alertas (Celery opcional)
- Mejoras de UX/UI

### Fase 4: Opcional
- Multiusuario y compartición de datos
- Integración con app móvil


## 🗂 Estructura de carpetas
finanzas_personales/  
│  
├─ backend/  
│   ├─ app/  
│   │   ├─ main.py              # Punto de entrada FastAPI  
│   │   ├─ models.py            # Modelos de MongoDB (Motor)  
│   │   ├─ schemas.py           # Pydantic schemas (validación/serialización)  
│   │   ├─ crud.py              # Funciones CRUD para usuarios, transacciones, categorías  
│   │   ├─ api/  
│   │   │   ├─ users.py         # Endpoints de usuarios  
│   │   │   ├─ transactions.py  # Endpoints de transacciones  
│   │   │   └─ categories.py    # Endpoints de categorías  
│   │   └─ config.py            # Configuración (DB URI, JWT, etc.)  
│   │  
│   ├─ tests/                   # Tests de endpoints y modelos  
│   └─ requirements.txt         # Dependencias Python  
│  
├─ frontend/  
│   ├─ angular.json             # Configuración Angular  
│   ├─ package.json  
│   ├─ src/  
│   │   ├─ app/  
│   │   │   ├─ components/      # Componentes reutilizables  
│   │   │   ├─ pages/           # Páginas (dashboard, login, transacciones)  
│   │   │   ├─ services/        # Servicios Angular (API calls)  
│   │   │   └─ app.module.ts  
│   │   └─ assets/              # Imágenes, estilos, iconos  
│   └─ tsconfig.json  
│  
├─ .env  
├─ README.md  
└─ .gitignore  
