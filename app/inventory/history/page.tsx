'use client'

import { useMemo } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { PageHeader } from '@/components/common/page-header'
import { InventorySubnav } from '@/components/modules/inventory/inventory-subnav'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DataTable } from '@/components/common/data-table'
import { Badge } from '@/components/ui/badge'
import { mockBranches } from '@/lib/mock/data'
import { getTransfers } from '@/lib/mock/runtime-store'

export default function InventoryHistoryPage() {
  const transfers = useMemo(() => getTransfers(), [])

  return (
    <MainLayout>
      <div className="space-y-6">
        <PageHeader title="Historial de Transferencias" description="Registro consolidado de transferencias entre sucursales" />
        <InventorySubnav />

        <Card>
          <CardHeader>
            <CardTitle>Historial</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={[
                { key: 'transfer_date', label: 'Fecha', render: (v) => new Date(String(v)).toLocaleString() },
                { key: 'part_name', label: 'Producto', render: (v) => String(v) },
                { key: 'quantity', label: 'Cantidad', render: (v) => String(v) },
                {
                  key: 'from_branch_id',
                  label: 'Origen',
                  render: (v) => mockBranches.find((b) => b.id === String(v))?.name ?? String(v),
                },
                {
                  key: 'to_branch_id',
                  label: 'Destino',
                  render: (v) => mockBranches.find((b) => b.id === String(v))?.name ?? String(v),
                },
                { key: 'user_name', label: 'Usuario', render: (v) => String(v) },
                {
                  key: 'status',
                  label: 'Estado',
                  render: (v) => <Badge className="bg-emerald-600 text-white">{String(v)}</Badge>,
                },
              ]}
              data={transfers}
              emptyMessage="Aún no existen transferencias registradas"
            />
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}
