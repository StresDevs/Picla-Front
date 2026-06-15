'use client'

import { useEffect, useMemo, useState } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { PageHeader } from '@/components/common/page-header'
import { InventorySubnav } from '@/components/modules/inventory/inventory-subnav'
import { PartCombobox } from '@/components/modules/inventory/part-combobox'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { ACTIVE_ROLE_EVENT, getActiveUserContext, type AppUserRole } from '@/lib/mock/runtime-store'
import { branchesService, entriesService, inventoryService, partsService, type InventoryEntryView } from '@/lib/supabase/inventory'
import type { Part } from '@/types/database'
import { generateEntriesPdf } from '@/lib/pdf/generators'
import { exportToExcel } from '@/lib/excel/export'
import { Download, FileSpreadsheet } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { SearchableStringPick } from '@/components/modules/inventory/part-combobox'
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination'

function toIsoStart(date: string) {
  if (!date) return null
  return new Date(`${date}T00:00:00`).toISOString()
}

function toIsoEnd(date: string) {
  if (!date) return null
  return new Date(`${date}T23:59:59.999`).toISOString()
}

function getQuotationRange(part: Part) {
  const referencePrice = Number(part.price || 0)
  const min = part.quotation_min_price ?? Number((referencePrice * 0.9).toFixed(2))
  const max = part.quotation_max_price ?? Number((referencePrice * 1.2).toFixed(2))
  return { min, max }
}

