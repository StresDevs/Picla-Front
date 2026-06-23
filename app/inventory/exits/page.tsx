'use client'

import { useEffect, useMemo, useState } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { PageHeader } from '@/components/common/page-header'
import { InventorySubnav } from '@/components/modules/inventory/inventory-subnav'
import { PartCombobox, SearchableStringPick } from '@/components/modules/inventory/part-combobox'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { ACTIVE_ROLE_EVENT, getActiveUserContext, type AppUserRole } from '@/lib/mock/runtime-store'
import { branchesService, exitsService, inventoryService, partsService, type InventoryExitView } from '@/lib/supabase/inventory'
import type { Part } from '@/types/database'
import { generateExitsPdf } from '@/lib/pdf/generators'
import { exportToExcel } from '@/lib/excel/export'
import { Download, FileSpreadsheet } from 'lucide-react'

function getQuotationRange(part: Part) {
  const referencePrice = Number(part.price || 0)
  const min = part.quotation_min_price ?? Number((referencePrice * 0.9).toFixed(2))
  const max = part.quotation_max_price ?? Number((referencePrice * 1.2).toFixed(2))
  return { min, max }
}

export default function InventoryExitsPage() {
  const [products, setProducts] = useState<Part[]>([])
  const [stockByPartId, setStockByPartId] = useState<Record<string, number>>({})
  const [records, setRecords] = useState<InventoryExitView[]>([])
  const [branches, setBranches] = useState<Array<{ id: string; name: string }>>([])
  const [activeRole, setActiveRole] = useState<AppUserRole>(() => getActiveUserContext().role)
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
  const [exitTypeText, setExitTypeText] = useState('')
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
      setActiveRole(context.role)
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
    const reloadByBranch = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const branchScope = branchFilter === 'all' ? null : branchFilter || activeBranchId
        await loadRecords(branchScope || null)
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'No se pudo cargar salidas')
      } finally {
        setIsLoading(false)
      }
    }

    if (!branchFilter && !activeBranchId) return
    void reloadByBranch()
  }, [branchFilter, activeBranchId])

  useEffect(() => {
    const loadProducts = async () => {
      if (!branchId) {
        setProducts([])
        setProductId('')
        setStockByPartId({})
        return
      }

      try {
        const [rows, inventoryRows] = await Promise.all([
          partsService.getAll(branchId),
          inventoryService.getByBranch(branchId),
        ])
        const stockMap: Record<string, number> = {}
        for (const row of inventoryRows) {
          stockMap[row.part_id] = Number(row.quantity || 0)
        }
        setProducts(rows)
        setProductId((prev) => prev || rows[0]?.id || '')
        setStockByPartId(stockMap)
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

  const selectedStock = useMemo(
    () => stockByPartId[productId] ?? 0,
    [stockByPartId, productId]
  )

  const canSeePurchasePrice = activeRole === 'admin'

  const productFilterPickOptions = useMemo(() => {
    const names = [...new Set(records.map((record) => record.part_name))]
    return [
      { value: 'all', label: 'Todos los productos' },
      ...names.map((name) => ({ value: name, label: name })),
    ]
  }, [records])

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

    if (!product || qty <= 0) {
      setFeedback('Completa producto y cantidad para registrar salida.')
      return
    }

    setIsSaving(true)
    setError(null)
    try {
      const typePart = exitTypeText.trim()
      const detail = reason.trim()
      const composedReason =
        typePart && detail ? `[${typePart}] ${detail}` : typePart || detail
      const createdId = await exitsService.create({
        branch_id: branchId,
        part_id: product.id,
        quantity: qty,
        reason: composedReason,
        source_reference: sourceReference.trim() || null,
      })

      await loadRecords(activeBranchId || null)
      setQuantity('')
      setExitTypeText('')
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
                <PartCombobox parts={products} value={productId} onValueChange={setProductId} />
                <div className="rounded-md border border-emerald-500/40 bg-emerald-500/10 px-2 py-1 text-xs text-emerald-200">
                  Stock disponible en sucursal: <span className="font-semibold">{selectedStock}</span>
                </div>
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
                <Input
                  value={exitTypeText}
                  onChange={(event) => setExitTypeText(event.target.value)}
                  placeholder="Escribe el motivo o clasificación (texto libre)"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Referencia (venta/edición)</Label>
                <Input value={sourceReference} onChange={(event) => setSourceReference(event.target.value)} placeholder="Ej. VT-2026-041" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Motivo</Label>
                <Input value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Describe por qué se registra la salida" />
              </div>
            </div>

            {feedback ? <p className="mt-3 text-xs text-primary">{feedback}</p> : null}

            <div className="mt-3 flex justify-end">
              <Button onClick={() => void registerExit()} disabled={isSaving}>Registrar salida</Button>
            </div>
          </CardContent>
        </Card>

        <Card className="card-filter">
          <CardHeader>
            <CardTitle className="text-orange-900 dark:text-orange-300">Filtros de historial de salidas</CardTitle>
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
              <Label>Producto</Label>
              <SearchableStringPick options={productFilterPickOptions} value={itemFilter} onValueChange={setItemFilter} />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-950/70">
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-zinc-100">Lista de salidas registradas</CardTitle>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={filtered.length === 0}
                  onClick={() => {
                    const branchName = branchFilter === 'all'
                      ? 'Todas las sucursales'
                      : branches.find((b) => b.id === branchFilter)?.name || 'Sucursal'
                    generateExitsPdf({
                      branchName,
                      from: fromDate || undefined,
                      to: toDate || undefined,
                      rows: filtered.map((r) => ({
                        code: r.part_code || '-',
                        name: r.part_name,
                        quantity: Number(r.quantity),
                        cost: Number(r.cost ?? 0),
                        reason: r.reason || '',
                        branchName: r.branch_name || branchName,
                        date: r.created_at,
                        category: r.category || '-',
                      })),
                    })
                  }}
                >
                  <Download className="mr-2 h-4 w-4" /> Descargar PDF
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={filtered.length === 0}
                  onClick={() => {
                    const branchName = branchFilter === 'all'
                      ? 'Todas las sucursales'
                      : branches.find((b) => b.id === branchFilter)?.name || 'Sucursal'
                    exportToExcel({
                      fileName: `salidas_${branchName.replace(/\s+/g, '_')}`,
                      headers: canSeePurchasePrice
                        ? ['#', 'Codigo', 'Producto', 'Cantidad', 'Precio de compra', 'Motivo', 'Sucursal']
                        : ['#', 'Codigo', 'Producto', 'Cantidad', 'Precio mínimo', 'Precio máximo', 'Motivo', 'Sucursal'],
                      rows: filtered.map((r, index) => {
                        if (canSeePurchasePrice) {
                          return [
                            index + 1,
                            r.part_code || '-',
                            r.part_name,
                            Number(r.quantity),
                            Number(r.cost ?? 0),
                            r.reason || '-',
                            r.branch_name || branchName,
                          ]
                        }
                        const product = products.find((p) => p.id === r.part_id)
                        const range = product ? getQuotationRange(product) : { min: 0, max: 0 }
                        return [
                          index + 1,
                          r.part_code || '-',
                          r.part_name,
                          Number(r.quantity),
                          range.min,
                          range.max,
                          r.reason || '-',
                          r.branch_name || branchName,
                        ]
                      }),
                    })
                  }}
                >
                  <FileSpreadsheet className="mr-2 h-4 w-4" /> Descargar Excel
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {filtered.map((record) => (
              <div key={record.id} className="rounded-lg border border-zinc-800 bg-zinc-900/70 p-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold text-zinc-100">{record.id} - {record.part_name}</p>
                  <Badge className="bg-amber-600 text-white">Salida</Badge>
                </div>
                <p className="text-zinc-400">
                  {new Date(record.created_at).toLocaleString('es-BO')} | {record.branch_name} | Usuario: {record.created_by_name || 'No disponible'}
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
