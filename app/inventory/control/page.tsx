'use client'

import { useMemo, useState } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { PageHeader } from '@/components/common/page-header'
import { InventorySubnav } from '@/components/modules/inventory/inventory-subnav'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { getInventoryCrudLogs } from '@/lib/mock/runtime-store'
import { mockBranches } from '@/lib/mock/data'

const stockByWarehouse = [
  { warehouse: 'Bodega Central CBBA', branch: 'Global', items: 1450, value: 'Bs 320,500' },
  { warehouse: 'Tienda Centro', branch: 'Sucursal Centro', items: 540, value: 'Bs 122,340' },
  { warehouse: 'Tienda Norte', branch: 'Sucursal Norte', items: 430, value: 'Bs 99,870' },
  { warehouse: 'Tienda Sur', branch: 'Sucursal Sur', items: 380, value: 'Bs 88,120' },
]

export default function InventoryControlPage() {
  const [crudLogs] = useState(() => getInventoryCrudLogs())
  const [branchFilter, setBranchFilter] = useState('all')
  const [actionFilter, setActionFilter] = useState('all')
  const [entityFilter, setEntityFilter] = useState('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const filteredLogs = useMemo(() => {
    const start = startDate ? new Date(`${startDate}T00:00:00`) : null
    const end = endDate ? new Date(`${endDate}T23:59:59.999`) : null

    return crudLogs.filter((log) => {
      const ts = new Date(log.created_at).getTime()
      const byDate = (!start || ts >= start.getTime()) && (!end || ts <= end.getTime())
      const byBranch = branchFilter === 'all' || log.branch_id === branchFilter
      const byAction = actionFilter === 'all' || log.action === actionFilter
      const byEntity = entityFilter === 'all' || log.entity_type === entityFilter

      return byDate && byBranch && byAction && byEntity
    })
  }, [crudLogs, branchFilter, actionFilter, entityFilter, startDate, endDate])

  return (
    <MainLayout>
      <div className="space-y-6">
        <PageHeader title="Control de Inventario" description="Verificación de stock por almacén y corte por fecha (día/mes/año)" />
        <InventorySubnav />

        <Card className="bg-zinc-950/70 border-zinc-800">
          <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-4 gap-3">
            <Input type="date" />
            <Input placeholder="Mes (MM-YYYY)" />
            <Input placeholder="Año" />
            <Button>Aplicar Corte</Button>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {stockByWarehouse.map((stock) => (
            <Card key={stock.warehouse} className="bg-zinc-950/70 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-zinc-100 text-base">{stock.warehouse}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-zinc-400">{stock.branch}</p>
                <p className="text-zinc-100 text-2xl font-semibold mt-3">{stock.items} items</p>
                <p className="text-emerald-300 text-sm mt-1">Valor inventario: {stock.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="bg-zinc-950/70 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-zinc-100">Bitácora de cambios de inventario (CRUD)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              <div className="space-y-2">
                <p className="text-sm font-medium text-zinc-200">Sucursal</p>
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
                <p className="text-sm font-medium text-zinc-200">Acción</p>
                <Select value={actionFilter} onValueChange={setActionFilter}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="create">Create</SelectItem>
                    <SelectItem value="update">Update</SelectItem>
                    <SelectItem value="delete">Delete</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-zinc-200">Entidad</p>
                <Select value={entityFilter} onValueChange={setEntityFilter}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="product">Producto</SelectItem>
                    <SelectItem value="kit">Kit</SelectItem>
                    <SelectItem value="transfer">Traspaso</SelectItem>
                    <SelectItem value="inventory_exit">Salida</SelectItem>
                    <SelectItem value="sale">Venta</SelectItem>
                    <SelectItem value="quotation">Cotización</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-zinc-200">Desde</p>
                <Input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-zinc-200">Hasta</p>
                <Input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              {filteredLogs.map((log) => (
                <div key={log.id} className="rounded-lg border border-zinc-800 bg-zinc-900/70 p-3 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold text-zinc-100">{log.entity_type} | {log.entity_name}</p>
                    <Badge className={log.action === 'create' ? 'bg-emerald-600 text-white' : log.action === 'update' ? 'bg-sky-600 text-white' : 'bg-rose-600 text-white'}>
                      {log.action.toUpperCase()}
                    </Badge>
                  </div>
                  <p className="text-zinc-400">ID entidad: {log.entity_id}</p>
                  <p className="text-zinc-400">Usuario: {log.user_name} | Fecha: {new Date(log.created_at).toLocaleString('es-BO')}</p>
                  <p className="text-zinc-400">Sucursal: {mockBranches.find((branch) => branch.id === log.branch_id)?.name || log.branch_id || 'N/A'}</p>
                  {log.details ? <p className="text-zinc-300 mt-1">Detalle: {log.details}</p> : null}
                </div>
              ))}

              {filteredLogs.length === 0 ? (
                <p className="text-sm text-zinc-400">No hay registros CRUD para los filtros seleccionados.</p>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}
