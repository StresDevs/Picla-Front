'use client'

import { MainLayout } from '@/components/layout/main-layout'
import { PageHeader } from '@/components/common/page-header'
import { InventorySubnav } from '@/components/modules/inventory/inventory-subnav'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

const stockByWarehouse = [
  { warehouse: 'Bodega Central CBBA', branch: 'Global', items: 1450, value: 'Bs 320,500' },
  { warehouse: 'Tienda Centro', branch: 'Sucursal Centro', items: 540, value: 'Bs 122,340' },
  { warehouse: 'Tienda Norte', branch: 'Sucursal Norte', items: 430, value: 'Bs 99,870' },
  { warehouse: 'Tienda Sur', branch: 'Sucursal Sur', items: 380, value: 'Bs 88,120' },
]

export default function InventoryControlPage() {
  return (
    <MainLayout>
      <div className="space-y-6">
        <PageHeader title="Control de Inventario" description="Verificación de stock por almacén y corte por fecha (día/mes/año)" />
        <InventorySubnav />

        <Card className="bg-zinc-950/70 border-zinc-800">
          <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-4 gap-3">
            <Input type="date" />
            <Input placeholder="Mes (MM-YYYY)" />
            <Input placeholder="Año" />
            <Button>Aplicar Corte</Button>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {stockByWarehouse.map((stock) => (
            <Card key={stock.warehouse} className="bg-zinc-950/70 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-zinc-100 text-base">{stock.warehouse}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-zinc-400">{stock.branch}</p>
                <p className="text-zinc-100 text-2xl font-semibold mt-3">{stock.items} items</p>
                <p className="text-emerald-300 text-sm mt-1">Valor inventario: {stock.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </MainLayout>
  )
}
