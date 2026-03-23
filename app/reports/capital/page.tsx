'use client'

import { MainLayout } from '@/components/layout/main-layout'
import { PageHeader } from '@/components/common/page-header'
import { ReportsSubnav } from '@/components/modules/reports/reports-subnav'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const capital = [
  { branch: 'Sucursal Centro', day: 'Bs 6,500', month: 'Bs 135,000', year: 'Bs 1,520,000' },
  { branch: 'Sucursal Norte', day: 'Bs 5,200', month: 'Bs 112,000', year: 'Bs 1,210,000' },
  { branch: 'Sucursal Sur', day: 'Bs 4,800', month: 'Bs 99,000', year: 'Bs 1,090,000' },
]

export default function ReportsCapitalPage() {
  return (
    <MainLayout>
      <div className="space-y-6">
        <PageHeader title="Capital Invertido" description="Capital invertido por día, mes y año por sucursal y global" />
        <ReportsSubnav />

        <Card className="bg-zinc-950/70 border-zinc-800">
          <CardHeader><CardTitle className="text-zinc-100">Detalle por sucursal</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {capital.map((item) => (
              <div key={item.branch} className="rounded-lg border border-zinc-800 bg-zinc-900/70 p-3 text-sm">
                <p className="text-zinc-100 font-semibold">{item.branch}</p>
                <p className="text-zinc-400">Día: {item.day} | Mes: {item.month} | Año: {item.year}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}
