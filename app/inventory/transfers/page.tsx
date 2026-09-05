'use client'

import { useEffect, useMemo, useState } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { PageHeader } from '@/components/common/page-header'
import { InventorySubnav } from '@/components/modules/inventory/inventory-subnav'
import { PartCombobox } from '@/components/modules/inventory/part-combobox'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DataTable } from '@/components/common/data-table'
import { Badge } from '@/components/ui/badge'
import {
  branchesService,
  inventoryService,
  partsService,
  transferService,
  type PartAvailability,
  type PendingTransferSummary,
  type TransferRequestDetail,
} from '@/lib/supabase/inventory'
import { ACTIVE_ROLE_EVENT, getActiveUserContext, type AppUserRole } from '@/lib/mock/runtime-store'
import { getCachedAppSettings, loadAppSettings } from '@/lib/supabase/settings'
import { Boxes, Plus, Trash2 } from 'lucide-react'
import type { Part } from '@/types/database'
import { generateTransferPdf, type TransferConfirmationItem } from '@/lib/pdf/generators'

interface BulkRow {
  id: string
  partId: string
  quantity: string
  unitPrice: string
}

function transferStatusLabel(status: string) {
  switch (status) {
    case 'pending':
      return 'pendiente'
    case 'completed':
      return 'completado'
    case 'anulled':
      return 'anulado'
    case 'returned':
      return 'devuelto'
    case 'replenished':
      return 'repuesto'
    default:
      return status
  }
}

