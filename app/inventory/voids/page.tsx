'use client'

import { MainLayout } from '@/components/layout/main-layout'
import { PageHeader } from '@/components/common/page-header'
import { InventorySubnav } from '@/components/modules/inventory/inventory-subnav'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const voidCandidates = [
  { id: 'TM-2026-011', type: 'Traspaso', item: 'Bomba', from: 'Bodega Central CBBA', to: 'Sucursal Sur', qty: 4, status: 'Pendiente' },
  { id: 'IN-2026-007', type: 'Ingreso', item: 'Correa', from: 'Sucursal Centro', to: '-', qty: 1, status: 'Pendiente' },
]

export default function InventoryVoidsPage() {
  return (
    <MainLayout>
      <div className="space-y-6">
        <PageHeader title="Anulaciones" description="Anulación de traspasos e ingresos con motivo y trazabilidad" />
        <InventorySubnav />

        <Card className="border-rose-500/40 bg-zinc-950/70">
          <CardHeader>
            <CardTitle className="text-zinc-100">Solicitar Anulación</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="space-y-2">
              <Label>ID Movimiento</Label>
              <Input placeholder="TM-2026-011" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Motivo</Label>
              <Input placeholder="Producto mal ingresado / traspaso erróneo" />
            </div>
            <div className="space-y-2">
              <Label>&nbsp;</Label>
              <Button variant="destructive" className="w-full">Registrar Anulación</Button>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-950/70">
          <CardHeader>
            <CardTitle className="text-zinc-100">Movimientos Anulables</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {voidCandidates.map((item) => (
              <div key={item.id} className="rounded-lg border border-zinc-800 bg-zinc-900/70 p-3 text-sm">
                <p className="font-semibold text-zinc-100">{item.id} - {item.type}</p>
                <p className="text-zinc-400">Producto: {item.item} | Cantidad: {item.qty}</p>
                <p className="text-zinc-400">Origen: {item.from} | Destino: {item.to}</p>
                <div className="mt-2">
                  <Button variant="destructive" size="sm">Anular</Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}
