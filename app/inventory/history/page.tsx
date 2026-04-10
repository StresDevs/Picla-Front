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
import { ACTIVE_ROLE_EVENT, getActiveUserContext } from '@/lib/mock/runtime-store'
import { branchesService, transferService, type TransferHistoryRow } from '@/lib/supabase/inventory'

export default function InventoryHistoryPage() {
  const [events, setEvents] = useState<TransferHistoryRow[]>([])
  const [branches, setBranches] = useState<Array<{ id: string; name: string }>>([])
  const [activeBranchId, setActiveBranchId] = useState(() => getActiveUserContext().branch_id)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [eventType, setEventType] = useState('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [branchFilter, setBranchFilter] = useState('all')
  const [productFilter, setProductFilter] = useState('all')

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
        setError(loadError instanceof Error ? loadError.message : 'No se pudo cargar historial')
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

    const loadHistory = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const historyRows = await transferService.getHistory({ branch_id: activeBranchId })
        setEvents(historyRows)
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'No se pudo cargar historial')
      } finally {
        setIsLoading(false)
      }
    }

    void loadHistory()
  }, [activeBranchId])

  const productNames = useMemo(
    () => [...new Set(events.map((item) => item.part_name).filter(Boolean))],
    [events]
  )

  const filteredEvents = useMemo(() => {
    const start = startDate ? new Date(`${startDate}T00:00:00`) : null
    const end = endDate ? new Date(`${endDate}T23:59:59.999`) : null

    return events.filter((event) => {
      const byType = eventType === 'all' || event.action_type === eventType
      const eventTime = new Date(event.action_date).getTime()
      const byDateRange = (!start || eventTime >= start.getTime()) && (!end || eventTime <= end.getTime())
      const byBranch =
        branchFilter === 'all' ||
        event.from_branch_id === branchFilter ||
        event.to_branch_id === branchFilter
      const byProduct = productFilter === 'all' || event.part_name === productFilter

      return byType && byDateRange && byBranch && byProduct
    })
  }, [events, eventType, startDate, endDate, branchFilter, productFilter])

  return (
    <MainLayout>
      <div className="space-y-6">
        <PageHeader
          title="Historial de Traspasos"
          description="Eventos de traspasos, anulaciones, devoluciones y reposiciones"
        />
        <InventorySubnav />

        {error ? (
          <Card className="border-red-500/40 bg-red-500/5">
            <CardContent className="pt-6 text-sm text-red-700 dark:text-red-300">{error}</CardContent>
          </Card>
        ) : null}

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
                  <SelectItem value="creado">Creado</SelectItem>
                  <SelectItem value="completado">Completado</SelectItem>
                  <SelectItem value="anulacion">Anulacion</SelectItem>
                  <SelectItem value="devolucion">Devolucion</SelectItem>
                  <SelectItem value="reposicion">Reposicion</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Desde</label>
              <Input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Hasta</label>
              <Input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Origen / Destino</label>
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
              <label className="text-sm font-medium">Producto</label>
              <Select value={productFilter} onValueChange={setProductFilter}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los productos</SelectItem>
                  {productNames.map((productName) => (
                    <SelectItem key={productName} value={productName}>{productName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Historial de traspasos y movimientos</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={[
                { key: 'action_date', label: 'Fecha', render: (v) => new Date(String(v)).toLocaleString() },
                {
                  key: 'action_type',
                  label: 'Operacion',
                  render: (v) => {
                    const value = String(v)
                    const className =
                      value === 'completado'
                        ? 'bg-emerald-600 text-white'
                        : value === 'creado'
                        ? 'bg-slate-500 text-white'
                        : value === 'anulacion'
                        ? 'bg-rose-600 text-white'
                        : value === 'devolucion'
                        ? 'bg-amber-600 text-white'
                        : 'bg-sky-600 text-white'

                    return <Badge className={className}>{value}</Badge>
                  },
                },
                { key: 'part_name', label: 'Producto', render: (v) => String(v) },
                { key: 'part_code', label: 'Codigo', render: (v) => String(v) },
                { key: 'quantity', label: 'Cantidad', render: (v) => String(v) },
                {
                  key: 'from_branch_id',
                  label: 'Origen',
                  render: (v) => branches.find((branch) => branch.id === String(v))?.name ?? String(v),
                },
                {
                  key: 'to_branch_id',
                  label: 'Destino',
                  render: (v) => branches.find((branch) => branch.id === String(v))?.name ?? String(v),
                },
                { key: 'action_reason', label: 'Motivo', render: (v) => String(v || '-') },
              ]}
              data={filteredEvents}
              emptyMessage={isLoading ? 'Cargando historial...' : 'No hay traspasos que cumplan los filtros'}
            />
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}
