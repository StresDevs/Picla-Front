# Picla Front

Aplicación web para gestión integral de repuestos: inventario, POS, caja, cotizaciones, créditos, reportes, auditoría y administración.

## Resumen General

El proyecto está construido con Next.js App Router y una arquitectura híbrida:

- Flujo principal en frontend con datos mock persistidos en localStorage.
- Integración base con Supabase para autenticación y endpoints administrativos.
- Componentes UI reutilizables y navegación modular por dominio.

El estado actual permite recorrer y probar todos los módulos funcionales con comportamiento realista usando mock data, mientras se completa la migración de reglas críticas al backend.

## Stack Técnico

- Next.js 16 (App Router)
- React 19
- TypeScript
- Tailwind CSS
- Componentes UI basados en Radix + librería interna de componentes
- Supabase JS (auth y servicios)

## Arquitectura Funcional

### 1. Capa de Presentación

- Rutas en app/ por módulo de negocio.
- Layout compartido en components/layout con sidebar persistente.
- Subnavegaciones por módulo en components/modules.
- Componentes comunes: tabla, headers, tarjetas de métricas, formularios.

### 2. Capa de Estado y Datos Mock

- Servicio central en lib/mock/runtime-store.ts.
- Persistencia local en localStorage por llaves de dominio (productos, traspasos, cotizaciones, créditos, usuarios, etc.).
- Seeds automáticos para iniciar datos de ejemplo si no existen.

### 3. Capa de Integración Backend

- Cliente Supabase en lib/supabase/client.ts.
- Auth de login/logout en lib/supabase/auth.ts.
- Endpoint admin para creación de usuarios en app/api/admin/users/route.ts.

## Módulos y Cómo Funcionan

### Dashboard

- Vista general de métricas del sistema.
- Punto de entrada a navegación operativa.

### Inventario

- Productos, kits, ingresos y salidas.
- Traspasos entre sucursales (simples y masivos).
- Anulaciones/devoluciones/reposiciones de traspasos.
- Historial de traspasos con filtros incluyendo rango de fechas.
- Historial de inventario (stock inicial diario) con filtro por fechas.
- Vista de control de inventario.

### Punto de Venta (POS)

- Ventas.
- Anulación de ventas.
- Venta adelantada.
- Entregas.
- Devoluciones.

### Caja

- Vista de caja y operaciones vinculadas a flujo comercial.

### Cotizaciones

- Creación de cotizaciones con carrito de productos.
- Historial de cotizaciones con estados.
- Conversión de cotización a venta.
- Regla implementada: límite de cotizaciones activas por usuario.
- Regla implementada: vigencia por fecha límite para que se considere activa.

### Créditos

- Registro de crédito.
- Cartera, pagos, alertas y kardex de cobros.
- Lógica de límite de créditos abiertos por cliente (mock).

### Reportes

- Ganancias (con filtro por fecha exacta y rango de fechas).
- Capital.
- Top productos.
- Cuentas por cobrar.

### Gestión

- Usuarios: CRUD, rol, sucursal y horario asignado.
- Dispositivos: vista mock de sesiones por dispositivo donde iniciaron sesión trabajadores.
- Clientes y sucursales.
- Rol solo lectura modelado en UI (mock) con switch similar a modo admin.

### Auditoría

- Visualización de eventos y trazabilidad operativa del sistema.

### Configuración

- Ajustes globales de aplicación (empresa, moneda, etc.).

## Reglas de Negocio Actuales

- Cotizaciones activas limitadas por usuario (mock local).
- Vigencia de cotización por fecha de expiración.
- Validación de horarios de usuario modelada en frontend/store para pruebas, pendiente enforcement backend.
- Registro de dispositivos en login implementado como mock data.

## Estado Mock vs Backend

### Ya funcional en mock

- Inventario, POS, cotizaciones, créditos, reportes y gestión operan sin backend obligatorio.
- Persistencia local por navegador/sesión mediante localStorage.

### Ya conectado o preparado para backend

- Login con Supabase Auth.
- Endpoint de administración de usuarios con validación de rol admin.
- Scripts SQL de base en carpeta scripts.

### Pendiente de backend (planificado)

- Enforzar horario de acceso de empleados en servidor.
- Persistir sesiones de dispositivos en base de datos real.
- Enforzar rol solo lectura con autorización server-side.
- Migrar reglas clave desde mock store a servicios Supabase por módulo.

## Estructura de Carpetas (Referencia)

```
app/                    # Rutas y páginas por módulo
components/             # UI base, layout y submódulos
hooks/                  # Hooks reutilizables
lib/mock/               # Datos y lógica mock centralizada
lib/supabase/           # Cliente y servicios Supabase
scripts/                # SQL de configuración de base
types/                  # Tipos de datos
```

## Ejecución Local

1. Instalar dependencias:

```bash
npm install
```

2. Levantar entorno de desarrollo:

```bash
npm run dev
```

Nota: el script dev usa webpack por estabilidad local. Si deseas probar Turbopack:

```bash
npm run dev:turbo
```

3. Compilar producción:

```bash
npm run build
```

## Variables de Entorno

Definir en .env.local:

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

Para setup detallado de base/auth, consultar SETUP_SUPABASE.md.

## Scripts Disponibles

- npm run dev
- npm run dev:turbo
- npm run build
- npm run start
- npm run lint

## Observaciones Finales

- El proyecto ya cubre el flujo completo de operación a nivel UX en modo mock.
- La base para endurecer seguridad y reglas en backend está encaminada.
- README actualizado para reflejar el estado real del sistema y facilitar onboarding técnico.
