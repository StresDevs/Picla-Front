'use client'

import { MainLayout } from '@/components/layout/main-layout'
import { PageHeader } from '@/components/common/page-header'
import { CreditsSubnav } from '@/components/modules/credits/credits-subnav'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

const payments = [
  { id: 'PG-2026-020', creditId: 'CR-2026-001', customer: 'Juan García', amount: 'Bs 200', date: '2026-03-19' },
  { id: 'PG-2026-021', creditId: 'CR-2026-003', customer: 'Carlos M.', amount: 'Bs 350', date: '2026-03-19' },
]

export default function CreditsPaymentsPage() {
  return (
    <MainLayout>
      <div className="space-y-6">
        <PageHeader title="Pagos de Crédito" description="Registro de cuotas, abonos y cancelación final" />
        <CreditsSubnav />

        <Card className="bg-zinc-950/70 border-zinc-800">
          <CardHeader><CardTitle className="text-zinc-100">Registrar pago</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="space-y-2"><Label>ID crédito</Label><Input placeholder="CR-2026-001" /></div>
            <div className="space-y-2"><Label>Monto pago</Label><Input type="number" placeholder="0.00" /></div>
            <div className="space-y-2"><Label>Método</Label><Input placeholder="Efectivo / QR / Transferencia" /></div>
            <div className="space-y-2"><Label>&nbsp;</Label><Button className="w-full">Registrar</Button></div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-950/70">
          <CardHeader><CardTitle className="text-zinc-100">Historial de pagos</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {payments.map((payment) => (
              <div key={payment.id} className="rounded-lg border border-zinc-800 bg-zinc-900/70 p-3 text-sm">
                <p className="text-zinc-100 font-semibold">{payment.id} - {payment.creditId}</p>
                <p className="text-zinc-400">Cliente: {payment.customer} | Fecha: {payment.date}</p>
                <p className="text-emerald-300">Monto: {payment.amount}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}
