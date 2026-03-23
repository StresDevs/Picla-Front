'use client'

import { MainLayout } from '@/components/layout/main-layout'
import { PageHeader } from '@/components/common/page-header'
import { CreditsSubnav } from '@/components/modules/credits/credits-subnav'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const portfolio = [
  { id: 'CR-2026-001', customer: 'Juan García', branch: 'Sucursal Centro', total: 'Bs 1,500', paid: 'Bs 500', balance: 'Bs 1,000', due: '2026-03-28' },
  { id: 'CR-2026-002', customer: 'María Loza', branch: 'Sucursal Norte', total: 'Bs 720', paid: 'Bs 720', balance: 'Bs 0', due: '2026-03-20' },
]

export default function CreditsPortfolioPage() {
  return (
    <MainLayout>
      <div className="space-y-6">
        <PageHeader title="Cartera de Créditos" description="Vista global y por sucursal de deudas por cobrar" />
        <CreditsSubnav />

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-zinc-950/70"><CardContent className="pt-6"><p className="text-sm text-zinc-400">Activos</p><p className="text-3xl text-zinc-100 font-semibold mt-2">24</p></CardContent></Card>
          <Card className="bg-zinc-950/70"><CardContent className="pt-6"><p className="text-sm text-zinc-400">Por cobrar</p><p className="text-3xl text-amber-300 font-semibold mt-2">Bs 14,200</p></CardContent></Card>
          <Card className="bg-zinc-950/70"><CardContent className="pt-6"><p className="text-sm text-zinc-400">Vencidos</p><p className="text-3xl text-rose-300 font-semibold mt-2">6</p></CardContent></Card>
          <Card className="bg-zinc-950/70"><CardContent className="pt-6"><p className="text-sm text-zinc-400">Pagados</p><p className="text-3xl text-emerald-300 font-semibold mt-2">18</p></CardContent></Card>
        </div>

        <Card className="bg-zinc-950/70">
          <CardHeader><CardTitle className="text-zinc-100">Créditos registrados</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {portfolio.map((credit) => (
              <div key={credit.id} className="rounded-lg border border-zinc-800 bg-zinc-900/70 p-3 text-sm">
                <p className="font-semibold text-zinc-100">{credit.id} - {credit.customer}</p>
                <p className="text-zinc-400">Sucursal: {credit.branch} | Vencimiento: {credit.due}</p>
                <p className="text-zinc-300">Total: {credit.total} | Pagado: {credit.paid} | Saldo: {credit.balance}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}
