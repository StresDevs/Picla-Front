'use client'

import { MainLayout } from '@/components/layout/main-layout'
import { PageHeader } from '@/components/common/page-header'
import { ReportsSubnav } from '@/components/modules/reports/reports-subnav'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const branchProfit = [
  { branch: 'Sucursal Centro', day: 'Bs 3,200', month: 'Bs 72,400', year: 'Bs 802,000' },
  { branch: 'Sucursal Norte', day: 'Bs 2,450', month: 'Bs 59,100', year: 'Bs 641,300' },
  { branch: 'Sucursal Sur', day: 'Bs 1,980', month: 'Bs 48,750', year: 'Bs 522,900' },
]

export default function ReportsProfitPage() {
  return (
    <MainLayout>
      <div className="space-y-6">
        <PageHeader title="Reporte de Ganancias" description="Ganancia por día, mes y año por sucursal y global" />
        <ReportsSubnav />

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-zinc-950/70"><CardContent className="pt-6"><p className="text-zinc-400 text-sm">Ganancia diaria global</p><p className="text-zinc-100 text-3xl font-semibold mt-2">Bs 7,630</p></CardContent></Card>
          <Card className="bg-zinc-950/70"><CardContent className="pt-6"><p className="text-zinc-400 text-sm">Ganancia mensual global</p><p className="text-emerald-300 text-3xl font-semibold mt-2">Bs 180,250</p></CardContent></Card>
          <Card className="bg-zinc-950/70"><CardContent className="pt-6"><p className="text-zinc-400 text-sm">Ganancia anual global</p><p className="text-sky-300 text-3xl font-semibold mt-2">Bs 1,966,200</p></CardContent></Card>
          <Card className="bg-zinc-950/70"><CardContent className="pt-6"><p className="text-zinc-400 text-sm">Producto con mayor margen</p><p className="text-zinc-100 text-xl font-semibold mt-2">Bomba hidráulica</p></CardContent></Card>
        </div>

        <Card className="bg-zinc-950/70">
          <CardHeader><CardTitle className="text-zinc-100">Ganancia por sucursal</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {branchProfit.map((item) => (
              <div key={item.branch} className="rounded-lg border border-zinc-800 bg-zinc-900/70 p-3 text-sm">
                <p className="font-semibold text-zinc-100">{item.branch}</p>
                <p className="text-zinc-400">Día: {item.day} | Mes: {item.month} | Año: {item.year}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}
