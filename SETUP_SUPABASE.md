# Guía de Configuración de Supabase

## Paso 1: Crear un Proyecto en Supabase

1. Ve a [supabase.com](https://supabase.com)
2. Haz clic en "Start your project"
3. Regístrate o inicia sesión con GitHub
4. Crea un nuevo proyecto:
   - Nombre del proyecto: "Sistema de Gestión de Repuestos" (o el que prefieras)
   - Contraseña de base de datos: Guarda esto en un lugar seguro
   - Región: Elige la más cercana a ti
   - Haz clic en "Create new project"

## Paso 2: Obtener Credenciales

Una vez que el proyecto está creado:

1. Ve a **Settings** → **API**
2. Copia estos valores:
   - **Project URL**: Esto es tu `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public**: Esto es tu `NEXT_PUBLIC_SUPABASE_ANON_KEY`

3. Guarda estos valores en `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://[tu-proyecto].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[tu-clave-anonima]
```

## Paso 3: Crear Tablas de Base de Datos

1. En Supabase, ve a **SQL Editor**
2. Copia el contenido completo de `scripts/setup-database.sql`
3. Pega en el editor de SQL
4. Haz clic en "Run"
5. Espera a que se complete

### Verificar que las tablas fueron creadas

1. Ve a **Table Editor**
2. Deberías ver todas estas tablas en el menú izquierdo:
   - branches
   - parts
   - inventory
   - sales
   - sale_items
   - credits
   - credit_payments
   - audit_logs
   - cash_boxes
   - daily_transactions

## Paso 4: Configurar Row Level Security (RLS) - Opcional

Para mayor seguridad, puedes habilitar RLS:

1. En **Authentication** → **Policies**
2. Para cada tabla, crear políticas que controlen el acceso

Ejemplo para tabla `parts`:
```sql
-- Política de lectura para todos
CREATE POLICY "Allow public read access"
ON public.parts
FOR SELECT
USING (true);

-- Política de inserción/actualización para usuarios autenticados
CREATE POLICY "Allow authenticated users to insert"
ON public.parts
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');
```

## Paso 5: Insertar Datos de Ejemplo (Opcional)

Para probar la aplicación con datos:

```sql
-- Insertar sucursal de ejemplo
INSERT INTO branches (name, location, manager, phone)
VALUES ('Sucursal Centro', 'Calle Principal 123', 'Carlos López', '555-0101');

-- Obtén el ID de la sucursal creada
SELECT id FROM branches LIMIT 1;

-- Insertar partes de ejemplo (reemplaza con el ID de sucursal)
INSERT INTO parts (sku, name, description, category, price, cost, branch_id, supplier)
VALUES 
  ('REP-001', 'Filtro de Aire', 'Filtro de aire para motores', 'Filtros', 5.50, 2.50, '[branch-id]', 'Proveedor A'),
  ('REP-002', 'Pastillas de Freno', 'Pastillas de freno delanteras', 'Frenos', 12.00, 6.00, '[branch-id]', 'Proveedor B'),
  ('REP-003', 'Batería 12V', 'Batería 12V 80Ah', 'Eléctrico', 45.00, 25.00, '[branch-id]', 'Proveedor C');
```

## Paso 6: Validar la Conexión

1. Inicia el servidor de desarrollo:
```bash
pnpm dev
```

2. Abre [http://localhost:3000](http://localhost:3000)

3. Verifica que:
   - La página carga sin errores
   - Los datos se cargan en el Dashboard
   - Puedes navegar entre módulos

## Solución de Problemas

### Error: "Missing Supabase environment variables"
- Verifica que `.env.local` existe
- Comprueba que `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` están configurados
- Reinicia el servidor de desarrollo

### Error: "Connection refused"
- Asegúrate de que Supabase está activo y el proyecto está creado
- Verifica que la URL de Supabase es correcta
- Comprueba tu conexión a internet

### Tablas no aparecen en el editor
- Verifica que el script SQL se ejecutó sin errores
- Busca mensajes de error en la consola de SQL de Supabase
- Asegúrate de que el script completo fue ejecutado

### Datos no se cargan en la aplicación
- Verifica que las tablas tienen datos
- Comprueba la consola del navegador para errores
- Valida que las rutas de la API son correctas

## Próximos Pasos

1. **Autenticación**: Configura Auth en Supabase si necesitas usuarios
2. **Políticas de RLS**: Implementa RLS para seguridad en producción
3. **Backups**: Configura backups automáticos
4. **Monitoreo**: Habilita el monitoreo de base de datos

## Recursos Útiles

- [Documentación de Supabase](https://supabase.com/docs)
- [Cliente de Supabase para JavaScript](https://supabase.com/docs/reference/javascript/introduction)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)

## Soporte

Si tienes problemas:
1. Revisa los logs en Supabase Dashboard
2. Consulta la documentación oficial
3. Abre un issue en el repositorio
