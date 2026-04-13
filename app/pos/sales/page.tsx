'use client'

import { useEffect, useMemo, useState } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { PageHeader } from '@/components/common/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Search, ShoppingCart, Plus, Trash2, ShieldCheck, CheckCircle2, DollarSign, CreditCard, QrCode } from 'lucide-react'
import {
  ACTIVE_ROLE_EVENT,
  canRoleCompleteSale,
  getActiveUserContext,
  getAppSettings,
  type AppUserRole,
} from '@/lib/mock/runtime-store'
import { mockBranches } from '@/lib/mock/data'
import { printMockInvoice } from '@/lib/mock/invoice'
import { posService, type POSCatalogItem, type POSQueuedSale, type POSQueueLineInput } from '@/lib/supabase/pos'

interface CartItem {
  id: string
  part_id: string
  code: string
  name: string
  quantity: number
  unit_price: number
}

const PAYMENT_METHODS = [
  { id: 'cash', label: 'Efectivo', icon: DollarSign },
  { id: 'card', label: 'Tarjeta', icon: CreditCard },
  { id: 'qr', label: 'QR/Transferencia', icon: QrCode },
] as const

export default function POSSalesPage() {
  const [catalog, setCatalog] = useState<POSCatalogItem[]>([])
  const [queuedSales, setQueuedSales] = useState<POSQueuedSale[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [customerName, setCustomerName] = useState('Cliente mostrador')
  const [selectedPayment, setSelectedPayment] = useState<'cash' | 'card' | 'qr'>('cash')
  const [paymentCurrency, setPaymentCurrency] = useState<'BOB' | 'USD'>('BOB')
  const [exchangeRate, setExchangeRate] = useState(6.96)
  const [activeRole, setActiveRole] = useState<AppUserRole>('employee')
  const [activeUserName, setActiveUserName] = useState('Usuario')
  const [activeBranchId, setActiveBranchId] = useState('branch-1')
  const [feedback, setFeedback] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [printInvoiceOnSale, setPrintInvoiceOnSale] = useState(true)

  const canCompleteSale = canRoleCompleteSale(activeRole)
  const canQueueSale = activeRole === 'read_only'
  const canApproveQueue = activeRole === 'admin' || activeRole === 'manager' || activeRole === 'employee'

  const reloadPOSData = async (branchId?: string) => {
    const targetBranch = branchId || getActiveUserContext().branch_id
    setIsLoading(true)
    setError(null)

    try {
      const [catalogData, queuedData] = await Promise.all([
        posService.getCatalog(targetBranch),
        posService.getQueuedSales({ branch_id: targetBranch, status: 'queued' }),
      ])

      setCatalog(catalogData)
      setQueuedSales(queuedData)

      setCart((prev) =>
        prev.filter((item) => catalogData.some((product) => product.part_id === item.part_id)),
      )
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'No se pudo cargar el módulo de ventas')
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
      setActiveRole(context.role)
      setActiveUserName(context.user_name)
      setActiveBranchId(context.branch_id)
      void reloadPOSData(context.branch_id)
    }

    syncContext()
    window.addEventListener(ACTIVE_ROLE_EVENT, syncContext)
    window.addEventListener('focus', syncContext)

    return () => {
      window.removeEventListener(ACTIVE_ROLE_EVENT, syncContext)
      window.removeEventListener('focus', syncContext)
    }
  }, [])

  const filteredCatalog = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    if (!term) return catalog
    return catalog.filter(
      (item) => item.name.toLowerCase().includes(term) || item.code.toLowerCase().includes(term),
    )
  }, [catalog, searchTerm])

  const cartTotalBob = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity * item.unit_price, 0),
    [cart],
  )
  const safeExchangeRate = exchangeRate > 0 ? exchangeRate : 1
  const cartTotalUsd = Number((cartTotalBob / safeExchangeRate).toFixed(2))
  const amountToCharge = paymentCurrency === 'USD' ? cartTotalUsd : cartTotalBob

  const addToCart = (product: POSCatalogItem) => {
    if (product.stock <= 0) {
      setFeedback('Este producto no tiene stock disponible en la sucursal activa.')
      return
    }

    setCart((prev) => {
      const found = prev.find((item) => item.part_id === product.part_id)
      if (found) {
        return prev.map((item) =>
          item.part_id === product.part_id
            ? { ...item, quantity: Math.min(item.quantity + 1, Number(product.stock || 0)) }
            : item,
        )
      }

      return [
        ...prev,
        {
          id: `cart-${product.part_id}`,
          part_id: product.part_id,
          code: product.code,
          name: product.name,
          quantity: 1,
          unit_price: Number(product.price || 0),
        },
      ]
    })
  }

  const removeFromCart = (partId: string) => {
    setCart((prev) => prev.filter((item) => item.part_id !== partId))
  }

  const updateCartQuantity = (partId: string, value: string) => {
    const qty = Number(value)
    if (!Number.isFinite(qty) || qty <= 0) return

    const stock = Number(catalog.find((item) => item.part_id === partId)?.stock || 0)
    setCart((prev) =>
      prev.map((item) =>
        item.part_id === partId ? { ...item, quantity: Math.min(qty, Math.max(stock, 1)) } : item,
      ),
    )
  }

  const updateCartPrice = (partId: string, value: string) => {
    if (!canCompleteSale) return
    const price = Number(value)
    if (!Number.isFinite(price) || price < 0) return

    setCart((prev) =>
      prev.map((item) => (item.part_id === partId ? { ...item, unit_price: Number(price.toFixed(2)) } : item)),
    )
  }

  const buildSaleItemsPayload = (): POSQueueLineInput[] => {
    return cart.map((item) => ({
      part_id: item.part_id,
      quantity: item.quantity,
      unit_price: Number(item.unit_price.toFixed(2)),
      source_type: 'product',
      source_kit_id: null,
    }))
  }

  const completeOrQueueSale = async () => {
    if (cart.length === 0) {
      setFeedback('Agrega productos al carrito antes de procesar la venta.')
      return
    }

    setError(null)
    setFeedback(null)
    setIsSubmitting(true)

    try {
      const items = buildSaleItemsPayload()
      const branchId = activeBranchId
      const saleMode = 'immediate' as const

      if (canQueueSale) {
        const queueId = await posService.enqueueSale({
          branch_id: branchId,
          customer_name: customerName,
          payment_method: selectedPayment,
          payment_currency: paymentCurrency,
          exchange_rate: safeExchangeRate,
          sale_mode: saleMode,
          advance_amount: 0,
          items,
        })

        setCart([])
        await reloadPOSData(branchId)
        setFeedback(`Venta encolada correctamente: ${queueId}`)
        return
      }

      if (!canCompleteSale) {
        setFeedback('Tu rol no tiene permiso para completar ventas.')
        return
      }

      const result = await posService.createSale({
        branch_id: branchId,
        customer_name: customerName,
        payment_method: selectedPayment,
        payment_currency: paymentCurrency,
        exchange_rate: safeExchangeRate,
        sale_mode: saleMode,
        advance_amount: 0,
        items,
        metadata: {
          ui_module: 'pos/sales',
          created_by_name: activeUserName,
        },
      })

      if (!result?.sale_id) {
        throw new Error('No se pudo obtener el identificador de la venta creada')
      }

      if (printInvoiceOnSale) {
        printMockInvoice({
          invoiceNumber: result.sale_id,
          customerName: customerName || 'Cliente mostrador',
          branchName: mockBranches.find((branch) => branch.id === activeBranchId)?.name || activeBranchId,
          cashierName: activeUserName,
          paymentMethod: PAYMENT_METHODS.find((method) => method.id === selectedPayment)?.label || selectedPayment,
          currency: paymentCurrency,
          total: amountToCharge,
          lines: cart.map((item) => ({
            name: item.name,
            quantity: item.quantity,
            unitPrice: item.unit_price,
          })),
        })
      }

      setCart([])
      await reloadPOSData(branchId)
      setFeedback(`Venta registrada correctamente: ${result.sale_id}`)
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'No se pudo procesar la venta')
    } finally {
      setIsSubmitting(false)
    }
  }

  const approveQueuedSale = async (queueId: string) => {
    setError(null)
    setFeedback(null)
    setIsSubmitting(true)

    try {
      const result = await posService.approveQueuedSale({ queue_id: queueId })
      await reloadPOSData(activeBranchId)
      setFeedback(`Venta en cola aprobada. Venta creada: ${result?.sale_id || 'N/A'}`)
    } catch (approveError) {
      setError(approveError instanceof Error ? approveError.message : 'No se pudo aprobar la venta en cola')
    } finally {
      setIsSubmitting(false)
    }
  }

  const rejectQueuedSale = async (queueId: string) => {
    setError(null)
    setFeedback(null)
    setIsSubmitting(true)

    try {
      await posService.rejectQueuedSale({ queue_id: queueId, reason: 'Rechazada desde POS' })
      await reloadPOSData(activeBranchId)
      setFeedback('Venta en cola rechazada correctamente.')
    } catch (rejectError) {
      setError(rejectError instanceof Error ? rejectError.message : 'No se pudo rechazar la venta en cola')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <PageHeader title="Punto de Venta" description="Ventas por sucursal con validación de caja abierta y cola para solo lectura" />

        <Card>
          <CardContent className="pt-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="flex items-center gap-3">
              <ShieldCheck className={`h-5 w-5 ${canCompleteSale ? 'text-emerald-500' : canQueueSale ? 'text-amber-500' : 'text-muted-foreground'}`} />
              <div>
                <p className="text-sm font-semibold">Rol activo: {activeRole}</p>
                <p className="text-xs text-muted-foreground">
                  {canCompleteSale
                    ? 'Puede completar ventas y aprobar cola.'
                    : canQueueSale
                    ? 'Solo puede encolar ventas para aprobación.'
                    : 'No puede confirmar ventas.'}
                </p>
              </div>
            </div>
            <div className="text-xs text-muted-foreground rounded-lg border border-border/60 bg-muted/20 px-3 py-2">
              Usuario: {activeUserName} | Sucursal: {activeBranchId}
            </div>
          </CardContent>
        </Card>

        {error ? <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">{error}</div> : null}
        {feedback ? <div className="rounded-lg border border-primary/30 bg-primary/10 p-3 text-sm text-primary">{feedback}</div> : null}

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          <section className="xl:col-span-3 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Productos de la sucursal</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative max-w-xl">
                  <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    className="pl-9"
                    placeholder="Buscar por nombre o código"
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                  />
                </div>

                {isLoading ? (
                  <p className="text-sm text-muted-foreground">Cargando catálogo...</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4">
                    {filteredCatalog.map((product) => (
                      <article key={product.part_id} className="rounded-xl border border-border/70 bg-card/70 p-3 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-semibold line-clamp-2">{product.name}</p>
                            <p className="text-xs text-muted-foreground">{product.code}</p>
                          </div>
                          <Badge variant="outline">Stock {Number(product.stock || 0)}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{product.category}</p>
                        <div className="flex items-end justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground">Precio</p>
                            <p className="text-lg font-bold text-primary">Bs {Number(product.price || 0).toFixed(2)}</p>
                          </div>
                          <Button size="sm" onClick={() => addToCart(product)} disabled={Number(product.stock || 0) <= 0}>
                            <Plus className="h-4 w-4 mr-1" /> Agregar
                          </Button>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </section>

          <aside className="xl:col-span-1">
            <Card className="xl:sticky xl:top-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><ShoppingCart className="h-5 w-5 text-primary" />Carrito</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">Cliente</p>
                  <Input value={customerName} onChange={(event) => setCustomerName(event.target.value)} placeholder="Nombre cliente" />
                </div>

                {cart.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Carrito vacío</p>
                ) : (
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {cart.map((item) => (
                      <div key={item.id} className="rounded-lg border border-border/70 p-2 space-y-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-sm font-semibold">{item.name}</p>
                            <p className="text-xs text-muted-foreground">{item.code}</p>
                          </div>
                          <Button variant="ghost" size="icon" onClick={() => removeFromCart(item.part_id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <Input type="number" min={1} value={item.quantity} onChange={(event) => updateCartQuantity(item.part_id, event.target.value)} />
                          {canCompleteSale ? (
                            <Input type="number" step="0.01" min={0} value={item.unit_price} onBlur={(event) => updateCartPrice(item.part_id, event.target.value)} />
                          ) : (
                            <div className="h-10 rounded-md border border-border/70 bg-muted/20 px-3 py-2 text-sm">Bs {item.unit_price.toFixed(2)}</div>
                          )}
                        </div>
                        <p className="text-sm font-semibold text-primary">Bs {(item.quantity * item.unit_price).toFixed(2)}</p>
                      </div>
                    ))}
                  </div>
                )}

                <div className="border-t border-border pt-3">
                  <p className="text-xs text-muted-foreground">Total BOB</p>
                  <p className="text-2xl font-bold text-primary">Bs {cartTotalBob.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">USD: ${cartTotalUsd.toFixed(2)} (TC {safeExchangeRate.toFixed(2)})</p>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-semibold">Moneda</p>
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant={paymentCurrency === 'BOB' ? 'default' : 'outline'} onClick={() => setPaymentCurrency('BOB')}>BOB</Button>
                    <Button variant={paymentCurrency === 'USD' ? 'default' : 'outline'} onClick={() => setPaymentCurrency('USD')}>USD</Button>
                  </div>
                  <p className="text-xs text-muted-foreground">Cobrar: {paymentCurrency === 'USD' ? `$${amountToCharge.toFixed(2)}` : `Bs ${amountToCharge.toFixed(2)}`}</p>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-semibold">Método de pago</p>
                  {PAYMENT_METHODS.map((method) => (
                    <Button key={method.id} variant={selectedPayment === method.id ? 'default' : 'outline'} className="w-full justify-start" onClick={() => setSelectedPayment(method.id)}>
                      <method.icon className="h-4 w-4 mr-2" /> {method.label}
                    </Button>
                  ))}
                </div>

                <label className="flex items-center gap-2 text-xs text-muted-foreground">
                  <input type="checkbox" checked={printInvoiceOnSale} onChange={(event) => setPrintInvoiceOnSale(event.target.checked)} />
                  Imprimir comprobante al completar
                </label>

                <Button className="w-full" onClick={completeOrQueueSale} disabled={isSubmitting || (!canCompleteSale && !canQueueSale)}>
                  {canQueueSale ? 'Enviar venta a cola' : 'Completar venta'}
                </Button>
              </CardContent>
            </Card>
          </aside>
        </div>

        {canApproveQueue ? (
          <Card>
            <CardHeader>
              <CardTitle>Ventas en cola</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {queuedSales.length === 0 ? (
                <p className="text-sm text-muted-foreground">No hay ventas pendientes de aprobación.</p>
              ) : (
                queuedSales.map((queue) => (
                  <div key={queue.queue_id} className="rounded-lg border border-border/70 bg-muted/20 p-3 space-y-3">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold">{queue.queue_id}</p>
                        <p className="text-xs text-muted-foreground">Creada por rol {queue.created_by_role}</p>
                        <p className="text-xs text-muted-foreground">Cliente: {queue.customer_name || 'Mostrador'}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-primary">Bs {Number(queue.total_amount_bob || 0).toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">{queue.payment_method.toUpperCase()}</p>
                      </div>
                    </div>

                    <div className="rounded-md border border-border/60 bg-background/40 p-2 space-y-1">
                      {queue.lines.map((line) => (
                        <div key={line.id} className="flex items-center justify-between text-xs">
                          <span>{line.part_name} x {Number(line.quantity || 0)}</span>
                          <span>Bs {Number(line.line_total || 0).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => approveQueuedSale(queue.queue_id)} disabled={isSubmitting}>
                        <CheckCircle2 className="h-4 w-4 mr-2" /> Aprobar
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => rejectQueuedSale(queue.queue_id)} disabled={isSubmitting}>
                        Rechazar
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        ) : null}
      </div>
    </MainLayout>
  )
}
