'use client'

import { useEffect, useMemo, useState } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { PageHeader } from '@/components/common/page-header'
import { POSSubnav } from '@/components/modules/pos/pos-subnav'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DataTable } from '@/components/common/data-table'
import { Badge } from '@/components/ui/badge'
import { addReturn, getProducts, getReturns } from '@/lib/mock/runtime-store'
import type { Part } from '@/types/database'

export default function POSReturnsPage() {
  const [products, setProducts] = useState<Part[]>([])
  const [returns, setReturns] = useState(getReturns())

  const [partId, setPartId] = useState('')
  const [quantity, setQuantity] = useState('')
  const [reason, setReason] = useState('')
  const [customerName, setCustomerName] = useState('Cliente Mostrador')

  useEffect(() => {
    const loaded = getProducts()
    setProducts(loaded)
    if (loaded.length > 0) setPartId(loaded[0].id)
  }, [])

  const selectedPart = useMemo(() => products.find((item) => item.id === partId), [products, partId])

  const registerReturn = () => {
    const qty = Number(quantity)
    if (!selectedPart || !qty || qty <= 0 || !reason.trim()) return

    addReturn({
      id: `ret-${Date.now()}`,
      part_id: selectedPart.id,
      part_name: selectedPart.name,
      quantity: qty,
      reason,
      customer_name: customerName || 'Cliente Mostrador',
      status: 'completed',
      created_at: new Date().toISOString(),
    })

    setReturns(getReturns())
    setQuantity('')
    setReason('')
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <PageHeader title="Devoluciones" description="Registro y seguimiento de devoluciones de productos" />
        <POSSubnav />

        <Card>
          <CardHeader>
            <CardTitle>Nueva devolución</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Producto</label>
              <Select value={partId} onValueChange={setPartId}>
                <SelectTrigger><SelectValue placeholder="Selecciona producto" /></SelectTrigger>
                <SelectContent>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id}>{product.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Cantidad</label>
              <Input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="0" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Cliente</label>
              <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Nombre cliente" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Motivo</label>
              <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Motivo de devolución" />
            </div>
            <div className="lg:col-span-4 flex justify-end gap-2">
              <Button variant="destructive" onClick={() => { setQuantity(''); setReason('') }}>Cancelar</Button>
              <Button onClick={registerReturn} disabled={!partId || !quantity || !reason}>Registrar devolución</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Historial de devoluciones</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={[
                { key: 'created_at', label: 'Fecha', render: (v) => new Date(String(v)).toLocaleString() },
                { key: 'part_name', label: 'Producto', render: (v) => String(v) },
                { key: 'quantity', label: 'Cantidad', render: (v) => String(v) },
                { key: 'customer_name', label: 'Cliente', render: (v) => String(v) },
                { key: 'reason', label: 'Motivo', render: (v) => String(v) },
                { key: 'status', label: 'Estado', render: (v) => <Badge className="bg-emerald-600 text-white">{String(v)}</Badge> },
              ]}
              data={returns}
              emptyMessage="No hay devoluciones registradas"
            />
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}
