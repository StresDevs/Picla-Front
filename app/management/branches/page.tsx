'use client'

import { useMemo } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { PageHeader } from '@/components/common/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { mockBranches } from '@/lib/mock/data'
import { getSales } from '@/lib/mock/runtime-store'
import { ManagementSubnav } from '@/components/modules/management/management-subnav'

const currency = (value: number) => `Bs ${value.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

export default function ManagementBranchesPage() {
  const sales = useMemo(() => getSales(), [])

  const metrics = useMemo(() => {
    return mockBranches.map((branch) => {
      const branchSales = sales.filter((sale) => sale.branch_id === branch.id)
      const salesCount = branchSales.length
      const income = branchSales.reduce((sum, sale) => sum + sale.total_amount, 0)
      return { branch, salesCount, income }
    })
  }, [sales])

  return (
    <MainLayout>
      <div className="space-y-6">
        <PageHeader title="Gestión - Sucursales" description="Resumen operativo por sucursal" />
        <ManagementSubnav />

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {metrics.map((item) => (
            <Card key={item.branch.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{item.branch.name}</span>
                  <Badge className="bg-primary/15 text-primary">Activa</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-muted-foreground">Ubicación: {item.branch.location}</p>
                <p className="text-sm text-muted-foreground">Encargado: {item.branch.manager}</p>
                <p className="text-sm text-muted-foreground">Teléfono: {item.branch.phone}</p>

                <div className="pt-2 border-t border-border/70">
                  <p className="text-sm">Cantidad de ventas: <span className="font-semibold">{item.salesCount}</span></p>
                  <p className="text-sm">Ingresos: <span className="font-semibold text-emerald-600">{currency(item.income)}</span></p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </MainLayout>
  )
}
