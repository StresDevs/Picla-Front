'use client'

import { useEffect, useMemo, useState } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { PageHeader } from '@/components/common/page-header'
import { InventorySubnav } from '@/components/modules/inventory/inventory-subnav'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DataTable } from '@/components/common/data-table'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { mockBranches } from '@/lib/mock/data'
import { getTransferHistory, getTransferFilterOptions } from '@/lib/mock/runtime-store'

export default function InventoryHistoryPage() {
  const [events, setEvents] = useState(getTransferHistory())
  const [eventType, setEventType] = useState('all')
  const [dateFilter, setDateFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [branchFilter, setBranchFilter] = useState('all')
  const [productFilter, setProductFilter] = useState('all')

  useEffect(() => {
    setEvents(getTransferHistory())
  }, [])

  const options = useMemo(() => getTransferFilterOptions(), [events])

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      const byType = eventType === 'all' || event.event_type === eventType
      const byDate =
        !dateFilter ||
        new Date(event.event_date).toISOString().slice(0, 10) === dateFilter
      const byCategory = categoryFilter === 'all' || event.category === categoryFilter
      const byBranch =
        branchFilter === 'all' ||
        event.from_branch_id === branchFilter ||
        event.to_branch_id === branchFilter
      const byProduct = productFilter === 'all' || event.part_name === productFilter

      return byType && byDate && byCategory && byBranch && byProduct
    })
  }, [events, eventType, dateFilter, categoryFilter, branchFilter, productFilter])

  return (
    <MainLayout>
      <div className="space-y-6">
        <PageHeader
          title="Historial de Transferencias"
          description="Eventos de envios, anulaciones, devoluciones y reposiciones"
        />
        <InventorySubnav />

        <Card>
          <CardHeader>
            <CardTitle>Filtros de historial</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo</label>
              <Select value={eventType} onValueChange={setEventType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="envio">Envio</SelectItem>
                  <SelectItem value="anulacion">Anulacion</SelectItem>
                  <SelectItem value="devolucion">Devolucion</SelectItem>
                  <SelectItem value="reposicion">Reposicion</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Dia</label>
              <Input type="date" value={dateFilter} onChange={(event) => setDateFilter(event.target.value)} />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Categoria</label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {options.categories.map((category) => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Origen / Destino</label>
              <Select value={branchFilter} onValueChange={setBranchFilter}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {mockBranches.map((branch) => (
                    <SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Producto</label>
              <Select value={productFilter} onValueChange={setProductFilter}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {options.productNames.map((productName) => (
                    <SelectItem key={productName} value={productName}>{productName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Historial de devoluciones y movimientos</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={[
                { key: 'event_date', label: 'Fecha', render: (v) => new Date(String(v)).toLocaleString() },
                {
                  key: 'event_type',
                  label: 'Operacion',
                  render: (v) => {
                    const value = String(v)
                    const className =
                      value === 'envio'
                        ? 'bg-emerald-600 text-white'
                        : value === 'anulacion'
                        ? 'bg-rose-600 text-white'
                        : value === 'devolucion'
                        ? 'bg-amber-600 text-white'
                        : 'bg-sky-600 text-white'

                    return <Badge className={className}>{value}</Badge>
                  },
                },
                { key: 'part_name', label: 'Producto', render: (v) => String(v) },
                { key: 'category', label: 'Categoria', render: (v) => String(v) },
                { key: 'quantity', label: 'Cantidad', render: (v) => String(v) },
                {
                  key: 'from_branch_id',
                  label: 'Origen',
                  render: (v) => mockBranches.find((branch) => branch.id === String(v))?.name ?? String(v),
                },
                {
                  key: 'to_branch_id',
                  label: 'Destino',
                  render: (v) => mockBranches.find((branch) => branch.id === String(v))?.name ?? String(v),
                },
                { key: 'reason', label: 'Motivo', render: (v) => String(v) },
              ]}
              data={filteredEvents}
              emptyMessage="No hay movimientos que cumplan los filtros"
            />
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}
