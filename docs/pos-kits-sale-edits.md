# POS: kits, modificación de ventas y retiro de tarjeta

Fecha: 25 de octubre de 2026. Proyecto: Picla-Front.

## Cambios

- Inventario / Kits: editar nombre, descripción, categoría, componentes, cantidades y precios. Se conserva código e identificador. La actualización del kit se ejecuta en una transacción.
- POS / Ventas: pestañas Productos y Kits. Se personalizan componentes y cantidades antes de agregar el kit al carrito. Cada instancia conserva líneas independientes de los productos individuales y su procedencia.
- El popup se abre únicamente al pulsar «Agregar producto al kit» del kit que se está preparando para vender. Muestra precio de kit y stock; filtra por nombre/código, categoría y precio mínimo/máximo. Agregar usa el precio de kit del producto.
- Historial / Editar venta: pestaña Modificar venta para reemplazar, agregar, eliminar, cambiar cantidades y precios. Muestra anterior, nuevo y diferencia. Se exige motivo y confirmación de dinero recibido/devuelto cuando hay diferencia. Admite efectivo, QR o ambos, con desglose exacto.
- Base de datos: edición, stock, movimientos monetarios y auditoría se guardan juntos; un error revierte toda la operación. Se detectan líneas obsoletas y reintentos de la misma edición. Los ajustes se registran en la caja abierta, sin reescribir movimientos históricos de cajas cerradas.
- Caja: importes netos de efectivo y QR. Comprobantes e informes reconocen la venta modificada. Devoluciones/anulaciones posteriores reparten por saldo real de los métodos después de editar.
- Tarjeta: retirada de nuevas ventas POS, anticipos, conversión de cotizaciones y pagos mixtos. La migración agrega triggers de rechazo en las tablas públicas con payment_method, incluidos pagos de crédito y movimientos de caja. También rechaza tarjeta en metadatos de pagos mixtos y pagos iniciales. Los datos históricos no se borran ni se convierten falsamente a efectivo.

## Migración pendiente de aplicación por el propietario

Archivo: `scripts/pos_kit_sale_edits.sql`.

Depende de las funciones existentes y de `scripts/pos_mixed_payments.sql`. Se aplicó únicamente sobre la copia local; NO se aplicó a Supabase de producción. El frontend requiere esta migración para editar kits/ventas y para bloquear tarjeta en la base. El propietario debe revisar/aplicar el SQL y desplegar el frontend coordinadamente.

## Alcance y restricciones vigentes

- La nueva modificación de venta está reservada a administradores, igual que el acceso existente a Editar venta. El servidor también lo exige.
- Se modifican ventas completadas al contado. Créditos y anticipos quedan bloqueados en esta operación: no se implementó aquí una reestructuración de deuda. Las ventas con factura fiscal requieren su procedimiento fiscal y también se bloquean.
- Las unidades ya devueltas conservan cantidad mínima y precio histórico. Para cambiar las restantes, se conserva esa parte en la línea original y se agrega otra línea. No se permite borrar una línea con devoluciones previas ni devolver dos veces su stock.
- Una venta debe conservar al menos un producto; para quitar todos se usa Anular venta.
- Los productos individuales conservan los permisos/rangos de precio existentes del POS. La migración no activa globalmente cambios de precio.
- No se ejecutó una prueba integral con servidor local de Auth/PostgREST/Supabase. La persistencia se verificó directamente en PostgreSQL con las funciones reales restauradas; las pruebas visuales utilizaron servicios simulados y bloquearon tráfico externo.

## Respaldo y entorno local

Se utilizó PostgreSQL 17 instalado en Windows, sin Docker. Primero se realizó una conexión de solo lectura y luego pg_dump en formato custom, también con default_transaction_read_only=on. La base remota informaba 312 MB; el respaldo comprimido ocupó 6.776.030 bytes.

SHA-256 del respaldo verificado: `5160790F6646E5B7559FD6DB19F10612052FB3878C83B47F28C3C2A5468AD023`.

Se restauró en `127.0.0.1:55439`, base `picla_local_test`. Se recuperaron tablas y funciones de la aplicación. La restauración reportó 11 errores relacionados con extensiones administradas no disponibles localmente (pg_cron, pg_net, supabase_vault) y sus datos/secuencias. No afectaron los escenarios de POS comprobados. No se ejecutaron sus tareas programadas ni integraciones remotas.

## Verificación realizada

1. `npm run build`: correcto; compilación y generación de 64 páginas. La configuración preexistente usa `ignoreBuildErrors: true`, por lo que este resultado no equivale a TypeScript limpio.
2. `node --test scripts/pos-price.test.cjs scripts/pos-payments.test.cjs scripts/sale-receipt.test.cjs scripts/payment-qr.test.cjs`: 43 pruebas, 43 correctas, 0 fallos. Se actualizaron dependencias simuladas del runner de comprobantes para poder ejecutar sus pruebas existentes.
3. `scripts/pos-kit-sale-edits.test.sql`: correcto sobre la copia restaurada, usando transacción y ROLLBACK. Verifica kit editado, venta de kit, incremento, reducción, reemplazo sin diferencia, agregar/eliminar líneas, precio, stock insuficiente y rollback, confirmación obligatoria, reintento idempotente, detección de edición obsoleta, usuario sin sesión, rechazo específico de tarjeta simple/mixta, reportes y anulación posterior con stock/caja/desglose correctos. No es una prueba de carga concurrente.
4. Prueba visual Chromium local: correcto. Popup contextual, filtros combinados, precio de kit enviado, confirmación obligatoria, cobro, devolución efectivo+QR y pantalla móvil de 390 px sin desbordamiento. Se inspeccionaron capturas de escritorio, móvil y popup.
5. `git diff --check`: correcto.
6. TypeScript independiente sobre el código fuente: 8 errores en archivos no modificados por este trabajo: `app/api/auth/resolve-username/route.ts:27` (ilike después de un builder incompatible), `app/audit/page.tsx:203` (conversión de tipos) y `lib/pdf/generators.ts:159,190,248,311,430,926` (finalY). No se reportaron errores en los archivos de esta implementación. Esta comprobación NO se considera aprobada.

## Limpieza y entrega

La instancia local se detuvo después de las pruebas. Se eliminaron los datos restaurados, dump temporal, scripts auxiliares de ejecución, página temporal, capturas y salida de la compilación de prueba. Se conservan código, migración, pruebas reproducibles y documentación. El respaldo no se conserva tras la limpieza solicitada.

La comprobación final confirmó que los puertos de prueba 3105 y 55439 no estaban escuchando. Se detectó un servidor de desarrollo ajeno a estas pruebas en el puerto 3000 (`next dev --webpack`), que vuelve a generar `.next/dev`; se dejó funcionando y no se eliminó repetidamente su caché regenerada.

No se modificó producción, no se cambió `.env`, no se instaló Docker y no se crearon commits. Se preservó el contenido inicial de `next-env.d.ts`, que ya tenía un cambio local antes de comenzar.

Se utilizó el skill instalado `app-development`, con sus referencias de frontend, backend y fullstack adaptadas de ECC. No se instalaron hooks, agentes ni configuración adicional.
