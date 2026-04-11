'use client'

import { useEffect, useMemo, useState } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { PageHeader } from '@/components/common/page-header'
import { InventorySubnav } from '@/components/modules/inventory/inventory-subnav'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { ACTIVE_ROLE_EVENT, getActiveUserContext, type AppUserRole } from '@/lib/mock/runtime-store'
import {
  branchesService,
  snapshotHistoryService,
  type InventorySnapshotHistoryRow,
  type InventorySnapshotItemRow,
} from '@/lib/supabase/inventory'

function snapshotTypeLabel(snapshotType: string) {
  return snapshotType === 'open' ? 'Apertura' : 'Cierre'
}

export default function InventoryStockHistoryPage() {
  const [snapshots, setSnapshots] = useState<InventorySnapshotHistoryRow[]>([])
  const [snapshotItemsMap, setSnapshotItemsMap] = useState<Record<string, InventorySnapshotItemRow[]>>({})
  const [loadingSnapshotItems, setLoadingSnapshotItems] = useState<Record<string, boolean>>({})
  const [expandedSnapshots, setExpandedSnapshots] = useState<string[]>([])
  const [branches, setBranches] = useState<Array<{ id: string; name: string }>>([])
  const [activeRole, setActiveRole] = useState<AppUserRole>(() => getActiveUserContext().role)
  const [activeBranchId, setActiveBranchId] = useState(() => getActiveUserContext().branch_id)
  const [branchFilter, setBranchFilter] = useState(() => getActiveUserContext().branch_id)
  const [snapshotTypeFilter, setSnapshotTypeFilter] = useState<'all' | 'open' | 'close'>('all')
  const [productSearch, setProductSearch] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const syncContext = () => {
      const context = getActiveUserContext()
      setActiveRole(context.role)
      setActiveBranchId(context.branch_id)
      if (context.role === 'admin') {
        setBranchFilter(context.branch_id)
      } else {
        setBranchFilter(context.branch_id)
      }
    }

    const loadBranches = async () => {
      try {
        syncContext()
        const context = getActiveUserContext()
        if (context.role === 'admin') {
          const branchRows = await branchesService.getAll()
          setBranches(branchRows)
        } else {
          setBranches([])
        }
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'No se pudo cargar configuracion de sucursales')
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

  const normalizedProductSearch = useMemo(() => productSearch.trim(), [productSearch])

  const resolvedBranchId = useMemo(() => {
    if (activeRole === 'admin') {
      return branchFilter === 'all' ? null : branchFilter || activeBranchId
    }
    return activeBranchId
  }, [activeBranchId, activeRole, branchFilter])

  useEffect(() => {
    if (!activeBranchId) return

    const loadSnapshots = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const rows = await snapshotHistoryService.getHistory({
          branch_id: resolvedBranchId,
          snapshot_type: snapshotTypeFilter === 'all' ? null : snapshotTypeFilter,
          from: startDate ? new Date(`${startDate}T00:00:00`).toISOString() : null,
          to: endDate ? new Date(`${endDate}T23:59:59.999`).toISOString() : null,
          product_search: normalizedProductSearch || null,
        })

        setSnapshots(rows)
        setSnapshotItemsMap((prev) => {
          const next: Record<string, InventorySnapshotItemRow[]> = {}
          for (const row of rows) {
            if (prev[row.snapshot_id]) {
              next[row.snapshot_id] = prev[row.snapshot_id]
            }
          }
          return next
        })
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'No se pudo cargar historial de snapshots')
      } finally {
        setIsLoading(false)
      }
    }

    void loadSnapshots()
  }, [activeBranchId, endDate, normalizedProductSearch, resolvedBranchId, snapshotTypeFilter, startDate])

  useEffect(() => {
    setSnapshotItemsMap({})
  }, [normalizedProductSearch])

  const loadSnapshotItems = async (snapshotId: string) => {
    if (loadingSnapshotItems[snapshotId]) return

    setLoadingSnapshotItems((prev) => ({ ...prev, [snapshotId]: true }))
    try {
      const items = await snapshotHistoryService.getItems({
        snapshot_id: snapshotId,
        product_search: normalizedProductSearch || null,
      })

      setSnapshotItemsMap((prev) => ({
        ...prev,
        [snapshotId]: items,
      }))
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'No se pudo cargar detalle del snapshot')
    } finally {
      setLoadingSnapshotItems((prev) => ({ ...prev, [snapshotId]: false }))
    }
  }

  useEffect(() => {
    for (const snapshotId of expandedSnapshots) {
      if (!snapshotItemsMap[snapshotId]) {
        void loadSnapshotItems(snapshotId)
      }
    }
  }, [expandedSnapshots, snapshotItemsMap])

  const totalSnapshots = snapshots.length
  const totalItems = useMemo(
    () => snapshots.reduce((acc, snapshot) => acc + Number(snapshot.item_count || 0), 0),
    [snapshots],
  )
  const totalUnits = useMemo(
    () => snapshots.reduce((acc, snapshot) => acc + Number(snapshot.total_units || 0), 0),
    [snapshots],
  )
  const totalMatchingUnits = useMemo(
    () => snapshots.reduce((acc, snapshot) => acc + Number(snapshot.matching_product_units || 0), 0),
    [snapshots],
  )

  return (
    <MainLayout>
      <div className="space-y-6">
        <PageHeader
          title="Historial de inventario"
          description="Snapshots de apertura y cierre de caja con detalle de productos"
        />
        <InventorySubnav />

        {error ? (
          <Card className="border-red-500/40 bg-red-500/5">
            <CardContent className="pt-6 text-sm text-red-700 dark:text-red-300">{error}</CardContent>
          </Card>
        ) : null}

        <Card className="bg-gradient-to-r from-sky-950/70 via-slate-950/70 to-emerald-950/70 border-primary/30">
          <CardHeader>
            <CardTitle className="text-base">Filtros de snapshots</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-7 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Desde</label>
              <Input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Hasta</label>
              <Input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
            </div>
            {activeRole === 'admin' ? (
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
            ) : null}
            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo snapshot</label>
              <Select value={snapshotTypeFilter} onValueChange={(value: 'all' | 'open' | 'close') => setSnapshotTypeFilter(value)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="open">Apertura</SelectItem>
                  <SelectItem value="close">Cierre</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Buscar producto</label>
              <Input
                value={productSearch}
                onChange={(event) => setProductSearch(event.target.value)}
                placeholder="Codigo o nombre (ej: bomba 1)"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Snapshots</label>
              <div className="rounded-lg border border-border/60 bg-background/60 px-3 py-2 text-sm">{totalSnapshots}</div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Items y unidades</label>
              <div className="rounded-lg border border-border/60 bg-background/60 px-3 py-2 text-sm">
                {totalItems} items | {totalUnits.toLocaleString('es-BO')} unidades
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Historial de snapshots</CardTitle>
          </CardHeader>
          <CardContent>
            {normalizedProductSearch ? (
              <div className="mb-4 rounded-lg border border-emerald-500/35 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
                Coincidencias para "{normalizedProductSearch}": {totalMatchingUnits.toLocaleString('es-BO')} unidades en {totalSnapshots} snapshots
              </div>
            ) : null}

            {isLoading ? (
              <p className="text-sm text-muted-foreground">Cargando snapshots...</p>
            ) : snapshots.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay snapshots para los filtros seleccionados.</p>
            ) : (
              <Accordion
                type="multiple"
                value={expandedSnapshots}
                onValueChange={setExpandedSnapshots}
                className="w-full"
              >
                {snapshots.map((snapshot) => {
                  const items = snapshotItemsMap[snapshot.snapshot_id] || []
                  const isLoadingItems = Boolean(loadingSnapshotItems[snapshot.snapshot_id])

                  return (
                    <AccordionItem key={snapshot.snapshot_id} value={snapshot.snapshot_id} className="border-b border-border/50">
                      <AccordionTrigger className="hover:no-underline">
                        <div className="grid grid-cols-1 md:grid-cols-6 gap-2 w-full text-left">
                          <div>
                            <p className="text-xs text-muted-foreground">Tipo</p>
                            <Badge className={snapshot.snapshot_type === 'open' ? 'bg-sky-700 text-white' : 'bg-emerald-700 text-white'}>
                              {snapshotTypeLabel(snapshot.snapshot_type)}
                            </Badge>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Fecha</p>
                            <p className="text-sm font-medium">{new Date(snapshot.taken_at).toLocaleString('es-BO')}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Sucursal</p>
                            <p className="text-sm font-medium">{snapshot.branch_name}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Registrado por</p>
                            <p className="text-sm font-medium">{snapshot.taken_by_name || '-'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Items</p>
                            <p className="text-sm font-medium">{snapshot.item_count}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Unidades</p>
                            <p className="text-sm font-medium">{Number(snapshot.total_units || 0).toLocaleString('es-BO')}</p>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="mb-3 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-muted-foreground">
                          <div className="rounded-md border border-border/50 bg-muted/20 px-3 py-2">
                            Rol apertura de caja: <span className="font-medium text-foreground">{snapshot.opening_role}</span>
                          </div>
                          <div className="rounded-md border border-border/50 bg-muted/20 px-3 py-2">
                            Caja abierta por: <span className="font-medium text-foreground">{snapshot.opened_by_name || '-'}</span>
                          </div>
                          <div className="rounded-md border border-border/50 bg-muted/20 px-3 py-2">
                            Sesion: <span className="font-medium text-foreground">{snapshot.cash_session_id}</span>
                          </div>
                        </div>

                        {normalizedProductSearch ? (
                          <div className="mb-3 rounded-md border border-primary/30 bg-primary/5 px-3 py-2 text-xs">
                            Coincidencias en este snapshot: {snapshot.matching_product_count} productos | {snapshot.matching_product_units.toLocaleString('es-BO')} unidades
                          </div>
                        ) : null}

                        {isLoadingItems ? (
                          <p className="text-sm text-muted-foreground">Cargando detalle del snapshot...</p>
                        ) : items.length === 0 ? (
                          <p className="text-sm text-muted-foreground">No hay productos para este snapshot con los filtros actuales.</p>
                        ) : (
                          <div className="overflow-x-auto rounded-lg border border-border/60">
                            <table className="w-full text-sm">
                              <thead className="bg-muted/35">
                                <tr>
                                  <th className="px-3 py-2 text-left font-medium">Codigo</th>
                                  <th className="px-3 py-2 text-left font-medium">Producto</th>
                                  <th className="px-3 py-2 text-right font-medium">Cantidad</th>
                                </tr>
                              </thead>
                              <tbody>
                                {items.map((item) => (
                                  <tr key={`${item.snapshot_id}-${item.part_id}`} className="border-t border-border/50">
                                    <td className="px-3 py-2">{item.part_code || '-'}</td>
                                    <td className="px-3 py-2">{item.part_name || '-'}</td>
                                    <td className="px-3 py-2 text-right">{Number(item.quantity || 0).toLocaleString('es-BO')}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </AccordionContent>
                    </AccordionItem>
                  )
                })}
              </Accordion>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}
