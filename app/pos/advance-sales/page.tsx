'use client'

import { useEffect, useMemo, useState } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { PageHeader } from '@/components/common/page-header'
import { POSSubnav } from '@/components/modules/pos/pos-subnav'
import { EmptyState } from '@/components/common/empty-state'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { ACTIVE_ROLE_EVENT, getActiveUserContext } from '@/lib/mock/runtime-store'
import { getSupabaseClient } from '@/lib/supabase/client'
import { posService, type POSCatalogItem, type POSPendingDelivery } from '@/lib/supabase/pos'
import { toast } from '@/hooks/use-toast'
import { Clock, PackageCheck } from 'lucide-react'
import type { AppSettings } from '@/types/database'

export default function POSAdvanceSalesPage() {
  const [catalog, setCatalog] = useState<POSCatalogItem[]>([])
  const [pendingDeliveries, setPendingDeliveries] = useState<POSPendingDelivery[]>([])
  const [activeBranchId, setActiveBranchId] = useState(() => getActiveUserContext().branch_id)

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

  const selectedPart = useMemo(() => catalog.find((item) => item.part_id === partId) ?? null, [catalog, partId])

  const totalBob = useMemo(() => {
    if (!selectedPart) return 0
    const qty = Number(quantity) || 0
    const price = Number(selectedPart.price) || 0
    const total = qty * price
    return paymentCurrency === 'USD' ? total * exchangeRate : total
  }, [selectedPart, quantity, paymentCurrency, exchangeRate])

  const loadData = async (branchId?: string) => {
    setIsLoading(true)
    try {
      const target = branchId ?? activeBranchId
      const [catalogData, deliveryData] = await Promise.all([
        posService.getCatalog(target),
        posService.getPendingDeliveries(target),
      ])
      setCatalog(catalogData)
      setPendingDeliveries(deliveryData)
      if (!partId && catalogData.length > 0) {
        setPartId(catalogData[0].part_id)
      }
    } catch (err) {
      toast({
        title: 'Error al cargar datos',
        description: err instanceof Error ? err.message : 'No se pudo cargar catálogo',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const supabase = getSupabaseClient()

    const loadSettings = async () => {
      const { data } = await supabase.rpc('get_app_settings')
      const row = Array.isArray(data) ? data[0] : data
      if (row) {
        const settings = row as AppSettings
        setExchangeRate(settings.usd_to_bob_rate ?? 6.96)
        setPaymentCurrency(settings.default_currency ?? 'BOB')
      }
    }

    const syncContext = () => {
      const ctx = getActiveUserContext()
      setActiveBranchId(ctx.branch_id)
      void loadData(ctx.branch_id)
    }

    void loadSettings()
    syncContext()
    window.addEventListener(ACTIVE_ROLE_EVENT, syncContext)
    window.addEventListener('focus', syncContext)
    return () => {
      window.removeEventListener(ACTIVE_ROLE_EVENT, syncContext)
      window.removeEventListener('focus', syncContext)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const registerAdvanceSale = async () => {
    if (!selectedPart) {
      toast({ title: 'Producto requerido', description: 'Selecciona un producto válido.', variant: 'destructive' })
      return
    }
    const qty = Number(quantity)
    const adv = Number(advanceAmount)
    if (!Number.isFinite(qty) || qty <= 0) {
      toast({ title: 'Cantidad inválida', description: 'La cantidad debe ser mayor a cero.', variant: 'destructive' })
      return
    }
    if (!Number.isFinite(adv) || adv < 0) {
      toast({ title: 'Anticipo inválido', description: 'El anticipo debe ser mayor o igual a cero.', variant: 'destructive' })
      return
    }

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
        items: [{
          part_id: selectedPart.part_id,
          quantity: qty,
          unit_price: Number(selectedPart.price || 0),
          source_type: 'product',
          source_kit_id: null,
        }],
        metadata: { module: 'pos/advance-sales', notes: notes || null },
      })

      toast({
        title: 'Venta adelantada registrada',
        description: `ID: ${result?.sale_id?.slice(0, 12) ?? 'OK'}…`,
      })
      await loadData(activeBranchId)
      setCustomerName('')
      setQuantity('1')
      setAdvanceAmount('0')
      setNotes('')
    } catch (err) {
      toast({
        title: 'Error al registrar',
        description: err instanceof Error ? err.message : 'No se pudo registrar la venta adelantada',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const deliveryStatusLabel: Record<string, string> = {
    pending: 'Pendiente',
    partial: 'Parcial',
    delivered: 'Entregado',
  }
  const deliveryStatusClass: Record<string, string> = {
    pending: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    partial: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
    delivered: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <PageHeader
          title="Venta por Adelantado"
          description="Registra un anticipo y deja la venta pendiente de entrega"
        />
        <POSSubnav />

        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
          {/* Form */}
          <div className="xl:col-span-2">
            <Card className="border-amber-500/30 bg-amber-500/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-amber-300 flex items-center gap-2">
                  <Clock className="w-4 h-4" /> Nueva venta adelantada
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-sm">Cliente (opcional)</Label>
                  <Input
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Nombre del cliente"
                    className="h-9"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-sm">Producto <span className="text-rose-400">*</span></Label>
                  <Select value={partId} onValueChange={setPartId} disabled={isLoading}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder={isLoading ? 'Cargando catálogo...' : 'Selecciona producto'} />
                    </SelectTrigger>
                    <SelectContent>
                      {catalog.map((item) => (
                        <SelectItem key={item.part_id} value={item.part_id}>
                          {item.name} — Bs {Number(item.price || 0).toFixed(2)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedPart && (
                    <p className="text-xs text-muted-foreground">
                      Stock disponible: <span className="font-medium text-foreground">{selectedPart.stock}</span>
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-sm">Cantidad</Label>
                    <Input type="number" min={1} value={quantity} onChange={(e) => setQuantity(e.target.value)} className="h-9" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm">Anticipo (Bs)</Label>
                    <Input type="number" min={0} value={advanceAmount} onChange={(e) => setAdvanceAmount(e.target.value)} className="h-9" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-sm">Método de pago</Label>
                    <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as 'cash' | 'card' | 'qr')}>
                      <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Efectivo</SelectItem>
                        <SelectItem value="card">Tarjeta</SelectItem>
                        <SelectItem value="qr">QR/Transferencia</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm">Moneda</Label>
                    <Select value={paymentCurrency} onValueChange={(v) => setPaymentCurrency(v as 'BOB' | 'USD')}>
                      <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BOB">BOB (Bs)</SelectItem>
                        <SelectItem value="USD">USD ($)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {paymentCurrency === 'USD' && (
                  <div className="space-y-1.5">
                    <Label className="text-sm">Tipo de cambio (1 USD = ? BOB)</Label>
                    <Input
                      type="number"
                      min={1}
                      step={0.01}
                      value={exchangeRate}
                      onChange={(e) => setExchangeRate(Number(e.target.value))}
                      className="h-9"
                    />
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label className="text-sm">Observaciones</Label>
                  <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notas de entrega" className="h-9" />
                </div>

                {/* Preview */}
                {selectedPart && (
                  <div className="rounded-lg border border-border/50 bg-muted/20 px-4 py-3 space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total estimado</span>
                      <span className="font-semibold">Bs {totalBob.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Anticipo</span>
                      <span className="text-amber-400 font-medium">Bs {Number(advanceAmount || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between border-t border-border/40 pt-1 mt-1">
                      <span className="text-muted-foreground">Saldo pendiente</span>
                      <span className="text-rose-400 font-semibold">
                        Bs {Math.max(0, totalBob - Number(advanceAmount || 0)).toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}

                <Button
                  className="w-full"
                  onClick={registerAdvanceSale}
                  disabled={isSubmitting || isLoading || !selectedPart}
                >
                  {isSubmitting ? 'Registrando...' : 'Registrar venta adelantada'}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Pending deliveries */}
          <div className="xl:col-span-3 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-foreground">Pendientes por entregar</h3>
              <Badge variant="secondary">{pendingDeliveries.length}</Badge>
            </div>

            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Card key={i} className="animate-pulse border-border/50">
                    <CardContent className="pt-4 pb-3 space-y-2">
                      <div className="h-4 bg-muted/50 rounded w-48" />
                      <div className="h-3 bg-muted/50 rounded w-32" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : pendingDeliveries.length === 0 ? (
              <Card className="border-border/50">
                <EmptyState
                  icon={PackageCheck}
                  title="Sin pendientes"
                  description="No hay ventas adelantadas pendientes por entregar en esta sucursal."
                />
              </Card>
            ) : (
              <div className="space-y-3">
                {pendingDeliveries.map((delivery) => (
                  <Card key={delivery.sale_id} className="border-border/50 hover:border-primary/30 transition-colors">
                    <CardContent className="pt-4 pb-3 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-sm">{delivery.customer_name ?? 'Cliente mostrador'}</p>
                          <p className="text-xs text-muted-foreground font-mono mt-0.5">{delivery.sale_id.slice(0, 16)}…</p>
                        </div>
                        <Badge
                          variant="outline"
                          className={deliveryStatusClass[delivery.delivery_status] ?? 'bg-muted text-muted-foreground'}
                        >
                          {deliveryStatusLabel[delivery.delivery_status] ?? delivery.delivery_status}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="rounded-md border border-border/40 bg-muted/10 px-3 py-1.5">
                          <p className="text-xs text-muted-foreground">Total</p>
                          <p className="font-semibold">Bs {Number(delivery.total_amount || 0).toFixed(2)}</p>
                        </div>
                        <div className="rounded-md border border-rose-500/30 bg-rose-500/10 px-3 py-1.5">
                          <p className="text-xs text-muted-foreground">Saldo pendiente</p>
                          <p className="font-semibold text-rose-400">Bs {Number(delivery.pending_amount || 0).toFixed(2)}</p>
                        </div>
                      </div>

                      {delivery.items && delivery.items.length > 0 && (
                        <div className="space-y-1">
                          {delivery.items.map((item) => (
                            <div key={item.sale_item_id} className="flex items-center justify-between text-xs text-muted-foreground bg-muted/10 rounded px-2 py-1">
                              <span>{item.part_name}</span>
                              <span>
                                {Number(item.delivered_quantity || 0)}/{Number(item.quantity || 0)} entregado
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      <p className="text-xs text-muted-foreground">
                        {new Date(delivery.created_at).toLocaleString('es-BO', { dateStyle: 'medium', timeStyle: 'short' })}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
