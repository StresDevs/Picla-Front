'use client'

import { useEffect, useMemo, useState } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { PageHeader } from '@/components/common/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Search, ShoppingCart, Plus, Trash2, ShieldCheck, CheckCircle2, DollarSign, CreditCard, QrCode } from 'lucide-react'
import {
  ACTIVE_ROLE_EVENT,
  canRoleCompleteSale,
  getActiveUserContext,
  getAppSettings,
  type AppUserRole,
} from '@/lib/mock/runtime-store'
import { mockBranches, mockCustomers } from '@/lib/mock/data'
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

type MockCustomer = (typeof mockCustomers)[number]

const PAYMENT_METHODS = [
  { id: 'cash', label: 'Efectivo', icon: DollarSign },
  { id: 'card', label: 'Tarjeta', icon: CreditCard },
  { id: 'qr', label: 'QR/Transferencia', icon: QrCode },
] as const

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function normalizeBranchId(value?: string | null) {
  const raw = (value || '').trim()
  return UUID_PATTERN.test(raw) ? raw : null
}

function toFriendlySaleError(rawMessage: string) {
  const normalized = rawMessage.toLowerCase()

  if (normalized.includes('a cash session must be open before creating sales')) {
    return 'No hay caja abierta en esta sucursal. Abre caja en el modulo Caja antes de completar la venta.'
  }

  if (normalized.includes('insufficient stock for product')) {
    return 'No hay stock suficiente para uno o mas productos del carrito.'
  }

  if (normalized.includes('no inventory row found for product')) {
    return 'Uno o mas productos no tienen registro de inventario en esta sucursal. Contacta a administracion.'
  }

  if (normalized.includes('only admin, manager or employee can create direct sales')) {
    return 'Tu rol actual no tiene permiso para completar ventas directas.'
  }

  if (normalized.includes('no active authenticated session')) {
    return 'Tu sesion expiro. Vuelve a iniciar sesion para continuar.'
  }

  if (normalized.includes('cannot operate branch')) {
    return 'La sucursal activa no coincide con la sucursal asignada a tu usuario.'
  }

  return rawMessage
}

function extractErrorMessage(error: unknown, fallback: string) {
  if (error && typeof error === 'object') {
    const candidate = error as {
      message?: unknown
      details?: unknown
      hint?: unknown
      code?: unknown
    }

    const message = typeof candidate.message === 'string' ? candidate.message.trim() : ''
    const details = typeof candidate.details === 'string' ? candidate.details.trim() : ''
    const hint = typeof candidate.hint === 'string' ? candidate.hint.trim() : ''
    const code = typeof candidate.code === 'string' ? candidate.code.trim() : ''

    const parts = [message, details, hint].filter((part) => part.length > 0)
    if (parts.length > 0) {
      return toFriendlySaleError(parts.join(' | '))
    }

    if (code.length > 0) {
      return toFriendlySaleError(code)
    }
  }

  if (error instanceof Error && error.message) return toFriendlySaleError(error.message)
  return fallback
}

