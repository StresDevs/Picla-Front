'use client'

import { useEffect, useMemo, useState } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { PageHeader } from '@/components/common/page-header'
import { InventorySubnav } from '@/components/modules/inventory/inventory-subnav'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { ACTIVE_ROLE_EVENT, getActiveUserContext } from '@/lib/mock/runtime-store'
import {
  branchesService,
  inventoryControlService,
  inventoryService,
  partsService,
  type InventoryBranchSummary,
  type InventoryControlView,
} from '@/lib/supabase/inventory'
import type { Part } from '@/types/database'

export default function InventoryControlPage() {
  const [branches, setBranches] = useState<Array<{ id: string; name: string }>>([])
  const [branchSummaries, setBranchSummaries] = useState<InventoryBranchSummary[]>([])
  const [records, setRecords] = useState<InventoryControlView[]>([])
  const [products, setProducts] = useState<Part[]>([])
  const [activeBranchId, setActiveBranchId] = useState(() => getActiveUserContext().branch_id)

  const [branchId, setBranchId] = useState('')
  const [partId, setPartId] = useState('')
  const [countedQuantity, setCountedQuantity] = useState('')
  const [controlReason, setControlReason] = useState('')
  const [notes, setNotes] = useState('')
  const [applyAdjustment, setApplyAdjustment] = useState<'yes' | 'no'>('no')

  const [error, setError] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const [branchFilter, setBranchFilter] = useState('all')
  const [differenceFilter, setDifferenceFilter] = useState('all')
  const [productFilter, setProductFilter] = useState('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const loadDashboard = async (branchScope: string | null) => {
    const [branchRows, summaryRows, recordRows] = await Promise.all([
      branchesService.getAll(),
      inventoryService.getBranchSummary(branchScope),
      inventoryControlService.getRecords(branchScope),
    ])

    setBranches(branchRows)
    setBranchSummaries(summaryRows)
    setRecords(recordRows)
    const contextBranch = getActiveUserContext().branch_id || branchRows[0]?.id || ''
    setBranchId(contextBranch)
    setBranchFilter(contextBranch)
  }

  useEffect(() => {
    const syncContext = () => {
      const context = getActiveUserContext()
      setActiveBranchId(context.branch_id)
      setBranchId(context.branch_id)
      setBranchFilter(context.branch_id)
    }

    const initialize = async () => {
      setIsLoading(true)
      setError(null)
      try {
        syncContext()
        await loadDashboard(getActiveUserContext().branch_id)
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'No se pudo cargar control de inventario')
      } finally {
        setIsLoading(false)
      }
    }

    void initialize()
    window.addEventListener(ACTIVE_ROLE_EVENT, syncContext)
    window.addEventListener('focus', syncContext)

    return () => {
      window.removeEventListener(ACTIVE_ROLE_EVENT, syncContext)
      window.removeEventListener('focus', syncContext)
    }
  }, [])

  useEffect(() => {
    if (!activeBranchId) return

    const reloadByBranch = async () => {
      setIsLoading(true)
      setError(null)
      try {
        await loadDashboard(activeBranchId)
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'No se pudo cargar control de inventario')
      } finally {
        setIsLoading(false)
      }
    }

    void reloadByBranch()
  }, [activeBranchId])

  useEffect(() => {
    const loadProducts = async () => {
      if (!branchId) {
        setProducts([])
        setPartId('')
        return
      }

      try {
        const rows = await partsService.getAll(branchId)
        setProducts(rows)
        setPartId((prev) => prev || rows[0]?.id || '')
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'No se pudo cargar productos')
      }
    }

    void loadProducts()
  }, [branchId])

  const registerControl = async () => {
    setFeedback(null)
    setError(null)

    const qty = Number(countedQuantity)
    if (!branchId || !partId || !Number.isFinite(qty) || qty < 0) {
      setFeedback('Completa sucursal, producto y cantidad contada valida.')
      return
    }

    setIsSaving(true)
    try {
      const recordId = await inventoryControlService.record({
        branch_id: branchId,
        part_id: partId,
        counted_quantity: qty,
        control_reason: controlReason.trim() || null,
        notes: notes.trim() || null,
        apply_adjustment: applyAdjustment === 'yes',
      })

      await loadDashboard(activeBranchId || null)
      setCountedQuantity('')
      setControlReason('')
      setNotes('')
      setFeedback(`Control ${recordId} registrado correctamente.`)
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'No se pudo registrar el control')
    } finally {
      setIsSaving(false)
    }
  }

  const productNames = useMemo(
    () => [...new Set(records.map((record) => record.part_name).filter(Boolean))],
    [records]
  )

  const filteredLogs = useMemo(() => {
    const start = startDate ? new Date(`${startDate}T00:00:00`) : null
    const end = endDate ? new Date(`${endDate}T23:59:59.999`) : null

    return records.filter((record) => {
      const ts = new Date(record.recorded_at).getTime()
      const byDate = (!start || ts >= start.getTime()) && (!end || ts <= end.getTime())
      const byBranch = branchFilter === 'all' || record.branch_id === branchFilter
      const byDifference =
        differenceFilter === 'all' ||
        (differenceFilter === 'with_difference'
          ? Number(record.difference_quantity) !== 0
          : Number(record.difference_quantity) === 0)
      const byProduct = productFilter === 'all' || record.part_name === productFilter

      return byDate && byBranch && byDifference && byProduct
    })
  }, [records, branchFilter, differenceFilter, productFilter, startDate, endDate])

  return (
    <MainLayout>
      <div className="space-y-6">
        <PageHeader title="Control de Inventario" description="Verificación de stock por almacén y corte por fecha (día/mes/año)" />
        <InventorySubnav />

        {error ? (
          <Card className="border-red-500/40 bg-red-500/5">
            <CardContent className="pt-6 text-sm text-red-700 dark:text-red-300">{error}</CardContent>
          </Card>
        ) : null}

        <Card className="bg-zinc-950/70 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-zinc-100 text-base">Registrar control</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-3">
            <Select value={branchId} onValueChange={setBranchId}>
              <SelectTrigger><SelectValue placeholder="Sucursal" /></SelectTrigger>
              <SelectContent>
                {branches.map((branch) => (
                  <SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={partId} onValueChange={setPartId}>
              <SelectTrigger><SelectValue placeholder="Producto" /></SelectTrigger>
              <SelectContent>
                {products.map((part) => (
                  <SelectItem key={part.id} value={part.id}>{part.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="number"
              min="0"
              step="1"
              placeholder="Cantidad contada"
              value={countedQuantity}
              onChange={(event) => setCountedQuantity(event.target.value)}
            />
            <Input
              placeholder="Motivo de control"
              value={controlReason}
              onChange={(event) => setControlReason(event.target.value)}
            />
            <Select value={applyAdjustment} onValueChange={(value: 'yes' | 'no') => setApplyAdjustment(value)}>
              <SelectTrigger><SelectValue placeholder="Aplicar ajuste" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="no">Sin ajuste</SelectItem>
                <SelectItem value="yes">Aplicar ajuste</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={() => void registerControl()} disabled={isSaving}>Registrar</Button>
            <div className="md:col-span-3 xl:col-span-6">
              <Input
                placeholder="Notas adicionales"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
              />
            </div>
            {feedback ? <p className="md:col-span-3 xl:col-span-6 text-sm text-emerald-300">{feedback}</p> : null}
            <p className="md:col-span-3 xl:col-span-6 text-xs text-zinc-500">Sucursal activa: {activeBranchId || 'No disponible'}</p>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {branchSummaries.map((stock) => (
            <Card key={stock.branch_id} className="bg-zinc-950/70 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-zinc-100 text-base">{stock.branch_name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-zinc-400">Productos distintos: {stock.total_items}</p>
                <p className="text-zinc-100 text-2xl font-semibold mt-3">{stock.total_units} unidades</p>
                <p className="text-emerald-300 text-sm mt-1">Valor inventario: Bs {stock.estimated_value.toFixed(2)}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="bg-zinc-950/70 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-zinc-100">Registros de control</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              <div className="space-y-2">
                <p className="text-sm font-medium text-zinc-200">Sucursal</p>
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
                <p className="text-sm font-medium text-zinc-200">Diferencia</p>
                <Select value={differenceFilter} onValueChange={setDifferenceFilter}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="with_difference">Con diferencia</SelectItem>
                    <SelectItem value="balanced">Sin diferencia</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-zinc-200">Producto</p>
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
                <p className="text-sm font-medium text-zinc-200">Desde</p>
                <Input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-zinc-200">Hasta</p>
                <Input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              {filteredLogs.map((record) => (
                <div key={record.id} className="rounded-lg border border-zinc-800 bg-zinc-900/70 p-3 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold text-zinc-100">{record.part_name} ({record.part_code})</p>
                    <Badge className={Number(record.difference_quantity) === 0 ? 'bg-emerald-600 text-white' : 'bg-amber-600 text-white'}>
                      Dif: {record.difference_quantity}
                    </Badge>
                  </div>
                  <p className="text-zinc-400">Sucursal: {record.branch_name}</p>
                  <p className="text-zinc-400">Sistema: {record.system_quantity} | Contado: {record.counted_quantity}</p>
                  <p className="text-zinc-400">Usuario: {record.recorded_by_name || 'N/A'} | Fecha: {new Date(record.recorded_at).toLocaleString('es-BO')}</p>
                  <p className="text-zinc-300 mt-1">Motivo: {record.control_reason || 'Sin motivo'}</p>
                  {record.notes ? <p className="text-zinc-300">Notas: {record.notes}</p> : null}
                </div>
              ))}

              {filteredLogs.length === 0 ? (
                <p className="text-sm text-zinc-400">{isLoading ? 'Cargando registros...' : 'No hay registros para los filtros seleccionados.'}</p>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}
