'use client'

import { useEffect, useMemo, useState } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { PageHeader } from '@/components/common/page-header'
import { InventorySubnav } from '@/components/modules/inventory/inventory-subnav'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DataTable } from '@/components/common/data-table'
import { Badge } from '@/components/ui/badge'
import {
  branchesService,
  partsService,
  transferService,
  type PendingTransferSummary,
  type TransferRequestDetail,
} from '@/lib/supabase/inventory'
import { ACTIVE_ROLE_EVENT, getActiveUserContext, type AppUserRole } from '@/lib/mock/runtime-store'
import { Boxes, Plus, Trash2 } from 'lucide-react'
import type { Part } from '@/types/database'

interface BulkRow {
  id: string
  partId: string
  quantity: string
}

function createBulkRow(partId = ''): BulkRow {
  return {
    id: `row-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
    partId,
    quantity: '',
  }
}

export default function InventoryTransfersPage() {
  const [products, setProducts] = useState<Part[]>([])
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

  useEffect(() => {
    const loadProducts = async () => {
      if (!fromBranch) {
        setProducts([])
        setPartId('')
        return
      }

      try {
        const loaded = await partsService.getAll(fromBranch)
        setProducts(loaded)

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

  const canCreateSingle = Boolean(selectedPart && Number(quantity) > 0 && fromBranch !== toBranch)

  const canCreateBulk = useMemo(() => {
    if (fromBranch === toBranch || bulkRows.length === 0) return false

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
  }, [bulkRows, fromBranch, toBranch])

  const resetForm = () => {
    setQuantity('')
    setNotes('')
    setBulkRows((prev) => {
      const defaultPart = prev[0]?.partId || products[0]?.id || ''
      return [createBulkRow(defaultPart)]
    })
  }

  const registerSingleTransfer = async () => {
    const qty = Number(quantity)
    if (!selectedPart || !qty || qty <= 0 || fromBranch === toBranch) return

    setIsSaving(true)
    setError(null)
    setFeedback(null)
    try {
      await transferService.createRequest({
        from_branch_id: fromBranch,
        to_branch_id: toBranch,
        notes: notes || 'Traspaso unitario',
        items: [{ part_id: selectedPart.id, quantity: qty }],
      })

      await loadTransfers(activeBranchId || null)
      setQuantity('')
      setNotes('')
      setFeedback('Traspaso registrado como pendiente. Puedes completarlo desde la cola de la derecha.')
    } catch (createError) {
      setError(resolveErrorMessage(createError, 'No se pudo registrar el traspaso'))
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
        }
      })
      .filter((row) => row.product && row.quantity > 0)

    setIsSaving(true)
    setError(null)
    setFeedback(null)

    try {
      await transferService.createRequest({
        from_branch_id: fromBranch,
        to_branch_id: toBranch,
        notes: notes || 'Traspaso masivo',
        items: rows.map((row) => ({
          part_id: row.product!.id,
          quantity: row.quantity,
        })),
      })

      await loadTransfers(activeBranchId || null)
      resetForm()
      setFeedback('Traspasos masivos registrados como pendientes.')
    } catch (bulkError) {
      setError(resolveErrorMessage(bulkError, 'No se pudo registrar el traspaso masivo'))
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
      await loadTransfers(activeBranchId || null)
      setFeedback(`Traspaso ${transferId} marcado como completado.`)
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
                    <Select value={partId} onValueChange={setPartId}>
                      <SelectTrigger><SelectValue placeholder="Seleccionar producto" /></SelectTrigger>
                      <SelectContent>
                        {products.map((product) => (
                          <SelectItem key={product.id} value={product.id}>{product.name} ({product.code})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Cantidad</label>
                    <Input type="number" value={quantity} onChange={(event) => setQuantity(event.target.value)} placeholder="0" />
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
                    {bulkRows.map((row, index) => (
                      <div key={row.id} className="grid grid-cols-1 md:grid-cols-12 gap-2 rounded-lg border border-border/60 p-2">
                        <div className="md:col-span-7">
                          <Select value={row.partId || 'none'} onValueChange={(value) => updateBulkRow(row.id, { partId: value === 'none' ? '' : value })}>
                            <SelectTrigger><SelectValue placeholder="Producto" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none" disabled>Selecciona producto</SelectItem>
                              {products.map((product) => (
                                <SelectItem key={product.id} value={product.id}>{product.name} ({product.code})</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="md:col-span-3">
                          <Input
                            type="number"
                            value={row.quantity}
                            onChange={(event) => updateBulkRow(row.id, { quantity: event.target.value })}
                            placeholder="Cantidad"
                          />
                        </div>
                        <div className="md:col-span-2 flex items-center justify-end">
                          <Button variant="destructive" size="sm" onClick={() => removeBulkLine(row.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="md:col-span-12 text-xs text-muted-foreground">
                          Linea {index + 1}: puedes quitarla o cambiar el producto libremente.
                        </div>
                      </div>
                    ))}
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
                      <p className="font-medium">Traspaso pendiente</p>
                      <Badge className="bg-amber-500 text-black">pendiente</Badge>
                    </div>
                    <p className="text-muted-foreground">{transfer.transfer_id}</p>
                    <p className="text-muted-foreground">Items: {transfer.total_items}</p>
                    <p className="text-muted-foreground">Cantidad: {transfer.total_quantity}</p>
                    <p className="text-muted-foreground">
                      {branches.find((b) => b.id === transfer.from_branch_id)?.name ?? transfer.from_branch_id}
                      {' -> '}
                      {branches.find((b) => b.id === transfer.to_branch_id)?.name ?? transfer.to_branch_id}
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

                    return <Badge className={className}>{value}</Badge>
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
