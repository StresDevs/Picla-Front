'use client'

import { MainLayout } from '@/components/layout/main-layout'
import { PageHeader } from '@/components/common/page-header'
import { POSSubnav } from '@/components/modules/pos/pos-subnav'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

const deliveries = [
  { id: 'VE-2026-001', customer: 'Carlos M.', seller: 'Leny', deliveredBy: 'Iván', item: 'Bomba', pending: 'Filtro', total: 'Bs 1,200.00', pendingAmount: 'Bs 300.00' },
  { id: 'VE-2026-002', customer: 'Ana T.', seller: 'Sergio', deliveredBy: 'Nora', item: 'Kit frenos', pending: 'Ninguno', total: 'Bs 680.00', pendingAmount: 'Bs 0.00' },
]

export default function POSDeliveriesPage() {
  return (
    <MainLayout>
      <div className="space-y-6">
        <PageHeader title="Mercadería por Entregar" description="Control de entregas parciales, responsables y montos pendientes" />
        <POSSubnav />

        <Card className="bg-zinc-950/70 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-zinc-100">Lista de entregas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {deliveries.map((delivery) => (
              <div key={delivery.id} className="rounded-lg border border-zinc-800 bg-zinc-900/70 p-3 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold text-zinc-100">{delivery.id} - {delivery.customer}</p>
                  <Button size="sm">Marcar entrega</Button>
                </div>
                <p className="text-zinc-400">Vendedor: {delivery.seller} | Entregó: {delivery.deliveredBy}</p>
                <p className="text-zinc-400">Entregado: {delivery.item} | Pendiente: {delivery.pending}</p>
                <p className="text-zinc-300">Total: {delivery.total} | Saldo: {delivery.pendingAmount}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}
