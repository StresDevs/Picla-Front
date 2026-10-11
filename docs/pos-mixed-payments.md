Pago mixto en el POS
===================

En el cobro, seleccionar **Pago mixto**, elegir dos métodos diferentes (efectivo, QR/transferencia o tarjeta) e ingresar sus montos en bolivianos. El segundo monto se calcula como saldo restante al editar el primero; también se puede editar manualmente. Ambos deben ser positivos, tener hasta dos decimales y sumar el total final de la venta.

Instalación
-----------

Ejecutar `scripts/pos_mixed_payments.sql` en el SQL Editor de Supabase después de `scripts/pos_price_changes.sql`, antes de utilizar el nuevo frontend. La migración es transaccional y puede ejecutarse nuevamente. No se aplicó a la base remota desde este workspace.

Las nuevas RPC `pos_create_mixed_sale` y `pos_enqueue_mixed_sale` delegan en las funciones existentes, conservando sus permisos, validaciones de precios, inventario y registros de auditoría. Los pagos se guardan en `pos_sale_payments` y en los metadatos del comprobante. El método principal en `pos_sales` se conserva como `cash` para compatibilidad; `metadata.payment_type = 'mixed'` identifica la modalidad. Las consultas de caja y reportes usan el desglose real.

Una venta crea dos movimientos de caja dentro de la misma transacción. La cola conserva los montos al aprobar. Una devolución parcial reparte el importe proporcionalmente entre los dos métodos; la anulación devuelve el saldo restante. El cálculo acumulado evita diferencias de centavos. Los comprobantes, PDF y Excel incluyen los pagos.

Los pagos mixtos se ofrecen para ventas al contado en BOB. Los pagos simples, USD, anticipos y créditos mantienen sus flujos actuales. Los montos de caja son montos aplicados a la compra; no incluyen efectivo entregado para recibir vuelto. El registro por QR utiliza la confirmación del cajero, como el flujo QR existente.

Los reportes muestran cobros por método. Una venta mixta puede participar en dos filas por método; el conteo general y por sucursal usa `get_report_unique_sale_counts` para contarla una sola vez.

Verificación
------------

```powershell
node --test scripts/pos-mixed-payments.test.cjs scripts/pos-price.test.cjs scripts/sale-receipt.test.cjs scripts/payment-qr.test.cjs
```

Para probar SQL, usar una base PostgreSQL nueva y aislada cuyo nombre comience con `picla_mixed_test`. El runner crea tablas y funciones del esquema guardado en el repositorio, instala las validaciones de precios y ejecuta la migración dos veces. Las funciones auxiliares de autenticación e inventario se simulan en ese fixture; no conecta automáticamente a Supabase.

```powershell
$env:PGHOST='127.0.0.1'
$env:PGPORT='55439'
$env:PGUSER='picla_test'
$env:PGDATABASE='picla_mixed_test'
$env:PG_BIN='C:/Program Files/PostgreSQL/17/bin'
node scripts/pos-mixed-payments-db.test.cjs
```

El fixture verifica Bs 10 efectivo + Bs 20 QR, rechazo y reversión de pagos inválidos, reporte sin duplicar importes ni ventas, precio editado dentro de rango, permiso desactivado, límites de precios, aprobación en cola, devolución parcial, anulación restante y venta simple.
