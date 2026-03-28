'use client'

import { useEffect, useMemo, useState } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { PageHeader } from '@/components/common/page-header'
import { InventorySubnav } from '@/components/modules/inventory/inventory-subnav'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { DataTable } from '@/components/common/data-table'
import { mockBranches } from '@/lib/mock/data'
import { getInventorySnapshots, type InventorySnapshotRecord } from '@/lib/mock/runtime-store'

export default function InventoryStockHistoryPage() {
  const [snapshots, setSnapshots] = useState<InventorySnapshotRecord[]>(getInventorySnapshots())
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  useEffect(() => {
    setSnapshots(getInventorySnapshots())
  }, [])

  const filteredSnapshots = useMemo(() => {
    const start = startDate ? new Date(`${startDate}T00:00:00`) : null
    const end = endDate ? new Date(`${endDate}T23:59:59.999`) : null

    return snapshots.filter((snapshot) => {
      const snapshotTime = new Date(snapshot.snapshot_date).getTime()
      return (!start || snapshotTime >= start.getTime()) && (!end || snapshotTime <= end.getTime())
    })
  }, [snapshots, startDate, endDate])

  const totalUnits = useMemo(
    () => filteredSnapshots.reduce((acc, snapshot) => acc + snapshot.opening_stock, 0),
    [filteredSnapshots]
  )

  const uniqueDays = useMemo(
    () => new Set(filteredSnapshots.map((item) => item.snapshot_date.slice(0, 10))).size,
    [filteredSnapshots]
  )

  return (
    <MainLayout>
      <div className="space-y-6">
        <PageHeader
          title="Historial de inventario"
          description="Stock registrado al inicio de cada día con opción de filtrar por rango de fechas"
        />
        <InventorySubnav />

        <Card className="bg-gradient-to-r from-sky-950/70 via-slate-950/70 to-emerald-950/70 border-primary/30">
          <CardHeader>
            <CardTitle className="text-base">Filtros de fechas</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Desde</label>
              <Input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Hasta</label>
              <Input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Días cubiertos</label>
              <div className="rounded-lg border border-border/60 bg-background/60 px-3 py-2 text-sm">{uniqueDays || 0}</div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Stock total (unidades)</label>
              <div className="rounded-lg border border-border/60 bg-background/60 px-3 py-2 text-sm">{totalUnits}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Registros de stock inicial</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={[
                { key: 'snapshot_date', label: 'Fecha', render: (value) => new Date(String(value)).toLocaleDateString() },
                {
                  key: 'branch_id',
                  label: 'Sucursal',
                  render: (value) => mockBranches.find((branch) => branch.id === String(value))?.name ?? String(value),
                },
                { key: 'part_name', label: 'Producto', render: (value) => String(value) },
                { key: 'category', label: 'Categoria', render: (value) => String(value) },
                { key: 'opening_stock', label: 'Stock inicial', render: (value) => String(value) },
              ]}
              data={filteredSnapshots}
              emptyMessage="No hay registros de inventario para el rango"
            />
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}
