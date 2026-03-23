'use client'

import { MainLayout } from '@/components/layout/main-layout'
import { PageHeader } from '@/components/common/page-header'
import { InventorySubnav } from '@/components/modules/inventory/inventory-subnav'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

const movements = [
  { id: 'IN-2026-001', date: '2026-03-18', type: 'Ingreso', item: 'Bomba', warehouse: 'Bodega Central CBBA', qty: '+25' },
  { id: 'TM-2026-011', date: '2026-03-18', type: 'Traspaso', item: 'Bomba', warehouse: 'Origen: Bodega -> Destino: Sucursal Sur', qty: '-4/+4' },
  { id: 'VT-2026-120', date: '2026-03-19', type: 'Venta', item: 'Bomba', warehouse: 'Sucursal Sur', qty: '-1' },
  { id: 'AN-2026-004', date: '2026-03-19', type: 'Anulación', item: 'Bomba', warehouse: 'Sucursal Sur', qty: '+1' },
]

export default function InventoryKardexPage() {
  return (
    <MainLayout>
      <div className="space-y-6">
        <PageHeader title="Kardex de Mercadería" description="Registro de todo movimiento: ingreso, traspaso, venta y anulación" />
        <InventorySubnav />

        <Card className="bg-zinc-950/70 border-zinc-800">
          <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-3 gap-3">
            <Input placeholder="Buscar producto (ej. Bomba)" />
            <Input placeholder="Almacén / sucursal" />
            <Input type="date" />
          </CardContent>
        </Card>

        <Card className="bg-zinc-950/70">
          <CardHeader>
            <CardTitle className="text-zinc-100">Historial de Movimientos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {movements.map((movement) => (
              <div key={movement.id} className="rounded-lg border border-zinc-800 bg-zinc-900/70 p-3 text-sm">
                <p className="font-semibold text-zinc-100">{movement.id} - {movement.type}</p>
                <p className="text-zinc-400">{movement.date} | {movement.item}</p>
                <p className="text-zinc-400">{movement.warehouse}</p>
                <p className="text-zinc-200">Cantidad: {movement.qty}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}
