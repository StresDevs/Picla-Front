'use client'

import { MainLayout } from '@/components/layout/main-layout'
import { PageHeader } from '@/components/common/page-header'
import { POSSubnav } from '@/components/modules/pos/pos-subnav'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

const salesToVoid = [
  { id: 'VT-2026-010', customer: 'Juan García', amount: 'Bs 420.00', status: 'Facturada', itemState: 'Entregado' },
  { id: 'VT-2026-011', customer: 'María Rojas', amount: 'Bs 180.00', status: 'Sin factura', itemState: 'Entregado' },
]

export default function POSVoidSalesPage() {
  return (
    <MainLayout>
      <div className="space-y-6">
        <PageHeader title="Anulación de Ventas" description="Anula ventas y registra observación para reversar pagos, stock y nota" />
        <POSSubnav />

        <Card className="border-rose-500/40 bg-zinc-950/70">
          <CardHeader>
            <CardTitle className="text-zinc-100">Registrar anulación</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label>Número de venta</Label>
              <Input placeholder="VT-2026-010" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Observación</Label>
              <Input placeholder="Motivo de anulación" />
            </div>
            <Button variant="destructive" className="md:col-span-3">Anular venta</Button>
          </CardContent>
        </Card>

        <Card className="bg-zinc-950/70">
          <CardHeader>
            <CardTitle className="text-zinc-100">Ventas recientes anulables</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {salesToVoid.map((sale) => (
              <div key={sale.id} className="rounded-lg border border-zinc-800 bg-zinc-900/70 p-3 text-sm">
                <p className="font-semibold text-zinc-100">{sale.id} - {sale.customer}</p>
                <p className="text-zinc-400">Monto: {sale.amount} | Estado factura: {sale.status}</p>
                <p className="text-zinc-400">Mercadería: {sale.itemState}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}
