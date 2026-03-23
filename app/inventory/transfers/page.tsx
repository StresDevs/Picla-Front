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
import { mockBranches } from '@/lib/mock/data'
import { addTransfersBulk, createTransfer, getProducts, getTransfers } from '@/lib/mock/runtime-store'
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
  const [transfers, setTransfers] = useState(getTransfers())

  const [mode, setMode] = useState<'single' | 'bulk'>('single')
  const [partId, setPartId] = useState('')
  const [fromBranch, setFromBranch] = useState('branch-1')
  const [toBranch, setToBranch] = useState('branch-2')
  const [quantity, setQuantity] = useState('')
  const [notes, setNotes] = useState('')
  const [bulkRows, setBulkRows] = useState<BulkRow[]>([])

  useEffect(() => {
    const loaded = getProducts()
    setProducts(loaded)

    if (loaded.length > 0) {
      setPartId(loaded[0].id)
      setBulkRows([createBulkRow(loaded[0].id)])
    }

    setTransfers(getTransfers())
  }, [])

  const selectedPart = useMemo(() => products.find((item) => item.id === partId), [products, partId])

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

  const registerSingleTransfer = () => {
    const qty = Number(quantity)
    if (!selectedPart || !qty || qty <= 0 || fromBranch === toBranch) return

    createTransfer({
      part_id: selectedPart.id,
      part_name: selectedPart.name,
      category: selectedPart.category,
      from_branch_id: fromBranch,
      to_branch_id: toBranch,
      quantity: qty,
      user_name: 'Usuario Demo',
      notes: notes || 'Envio unitario',
    })

    setTransfers(getTransfers())
    setQuantity('')
    setNotes('')
  }

  const registerBulkTransfer = () => {
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

    addTransfersBulk(
      rows.map((row) => ({
        part_id: row.product!.id,
        part_name: row.product!.name,
        category: row.product!.category,
        from_branch_id: fromBranch,
        to_branch_id: toBranch,
        quantity: row.quantity,
        user_name: 'Usuario Demo',
        notes: notes || 'Envio masivo',
      }))
    )

    setTransfers(getTransfers())
    resetForm()
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

  return (
    <MainLayout>
      <div className="space-y-6">
        <PageHeader title="Transferencias" description="Envios unitarios o masivos entre sucursales (modo mock)" />
        <InventorySubnav />

        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle>Nuevo envio</CardTitle>
                <CardDescription>
                  Crea traspasos individuales o arma un envio masivo con multiples productos.
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button variant={mode === 'single' ? 'default' : 'outline'} onClick={() => setMode('single')}>
                  Envio simple
                </Button>
                <Button variant={mode === 'bulk' ? 'default' : 'outline'} onClick={() => setMode('bulk')}>
                  Envio masivo
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
                    {mockBranches.map((branch) => (
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
                    {mockBranches.map((branch) => (
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
                  <h3 className="font-medium">Listado de envio masivo</h3>
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

            <div className="flex justify-end gap-2">
              <Button variant="destructive" onClick={resetForm}>Cancelar</Button>
              {mode === 'single' ? (
                <Button onClick={registerSingleTransfer} disabled={!canCreateSingle}>Registrar envio</Button>
              ) : (
                <Button onClick={registerBulkTransfer} disabled={!canCreateBulk}>Registrar envio masivo</Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Boxes className="h-4 w-4 text-primary" />
              Envíos recientes
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
                  render: (v) => mockBranches.find((b) => b.id === String(v))?.name ?? String(v),
                },
                {
                  key: 'to_branch_id',
                  label: 'Destino',
                  render: (v) => mockBranches.find((b) => b.id === String(v))?.name ?? String(v),
                },
                {
                  key: 'status',
                  label: 'Estado',
                  render: (v) => {
                    const value = String(v)
                    const className =
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
              data={transfers}
              emptyMessage="No hay transferencias todavía"
            />
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}
