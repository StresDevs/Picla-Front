# Inicio Rápido - Sistema de Gestión de Repuestos

## En 5 minutos

### 1. Clonar y instalar
```bash
pnpm install
```

### 2. Configurar Supabase
- Copia `.env.example` a `.env.local`
- Actualiza con tus credenciales de Supabase
- Ver `SETUP_SUPABASE.md` para instrucciones detalladas

### 3. Crear base de datos
- Ve a Supabase SQL Editor
- Copia `scripts/setup-database.sql`
- Ejecuta

### 4. Iniciar
```bash
pnpm dev
```

Abre [http://localhost:3000](http://localhost:3000)

---

## Estructura de Navegación

```
Dashboard /dashboard
├── Inventario /inventory          - Gestión de repuestos
├── Punto de Venta /pos            - Sistema POS
├── Créditos /credits              - Gestión de créditos
├── Reportes /reports              - Análisis y gráficos
├── Auditoría /audit               - Registro de cambios
└── Configuración /settings        - Ajustes del sistema
```

---

## Componentes Principales

### Layout
- `components/layout/sidebar.tsx` - Menú de navegación
- `components/layout/main-layout.tsx` - Wrapper de página
- `components/layout/theme-switcher.tsx` - Toggle dark/light

### Comunes
- `components/common/stat-card.tsx` - Tarjeta de estadística
- `components/common/data-table.tsx` - Tabla de datos
- `components/common/page-header.tsx` - Encabezado de página

### Servicios
- `lib/supabase/client.ts` - Cliente de Supabase
- `lib/supabase/inventory.ts` - Operaciones de inventario
- `lib/supabase/sales.ts` - Operaciones de ventas
- `lib/supabase/credits.ts` - Operaciones de créditos

---

## Características Implementadas

✅ Dashboard con 7 gráficos Recharts
✅ Gestión de inventario multi-sucursal
✅ Sistema POS completo con carrito
✅ Gestión de créditos con pagos
✅ Reportes con múltiples visualizaciones
✅ Auditoría con filtros avanzados
✅ Modo dark/light automático
✅ Diseño responsive para móvil
✅ Componentes reutilizables
✅ Base de datos PostgreSQL

---

## Uso de Ejemplo

### Agregar nuevo repuesto
1. Ve a Inventario
2. Haz clic en "Nuevo Repuesto"
3. Completa el formulario
4. Guarda

### Realizar venta
1. Ve a Punto de Venta
2. Busca productos
3. Agrega al carrito
4. Finaliza venta

### Ver reportes
1. Ve a Reportes
2. Selecciona fecha
3. Visualiza gráficos
4. Exporta si necesitas

---

## Paleta de Colores

```
Primario: Azul (#2563EB)
Secundario: Gris (#F3F4F6)
Acentos: Múltiples para gráficos
Dark: Tema oscuro automático
```

---

## Próximos Pasos

1. **Autenticación** - Implementar login de usuarios
2. **Datos Reales** - Conectar con Supabase datos
3. **Exportación** - Agregar PDF/Excel
4. **Notificaciones** - Sistema de alertas
5. **Mobile** - Optimizar para móvil

---

## Comandos Útiles

```bash
# Desarrollo
pnpm dev

# Build
pnpm build

# Iniciar producción
pnpm start

# Linter
pnpm lint

# Actualizar tipos (si cambias DB)
pnpm types
```

---

## Información de Contacto

Para soporte y preguntas, revisa:
- README.md - Documentación completa
- SETUP_SUPABASE.md - Guía de BD
- Código comentado en componentes

¡Listo para usar!
