'use client'

import { useEffect, useMemo, useState } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { PageHeader } from '@/components/common/page-header'
import { POSSubnav } from '@/components/modules/pos/pos-subnav'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ACTIVE_ROLE_EVENT, getActiveUserContext, getAppSettings } from '@/lib/mock/runtime-store'
import { posService, type POSCatalogItem, type POSPendingDelivery } from '@/lib/supabase/pos'

export default function POSAdvanceSalesPage() {
  const [catalog, setCatalog] = useState<POSCatalogItem[]>([])
  const [pendingDeliveries, setPendingDeliveries] = useState<POSPendingDelivery[]>([])
  const [activeBranchId, setActiveBranchId] = useState('branch-1')

  const [customerName, setCustomerName] = useState('')
  const [partId, setPartId] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [advanceAmount, setAdvanceAmount] = useState('0')
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'qr'>('cash')
  const [paymentCurrency, setPaymentCurrency] = useState<'BOB' | 'USD'>('BOB')
  const [exchangeRate, setExchangeRate] = useState(6.96)
  const [notes, setNotes] = useState('')

  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)

  const selectedPart = useMemo(() => catalog.find((item) => item.part_id === partId) || null, [catalog, partId])

  const loadData = async (branchId?: string) => {
    setIsLoading(true)
    setError(null)

    try {
      const targetBranch = branchId || getActiveUserContext().branch_id
      const [catalogData, deliveryData] = await Promise.all([
        posService.getCatalog(targetBranch),
        posService.getPendingDeliveries(targetBranch),
      ])

      setCatalog(catalogData)
      setPendingDeliveries(deliveryData)

      if (!partId && catalogData.length > 0) {
        setPartId(catalogData[0].part_id)
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'No se pudo cargar venta adelantada')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const settings = getAppSettings()
    setExchangeRate(settings.usd_to_bob_rate)
    setPaymentCurrency(settings.default_currency)

    const syncContext = () => {
      const context = getActiveUserContext()
      setActiveBranchId(context.branch_id)
      void loadData(context.branch_id)
    }

    syncContext()
    window.addEventListener(ACTIVE_ROLE_EVENT, syncContext)
    window.addEventListener('focus', syncContext)

    return () => {
      window.removeEventListener(ACTIVE_ROLE_EVENT, syncContext)
      window.removeEventListener('focus', syncContext)
    }
  }, [])

  const registerAdvanceSale = async () => {
    if (!selectedPart) {
      setFeedback('Selecciona un producto válido.')
      return
    }

    const qty = Number(quantity)
    const adv = Number(advanceAmount)

    if (!Number.isFinite(qty) || qty <= 0) {
      setFeedback('La cantidad debe ser mayor a cero.')
      return
    }

    if (!Number.isFinite(adv) || adv < 0) {
      setFeedback('El anticipo debe ser mayor o igual a cero.')
      return
    }

    setError(null)
    setFeedback(null)
    setIsSubmitting(true)

    try {
      const result = await posService.createSale({
        branch_id: activeBranchId,
        customer_name: customerName || null,
        payment_method: paymentMethod,
        payment_currency: paymentCurrency,
        exchange_rate: exchangeRate,
        sale_mode: 'advance',
        advance_amount: adv,
        items: [
          {
            part_id: selectedPart.part_id,
            quantity: qty,
            unit_price: Number(selectedPart.price || 0),
            source_type: 'product',
            source_kit_id: null,
          },
        ],
        metadata: {
          module: 'pos/advance-sales',
          notes: notes || null,
        },
      })

      await loadData(activeBranchId)
      setCustomerName('')
      setQuantity('1')
      setAdvanceAmount('0')
      setNotes('')
      setFeedback(`Venta adelantada registrada: ${result?.sale_id || 'OK'}`)
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'No se pudo registrar la venta adelantada')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <PageHeader title="Venta por Adelantado" description="Registra anticipos y deja la venta pendiente de entrega" />
        <POSSubnav />

        {error ? <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">{error}</div> : null}
        {feedback ? <div className="rounded-lg border border-primary/30 bg-primary/10 p-3 text-sm text-primary">{feedback}</div> : null}

        <Card className="border-amber-500/45 bg-zinc-950/70">
          <CardHeader>
            <CardTitle className="text-zinc-100">Nueva venta adelantada</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label>Cliente</Label>
              <Input value={customerName} onChange={(event) => setCustomerName(event.target.value)} placeholder="Nombre cliente" />
            </div>

            <div className="space-y-2">
              <Label>Producto</Label>
              <Select value={partId} onValueChange={setPartId}>
                <SelectTrigger><SelectValue placeholder="Selecciona producto" /></SelectTrigger>
                <SelectContent>
                  {catalog.map((item) => (
                    <SelectItem key={item.part_id} value={item.part_id}>
                      {item.name} - Bs {Number(item.price || 0).toFixed(2)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Cantidad</Label>
              <Input type="number" min={1} value={quantity} onChange={(event) => setQuantity(event.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>Anticipo</Label>
              <Input type="number" min={0} value={advanceAmount} onChange={(event) => setAdvanceAmount(event.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>Método de pago</Label>
              <Select value={paymentMethod} onValueChange={(value) => setPaymentMethod(value as 'cash' | 'card' | 'qr')}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Efectivo</SelectItem>
                  <SelectItem value="card">Tarjeta</SelectItem>
                  <SelectItem value="qr">QR/Transferencia</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Moneda</Label>
              <Select value={paymentCurrency} onValueChange={(value) => setPaymentCurrency(value as 'BOB' | 'USD')}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="BOB">BOB</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 md:col-span-3">
              <Label>Observaciones</Label>
              <Input value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Notas de entrega" />
            </div>

            <div className="md:col-span-3 flex justify-end">
              <Button onClick={registerAdvanceSale} disabled={isSubmitting || isLoading}>Registrar venta adelantada</Button>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-950/70">
          <CardHeader>
            <CardTitle className="text-zinc-100">Pendientes por entregar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              <p className="text-sm text-zinc-400">Cargando pendientes...</p>
            ) : pendingDeliveries.length === 0 ? (
              <p className="text-sm text-zinc-400">No hay ventas pendientes por entregar en la sucursal activa.</p>
            ) : (
              pendingDeliveries.map((delivery) => (
                <div key={delivery.sale_id} className="rounded-lg border border-zinc-800 bg-zinc-900/70 p-3 text-sm">
                  <p className="font-semibold text-zinc-100">{delivery.sale_id} - {delivery.customer_name || 'Cliente mostrador'}</p>
                  <p className="text-zinc-400">Total: Bs {Number(delivery.total_amount || 0).toFixed(2)} | Saldo: Bs {Number(delivery.pending_amount || 0).toFixed(2)}</p>
                  <p className="text-amber-300">Estado de entrega: {delivery.delivery_status}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}
