'use client'

import { MainLayout } from '@/components/layout/main-layout'
import { PageHeader } from '@/components/common/page-header'
import { POSSubnav } from '@/components/modules/pos/pos-subnav'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

const reservations = [
  { id: 'VA-2026-004', customer: 'Pedro Lima', product: 'Kit Embrague', total: 'Bs 950.00', advance: 'Bs 300.00', status: 'Reservado' },
  { id: 'VA-2026-005', customer: 'Sandra S.', product: 'Bomba Hidráulica', total: 'Bs 720.00', advance: 'Bs 200.00', status: 'Pendiente entrega' },
]

export default function POSAdvanceSalesPage() {
  return (
    <MainLayout>
      <div className="space-y-6">
        <PageHeader title="Venta por Adelantado" description="Registra anticipos y reserva automática de mercadería" />
        <POSSubnav />

        <Card className="border-amber-500/45 bg-zinc-950/70">
          <CardHeader>
            <CardTitle className="text-zinc-100">Nueva venta adelantada</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="space-y-2"><Label>Cliente</Label><Input placeholder="Nombre" /></div>
            <div className="space-y-2"><Label>Vendedor</Label><Input placeholder="Nombre" /></div>
            <div className="space-y-2"><Label>Mercadería</Label><Input placeholder="Producto" /></div>
            <div className="space-y-2"><Label>Monto total</Label><Input type="number" placeholder="0.00" /></div>
            <div className="space-y-2"><Label>Pago adelantado</Label><Input type="number" placeholder="0.00" /></div>
            <div className="space-y-2"><Label>Pago final</Label><Input type="number" placeholder="0.00" /></div>
            <div className="space-y-2 md:col-span-2"><Label>Observaciones</Label><Input placeholder="Detalles de entrega" /></div>
            <Button className="md:col-span-4">Registrar venta adelantada</Button>
          </CardContent>
        </Card>

        <Card className="bg-zinc-950/70">
          <CardHeader>
            <CardTitle className="text-zinc-100">Reservas y anticipos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {reservations.map((item) => (
              <div key={item.id} className="rounded-lg border border-zinc-800 bg-zinc-900/70 p-3 text-sm">
                <p className="font-semibold text-zinc-100">{item.id} - {item.customer}</p>
                <p className="text-zinc-400">{item.product} | Total: {item.total} | Anticipo: {item.advance}</p>
                <p className="text-amber-300">Estado: {item.status}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}
