'use client'

import { useEffect, useMemo, useState } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { PageHeader } from '@/components/common/page-header'
import { InventorySubnav } from '@/components/modules/inventory/inventory-subnav'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { ACTIVE_ROLE_EVENT, getActiveUserContext } from '@/lib/mock/runtime-store'
import { branchesService, exitsService, partsService, type InventoryExitView } from '@/lib/supabase/inventory'
import type { Part } from '@/types/database'

export default function InventoryExitsPage() {
  const [products, setProducts] = useState<Part[]>([])
  const [records, setRecords] = useState<InventoryExitView[]>([])
  const [branches, setBranches] = useState<Array<{ id: string; name: string }>>([])
  const [activeBranchId, setActiveBranchId] = useState(() => getActiveUserContext().branch_id)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [branchFilter, setBranchFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [itemFilter, setItemFilter] = useState('all')

  const [productId, setProductId] = useState('')
  const [branchId, setBranchId] = useState('')
  const [quantity, setQuantity] = useState('')
  const [sourceType, setSourceType] = useState<'adjustment_error' | 'damage' | 'internal_use' | 'other'>('adjustment_error')
  const [sourceReference, setSourceReference] = useState('')
  const [reason, setReason] = useState('')
  const [feedback, setFeedback] = useState<string | null>(null)

  const loadRecords = async (branchScope: string | null) => {
    const data = await exitsService.getAll(branchScope)
    setRecords(data)
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
        const [branchRows] = await Promise.all([branchesService.getAll()])
        setBranches(branchRows)
        const contextBranch = getActiveUserContext().branch_id || branchRows[0]?.id || ''
        setBranchId(contextBranch)
        setBranchFilter(contextBranch)
        await loadRecords(contextBranch || null)
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'No se pudo cargar salidas')
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
        await loadRecords(activeBranchId)
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'No se pudo cargar salidas')
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
        setProductId('')
        return
      }

      try {
        const rows = await partsService.getAll(branchId)
        setProducts(rows)
        setProductId((prev) => prev || rows[0]?.id || '')
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'No se pudo cargar productos')
      }
    }

    void loadProducts()
  }, [branchId])

  const categoryOptions = useMemo(
    () => ['all', ...new Set(records.map((record) => record.category || '-'))],
    [records],
  )

  const itemOptions = useMemo(
    () => ['all', ...new Set(records.map((record) => record.part_name))],
    [records],
  )

  const filtered = useMemo(() => {
    const start = fromDate ? new Date(`${fromDate}T00:00:00`) : null
    const end = toDate ? new Date(`${toDate}T23:59:59.999`) : null

    return records.filter((record) => {
      const ts = new Date(record.created_at).getTime()
      const byDate = (!start || ts >= start.getTime()) && (!end || ts <= end.getTime())
      const byBranch = branchFilter === 'all' || record.branch_id === branchFilter
      const byCategory = categoryFilter === 'all' || (record.category || '-') === categoryFilter
      const byItem = itemFilter === 'all' || record.part_name === itemFilter
      return byDate && byBranch && byCategory && byItem
    })
  }, [records, fromDate, toDate, branchFilter, categoryFilter, itemFilter])

  const registerExit = async () => {
    setFeedback(null)
    const product = products.find((item) => item.id === productId)
    const qty = Number(quantity)

    if (!product || qty <= 0 || !reason.trim()) {
      setFeedback('Completa producto, cantidad y motivo para registrar salida.')
      return
    }

    setIsSaving(true)
    setError(null)
    try {
      const composedReason = `[${sourceType}] ${reason.trim()}`
      const createdId = await exitsService.create({
        branch_id: branchId,
        part_id: product.id,
        quantity: qty,
        reason: composedReason,
        source_reference: sourceReference.trim() || null,
      })

      await loadRecords(activeBranchId || null)
      setQuantity('')
      setReason('')
      setSourceReference('')
      setFeedback(`Salida ${createdId} registrada correctamente.`)
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'No se pudo registrar salida')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <PageHeader title="Salidas de Mercadería" description="Ajustes de inventario por error de edición/venta y otros motivos operativos" />
        <InventorySubnav />

        {error ? (
          <Card className="border-red-500/40 bg-red-500/5">
            <CardContent className="pt-6 text-sm text-red-700 dark:text-red-300">{error}</CardContent>
          </Card>
        ) : null}

        <Card className="bg-zinc-950/70 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-zinc-100">Registrar salida de inventario</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <p className="mb-3 text-xs text-zinc-500">Sucursal activa: {activeBranchId || 'N/A'}</p>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="space-y-2">
                <Label>Producto</Label>
                <Select value={productId} onValueChange={setProductId}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {products.map((product) => (
                      <SelectItem key={product.id} value={product.id}>{product.name} ({product.code})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Sucursal</Label>
                <Select value={branchId} onValueChange={setBranchId}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {branches.map((branch) => (
                      <SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Cantidad</Label>
                <Input type="number" value={quantity} onChange={(event) => setQuantity(event.target.value)} placeholder="0" />
              </div>
              <div className="space-y-2">
                <Label>Tipo de salida</Label>
                <Select value={sourceType} onValueChange={(value: 'adjustment_error' | 'damage' | 'internal_use' | 'other') => setSourceType(value)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="adjustment_error">Ajuste por error en venta/edición</SelectItem>
                    <SelectItem value="damage">Daño o merma</SelectItem>
                    <SelectItem value="internal_use">Uso interno</SelectItem>
                    <SelectItem value="other">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Referencia (venta/edición)</Label>
                <Input value={sourceReference} onChange={(event) => setSourceReference(event.target.value)} placeholder="Ej. VT-2026-041" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Motivo</Label>
                <Input value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Describe por qué se registra salida" />
              </div>
            </div>

            {feedback ? <p className="mt-3 text-xs text-primary">{feedback}</p> : null}

            <div className="mt-3 flex justify-end">
              <Button onClick={() => void registerExit()} disabled={isSaving}>Registrar salida</Button>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-950/70">
          <CardHeader>
            <CardTitle className="text-zinc-100">Filtros de historial de salidas</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <div className="space-y-2">
              <Label>Desde</Label>
              <Input type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Hasta</Label>
              <Input type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Sucursal</Label>
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
              <Label>Categoría</Label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {categoryOptions.map((category) => (
                    <SelectItem key={category} value={category}>{category === 'all' ? 'Todas' : category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Item</Label>
              <Select value={itemFilter} onValueChange={setItemFilter}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {itemOptions.map((item) => (
                    <SelectItem key={item} value={item}>{item === 'all' ? 'Todos los items' : item}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-950/70">
          <CardHeader>
            <CardTitle className="text-zinc-100">Lista de salidas registradas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {filtered.map((record) => (
              <div key={record.id} className="rounded-lg border border-zinc-800 bg-zinc-900/70 p-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold text-zinc-100">{record.id} - {record.part_name}</p>
                  <Badge className="bg-amber-600 text-white">Salida</Badge>
                </div>
                <p className="text-zinc-400">
                  {new Date(record.created_at).toLocaleString('es-BO')} | {record.branch_name} | Usuario: {record.created_by_name || 'N/A'}
                </p>
                <p className="text-zinc-400">Cantidad: {record.quantity} | Categoría: {record.category || '-'}</p>
                <p className="text-zinc-400">Motivo: {record.reason}</p>
                <p className="text-zinc-400">Referencia: {record.source_reference || 'Sin referencia'}</p>
              </div>
            ))}

            {filtered.length === 0 ? (
              <p className="text-sm text-zinc-400">{isLoading ? 'Cargando salidas...' : 'No hay salidas para los filtros seleccionados.'}</p>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}
