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
import { ACTIVE_ROLE_EVENT, getActiveUserContext, type AppUserRole } from '@/lib/mock/runtime-store'
import { branchesService, entriesService, partsService, type InventoryEntryView } from '@/lib/supabase/inventory'
import type { Part } from '@/types/database'

function toIsoStart(date: string) {
  if (!date) return null
  return new Date(`${date}T00:00:00`).toISOString()
}

function toIsoEnd(date: string) {
  if (!date) return null
  return new Date(`${date}T23:59:59.999`).toISOString()
}

export default function InventoryEntriesPage() {
  const [activeRole, setActiveRole] = useState<AppUserRole>(() => getActiveUserContext().role)
  const [activeBranchId, setActiveBranchId] = useState(() => getActiveUserContext().branch_id)

  const [branches, setBranches] = useState<Array<{ id: string; name: string }>>([])
  const [products, setProducts] = useState<Part[]>([])
  const [entries, setEntries] = useState<InventoryEntryView[]>([])

  const [branchId, setBranchId] = useState('')
  const [partId, setPartId] = useState('')
  const [quantity, setQuantity] = useState('')
  const [unitCost, setUnitCost] = useState('')
  const [unitPrice, setUnitPrice] = useState('')
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

  const canRegister = activeRole === 'admin'

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
      return
    }

    const loadProducts = async () => {
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

  const registerEntry = async () => {
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

    setIsSaving(true)
    try {
      const createdId = await entriesService.create({
        branch_id: branchId,
        part_id: partId,
        quantity: qty,
        reason: reason.trim() || null,
        source_reference: sourceReference.trim() || null,
        supplier_name: supplierName.trim() || null,
        notes: notes.trim() || null,
        unit_cost: unitCost.trim() ? Number(unitCost) : null,
        unit_price: unitPrice.trim() ? Number(unitPrice) : null,
        currency,
        exchange_rate: currency === 'USD' && exchangeRate.trim() ? Number(exchangeRate) : null,
      })

      setQuantity('')
      setUnitCost('')
      setUnitPrice('')
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
                <Select value={branchId} onValueChange={setBranchId}>
                  <SelectTrigger><SelectValue placeholder="Sucursal" /></SelectTrigger>
                  <SelectContent>
                    {branches.map((branch) => (
                      <SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Producto</Label>
                <Select value={partId} onValueChange={setPartId}>
                  <SelectTrigger><SelectValue placeholder="Producto" /></SelectTrigger>
                  <SelectContent>
                    {products.map((product) => (
                      <SelectItem key={product.id} value={product.id}>{product.name} ({product.code})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Cantidad</Label>
                <Input type="number" min="0" step="1" placeholder="0" value={quantity} onChange={(event) => setQuantity(event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Moneda</Label>
                <Select value={currency} onValueChange={(value: 'BOB' | 'USD') => setCurrency(value)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BOB">BOB</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                  </SelectContent>
                </Select>
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
              <p className="text-xs text-zinc-500">Producto seleccionado: {selectedPartName || 'N/A'}</p>
              <Button onClick={() => void registerEntry()} disabled={isSaving || !canRegister}>Registrar Ingreso</Button>
            </div>
            {feedback ? <p className="text-xs text-emerald-300">{feedback}</p> : null}
          </CardContent>
        </Card>

        <Card className="bg-zinc-950/70">
          <CardHeader>
            <CardTitle className="text-zinc-100">Listado de Ingresos (Día / Mes / Año)</CardTitle>
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
                <Select value={branchFilter} onValueChange={setBranchFilter}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {activeRole === 'admin' ? <SelectItem value="all">Todas</SelectItem> : null}
                    {branches.map((branch) => (
                      <SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Estado</Label>
                <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2 text-sm text-zinc-300">
                  {isLoading ? 'Cargando...' : `${entries.length} registros`}
                </div>
              </div>
            </div>

            {entries.map((entry) => (
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
                  Costo: {entry.unit_cost ?? '-'} | Precio: {entry.unit_price ?? '-'}
                </p>
                <p className="text-zinc-400">Motivo: {entry.reason}</p>
                <p className="text-zinc-400">Proveedor: {entry.supplier_name || 'No disponible'} | Referencia: {entry.source_reference || 'No disponible'}</p>
                {entry.notes ? <p className="text-zinc-300 mt-1">Notas: {entry.notes}</p> : null}
              </div>
            ))}

            {!isLoading && entries.length === 0 ? (
              <p className="text-sm text-zinc-400">No hay ingresos para los filtros seleccionados.</p>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}