export default function POSSalesPage() {
  const [catalog, setCatalog] = useState<POSCatalogItem[]>([])
  const [queuedSales, setQueuedSales] = useState<POSQueuedSale[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [searchTerm, setSearchTerm] = useState('')
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
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)
  const [customerSearchTerm, setCustomerSearchTerm] = useState('')
  const [selectedCustomerId, setSelectedCustomerId] = useState('')
  const [anonymousSale, setAnonymousSale] = useState(true)
  const [expandedCartItemId, setExpandedCartItemId] = useState<string | null>(null)

  const canCompleteSale = canRoleCompleteSale(activeRole)
  const canQueueSale = activeRole === 'read_only'
  const canApproveQueue = activeRole === 'admin' || activeRole === 'manager' || activeRole === 'employee'

  const branchCustomers = useMemo(() => {
    const scopedCustomers = mockCustomers.filter(
      (customer) => !activeBranchId || customer.branch_id === activeBranchId,
    )

    return scopedCustomers.length > 0 ? scopedCustomers : mockCustomers
  }, [activeBranchId])

  const filteredCustomers = useMemo(() => {
    const term = customerSearchTerm.trim().toLowerCase()

    if (!term) return branchCustomers

    return branchCustomers.filter((customer) => {
      return [customer.full_name, customer.nit_ci, customer.phone, customer.email]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(term))
    })
  }, [branchCustomers, customerSearchTerm])

  const selectedCustomer = useMemo<MockCustomer | null>(() => {
    if (anonymousSale || !selectedCustomerId) return null
    return branchCustomers.find((customer) => customer.id === selectedCustomerId) ?? null
  }, [anonymousSale, branchCustomers, selectedCustomerId])

  const resolvedCustomerName = anonymousSale ? 'Cliente anónimo' : selectedCustomer?.full_name || 'Cliente mostrador'

  const reloadPOSData = async (branchId?: string | null) => {
    const targetBranch = normalizeBranchId(branchId) ?? normalizeBranchId(getActiveUserContext().branch_id)
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
      setError(extractErrorMessage(loadError, 'No se pudo cargar el módulo de ventas'))
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

  useEffect(() => {
    if (anonymousSale) return

    if (branchCustomers.length > 0 && !selectedCustomerId) {
      setSelectedCustomerId(branchCustomers[0].id)
    }
  }, [anonymousSale, branchCustomers, selectedCustomerId])

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
      return false
    }

    if (!anonymousSale && !selectedCustomer) {
      setError('Selecciona un cliente o activa la venta anónima antes de confirmar.')
      return false
    }

    setError(null)
    setFeedback(null)
    setIsSubmitting(true)

    try {
      const items = buildSaleItemsPayload()
      const branchId = normalizeBranchId(activeBranchId)
      const saleMode = 'immediate' as const

      if (canQueueSale) {
        const queueId = await posService.enqueueSale({
          branch_id: branchId,
          customer_name: resolvedCustomerName,
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
        return true
      }

      if (!canCompleteSale) {
        setFeedback('Tu rol no tiene permiso para completar ventas.')
        return
      }

      const result = await posService.createSale({
        branch_id: branchId,
        customer_name: resolvedCustomerName,
        payment_method: selectedPayment,
        payment_currency: paymentCurrency,
        exchange_rate: safeExchangeRate,
        sale_mode: saleMode,
        advance_amount: 0,
        items,
        metadata: {
          ui_module: 'pos/sales',
          created_by_name: activeUserName,
          customer_id: selectedCustomer?.id ?? null,
          customer_name: selectedCustomer?.full_name ?? resolvedCustomerName,
          customer_is_anonymous: anonymousSale,
        },
      })

      if (!result?.sale_id) {
        throw new Error('No se pudo obtener el identificador de la venta creada')
      }

      if (printInvoiceOnSale) {
        printMockInvoice({
          invoiceNumber: result.sale_id,
          customerName: resolvedCustomerName,
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
      return true
    } catch (submitError) {
      setError(extractErrorMessage(submitError, 'No se pudo procesar la venta'))
    } finally {
      setIsSubmitting(false)
    }

    return false
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
      setError(extractErrorMessage(approveError, 'No se pudo aprobar la venta en cola'))
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
      setError(extractErrorMessage(rejectError, 'No se pudo rechazar la venta en cola'))
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

        <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
          <DialogContent className="!w-[min(99vw,1600px)] !max-w-none sm:!max-w-none p-0 overflow-hidden max-h-[95vh]">
            <div className="flex max-h-[95vh] flex-col">
              <DialogHeader className="border-b border-border/60 bg-gradient-to-r from-background to-muted/20 px-6 py-5 text-left sm:px-8">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-1">
                    <DialogTitle className="text-2xl">Cobrar venta</DialogTitle>
                    <DialogDescription className="max-w-2xl text-sm sm:text-base">
                      Confirma los productos, selecciona el cliente y define el método de pago antes de cerrar la venta.
                    </DialogDescription>
                  </div>
                  <div className="grid grid-cols-2 gap-3 lg:min-w-[280px]">
                    <div className="rounded-xl border border-border/70 bg-background/70 px-4 py-3">
                      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Cliente</p>
                      <p className="mt-1 truncate text-sm font-semibold">{resolvedCustomerName}</p>
                    </div>
                    <div className="rounded-xl border border-border/70 bg-background/70 px-4 py-3">
                      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Total</p>
                      <p className="mt-1 truncate text-sm font-semibold text-primary">
                        {paymentCurrency === 'USD' ? `$${amountToCharge.toFixed(2)}` : `Bs ${amountToCharge.toFixed(2)}`}
                      </p>
                    </div>
                  </div>
                </div>
              </DialogHeader>

              <div className="grid flex-1 min-h-0 grid-cols-1 gap-0 overflow-y-auto lg:grid-cols-[minmax(0,1.12fr)_minmax(420px,0.88fr)] lg:overflow-hidden">
                <div className="space-y-5 px-6 py-6 sm:px-8 lg:overflow-y-auto">
                  <div className="rounded-3xl border border-border/70 bg-muted/20 p-5 shadow-sm">
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div>
                        <p className="text-base font-semibold">Cliente</p>
                        <p className="text-sm text-muted-foreground">
                          Busca y selecciona a quién se le registrará la venta.
                        </p>
                      </div>
                      <div className="flex items-center justify-between gap-5 rounded-2xl bg-white/[0.03] px-4 py-4 ring-1 ring-white/8">
                        <div className="min-w-0 space-y-1.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-medium tracking-tight text-foreground">Venta anónima</p>
                            <span
                              className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] ${anonymousSale ? 'bg-emerald-500/12 text-emerald-300' : 'bg-white/5 text-muted-foreground'}`}
                            >
                              {anonymousSale ? 'On' : 'Off'}
                            </span>
                          </div>
                          <p className="max-w-md text-xs leading-relaxed text-muted-foreground">
                            {anonymousSale
                              ? 'Se guardará sin cliente asociado.'
                              : 'Actívala solo si quieres omitir el cliente.'}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-3">
                          <span className="text-[11px] font-medium text-muted-foreground">
                            {anonymousSale ? 'Anónimo' : 'Cliente'}
                          </span>
                          <button
                            type="button"
                            role="switch"
                            aria-checked={anonymousSale}
                            onClick={() => setAnonymousSale((prev) => !prev)}
                            className={`group relative inline-flex h-8 w-[74px] items-center overflow-hidden rounded-full border px-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 motion-reduce:transition-none ${
                              anonymousSale
                                ? 'border-emerald-300/45 bg-emerald-500/20'
                                : 'border-white/20 bg-white/8'
                            }`}
                          >
                            <span
                              aria-hidden="true"
                              className={`pointer-events-none absolute top-1 left-1 h-6 w-9 rounded-full transform-gpu transition-transform duration-160 ease-out motion-reduce:transition-none ${
                                anonymousSale ? 'translate-x-[30px] bg-emerald-300' : 'translate-x-0 bg-zinc-200/95'
                              }`}
                            />
                            <span
                              className={`relative z-10 w-full px-1 text-[10px] font-semibold uppercase tracking-[0.14em] transition-colors ${
                                anonymousSale ? 'text-emerald-100' : 'text-muted-foreground'
                              }`}
                            >
                              {anonymousSale ? 'ON' : 'OFF'}
                            </span>
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 space-y-4">
                      <Input
                        className="h-12 rounded-xl text-base"
                        placeholder="Buscar por nombre, CI/NIT, teléfono o correo"
                        value={customerSearchTerm}
                        onChange={(event) => setCustomerSearchTerm(event.target.value)}
                        disabled={anonymousSale}
                      />

                      {anonymousSale ? (
                        <div className="rounded-2xl border border-dashed border-border/70 bg-background/70 p-5 text-sm text-muted-foreground">
                          La venta se registrará como cliente anónimo.
                        </div>
                      ) : (
                        <div className="max-h-72 space-y-3 overflow-y-auto pr-1">
                          {filteredCustomers.length === 0 ? (
                            <div className="rounded-2xl border border-border/70 bg-background/70 p-5 text-sm text-muted-foreground">
                              No se encontraron clientes con ese criterio.
                            </div>
                          ) : (
                            filteredCustomers.map((customer) => {
                              const isSelected = customer.id === selectedCustomerId

                              return (
                                <button
                                  key={customer.id}
                                  type="button"
                                  onClick={() => setSelectedCustomerId(customer.id)}
                                  className={`w-full rounded-2xl border p-4 text-left transition-colors duration-150 ${
                                    isSelected
                                      ? 'border-primary/60 bg-primary/10'
                                      : 'border-border/70 bg-background/70 hover:border-primary/40 hover:bg-muted/20'
                                  }`}
                                >
                                  <div className="flex items-start justify-between gap-4">
                                    <div className="space-y-1">
                                      <p className="text-base font-semibold">{customer.full_name}</p>
                                      <p className="text-sm text-muted-foreground">
                                        CI/NIT: {customer.nit_ci} · {customer.phone || 'Sin teléfono'}
                                      </p>
                                      <p className="text-xs text-muted-foreground">{customer.email}</p>
                                    </div>
                                    {isSelected ? <Badge className="shrink-0">Seleccionado</Badge> : null}
                                  </div>
                                </button>
                              )
                            })
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="rounded-3xl border border-border/70 bg-muted/20 p-5 shadow-sm">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-base font-semibold">Método de pago</p>
                        <p className="text-sm text-muted-foreground">Selecciona cómo se registrará el cobro.</p>
                      </div>
                      <Badge variant="outline" className="w-fit">{selectedPayment.toUpperCase()}</Badge>
                    </div>

                    <Tabs value={selectedPayment} onValueChange={(value) => setSelectedPayment(value as 'cash' | 'card' | 'qr')} className="mt-5">
                      <TabsList className="grid h-auto w-full grid-cols-1 gap-2 rounded-2xl p-2 sm:grid-cols-3">
                        {PAYMENT_METHODS.map((method) => (
                          <TabsTrigger key={method.id} value={method.id} className="h-12 justify-center gap-2 rounded-xl py-3 text-sm">
                            <method.icon className="h-4 w-4" />
                            {method.label}
                          </TabsTrigger>
                        ))}
                      </TabsList>

                      {PAYMENT_METHODS.map((method) => (
                        <TabsContent key={method.id} value={method.id} className="mt-4 rounded-2xl border border-border/60 bg-background/70 p-5">
                          <div className="flex items-center gap-2 text-sm font-medium">
                            <method.icon className="h-4 w-4 text-primary" />
                            {method.label}
                          </div>
                          <p className="mt-2 text-sm text-muted-foreground">
                            {method.id === 'cash'
                              ? 'Registra el cobro con efectivo y valida el monto recibido.'
                              : method.id === 'card'
                              ? 'Usa este modo para pagos con tarjeta.'
                              : 'Usa este modo para pagos por QR o transferencia.'}
                          </p>
                        </TabsContent>
                      ))}
                    </Tabs>
                  </div>
                </div>

                <div className="border-t border-border/60 bg-muted/10 px-6 py-6 sm:px-8 lg:border-l lg:border-t-0 lg:overflow-y-auto">
                  <div className="space-y-5">
                    <div className="rounded-3xl border border-border/70 bg-card/95 p-5 shadow-sm">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-base font-semibold">Resumen de la venta</p>
                        <Badge variant="outline">{cart.length} productos</Badge>
                      </div>
                      <div className="mt-4 space-y-3 text-sm">
                        {cart.map((item) => (
                          <div key={`checkout-${item.part_id}`} className="flex items-start justify-between gap-4 rounded-2xl bg-muted/40 px-4 py-3">
                            <div className="min-w-0">
                              <p className="font-medium leading-tight">{item.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {item.quantity} x Bs {item.unit_price.toFixed(2)}
                              </p>
                            </div>
                            <p className="shrink-0 font-semibold text-primary">Bs {(item.quantity * item.unit_price).toFixed(2)}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                      <div className="rounded-3xl border border-border/70 bg-card/95 p-5 shadow-sm">
                        <div className="space-y-3 text-sm">
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-muted-foreground">Cliente</span>
                            <span className="text-right font-medium">{resolvedCustomerName}</span>
                          </div>
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-muted-foreground">Pago</span>
                            <span className="font-medium">{PAYMENT_METHODS.find((method) => method.id === selectedPayment)?.label}</span>
                          </div>
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-muted-foreground">Moneda</span>
                            <span className="font-medium">{paymentCurrency}</span>
                          </div>
                          <div className="border-t border-border/60 pt-3 flex items-center justify-between gap-3">
                            <span className="text-muted-foreground">Total</span>
                            <span className="text-2xl font-bold text-primary">
                              {paymentCurrency === 'USD' ? `$${amountToCharge.toFixed(2)}` : `Bs ${amountToCharge.toFixed(2)}`}
                            </span>
                          </div>
                        </div>
                      </div>

                      {selectedPayment === 'cash' ? (
                        <div className="rounded-3xl border border-border/70 bg-card/95 p-5 shadow-sm">
                          <p className="text-base font-semibold">Monto recibido</p>
                          <p className="mt-2 text-sm text-muted-foreground">
                            El importe se mantiene visible para cuadrar efectivo antes de confirmar.
                          </p>
                          <div className="mt-4 rounded-2xl border border-border/70 bg-background/80 px-4 py-4 text-base font-semibold">
                            Bs {amountToCharge.toFixed(2)}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <DialogFooter className="mt-6 border-t border-border/60 pt-4">
                    <Button variant="outline" onClick={() => setIsCheckoutOpen(false)} disabled={isSubmitting} className="h-11 px-5">
                      Volver
                    </Button>
                    <Button
                      onClick={async () => {
                        const success = await completeOrQueueSale()
                        if (success) setIsCheckoutOpen(false)
                      }}
                      disabled={isSubmitting || (!canCompleteSale && !canQueueSale)}
                      className="h-11 px-5"
                    >
                      {canQueueSale ? 'Enviar venta a cola' : 'Confirmar venta'}
                    </Button>
                  </DialogFooter>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px] items-start">
          <section className="space-y-4">
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

          <aside className="xl:sticky xl:top-6 xl:self-start">
            <Card className="flex max-h-[calc(100vh-3rem)] flex-col overflow-hidden border-border/70 bg-card/95 shadow-xl shadow-black/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><ShoppingCart className="h-5 w-5 text-primary" />Carrito</CardTitle>
              </CardHeader>
              <CardContent className="flex min-h-0 flex-1 flex-col space-y-4">
                <div className="rounded-2xl border border-border/70 bg-muted/20 p-3">
                  <p className="text-xs text-muted-foreground">Cliente de la venta</p>
                  <p className="font-semibold">{resolvedCustomerName}</p>
                  <p className="text-xs text-muted-foreground">
                    {anonymousSale ? 'Venta anónima' : selectedCustomer ? `${selectedCustomer.phone || 'Sin teléfono'} · ${selectedCustomer.email}` : 'Cliente pendiente de selección'}
                  </p>
                </div>

                {cart.length === 0 ? (
                  <div className="flex flex-1 items-center justify-center rounded-2xl border border-dashed border-border/70 bg-background/40 px-4 py-10 text-center">
                    <div>
                      <ShoppingCart className="mx-auto h-10 w-10 text-muted-foreground/70" />
                      <p className="mt-3 text-sm font-medium">Carrito vacío</p>
                      <p className="text-xs text-muted-foreground">Escanea o selecciona productos para empezar.</p>
                    </div>
                  </div>
                ) : (
                  <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
                    {cart.map((item) => (
                      <div
                        key={item.id}
                        className={`rounded-2xl border p-3 transition-colors duration-150 ${
                          expandedCartItemId === item.id
                            ? 'border-primary/40 bg-primary/5'
                            : 'border-border/70 bg-background/60 hover:border-primary/30 hover:bg-muted/10'
                        }`}
                      >
                        <div
                          role="button"
                          tabIndex={0}
                          onClick={() => setExpandedCartItemId((current) => (current === item.id ? null : item.id))}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                              event.preventDefault()
                              setExpandedCartItemId((current) => (current === item.id ? null : item.id))
                            }
                          }}
                          className="w-full text-left"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-sm font-semibold">{item.name}</p>
                              <p className="text-xs text-muted-foreground">{item.code}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-muted-foreground">Cantidad</p>
                              <p className="text-base font-semibold">{item.quantity}</p>
                            </div>
                          </div>
                          <div className="mt-2 flex items-center justify-between">
                            <p className="text-base font-semibold text-primary">Bs {(item.quantity * item.unit_price).toFixed(2)}</p>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={(event) => {
                                event.stopPropagation()
                                removeFromCart(item.part_id)
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        {expandedCartItemId === item.id ? (
                          <div className="mt-3 grid grid-cols-2 gap-2 border-t border-border/60 pt-3">
                            <div>
                              <p className="text-xs text-muted-foreground">Cantidad</p>
                              <Input type="number" min={1} value={item.quantity} onChange={(event) => updateCartQuantity(item.part_id, event.target.value)} />
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Precio unitario</p>
                              {canCompleteSale ? (
                                <Input
                                  type="number"
                                  step="0.01"
                                  min={0}
                                  value={item.unit_price}
                                  onChange={(event) => updateCartPrice(item.part_id, event.target.value)}
                                  onBlur={(event) => updateCartPrice(item.part_id, event.target.value)}
                                />
                              ) : (
                                <div className="h-10 rounded-md border border-border/70 bg-muted/20 px-3 py-2 text-sm">Bs {item.unit_price.toFixed(2)}</div>
                              )}
                            </div>
                            <div className="col-span-2 flex items-center justify-between rounded-xl bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                              <span>Producto: {item.code}</span>
                              <span>Subtotal: Bs {(item.quantity * item.unit_price).toFixed(2)}</span>
                            </div>
                          </div>
                        ) : null}
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

                <Button className="w-full" onClick={() => setIsCheckoutOpen(true)} disabled={isSubmitting || (!canCompleteSale && !canQueueSale) || cart.length === 0}>
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
