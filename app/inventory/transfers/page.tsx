'use client'

import { useEffect, useMemo, useState } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { PageHeader } from '@/components/common/page-header'
import { InventorySubnav } from '@/components/modules/inventory/inventory-subnav'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DataTable } from '@/components/common/data-table'
import { Badge } from '@/components/ui/badge'
import { mockBranches } from '@/lib/mock/data'
import { addTransfer, getProducts, getTransfers } from '@/lib/mock/runtime-store'
import type { Part } from '@/types/database'

export default function InventoryTransfersPage() {
  const [products, setProducts] = useState<Part[]>([])
  const [transfers, setTransfers] = useState(getTransfers())

  const [partId, setPartId] = useState('')
  const [fromBranch, setFromBranch] = useState('branch-1')
  const [toBranch, setToBranch] = useState('branch-2')
  const [quantity, setQuantity] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    const loaded = getProducts()
    setProducts(loaded)
    if (loaded.length > 0) {
      setPartId(loaded[0].id)
    }
  }, [])

  const selectedPart = useMemo(() => products.find((item) => item.id === partId), [products, partId])

  const createTransfer = () => {
    const qty = Number(quantity)
    if (!selectedPart || !qty || qty <= 0 || fromBranch === toBranch) return

    const transfer = {
      id: `trf-${Date.now()}`,
      part_id: selectedPart.id,
      part_name: selectedPart.name,
      from_branch_id: fromBranch,
      to_branch_id: toBranch,
      quantity: qty,
      status: 'completed' as const,
      user_name: 'Usuario Demo',
      transfer_date: new Date().toISOString(),
      notes,
    }

    addTransfer(transfer)
    setTransfers(getTransfers())
    setQuantity('')
    setNotes('')
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <PageHeader title="Transferencias" description="Traspaso de productos entre sucursales con descuento/aumento de stock simulado" />
        <InventorySubnav />

        <Card>
          <CardHeader>
            <CardTitle>Nueva transferencia</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
            <div className="space-y-2">
              <label className="text-sm font-medium">Cantidad</label>
              <Input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="0" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">Notas</label>
              <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Motivo de transferencia" />
            </div>
            <div className="md:col-span-2 lg:col-span-3 flex justify-end gap-2">
              <Button variant="destructive" onClick={() => { setQuantity(''); setNotes('') }}>Cancelar</Button>
              <Button onClick={createTransfer} disabled={!partId || !quantity || fromBranch === toBranch}>Registrar Transferencia</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Transferencias recientes</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={[
                { key: 'transfer_date', label: 'Fecha', render: (v) => new Date(String(v)).toLocaleString() },
                { key: 'part_name', label: 'Producto', render: (v) => String(v) },
                { key: 'quantity', label: 'Cantidad', render: (v) => String(v) },
                {
                  key: 'from_branch_id',
                  label: 'Desde',
                  render: (v) => mockBranches.find((b) => b.id === String(v))?.name ?? String(v),
                },
                {
                  key: 'to_branch_id',
                  label: 'Hacia',
                  render: (v) => mockBranches.find((b) => b.id === String(v))?.name ?? String(v),
                },
                {
                  key: 'status',
                  label: 'Estado',
                  render: (v) => <Badge className="bg-emerald-600 text-white">{String(v)}</Badge>,
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
