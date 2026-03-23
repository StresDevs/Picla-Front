'use client'

import { MainLayout } from '@/components/layout/main-layout'
import { PageHeader } from '@/components/common/page-header'
import { InventorySubnav } from '@/components/modules/inventory/inventory-subnav'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

const exits = [
  { id: 'SA-2026-022', date: '2026-03-19', origin: 'Sucursal Centro', user: 'Leny', item: 'Bomba de agua', qty: 3, reason: 'Venta contado' },
  { id: 'SA-2026-023', date: '2026-03-19', origin: 'Bodega Central CBBA', user: 'Iván', item: 'Filtro de aire', qty: 10, reason: 'Traspaso a sucursal' },
]

export default function InventoryExitsPage() {
  return (
    <MainLayout>
      <div className="space-y-6">
        <PageHeader title="Salidas de Mercadería" description="Control de salidas por día, mes y año con origen y usuario" />
        <InventorySubnav />

        <Card className="bg-zinc-950/70 border-zinc-800">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              <div className="space-y-2">
                <Label>Desde</Label>
                <Input type="date" />
              </div>
              <div className="space-y-2">
                <Label>Hasta</Label>
                <Input type="date" />
              </div>
              <div className="space-y-2">
                <Label>Almacén origen</Label>
                <Input placeholder="Sucursal / Bodega" />
              </div>
              <div className="space-y-2">
                <Label>Usuario</Label>
                <Input placeholder="Leny / Iván" />
              </div>
              <div className="space-y-2">
                <Label>&nbsp;</Label>
                <Button className="w-full">Filtrar</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-950/70">
          <CardHeader>
            <CardTitle className="text-zinc-100">Lista de Salidas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {exits.map((exit) => (
              <div key={exit.id} className="rounded-lg border border-zinc-800 bg-zinc-900/70 p-3 text-sm">
                <p className="font-semibold text-zinc-100">{exit.id} - {exit.item}</p>
                <p className="text-zinc-400">{exit.date} | Origen: {exit.origin} | Usuario: {exit.user}</p>
                <p className="text-zinc-400">Cantidad: {exit.qty} | Motivo: {exit.reason}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}
