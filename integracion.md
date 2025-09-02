Roadmap de Integración: Finanzas + Compra-Venta
Fase 0: Preparación de entorno

Revisar que ambos proyectos corran en paralelo:

Angular + FastAPI + MongoDB (Finanzas)

Node + React + PostgreSQL + Nginx + Grafana/Prometheus (Compra-Venta)

Asegurar conectividad WSL/Multipass/Portproxy

Revisar puertos y red interna Docker

Objetivo: ambos sistemas arrancan de manera estable y aislada.

Fase 1: Autenticación unificada

Objetivo: Angular Finanzas usa login Node de Compra-Venta

Node Backend Compra-Venta:

Endpoint /auth/login → retorna JWT + rol

Endpoint /auth/verify-token

Endpoint /users/roles → devuelve permisos/estado usuario

Angular Finanzas:

Login redirige a Node si no está autenticado

Guardar token JWT en memoria/sessionStorage

Mostrar/ocultar componentes según rol (admin, basic)

Test:

Usuario aprobado+admin → accede a todas funcionalidades

Usuario aprobado+basic → acceso limitado

Usuario pendiente → redirección o mensaje

Fase 2: Autorización y protección de endpoints FastAPI

Objetivo: FastAPI reconoce y valida JWT de Node

Middleware en FastAPI para validar JWT recibido desde Angular

Rechazar peticiones sin token válido

Mantener endpoints internos /api/transactions, /api/categories, /api/users

Opcional: registrar logs de acceso de Angular en Node (como actividad de usuario)

Test:

Petición sin token → 401

Petición con token válido y rol correcto → acceso permitido

Fase 3: Integración de monitorización

Objetivo: Métricas unificadas en Grafana/Prometheus

Node Backend:

Endpoint /metrics para Prometheus

FastAPI:

Middleware o endpoint /metrics compatible con Prometheus

Configurar Prometheus:

Scrape FastAPI + Node + Docker containers

Dashboards en Grafana:

Estado usuarios, transacciones, tiempos de respuesta

Test: asegurar que alertas y métricas se muestran correctamente

Fase 4: UI/UX y navegación

Objetivo: Angular Finanzas se integra visualmente y respeta roles

Revisar rutas internas de Angular → no interferir con Node/React

Comprobar responsive y mobile

Ajustar componentes visibles según rol y estado de usuario

Test:

Comprobación de componentes visibles/ocultos

Logout y cambio de tema funcionan correctamente

Fase 5: Exportación y funcionalidades avanzadas

Opcional

Exportar transacciones → CSV/Excel

Notificaciones y alertas (Celery opcional)

Posible sincronización multiusuario con Node backend

Test:

Exportación → archivos correctos

Alertas y notificaciones funcionan según rol

--
Angular Finanzas habla con FastAPI Finanzas para datos y con Node Auth para login.
Node Auth (Compra-Venta) valida usuarios contra PostgreSQL y devuelve JWTs/roles.
FastAPI valida esos tokens y sigue usando MongoDB para las finanzas.


🔹 Dependencias entre fases
Fase 0 ──> Fase 1 ──> Fase 2 ──> Fase 3 ──> Fase 4 ──> Fase 5


Sin Fase 1 (auth unificada), Fase 2 y 4 no tienen sentido
Fase 3 es independiente en parte, pero útil para alertas tempranas
Fase 5 es opcional, depende de Fase 1-4


