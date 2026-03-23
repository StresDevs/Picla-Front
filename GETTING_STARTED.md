# Guía de Inicio Rápido - Sistema de Gestión de Repuestos

## Inicio del Proyecto

```bash
# Instalar dependencias
npm install
# o con pnpm
pnpm install

# Ejecutar en desarrollo
npm run dev
# Acceder a http://localhost:3000
```

## Características Actuales (Mock Data)

El sistema funciona completamente con datos de prueba. Puedes:

### Dashboard
- Ver estadísticas de ventas
- Gráficos de tendencias
- Información general del sistema
- *Nota: Solo visible para administradores*

### Inventario
**3 Tabs:**
- **Productos**: Busca por nombre, código, categoría o rango de precio
  - 8 productos de ejemplo cargados
  - Filtros completamente funcionales
- **Transferencias**: Transferir productos entre sucursales
  - Formulario para crear transferencias
  - Aprobación de transferencias pendientes
- **Historial**: Registro de todas las transferencias completadas

### Punto de Venta
**2 Tabs:**
- **Ventas**: Sistema POS completo
  - Agregar productos al carrito
  - Seleccionar método de pago (Efectivo, QR, Crédito)
  - Completar venta con cliente
- **Devoluciones**: Control de devoluciones (esquema listo)

### Caja
**2 Tabs:**
- **Caja Abierta**: Apertura y cierre de caja
  - Establecer saldo inicial
  - Ver caja abierta actual
- **Gastos**: Registro de gastos de caja chica
  - Agregar gastos con descripción
  - Opcional: adjuntar comprobante

### Gestión
**3 Tabs:**
- **Usuarios**: CRUD de trabajadores
  - Crear nuevos usuarios
  - Editar información
  - Eliminar usuarios
- **Clientes**: CRUD de clientes
  - Crear clientes con NIT/CI
  - Editar información
  - Eliminar registros
- **Sucursales**: Gestión de sucursales (esquema listo)

### Créditos
- Gestión de créditos a clientes
- Pagos e historial
- *Integración con ventas*

### Reportes
- Análisis de ventas por período
- Productos más vendidos
- Desglose por categoría
- Gráficos estadísticos

### Auditoría
- Registro completo de actividades
- Filtrado por usuario, acción, fecha
- Historial inmutable

## Estructura de Carpetas

```
app/
├── dashboard/          # Panel principal
├── inventory/          # Gestión de inventario
├── pos/               # Punto de venta
├── cash/              # Caja y gastos
├── management/        # Usuarios y clientes
├── credits/           # Créditos
├── reports/           # Reportes
├── audit/             # Auditoría
└── settings/          # Configuración

components/
├── layout/
│   ├── sidebar.tsx    # Menú lateral (sticky)
│   ├── main-layout.tsx
│   └── theme-switcher.tsx
├── common/
│   ├── stat-card.tsx
│   ├── data-table.tsx
│   └── page-header.tsx
└── ui/                # Componentes shadcn/ui

lib/
├── mock/
│   └── data.ts        # Datos de prueba
└── supabase/          # (Vacío, listo para servicios reales)

types/
└── database.ts        # Tipos TypeScript
```

## Paleta de Colores

**Tema Claro:**
- Fondo: Blanco (#FFFFFF)
- Texto: Azul oscuro (#001a33)
- Primario: Azul (#0066CC) - hsl(210, 100%, 45%)
- Secundario: Verde Lima (#99FF00) - hsl(82, 85%, 48%)

**Tema Oscuro:**
- Fondo: Gris muy oscuro (#0F1419)
- Texto: Blanco (#F5F5F5)
- Primario: Azul claro (#3399FF) - hsl(210, 100%, 55%)
- Secundario: Verde Lima claro (#CCFF33) - hsl(82, 85%, 58%)

## Siguiente: Integración con Supabase

Cuando estés listo para conectar datos reales:

1. **Crear servicios en `lib/supabase/`:**
   - `inventory.ts` - Servicios de productos
   - `sales.ts` - Servicios de ventas
   - `cash-register.ts` - Servicios de caja
   - `customers.ts` - Servicios de clientes
   - `users.ts` - Servicios de usuarios

2. **Ejecutar migración SQL:**
   ```bash
   # En tu consola de Supabase, ejecuta:
   # scripts/setup-database.sql
   ```

3. **Actualizar variables de entorno:**
   ```
   NEXT_PUBLIC_SUPABASE_URL=tu_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_key
   ```

4. **Reemplazar imports:**
   - Cambiar `import { mockProducts } from '@/lib/mock/data'`
   - Por `import { partsService } from '@/lib/supabase/inventory'`

## Notas Importantes

- El sidebar es **sticky** en desktop y colapsable en móvil
- Los menús desplegables funcionan en los siguientes módulos:
  - Inventario
  - Punto de Venta
  - Caja
  - Gestión
- El tema dark/light cambia automáticamente según preferencias del sistema
- Todos los tipos TypeScript están listos para Supabase
- Los scripts SQL contienen toda la estructura necesaria

## Troubleshooting

**Si ves errores de hidratación:**
- Recarga la página
- El tema-switcher puede causar esto inicialmente

**Si los datos no cargan:**
- Verifica que estés usando los datos mock
- Todas las funciones retornan promesas pero con datos locales

**Para tema oscuro:**
- El sistema automáticamente detecta tu preferencia del SO
- Puedes cambiar manualmente con el botón en el sidebar