export default function InventoryEntriesPage() {
  const [activeRole, setActiveRole] = useState<AppUserRole>(() => getActiveUserContext().role)
  const [activeBranchId, setActiveBranchId] = useState(() => getActiveUserContext().branch_id)

  const [branches, setBranches] = useState<Array<{ id: string; name: string }>>([])
  const [products, setProducts] = useState<Part[]>([])
  const [stockByPartId, setStockByPartId] = useState<Record<string, number>>({})
  const [entries, setEntries] = useState<InventoryEntryView[]>([])

  const [branchId, setBranchId] = useState('')
  const [partId, setPartId] = useState('')
  const [quantity, setQuantity] = useState('')
  const [unitCost, setUnitCost] = useState('')
  const [unitPrice, setUnitPrice] = useState('')
  const [quotationMinPrice, setQuotationMinPrice] = useState('')
  const [quotationMaxPrice, setQuotationMaxPrice] = useState('')
  const [currency, setCurrency] = useState<'BOB' | 'USD'>('BOB')
  const [exchangeRate, setExchangeRate] = useState('')
  const [sourceReference, setSourceReference] = useState('')
  const [supplierName, setSupplierName] = useState('')
  const [reason, setReason] = useState('')
  const [notes, setNotes] = useState('')

  const [branchFilter, setBranchFilter] = useState('all')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [entriesPage, setEntriesPage] = useState(1)
  const [avgPriceDialog, setAvgPriceDialog] = useState<{
    avgCost: number
    currentStock: number
    currentCost: number
    newQty: number
    newCost: number
    acceptedCost: string
  } | null>(null)

  const canRegister = activeRole === 'admin'
  const canSeePurchasePrice = activeRole === 'admin'

  const loadEntries = async (scopeBranchId?: string) => {
    const branchScope = scopeBranchId ?? (branchFilter === 'all' ? null : branchFilter)
    const rows = await entriesService.getAll({
      branch_id: branchScope,
      from: toIsoStart(fromDate),
      to: toIsoEnd(toDate),
    })
    setEntries(rows)
  }

  useEffect(() => {
    const syncContext = () => {
      const context = getActiveUserContext()
      setActiveRole(context.role)
      setActiveBranchId(context.branch_id)
      setBranchId(context.branch_id)
      if (context.role !== 'admin') {
        setBranchFilter(context.branch_id)
      }
    }

    const initialize = async () => {
      setIsLoading(true)
      setError(null)
      try {
        syncContext()
        const context = getActiveUserContext()
        const branchRows = await branchesService.getAll()
        setBranches(branchRows)

        const selectedBranch = context.branch_id || branchRows[0]?.id || ''
        setBranchId(selectedBranch)
        setBranchFilter(context.role === 'admin' ? 'all' : selectedBranch)
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'No se pudo inicializar ingresos')
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
    if (!branchId) {
      setProducts([])
      setPartId('')
      setStockByPartId({})
      return
    }

    const loadProducts = async () => {
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
        setPartId((prev) => prev || rows[0]?.id || '')
        setStockByPartId(stockMap)
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'No se pudo cargar productos')
      }
    }

    void loadProducts()
  }, [branchId])

  useEffect(() => {
    const selected = products.find((item) => item.id === partId)
    setQuotationMinPrice(selected?.quotation_min_price !== undefined && selected?.quotation_min_price !== null
      ? String(selected.quotation_min_price)
      : '')
    setQuotationMaxPrice(selected?.quotation_max_price !== undefined && selected?.quotation_max_price !== null
      ? String(selected.quotation_max_price)
      : '')
  }, [partId, products])

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      setError(null)
      try {
        await loadEntries()
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'No se pudo cargar ingresos')
      } finally {
        setIsLoading(false)
      }
    }

    void fetchData()
  }, [branchFilter, fromDate, toDate, activeRole, activeBranchId])

  const registerEntry = () => {
    setFeedback(null)
    setError(null)

    if (!canRegister) {
      setFeedback('Solo admin puede registrar ingresos/restock.')
      return
    }

    const qty = Number(quantity)
    if (!branchId || !partId || !Number.isFinite(qty) || qty <= 0) {
      setFeedback('Completa sucursal, producto y cantidad valida.')
      return
    }

    const minQuote = quotationMinPrice.trim() ? Number(quotationMinPrice) : null
    const maxQuote = quotationMaxPrice.trim() ? Number(quotationMaxPrice) : null
    if ((minQuote !== null && !Number.isFinite(minQuote)) || (maxQuote !== null && !Number.isFinite(maxQuote))) {
      setFeedback('Los precios de cotizacion deben ser validos.')
      return
    }
    if (minQuote !== null && maxQuote !== null && minQuote > maxQuote) {
      setFeedback('El precio minimo no puede ser mayor al maximo.')
      return
    }

    const selectedProduct = products.find((p) => p.id === partId)
    const currentCost = selectedProduct ? Number(selectedProduct.cost || 0) : 0
    const newCost = unitCost.trim() ? Number(unitCost) : currentCost
    const newQty = qty
    const totalNew = newQty + selectedStock
    const avgCost = totalNew > 0
      ? (selectedStock * currentCost + newQty * newCost) / totalNew
      : newCost

    setAvgPriceDialog({
      avgCost: Number(avgCost.toFixed(4)),
      currentStock: selectedStock,
      currentCost,
      newQty,
      newCost,
      acceptedCost: avgCost.toFixed(2),
    })
  }

  const confirmEntry = async (finalCost: string) => {
    const qty = Number(quantity)
    const minQuote = quotationMinPrice.trim() ? Number(quotationMinPrice) : null
    const maxQuote = quotationMaxPrice.trim() ? Number(quotationMaxPrice) : null

    setIsSaving(true)
    setAvgPriceDialog(null)
    try {
      const createdId = await entriesService.create({
        branch_id: branchId,
        part_id: partId,
        quantity: qty,
        reason: reason.trim() || null,
        source_reference: sourceReference.trim() || null,
        supplier_name: supplierName.trim() || null,
        notes: notes.trim() || null,
        unit_cost: finalCost.trim() ? Number(finalCost) : null,
        unit_price: unitPrice.trim() ? Number(unitPrice) : null,
        quotation_min_price: minQuote,
        quotation_max_price: maxQuote,
        currency,
        exchange_rate: currency === 'USD' && exchangeRate.trim() ? Number(exchangeRate) : null,
      })

      setQuantity('')
      setUnitCost('')
      setUnitPrice('')
      setQuotationMinPrice('')
      setQuotationMaxPrice('')
      setExchangeRate('')
      setSourceReference('')
      setSupplierName('')
      setReason('')
      setNotes('')

      await loadEntries()
      setFeedback(`Ingreso ${createdId} registrado correctamente.`)
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'No se pudo registrar ingreso')
    } finally {
      setIsSaving(false)
    }
  }

  const selectedPartName = useMemo(
    () => products.find((item) => item.id === partId)?.name || '',
    [products, partId]
  )
  const selectedStock = useMemo(
    () => stockByPartId[partId] ?? 0,
    [stockByPartId, partId]
  )

  return (
    <MainLayout>
      <div className="space-y-6">
        <PageHeader
          title="Ingreso de Mercadería"
          description="Registro de ingresos/restock de inventario por sucursal"
        />
        <InventorySubnav />

        {error ? (
          <Card className="border-red-500/40 bg-red-500/5">
            <CardContent className="pt-6 text-sm text-red-700 dark:text-red-300">{error}</CardContent>
          </Card>
        ) : null}

        <Card className="border-emerald-500/40 bg-zinc-950/70">
          <CardHeader>
            <CardTitle className="text-zinc-100">Nuevo Ingreso</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!canRegister ? (
              <p className="text-xs text-zinc-400">Solo admin puede registrar ingresos/restock. Tu rol actual es {activeRole}.</p>
            ) : null}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="space-y-2">
                <Label>Sucursal</Label>
                <SearchableStringPick
                  value={branchId}
                  onValueChange={setBranchId}
                  options={branches.map((b) => ({ value: b.id, label: b.name }))}
                  placeholder="Seleccionar sucursal"
                  searchPlaceholder="Buscar sucursal..."
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Producto</Label>
                <PartCombobox parts={products} value={partId} onValueChange={setPartId} />
              </div>
              <div className="space-y-2">
                <Label>Cantidad</Label>
                <Input type="number" min="0" step="1" placeholder="0" value={quantity} onChange={(event) => setQuantity(event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Moneda</Label>
                <SearchableStringPick
                  value={currency}
                  onValueChange={(v) => setCurrency(v as 'BOB' | 'USD')}
                  options={[{ value: 'BOB', label: 'BOB' }, { value: 'USD', label: 'USD' }]}
                  placeholder="Moneda"
                  searchPlaceholder="Buscar..."
                />
              </div>
              <div className="space-y-2">
                <Label>Precio compra</Label>
                <Input type="number" min="0" step="0.01" placeholder="0.00" value={unitCost} onChange={(event) => setUnitCost(event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Precio venta</Label>
                <Input type="number" min="0" step="0.01" placeholder="0.00" value={unitPrice} onChange={(event) => setUnitPrice(event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Precio mínimo</Label>
                <Input type="number" min="0" step="0.01" placeholder="0.00" value={quotationMinPrice} onChange={(event) => setQuotationMinPrice(event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Precio máximo</Label>
                <Input type="number" min="0" step="0.01" placeholder="0.00" value={quotationMaxPrice} onChange={(event) => setQuotationMaxPrice(event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Tipo de cambio</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.0001"
                  placeholder={currency === 'USD' ? 'Requerido para USD' : 'No aplica en BOB'}
                  value={exchangeRate}
                  onChange={(event) => setExchangeRate(event.target.value)}
                  disabled={currency !== 'USD'}
                />
              </div>
              <div className="space-y-2">
                <Label>Referencia</Label>
                <Input placeholder="OC-123 / Factura" value={sourceReference} onChange={(event) => setSourceReference(event.target.value)} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Proveedor</Label>
                <Input placeholder="Nombre proveedor" value={supplierName} onChange={(event) => setSupplierName(event.target.value)} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Motivo</Label>
                <Input placeholder="Ingreso de compra / ajuste" value={reason} onChange={(event) => setReason(event.target.value)} />
              </div>
              <div className="space-y-2 md:col-span-4">
                <Label>Notas</Label>
                <Input placeholder="Notas adicionales" value={notes} onChange={(event) => setNotes(event.target.value)} />
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
                Stock disponible en sucursal: <span className="font-semibold">{selectedStock}</span>
                <span className="text-emerald-100/80"> · {selectedPartName || 'N/A'}</span>
              </div>
              <Button onClick={() => void registerEntry()} disabled={isSaving || !canRegister}>Registrar Ingreso</Button>
            </div>
            {feedback ? <p className="text-xs text-emerald-300">{feedback}</p> : null}
          </CardContent>
        </Card>

        <Card className="bg-zinc-950/70">
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-zinc-100">Listado de Ingresos (Día / Mes / Año)</CardTitle>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={entries.length === 0}
                  onClick={() => {
                    const branchName = branchFilter === 'all'
                      ? 'Todas las sucursales'
                      : branches.find((b) => b.id === branchFilter)?.name || 'Sucursal'
                    generateEntriesPdf({
                      branchName,
                      from: fromDate || undefined,
                      to: toDate || undefined,
                      rows: entries.map((e) => ({
                        date: e.created_at,
                        code: e.part_code || '-',
                        name: e.part_name,
                        quantity: Number(e.quantity),
                        unitCost: e.unit_cost ?? null,
                        unitPrice: e.unit_price ?? null,
                        supplier: e.supplier_name || '',
                        reference: e.source_reference || '',
                        reason: e.reason || '',
                        branchName: e.branch_name || branchName,
                      })),
                    })
                  }}
                >
                  <Download className="mr-2 h-4 w-4" /> Descargar PDF
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={entries.length === 0}
                  onClick={() => {
                    const branchName = branchFilter === 'all'
                      ? 'Todas las sucursales'
                      : branches.find((b) => b.id === branchFilter)?.name || 'Sucursal'
                    exportToExcel({
                      fileName: `ingresos_${branchName.replace(/\s+/g, '_')}`,
                      headers: canSeePurchasePrice
                        ? ['#', 'Fecha', 'Codigo', 'Producto', 'Cant.', 'Precio de compra', 'Precio', 'Proveedor', 'Motivo']
                        : ['#', 'Fecha', 'Codigo', 'Producto', 'Cant.', 'Precio mínimo', 'Precio máximo', 'Precio', 'Proveedor', 'Motivo'],
                      rows: entries.map((e, index) => {
                        const product = products.find((p) => p.id === e.part_id)
                        const range = product ? getQuotationRange(product) : { min: 0, max: 0 }
                        return canSeePurchasePrice
                          ? [
                            index + 1,
                            new Date(e.created_at).toLocaleString('es-BO'),
                            e.part_code || '-',
                            e.part_name,
                            Number(e.quantity),
                            e.unit_cost ?? 0,
                            e.unit_price ?? 0,
                            e.supplier_name || '-',
                            e.reason || '-',
                          ]
                          : [
                            index + 1,
                            new Date(e.created_at).toLocaleString('es-BO'),
                            e.part_code || '-',
                            e.part_name,
                            Number(e.quantity),
                            range.min,
                            range.max,
                            e.unit_price ?? 0,
                            e.supplier_name || '-',
                            e.reason || '-',
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
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
                <SearchableStringPick
                  value={branchFilter}
                  onValueChange={setBranchFilter}
                  options={[
                    ...(activeRole === 'admin' ? [{ value: 'all', label: 'Todas' }] : []),
                    ...branches.map((b) => ({ value: b.id, label: b.name })),
                  ]}
                  placeholder="Seleccionar sucursal"
                  searchPlaceholder="Buscar sucursal..."
                />
              </div>
              <div className="space-y-2">
                <Label>Estado</Label>
                <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2 text-sm text-zinc-300">
                  {isLoading ? 'Cargando...' : `${entries.length} registros`}
                </div>
              </div>
            </div>

            {(() => {
              const ENTRIES_PER_PAGE = 15
              const totalPages = Math.max(1, Math.ceil(entries.length / ENTRIES_PER_PAGE))
              const paginated = entries.slice((entriesPage - 1) * ENTRIES_PER_PAGE, entriesPage * ENTRIES_PER_PAGE)

              return (
                <>
                  {paginated.map((entry) => (
                    <div key={entry.id} className="rounded-lg border border-zinc-800 bg-zinc-900/70 p-3 text-sm">
                      <p className="text-zinc-100 font-semibold">{entry.id} - {entry.part_name} ({entry.part_code})</p>
                      <p className="text-zinc-400">
                        {new Date(entry.created_at).toLocaleString('es-BO')} | {entry.branch_name} | Usuario: {entry.created_by_name || 'No disponible'}
                      </p>
                      <p className="text-zinc-400">
                        Cantidad: {entry.quantity} | Moneda: {entry.currency}
                        {entry.exchange_rate ? ` | TC: ${entry.exchange_rate}` : ''}
                      </p>
                      <p className="text-zinc-400">
                        {canSeePurchasePrice ? (
                          <>Precio de compra: {entry.unit_cost ?? '-'} | Precio: {entry.unit_price ?? '-'}</>
                        ) : (() => {
                          const product = products.find((p) => p.id === entry.part_id)
                          const range = product ? getQuotationRange(product) : null
                          return (
                            <>
                              Precio: {entry.unit_price ?? '-'}
                              {range ? ` | Cotización: Bs ${range.min.toFixed(2)} - Bs ${range.max.toFixed(2)}` : ''}
                            </>
                          )
                        })()}
                      </p>
                      <p className="text-zinc-400">Motivo: {entry.reason}</p>
                      <p className="text-zinc-400">Proveedor: {entry.supplier_name || 'No disponible'} | Referencia: {entry.source_reference || 'No disponible'}</p>
                      {entry.notes ? <p className="text-zinc-300 mt-1">Notas: {entry.notes}</p> : null}
                    </div>
                  ))}

                  {!isLoading && entries.length === 0 ? (
                    <p className="text-sm text-zinc-400">No hay ingresos para los filtros seleccionados.</p>
                  ) : null}

                  {totalPages > 1 && (
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious
                            href="#"
                            onClick={(e) => { e.preventDefault(); setEntriesPage((p) => Math.max(1, p - 1)) }}
                            aria-disabled={entriesPage === 1}
                            className={entriesPage === 1 ? 'pointer-events-none opacity-50' : ''}
                          />
                        </PaginationItem>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                          <PaginationItem key={page}>
                            <PaginationLink
                              href="#"
                              isActive={page === entriesPage}
                              onClick={(e) => { e.preventDefault(); setEntriesPage(page) }}
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        ))}
                        <PaginationItem>
                          <PaginationNext
                            href="#"
                            onClick={(e) => { e.preventDefault(); setEntriesPage((p) => Math.min(totalPages, p + 1)) }}
                            aria-disabled={entriesPage === totalPages}
                            className={entriesPage === totalPages ? 'pointer-events-none opacity-50' : ''}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  )}
                </>
              )
            })()}
          </CardContent>
        </Card>
      </div>

      {/* Average price confirmation dialog */}
      <Dialog open={avgPriceDialog !== null} onOpenChange={(open) => { if (!open) setAvgPriceDialog(null) }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmar precio de costo</DialogTitle>
          </DialogHeader>

          {avgPriceDialog && (
            <div className="space-y-4">
              <div className="rounded-xl border border-border/60 bg-muted/20 p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Stock actual</span>
                  <span className="font-medium">{avgPriceDialog.currentStock} unidades @ Bs {avgPriceDialog.currentCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Nuevo ingreso</span>
                  <span className="font-medium">{avgPriceDialog.newQty} unidades @ Bs {avgPriceDialog.newCost.toFixed(2)}</span>
                </div>
                <div className="border-t border-border/50 pt-2 flex justify-between">
                  <span className="font-semibold text-foreground">Costo promedio calculado</span>
                  <span className="font-bold text-primary text-base">Bs {avgPriceDialog.avgCost.toFixed(2)}</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">
                  Costo a registrar (puede modificar)
                </label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={avgPriceDialog.acceptedCost}
                  onChange={(e) => setAvgPriceDialog((prev) => prev ? { ...prev, acceptedCost: e.target.value } : prev)}
                  className="text-lg font-semibold"
                />
                <p className="text-xs text-muted-foreground">
                  Se precargó el precio promedio. Modifícalo si lo deseas antes de confirmar.
                </p>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setAvgPriceDialog(null)}>Cancelar</Button>
                <Button
                  onClick={() => void confirmEntry(avgPriceDialog.acceptedCost)}
                  disabled={isSaving}
                >
                  {isSaving ? 'Registrando...' : 'Confirmar ingreso'}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

    </MainLayout>
  )
}
