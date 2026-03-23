'use client'

import { MainLayout } from '@/components/layout/main-layout'
import { PageHeader } from '@/components/common/page-header'
import { ReportsSubnav } from '@/components/modules/reports/reports-subnav'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const topProducts = [
  { product: 'Filtro de aceite', soldMonth: 240, soldYear: 2980, margin: '32%' },
  { product: 'Bomba hidráulica', soldMonth: 190, soldYear: 2210, margin: '44%' },
  { product: 'Kit de frenos', soldMonth: 165, soldYear: 1930, margin: '29%' },
]

export default function ReportsTopProductsPage() {
  return (
    <MainLayout>
      <div className="space-y-6">
        <PageHeader title="Top Productos" description="Producto más vendido y con mayor ganancia" />
        <ReportsSubnav />

        <Card className="bg-zinc-950/70">
          <CardHeader><CardTitle className="text-zinc-100">Ranking mensual/anual</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {topProducts.map((item) => (
              <div key={item.product} className="rounded-lg border border-zinc-800 bg-zinc-900/70 p-3 text-sm">
                <p className="font-semibold text-zinc-100">{item.product}</p>
                <p className="text-zinc-400">Vendidos mes: {item.soldMonth} | Vendidos año: {item.soldYear}</p>
                <p className="text-emerald-300">Margen estimado: {item.margin}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}
