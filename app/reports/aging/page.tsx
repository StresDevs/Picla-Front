'use client'

import { useMemo, useState } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { PageHeader } from '@/components/common/page-header'
import { ReportsSubnav } from '@/components/modules/reports/reports-subnav'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { mockBranches } from '@/lib/mock/data'

const aging = [
  { customer: 'Juan García', branch: 'Sucursal Centro', debt: 'Bs 1,000', age: '15 días' },
  { customer: 'María Loza', branch: 'Sucursal Norte', debt: 'Bs 860', age: '32 días' },
  { customer: 'Pedro Lima', branch: 'Sucursal Sur', debt: 'Bs 420', age: '8 días' },
]

export default function ReportsAgingPage() {
  const [branchFilter, setBranchFilter] = useState('all')

  const filtered = useMemo(() => {
    const selectedBranch =
      branchFilter === 'all'
        ? null
        : mockBranches.find((branch) => branch.id === branchFilter)?.name || null

    return aging.filter((item) => !selectedBranch || item.branch === selectedBranch)
  }, [branchFilter])

  return (
    <MainLayout>
      <div className="space-y-6">
        <PageHeader title="Cuentas por Cobrar" description="Historial general de deudas por sucursal y cliente" />
        <ReportsSubnav />

        <Card className="bg-zinc-950/70 border-zinc-800">
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

        <Card className="bg-zinc-950/70 border-zinc-800">
          <CardHeader><CardTitle className="text-zinc-100">Antigüedad de cartera</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {filtered.map((item) => (
              <div key={`${item.customer}-${item.branch}`} className="rounded-lg border border-zinc-800 bg-zinc-900/70 p-3 text-sm">
                <p className="text-zinc-100 font-semibold">{item.customer}</p>
                <p className="text-zinc-400">Sucursal: {item.branch} | Antigüedad: {item.age}</p>
                <p className="text-amber-300">Deuda: {item.debt}</p>
              </div>
            ))}

            {filtered.length === 0 ? <p className="text-sm text-zinc-400">Sin registros para la sucursal seleccionada.</p> : null}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}
