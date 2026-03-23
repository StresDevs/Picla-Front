'use client'

import { MainLayout } from '@/components/layout/main-layout'
import { PageHeader } from '@/components/common/page-header'
import { InventorySubnav } from '@/components/modules/inventory/inventory-subnav'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

const entries = [
  { id: 'IN-2026-001', date: '2026-03-19', warehouse: 'Bodega Central CBBA', branch: 'Sucursal Centro', user: 'Iván', item: 'Bomba de gasolina', qty: 25, currency: 'USD' },
  { id: 'IN-2026-002', date: '2026-03-19', warehouse: 'Tienda Norte', branch: 'Sucursal Norte', user: 'Leny', item: 'Filtro de aceite', qty: 60, currency: 'BOB' },
]

export default function InventoryEntriesPage() {
  return (
    <MainLayout>
      <div className="space-y-6">
        <PageHeader
          title="Ingreso de Mercadería"
          description="Registro base de ingresos por almacén, sucursal, usuario y moneda"
        />
        <InventorySubnav />

        <Card className="border-emerald-500/40 bg-zinc-950/70">
          <CardHeader>
            <CardTitle className="text-zinc-100">Nuevo Ingreso</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="space-y-2">
                <Label>Código</Label>
                <Input placeholder="REP-001" />
              </div>
              <div className="space-y-2">
                <Label>Nombre mercadería</Label>
                <Input placeholder="Bomba" />
              </div>
              <div className="space-y-2">
                <Label>Cantidad</Label>
                <Input type="number" placeholder="0" />
              </div>
              <div className="space-y-2">
                <Label>Unidad</Label>
                <Input placeholder="pieza" />
              </div>
              <div className="space-y-2">
                <Label>Precio compra</Label>
                <Input type="number" placeholder="0.00" />
              </div>
              <div className="space-y-2">
                <Label>Precio venta</Label>
                <Input type="number" placeholder="0.00" />
              </div>
              <div className="space-y-2">
                <Label>Moneda</Label>
                <Input placeholder="BOB / USD" />
              </div>
              <div className="space-y-2">
                <Label>Almacén</Label>
                <Input placeholder="Tienda / Bodega" />
              </div>
            </div>
            <Button>Registrar Ingreso</Button>
          </CardContent>
        </Card>

        <Card className="bg-zinc-950/70">
          <CardHeader>
            <CardTitle className="text-zinc-100">Listado de Ingresos (Día / Mes / Año)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {entries.map((entry) => (
              <div key={entry.id} className="rounded-lg border border-zinc-800 bg-zinc-900/70 p-3 text-sm">
                <p className="text-zinc-100 font-semibold">{entry.id} - {entry.item}</p>
                <p className="text-zinc-400">{entry.date} | {entry.warehouse} | {entry.branch}</p>
                <p className="text-zinc-400">Usuario: {entry.user} | Cantidad: {entry.qty} | Moneda: {entry.currency}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}
