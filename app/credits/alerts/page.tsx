'use client'

import { MainLayout } from '@/components/layout/main-layout'
import { PageHeader } from '@/components/common/page-header'
import { CreditsSubnav } from '@/components/modules/credits/credits-subnav'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

const alerts = [
  { id: 'ALT-01', creditId: 'CR-2026-001', customer: 'Juan García', branch: 'Sucursal Centro', due: '2026-03-20', frequency: '2 veces al día', status: 'Próximo a vencer' },
  { id: 'ALT-02', creditId: 'CR-2026-007', customer: 'María T.', branch: 'Sucursal Norte', due: '2026-03-18', frequency: '2 veces al día', status: 'Vencido' },
]

export default function CreditsAlertsPage() {
  return (
    <MainLayout>
      <div className="space-y-6">
        <PageHeader title="Alertas de Crédito" description="Recordatorios por vencimiento para sucursal y propietario" />
        <CreditsSubnav />

        <Card className="border-amber-500/45 bg-zinc-950/70">
          <CardHeader><CardTitle className="text-zinc-100">Recordatorios activos</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {alerts.map((alert) => (
              <div key={alert.id} className="rounded-lg border border-zinc-800 bg-zinc-900/70 p-3 text-sm">
                <p className="font-semibold text-zinc-100">{alert.creditId} - {alert.customer}</p>
                <p className="text-zinc-400">{alert.branch} | Vence: {alert.due} | Frecuencia: {alert.frequency}</p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-amber-300">{alert.status}</span>
                  <Button size="sm" variant="outline">Marcar visto</Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}
