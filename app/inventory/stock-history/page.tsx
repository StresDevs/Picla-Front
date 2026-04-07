'use client'

import { useEffect, useMemo, useState } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { PageHeader } from '@/components/common/page-header'
import { InventorySubnav } from '@/components/modules/inventory/inventory-subnav'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { DataTable } from '@/components/common/data-table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ACTIVE_ROLE_EVENT, getActiveUserContext } from '@/lib/mock/runtime-store'
import { branchesService, movementHistoryService, type InventoryMovementRow } from '@/lib/supabase/inventory'

export default function InventoryStockHistoryPage() {
  const [movements, setMovements] = useState<InventoryMovementRow[]>([])
  const [branches, setBranches] = useState<Array<{ id: string; name: string }>>([])
  const [activeBranchId, setActiveBranchId] = useState(() => getActiveUserContext().branch_id)
  const [branchFilter, setBranchFilter] = useState('all')
  const [movementTypeFilter, setMovementTypeFilter] = useState('all')
  const [productFilter, setProductFilter] = useState('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const syncContext = () => {
      const context = getActiveUserContext()
      setActiveBranchId(context.branch_id)
      setBranchFilter(context.branch_id)
    }

    const loadBranches = async () => {
      setIsLoading(true)
      setError(null)
      try {
        syncContext()
        const branchRows = await branchesService.getAll()
        setBranches(branchRows)
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'No se pudo cargar historial de stock')
      } finally {
        setIsLoading(false)
      }
    }

    void loadBranches()
    window.addEventListener(ACTIVE_ROLE_EVENT, syncContext)
    window.addEventListener('focus', syncContext)

    return () => {
      window.removeEventListener(ACTIVE_ROLE_EVENT, syncContext)
      window.removeEventListener('focus', syncContext)
    }
  }, [])

  useEffect(() => {
    if (!activeBranchId) return

    const loadMovements = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const movementRows = await movementHistoryService.getHistory({ branch_id: activeBranchId })
        setMovements(movementRows)
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'No se pudo cargar historial de stock')
      } finally {
        setIsLoading(false)
      }
    }

    void loadMovements()
  }, [activeBranchId])

  const productNames = useMemo(
    () => [...new Set(movements.map((item) => item.part_name).filter(Boolean))],
    [movements]
  )

  const movementTypes = useMemo(
    () => [...new Set(movements.map((item) => item.movement_type).filter(Boolean))],
    [movements]
  )

  const filteredMovements = useMemo(() => {
    const start = startDate ? new Date(`${startDate}T00:00:00`) : null
    const end = endDate ? new Date(`${endDate}T23:59:59.999`) : null

    return movements.filter((movement) => {
      const movementTime = new Date(movement.created_at).getTime()
      const byDate = (!start || movementTime >= start.getTime()) && (!end || movementTime <= end.getTime())
      const byBranch = branchFilter === 'all' || movement.branch_id === branchFilter
      const byType = movementTypeFilter === 'all' || movement.movement_type === movementTypeFilter
      const byProduct = productFilter === 'all' || movement.part_name === productFilter
      return byDate && byBranch && byType && byProduct
    })
  }, [movements, startDate, endDate, branchFilter, movementTypeFilter, productFilter])

  const totalUnits = useMemo(
    () => filteredMovements.reduce((acc, movement) => acc + Number(movement.quantity || 0), 0),
    [filteredMovements]
  )

  const uniqueEvents = useMemo(
    () => new Set(filteredMovements.map((item) => item.id)).size,
    [filteredMovements]
  )

  return (
    <MainLayout>
      <div className="space-y-6">
        <PageHeader
          title="Historial de inventario"
          description="Movimientos de stock por fecha, sucursal, tipo y producto"
        />
        <InventorySubnav />

        {error ? (
          <Card className="border-red-500/40 bg-red-500/5">
            <CardContent className="pt-6 text-sm text-red-700 dark:text-red-300">{error}</CardContent>
          </Card>
        ) : null}

        <Card className="bg-gradient-to-r from-sky-950/70 via-slate-950/70 to-emerald-950/70 border-primary/30">
          <CardHeader>
            <CardTitle className="text-base">Filtros de fechas</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Desde</label>
              <Input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Hasta</label>
              <Input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Sucursal</label>
              <Select value={branchFilter} onValueChange={setBranchFilter}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {branches.map((branch) => (
                    <SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo movimiento</label>
              <Select value={movementTypeFilter} onValueChange={setMovementTypeFilter}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {movementTypes.map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
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
                  {productNames.map((name) => (
                    <SelectItem key={name} value={name}>{name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Movimientos</label>
              <div className="rounded-lg border border-border/60 bg-background/60 px-3 py-2 text-sm">{uniqueEvents || 0}</div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Unidades movidas</label>
              <div className="rounded-lg border border-border/60 bg-background/60 px-3 py-2 text-sm">{totalUnits}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Registros de movimientos</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={[
                { key: 'created_at', label: 'Fecha', render: (value) => new Date(String(value)).toLocaleString() },
                { key: 'movement_type', label: 'Tipo', render: (value) => String(value) },
                {
                  key: 'branch_id',
                  label: 'Sucursal',
                  render: (value) => branches.find((branch) => branch.id === String(value))?.name ?? String(value),
                },
                { key: 'part_name', label: 'Producto', render: (value) => String(value) },
                { key: 'part_code', label: 'Codigo', render: (value) => String(value) },
                { key: 'quantity_before', label: 'Antes', render: (value) => String(value) },
                { key: 'quantity', label: 'Cantidad', render: (value) => String(value) },
                { key: 'quantity_after', label: 'Despues', render: (value) => String(value) },
                { key: 'reason', label: 'Motivo', render: (value) => String(value) },
              ]}
              data={filteredMovements}
              emptyMessage={isLoading ? 'Cargando historial...' : 'No hay movimientos para los filtros seleccionados'}
            />
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}