function createBulkRow(partId = ''): BulkRow {
  return {
    id: `row-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
    partId,
    quantity: '',
    unitPrice: '',
  }
}

const EMPTY_AVAILABILITY: PartAvailability = {
  part_id: '',
  on_hand: 0,
  reserved: 0,
  available: 0,
}

function formatUnits(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(2)
}

function toLocalDateKey(value: string) {
  const dt = new Date(value)
  const year = dt.getFullYear()
  const month = String(dt.getMonth() + 1).padStart(2, '0')
  const day = String(dt.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export default function InventoryTransfersPage() {
  const [products, setProducts] = useState<Part[]>([])
  const [availabilityByPartId, setAvailabilityByPartId] = useState<Record<string, PartAvailability>>({})
  const [transfers, setTransfers] = useState<TransferRequestDetail[]>([])
  const [pendingTransfers, setPendingTransfers] = useState<PendingTransferSummary[]>([])
  const [branches, setBranches] = useState<Array<{ id: string; name: string }>>([])
  const [activeBranchId, setActiveBranchId] = useState(() => getActiveUserContext().branch_id)
  const [activeRole, setActiveRole] = useState<AppUserRole>(() => getActiveUserContext().role)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)

  const [mode, setMode] = useState<'single' | 'bulk'>('single')
  const [partId, setPartId] = useState('')
  const [fromBranch, setFromBranch] = useState('')
  const [toBranch, setToBranch] = useState('')
  const [quantity, setQuantity] = useState('')
  const [unitPrice, setUnitPrice] = useState('')
  const [notes, setNotes] = useState('')
  const [bulkRows, setBulkRows] = useState<BulkRow[]>([])

  const resolveErrorMessage = (value: unknown, fallback: string) => {
    if (typeof value === 'object' && value !== null && 'message' in value) {
      const candidate = (value as { message?: unknown }).message
      if (typeof candidate === 'string' && candidate.trim().length > 0) {
        return candidate
      }
    }
    return fallback
  }

  const resolveCompletionErrorMessage = (value: unknown) => {
    const message = resolveErrorMessage(value, 'No se pudo completar el traspaso')
    if (
      message.includes('Stock insuficiente para el producto') ||
      message.includes('No existe inventario para descontar')
    ) {
      return 'No hay stock suficiente en la sucursal de origen para completar el traspaso. Ajusta inventario en origen o crea un nuevo traspaso con menor cantidad.'
    }
    return message
  }

  // La base de datos revalida al guardar, asi que este mensaje aparece cuando dos
  // personas crean traspasos del mismo producto casi a la vez.
  const resolveCreationErrorMessage = (value: unknown, fallback: string) => {
    const message = resolveErrorMessage(value, fallback)
    const match = message.match(/Disponible (\d+), solicitado (\d+)/)
    if (match) {
      return `Alguien mas reservo ese producto mientras armabas el traspaso. Ahora solo quedan ${match[1]} disponibles y estas pidiendo ${match[2]}.`
    }
    if (message.includes('No existe inventario en origen')) {
      return 'Ese producto no tiene inventario en la sucursal de origen.'
    }
    return message
  }

  const loadTransfers = async (branchId: string | null) => {
    const [transferRows, pendingRows] = await Promise.all([
      transferService.getRequests(branchId),
      transferService.getPendingSummaries(branchId),
    ])
    setTransfers(transferRows)
    setPendingTransfers(pendingRows)
  }

  useEffect(() => {
    const syncContext = () => {
      const context = getActiveUserContext()
      setActiveBranchId(context.branch_id)
      setActiveRole(context.role)
      setFromBranch(context.branch_id)
    }

    const loadInitial = async () => {
      setIsLoading(true)
      setError(null)
      try {
        syncContext()
        // El tipo de cambio del PDF sale de app_settings, no del navegador.
        void loadAppSettings()
        const branchRows = await branchesService.getAll()
        setBranches(branchRows)

        const context = getActiveUserContext()
        const defaultFrom = context.branch_id || branchRows[0]?.id || ''
        const defaultTo = branchRows.find((branch) => branch.id !== defaultFrom)?.id || defaultFrom

        setFromBranch(defaultFrom)
        setToBranch(defaultTo)
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'No se pudo cargar traspasos')
      } finally {
        setIsLoading(false)
      }
    }

    void loadInitial()

    window.addEventListener(ACTIVE_ROLE_EVENT, syncContext)
    window.addEventListener('focus', syncContext)

    return () => {
      window.removeEventListener(ACTIVE_ROLE_EVENT, syncContext)
      window.removeEventListener('focus', syncContext)
    }
  }, [])

  useEffect(() => {
    if (!activeBranchId) return

    const loadByBranch = async () => {
      setIsLoading(true)
      setError(null)
      try {
        await loadTransfers(activeBranchId)
      } catch (loadError) {
        setError(resolveErrorMessage(loadError, 'No se pudo cargar traspasos'))
      } finally {
        setIsLoading(false)
      }
    }

    void loadByBranch()
  }, [activeBranchId])

  useEffect(() => {
    if (!fromBranch || branches.length === 0) return

    setToBranch((prev) => {
      if (prev && prev !== fromBranch) return prev
      return branches.find((branch) => branch.id !== fromBranch)?.id || fromBranch
    })
  }, [fromBranch, branches])

  const loadAvailability = async (branchId: string) => {
    if (!branchId) {
      setAvailabilityByPartId({})
      return
    }
    setAvailabilityByPartId(await inventoryService.getAvailabilityByBranch(branchId))
  }

  // Otra maquina pudo crear o completar traspasos mientras esta pestaña estaba en
  // segundo plano; nada revalida solo.
  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState !== 'visible') return
      void loadTransfers(activeBranchId || null).catch(() => undefined)
      if (fromBranch) {
        void loadAvailability(fromBranch).catch(() => undefined)
      }
    }

    window.addEventListener('focus', refresh)
    document.addEventListener('visibilitychange', refresh)

    return () => {
      window.removeEventListener('focus', refresh)
      document.removeEventListener('visibilitychange', refresh)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeBranchId, fromBranch])

  useEffect(() => {
    const loadProducts = async () => {
      if (!fromBranch) {
        setProducts([])
        setPartId('')
        setAvailabilityByPartId({})
        return
      }

      try {
        const [loaded, availability] = await Promise.all([
          partsService.getAll(fromBranch),
          inventoryService.getAvailabilityByBranch(fromBranch),
        ])
        setProducts(loaded)
        setAvailabilityByPartId(availability)

        if (loaded.length > 0) {
          setPartId((prev) => prev || loaded[0].id)
          setBulkRows((prev) => {
            if (prev.length > 0) return prev
            return [createBulkRow(loaded[0].id)]
          })
        } else {
          setPartId('')
          setBulkRows([createBulkRow('')])
        }
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'No se pudo cargar productos para traspaso')
      }
    }

    void loadProducts()
  }, [fromBranch])

  const selectedPart = useMemo(() => products.find((item) => item.id === partId), [products, partId])

  const availabilityFor = (id: string) => availabilityByPartId[id] ?? EMPTY_AVAILABILITY
  const selectedAvailability = availabilityFor(partId)

  const shortageMessage = (requested: number, stock: PartAvailability) => {
    if (!requested || requested <= stock.available) return null
    const base = `Solo tienes ${formatUnits(stock.available)} disponibles en el inventario`
    return stock.reserved > 0
      ? `${base} (${formatUnits(stock.on_hand)} en stock, ${formatUnits(stock.reserved)} reservados en traspasos pendientes).`
      : `${base}.`
  }

  const singleShortage = useMemo(
    () => shortageMessage(Number(quantity), selectedAvailability),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [quantity, selectedAvailability],
  )

  // Un mismo producto puede repetirse en varias lineas: lo que cuenta contra el
  // stock es la suma, no cada linea por separado.
  const bulkRequestedByPart = useMemo(() => {
    const totals: Record<string, number> = {}
    for (const row of bulkRows) {
      if (!row.partId) continue
      totals[row.partId] = (totals[row.partId] || 0) + (Number(row.quantity) || 0)
    }
    return totals
  }, [bulkRows])

  const bulkShortages = useMemo(() => {
    const messages: Record<string, string> = {}
    for (const [id, requested] of Object.entries(bulkRequestedByPart)) {
      const message = shortageMessage(requested, availabilityFor(id))
      if (message) messages[id] = message
    }
    return messages
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bulkRequestedByPart, availabilityByPartId])

  const transferRows = useMemo(() => {
    return transfers.map((transfer) => {
      const totalQty = transfer.items.reduce((acc, item) => acc + Number(item.quantity || 0), 0)
      const productSummary = transfer.items.length === 1
        ? `${transfer.items[0].part_name} (${transfer.items[0].part_code})`
        : `${transfer.items.length} productos`
      const categorySummary = transfer.items.length === 1
        ? (transfer.items[0].part_category || '-')
        : 'Mixto'

      return {
        id: transfer.id,
        transfer_date: transfer.requested_at,
        part_name: productSummary,
        category: categorySummary,
        quantity: totalQty,
        from_branch_id: transfer.from_branch_id,
        to_branch_id: transfer.to_branch_id,
        status: transfer.status,
      }
    })
  }, [transfers])

  const pendingNumberMap = useMemo(() => {
    const map = new Map<string, string>()
    const grouped = new Map<string, PendingTransferSummary[]>()

    pendingTransfers.forEach((transfer) => {
      const key = toLocalDateKey(transfer.requested_at)
      const list = grouped.get(key) ?? []
      list.push(transfer)
      grouped.set(key, list)
    })

    grouped.forEach((list) => {
      list.sort((a, b) => new Date(a.requested_at).getTime() - new Date(b.requested_at).getTime())
      list.forEach((transfer, index) => {
        map.set(transfer.transfer_id, `Traspaso ${index + 1}`)
      })
    })

    return map
  }, [pendingTransfers])

  const canCreateSingle = Boolean(
    selectedPart && Number(quantity) > 0 && fromBranch !== toBranch && !singleShortage,
  )

  const canCreateBulk = useMemo(() => {
    if (fromBranch === toBranch || bulkRows.length === 0) return false
    if (Object.keys(bulkShortages).length > 0) return false

    const uniqueParts = new Set<string>()
    for (const row of bulkRows) {
      const qty = Number(row.quantity)
      if (!row.partId || !qty || qty <= 0) {
        return false
      }
      if (uniqueParts.has(row.partId)) {
        return false
      }
      uniqueParts.add(row.partId)
    }

    return true
  }, [bulkRows, bulkShortages, fromBranch, toBranch])

  const resetForm = () => {
    setQuantity('')
    setUnitPrice('')
    setNotes('')
    setBulkRows((prev) => {
      const defaultPart = prev[0]?.partId || products[0]?.id || ''
      return [createBulkRow(defaultPart)]
    })
  }

  const getTransferNumeral = async (transferId: string) => {
    const requests = await transferService.getRequests(null)
    const sorted = [...requests].sort(
      (a, b) => new Date(a.requested_at).getTime() - new Date(b.requested_at).getTime(),
    )
    const index = sorted.findIndex((r) => r.id === transferId)
    return index === -1 ? 'N/A' : String(index + 1)
  }

  const registerSingleTransfer = async () => {
    const qty = Number(quantity)
    if (!selectedPart || !qty || qty <= 0 || fromBranch === toBranch || singleShortage) return

    setIsSaving(true)
    setError(null)
    setFeedback(null)
    try {
      const transferId = await transferService.createRequest({
        from_branch_id: fromBranch,
        to_branch_id: toBranch,
        notes: notes || 'Traspaso unitario',
        items: [{ part_id: selectedPart.id, quantity: qty, unit_price: unitPrice ? Number(unitPrice) : null }],
      })

      // Generate confirmation PDF
      const fromName = branches.find((b) => b.id === fromBranch)?.name || fromBranch
      const toName = branches.find((b) => b.id === toBranch)?.name || toBranch
      const pdfItems: TransferConfirmationItem[] = [{
        name: selectedPart.name,
        quantity: qty,
        priceOrigin: Number(selectedPart.price || 0),
        priceDestination: unitPrice ? Number(unitPrice) : Number(selectedPart.price || 0),
      }]
      const transferNumber = typeof transferId === 'string' ? await getTransferNumeral(transferId) : 'N/A'
      generateTransferPdf({
        transferNumber,
        date: new Date(),
        exchangeRate: getCachedAppSettings().usd_to_bob_rate,
        fromBranchName: fromName,
        toBranchName: toName,
        items: pdfItems,
      })

      await Promise.all([loadTransfers(activeBranchId || null), loadAvailability(fromBranch)])
      setQuantity('')
      setUnitPrice('')
      setNotes('')
      setFeedback('Traspaso registrado como pendiente. Las unidades quedan reservadas y ya no figuran como disponibles en origen.')
    } catch (createError) {
      setError(resolveCreationErrorMessage(createError, 'No se pudo registrar el traspaso'))
    } finally {
      setIsSaving(false)
    }
  }

  const registerBulkTransfer = async () => {
    if (!canCreateBulk) return

    const rows = bulkRows
      .map((row) => {
        const product = products.find((item) => item.id === row.partId)
        return {
          product,
          quantity: Number(row.quantity),
          unitPrice: row.unitPrice,
        }
      })
      .filter((row) => row.product && row.quantity > 0)

    setIsSaving(true)
    setError(null)
    setFeedback(null)

    try {
      const transferId = await transferService.createRequest({
        from_branch_id: fromBranch,
        to_branch_id: toBranch,
        notes: notes || 'Traspaso masivo',
        items: rows.map((row) => ({
          part_id: row.product!.id,
          quantity: row.quantity,
          unit_price: row.unitPrice ? Number(row.unitPrice) : null,
        })),
      })

      // Generate confirmation PDF
      const fromName = branches.find((b) => b.id === fromBranch)?.name || fromBranch
      const toName = branches.find((b) => b.id === toBranch)?.name || toBranch
      const pdfItems: TransferConfirmationItem[] = rows.map((row) => ({
        name: row.product!.name,
        quantity: row.quantity,
        priceOrigin: Number(row.product!.price || 0),
        priceDestination: row.unitPrice ? Number(row.unitPrice) : Number(row.product!.price || 0),
      }))
      const transferNumber = typeof transferId === 'string' ? await getTransferNumeral(transferId) : 'N/A'
      generateTransferPdf({
        transferNumber,
        date: new Date(),
        exchangeRate: getCachedAppSettings().usd_to_bob_rate,
        fromBranchName: fromName,
        toBranchName: toName,
        items: pdfItems,
      })

      await Promise.all([loadTransfers(activeBranchId || null), loadAvailability(fromBranch)])
      resetForm()
      setFeedback('Traspasos masivos registrados como pendientes. Las unidades quedan reservadas en origen.')
    } catch (bulkError) {
      setError(resolveCreationErrorMessage(bulkError, 'No se pudo registrar el traspaso masivo'))
    } finally {
      setIsSaving(false)
    }
  }

  const completePendingTransfer = async (transferId: string) => {
    setIsSaving(true)
    setError(null)
    setFeedback(null)
    try {
      await transferService.completeRequest(transferId, 'Confirmado desde cola de pendientes')
      await Promise.all([loadTransfers(activeBranchId || null), loadAvailability(fromBranch)])
      setFeedback('Traspaso completado. El stock ya se movio a la sucursal de destino.')
    } catch (completeError) {
      setError(resolveCompletionErrorMessage(completeError))
    } finally {
      setIsSaving(false)
    }
  }

  const addBulkLine = () => {
    const available = products.find((product) => !bulkRows.some((row) => row.partId === product.id))
    setBulkRows((prev) => [...prev, createBulkRow(available?.id || products[0]?.id || '')])
  }

  const removeBulkLine = (id: string) => {
    setBulkRows((prev) => {
      const next = prev.filter((row) => row.id !== id)
      return next.length > 0 ? next : [createBulkRow(products[0]?.id || '')]
    })
  }

  const updateBulkRow = (id: string, patch: Partial<BulkRow>) => {
    setBulkRows((prev) => prev.map((row) => (row.id === id ? { ...row, ...patch } : row)))
  }

  const canCompleteTransfer = (transfer: PendingTransferSummary) => {
    return Boolean(transfer.can_complete) || activeRole === 'admin' || transfer.to_branch_id === activeBranchId
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <PageHeader title="Traspasos" description="Traspasos unitarios o masivos entre sucursales" />
        <InventorySubnav />

        {error ? (
          <Card className="border-red-500/40 bg-red-500/5">
            <CardContent className="pt-6 text-sm text-red-700 dark:text-red-300">{error}</CardContent>
          </Card>
        ) : null}

        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)] gap-4">
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <CardTitle>Nuevo traspaso</CardTitle>
                  <CardDescription>
                    Crea traspasos individuales o arma un traspaso masivo con multiples productos.
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant={mode === 'single' ? 'default' : 'outline'} onClick={() => setMode('single')}>
                    Traspaso simple
                  </Button>
                  <Button variant={mode === 'bulk' ? 'default' : 'outline'} onClick={() => setMode('bulk')}>
                    Traspaso masivo
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Sucursal origen</label>
                  <Select value={fromBranch} onValueChange={setFromBranch}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {branches.map((branch) => (
                        <SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Sucursal destino</label>
                  <Select value={toBranch} onValueChange={setToBranch}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {branches.map((branch) => (
                        <SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 md:col-span-2 lg:col-span-1">
                  <label className="text-sm font-medium">Motivo / nota</label>
                  <Input value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Ej. Reposicion por alta demanda" />
                </div>
              </div>

              {mode === 'single' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 rounded-xl border border-border/70 p-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Producto</label>
                    <PartCombobox parts={products} value={partId} onValueChange={setPartId} />
                    <div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-xs text-emerald-300">
                      Disponible en origen: <span className="font-semibold">{formatUnits(selectedAvailability.available)}</span>
                      {selectedAvailability.reserved > 0 ? (
                        <span className="text-emerald-300/70">
                          {' '}({formatUnits(selectedAvailability.on_hand)} en stock,{' '}
                          {formatUnits(selectedAvailability.reserved)} reservados en traspasos pendientes)
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Cantidad</label>
                    <Input
                      type="number"
                      min={0}
                      max={selectedAvailability.available || undefined}
                      value={quantity}
                      onChange={(event) => setQuantity(event.target.value)}
                      placeholder="0"
                    />
                    {singleShortage ? (
                      <p className="text-xs font-medium text-red-600 dark:text-red-400">{singleShortage}</p>
                    ) : null}
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Precio unitario (opcional)</label>
                    <Input type="number" step="0.01" value={unitPrice} onChange={(event) => setUnitPrice(event.target.value)} placeholder="Precio de venta en destino" />
                    <p className="text-[10px] text-muted-foreground">Si se indica, se promediará con el precio actual del producto en destino.</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 rounded-xl border border-border/70 p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">Listado de traspaso masivo</h3>
                    <Button variant="outline" size="sm" onClick={addBulkLine}>
                      <Plus className="mr-1 h-4 w-4" /> Agregar producto
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {bulkRows.map((row, index) => {
                      const rowStock = availabilityFor(row.partId)
                      const rowShortage = bulkShortages[row.partId]

                      return (
                      <div key={row.id} className="grid grid-cols-1 md:grid-cols-12 gap-2 rounded-lg border border-border/60 p-2">
                        <div className="md:col-span-7">
                          <PartCombobox parts={products} value={row.partId} onValueChange={(id) => updateBulkRow(row.id, { partId: id })} />
                          <div className="mt-1 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-xs text-emerald-300">
                            Disponible: <span className="font-semibold">{formatUnits(rowStock.available)}</span>
                            {rowStock.reserved > 0 ? (
                              <span className="text-emerald-300/70">
                                {' '}({formatUnits(rowStock.on_hand)} en stock, {formatUnits(rowStock.reserved)} reservados)
                              </span>
                            ) : null}
                          </div>
                        </div>
                        <div className="md:col-span-2">
                          <Input
                            type="number"
                            min={0}
                            max={rowStock.available || undefined}
                            value={row.quantity}
                            onChange={(event) => updateBulkRow(row.id, { quantity: event.target.value })}
                            placeholder="Cantidad"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <Input
                            type="number"
                            step="0.01"
                            value={row.unitPrice}
                            onChange={(event) => updateBulkRow(row.id, { unitPrice: event.target.value })}
                            placeholder="Precio (opc.)"
                          />
                        </div>
                        <div className="md:col-span-2 flex items-center justify-end">
                          <Button variant="destructive" size="sm" onClick={() => removeBulkLine(row.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="md:col-span-12 text-xs">
                          {rowShortage ? (
                            <span className="font-medium text-red-600 dark:text-red-400">{rowShortage}</span>
                          ) : (
                            <span className="text-muted-foreground">
                              Linea {index + 1}: puedes quitarla o cambiar el producto libremente.
                            </span>
                          )}
                        </div>
                      </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {feedback ? (
                <div className="rounded-lg border border-primary/25 bg-primary/10 px-3 py-2 text-sm">
                  {feedback}
                </div>
              ) : null}

              <div className="flex justify-end gap-2">
                <Button variant="destructive" onClick={resetForm}>Cancelar</Button>
                {mode === 'single' ? (
                  <Button onClick={() => void registerSingleTransfer()} disabled={!canCreateSingle || isSaving}>Registrar traspaso</Button>
                ) : (
                  <Button onClick={() => void registerBulkTransfer()} disabled={!canCreateBulk || isSaving}>Registrar traspaso masivo</Button>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="h-fit">
            <CardHeader>
              <CardTitle>Cola de pendientes</CardTitle>
              <CardDescription>
                Traspasos que aun no fueron completados en destino.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {pendingTransfers.length === 0 ? (
                <p className="text-sm text-muted-foreground">No hay traspasos pendientes.</p>
              ) : (
                pendingTransfers.map((transfer) => {
                  const canComplete = canCompleteTransfer(transfer)

                  return (
                    <div key={transfer.transfer_id} className="rounded-lg border border-border/70 p-3 space-y-2 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium">
                        {pendingNumberMap.get(transfer.transfer_id) ?? 'Traspaso pendiente'}
                      </p>
                      <Badge className="bg-amber-500 text-black">pendiente</Badge>
                    </div>
                    <p className="text-muted-foreground">Productos: {transfer.total_items}</p>
                    <p className="text-muted-foreground">Cantidad: {transfer.total_quantity}</p>
                    <p className="text-muted-foreground">
                      {branches.find((b) => b.id === transfer.from_branch_id)?.name ?? 'Sucursal sin nombre'}
                      {' -> '}
                      {branches.find((b) => b.id === transfer.to_branch_id)?.name ?? 'Sucursal sin nombre'}
                    </p>
                    <p className="text-muted-foreground">{new Date(transfer.requested_at).toLocaleString()}</p>
                    <Button
                      size="sm"
                      className="w-full"
                      onClick={() => void completePendingTransfer(transfer.transfer_id)}
                      disabled={isSaving || !canComplete}
                    >
                      Marcar como completado
                    </Button>
                    {!canComplete ? (
                      <p className="text-xs text-muted-foreground">Solo admin o sucursal destino puede completar.</p>
                    ) : null}
                    </div>
                  )
                })
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Boxes className="h-4 w-4 text-primary" />
              Traspasos recientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={[
                { key: 'transfer_date', label: 'Fecha', render: (v) => new Date(String(v)).toLocaleString() },
                { key: 'part_name', label: 'Producto', render: (v) => String(v) },
                { key: 'category', label: 'Categoría', render: (v) => String(v) },
                { key: 'quantity', label: 'Cantidad', render: (v) => String(v) },
                {
                  key: 'from_branch_id',
                  label: 'Origen',
                  render: (v) => branches.find((b) => b.id === String(v))?.name ?? String(v),
                },
                {
                  key: 'to_branch_id',
                  label: 'Destino',
                  render: (v) => branches.find((b) => b.id === String(v))?.name ?? String(v),
                },
                {
                  key: 'status',
                  label: 'Estado',
                  render: (v) => {
                    const value = String(v)
                    const className =
                      value === 'pending'
                        ? 'bg-amber-500 text-black'
                        :
                      value === 'completed'
                        ? 'bg-emerald-600 text-white'
                        : value === 'anulled'
                        ? 'bg-rose-600 text-white'
                        : value === 'returned'
                        ? 'bg-amber-600 text-white'
                        : 'bg-sky-600 text-white'

                    return <Badge className={className}>{transferStatusLabel(value)}</Badge>
                  },
                },
              ]}
              data={transferRows}
              loading={isLoading}
              emptyMessage="No hay traspasos todavía"
            />
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}
