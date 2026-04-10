'use client'

import { MainLayout } from '@/components/layout/main-layout'
import { PageHeader } from '@/components/common/page-header'
import { CreditsSubnav } from '@/components/modules/credits/credits-subnav'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

const records = [
  { id: 'KD-001', branch: 'Sucursal Centro', customer: 'Juan García', movement: 'Alta crédito', amount: 'Bs 1,500', date: '2026-03-01' },
  { id: 'KD-002', branch: 'Sucursal Centro', customer: 'Juan García', movement: 'Abono', amount: 'Bs 200', date: '2026-03-19' },
  { id: 'KD-003', branch: 'Sucursal Norte', customer: 'María T.', movement: 'Vencimiento', amount: 'Bs 860', date: '2026-03-18' },
]

export default function CreditsKardexPage() {
  return (
    <MainLayout>
      <div className="space-y-6">
        <PageHeader title="Historial de cobros" description="Movimientos históricos de créditos y cuentas por cobrar" />
        <CreditsSubnav />

        <Card className="bg-zinc-950/70 border-zinc-800">
          <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-3 gap-3">
            <Input placeholder="Cliente" />
            <Input placeholder="Sucursal" />
            <Input type="date" />
          </CardContent>
        </Card>

        <Card className="bg-zinc-950/70">
          <CardHeader><CardTitle className="text-zinc-100">Movimientos</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {records.map((record) => (
              <div key={record.id} className="rounded-lg border border-zinc-800 bg-zinc-900/70 p-3 text-sm">
                <p className="font-semibold text-zinc-100">{record.id} - {record.movement}</p>
                <p className="text-zinc-400">Cliente: {record.customer} | Sucursal: {record.branch}</p>
                <p className="text-zinc-300">Monto: {record.amount} | Fecha: {record.date}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}
