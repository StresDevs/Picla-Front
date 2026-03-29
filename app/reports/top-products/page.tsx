'use client'

import { useMemo, useState } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { PageHeader } from '@/components/common/page-header'
import { ReportsSubnav } from '@/components/modules/reports/reports-subnav'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { mockBranches } from '@/lib/mock/data'

const topProducts = [
  { product: 'Filtro de aceite', branch: 'Sucursal Centro', soldMonth: 240, soldYear: 2980, margin: '32%' },
  { product: 'Bomba hidráulica', branch: 'Sucursal Norte', soldMonth: 190, soldYear: 2210, margin: '44%' },
  { product: 'Kit de frenos', branch: 'Sucursal Sur', soldMonth: 165, soldYear: 1930, margin: '29%' },
]

export default function ReportsTopProductsPage() {
  const [branchFilter, setBranchFilter] = useState('all')

  const filtered = useMemo(() => {
    const selectedBranch =
      branchFilter === 'all'
        ? null
        : mockBranches.find((branch) => branch.id === branchFilter)?.name || null

    return topProducts.filter((item) => !selectedBranch || item.branch === selectedBranch)
  }, [branchFilter])

  return (
    <MainLayout>
      <div className="space-y-6">
        <PageHeader title="Top Productos" description="Producto más vendido y con mayor ganancia" />
        <ReportsSubnav />

        <Card className="bg-zinc-950/70">
          <CardHeader><CardTitle className="text-zinc-100">Filtro por sucursal</CardTitle></CardHeader>
          <CardContent>
            <Select value={branchFilter} onValueChange={setBranchFilter}>
              <SelectTrigger className="max-w-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las sucursales</SelectItem>
                {mockBranches.map((branch) => (
                  <SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card className="bg-zinc-950/70">
          <CardHeader><CardTitle className="text-zinc-100">Ranking mensual/anual</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {filtered.map((item) => (
              <div key={item.product} className="rounded-lg border border-zinc-800 bg-zinc-900/70 p-3 text-sm">
                <p className="font-semibold text-zinc-100">{item.product}</p>
                <p className="text-zinc-400">Sucursal: {item.branch}</p>
                <p className="text-zinc-400">Vendidos mes: {item.soldMonth} | Vendidos año: {item.soldYear}</p>
                <p className="text-emerald-300">Margen estimado: {item.margin}</p>
              </div>
            ))}

            {filtered.length === 0 ? <p className="text-sm text-zinc-400">Sin registros para la sucursal seleccionada.</p> : null}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}
