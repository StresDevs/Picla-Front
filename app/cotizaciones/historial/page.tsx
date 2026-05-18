'use client'

import { useEffect, useMemo, useState } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { PageHeader } from '@/components/common/page-header'
import { QuotationsSubnav } from '@/components/modules/quotations/quotations-subnav'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CreditCard, DollarSign, QrCode } from 'lucide-react'
import {
  ACTIVE_ROLE_EVENT,
  getActiveUserContext,
  getAppSettings,
  type AppUserRole,
} from '@/lib/mock/runtime-store'
import { printMockInvoice } from '@/lib/mock/invoice'
import { quotationsService, type QuotationRecord } from '@/lib/supabase/quotations'
import { posService } from '@/lib/supabase/pos'

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

function isQuotationActiveAndValid(quotation: QuotationRecord) {
  if (quotation.status !== 'active') return false
  return new Date(quotation.expires_at).getTime() >= Date.now()
}

function isQuotationExpired(quotation: QuotationRecord) {
  return quotation.status === 'active' && !isQuotationActiveAndValid(quotation)
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
      return parts.join(' | ')
    }

    if (code.length > 0) {
      return code
    }
  }

  if (error instanceof Error && error.message) return error.message
  return fallback
}

export default function QuotationsHistoryPage() {
  const [quotations, setQuotations] = useState<QuotationRecord[]>([])
  const [selectedQuotation, setSelectedQuotation] = useState<QuotationRecord | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'qr'>('cash')
  const [paymentCurrency, setPaymentCurrency] = useState<'BOB' | 'USD'>(() => getAppSettings().default_currency)
  const [exchangeRate, setExchangeRate] = useState(() => getAppSettings().usd_to_bob_rate)
  const [printInvoice, setPrintInvoice] = useState(true)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeRole, setActiveRole] = useState<AppUserRole>(() => getActiveUserContext().role)
  const [activeUserName, setActiveUserName] = useState(() => getActiveUserContext().user_name)
  const [activeBranchId, setActiveBranchId] = useState(() => getActiveUserContext().branch_id)

  const canConvertQuotation = activeRole === 'admin' || activeRole === 'manager'

  const refresh = async (branchId?: string | null) => {
    setIsLoading(true)
    setError(null)

    try {
      const rows = await quotationsService.getList({ branch_id: normalizeBranchId(branchId ?? activeBranchId) })
      setQuotations(rows)
    } catch (loadError) {
      setError(extractErrorMessage(loadError, 'No se pudo cargar el historial de cotizaciones'))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const syncContext = () => {
      const context = getActiveUserContext()
      setActiveRole(context.role)
      setActiveUserName(context.user_name)
      setActiveBranchId(context.branch_id)
      void refresh(context.branch_id)
    }

    syncContext()
    window.addEventListener(ACTIVE_ROLE_EVENT, syncContext)
    window.addEventListener('focus', syncContext)

    return () => {
      window.removeEventListener(ACTIVE_ROLE_EVENT, syncContext)
      window.removeEventListener('focus', syncContext)
    }
  }, [])

  const totals = useMemo(() => {
    const active = quotations.filter((item) => isQuotationActiveAndValid(item)).length
    const expired = quotations.filter((item) => isQuotationExpired(item)).length
    const converted = quotations.filter((item) => item.status === 'converted').length
    const cancelled = quotations.filter((item) => item.status === 'cancelled').length

    return {
      active,
      expired,
      converted,
      cancelled,
      amount: quotations.reduce((sum, item) => sum + Number(item.total_amount || 0), 0),
    }
  }, [quotations])

  const handleCancel = async (quotation: QuotationRecord) => {
    setFeedback(null)
    setError(null)
    setIsSubmitting(true)

    try {
      await quotationsService.cancel({ quotation_id: quotation.quotation_id, reason: 'Anulada desde historial' })
      await refresh(activeBranchId)
      setFeedback(`Cotizacion de ${quotation.customer_name} anulada correctamente.`)
    } catch (cancelError) {
      setError(extractErrorMessage(cancelError, 'No se pudo anular la cotizacion'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const openConvertDialog = (quotation: QuotationRecord) => {
    if (!canConvertQuotation) {
      setError('Solo administradores y encargados pueden convertir una cotizacion en venta.')
      return
    }

    setError(null)
    setSelectedQuotation(quotation)
    setIsDialogOpen(true)
    setFeedback(null)
  }

  const handleConvert = async () => {
    if (!selectedQuotation) return

    const safeExchangeRate = exchangeRate > 0 ? exchangeRate : 1
    const amountToPay = paymentCurrency === 'USD'
      ? Number((Number(selectedQuotation.total_amount || 0) / safeExchangeRate).toFixed(2))
      : Number(selectedQuotation.total_amount || 0)

    setError(null)
    setFeedback(null)
    setIsSubmitting(true)

    try {
      const result = await quotationsService.convertToSale({
        quotation_id: selectedQuotation.quotation_id,
        payment_method: paymentMethod,
        payment_currency: paymentCurrency,
        exchange_rate: safeExchangeRate,
        sale_mode: 'immediate',
        advance_amount: 0,
        metadata: {
          ui_module: 'quotations/history',
          converted_by_name: activeUserName,
        },
      })

      if (!result?.sale_id) {
        throw new Error('No se obtuvo el identificador de la venta creada')
      }

      let receiptNumber = 'N0'
      try {
        receiptNumber = await posService.getSaleReceiptNumber(result.sale_id, selectedQuotation.branch_id)
      } catch {
        receiptNumber = 'N0'
      }

      if (printInvoice) {
        printMockInvoice({
          invoiceNumber: receiptNumber,
          customerName: selectedQuotation.customer_name,
          branchName: selectedQuotation.branch_name,
          cashierName: activeUserName,
          paymentMethod: PAYMENT_METHODS.find((item) => item.id === paymentMethod)?.label || paymentMethod,
          currency: paymentCurrency,
          total: amountToPay,
          lines: selectedQuotation.items.map((item) => ({
            name: item.part_name,
            quantity: item.quantity,
            unitPrice: item.unit_price,
          })),
        })
      }

      await refresh(activeBranchId)
      setIsDialogOpen(false)
      setSelectedQuotation(null)
      setFeedback(`Cotizacion de ${selectedQuotation.customer_name} convertida a venta ${receiptNumber}.`)
    } catch (convertError) {
      setError(extractErrorMessage(convertError, 'No se pudo convertir la cotizacion a venta'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const amountToPay = selectedQuotation
    ? paymentCurrency === 'USD'
      ? Number(selectedQuotation.total_amount || 0) / (exchangeRate > 0 ? exchangeRate : 1)
      : Number(selectedQuotation.total_amount || 0)
    : 0

  return (
    <MainLayout>
      <div className="space-y-6">
        <PageHeader
          title="Historial de Cotizaciones"
          description="Consulta cotizaciones registradas, anúlalas o conviértelas en venta"
        />
        <QuotationsSubnav />

        {error ? (
          <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">{error}</div>
        ) : null}
        {feedback ? (
          <div className="rounded-lg border border-primary/30 bg-primary/10 p-3 text-sm text-primary">{feedback}</div>
        ) : null}

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Activas</p><p className="mt-1 text-3xl font-semibold text-foreground">{totals.active}</p></CardContent></Card>
          <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Vencidas</p><p className="mt-1 text-3xl font-semibold text-amber-400">{totals.expired}</p></CardContent></Card>
          <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Convertidas</p><p className="mt-1 text-3xl font-semibold text-foreground">{totals.converted}</p></CardContent></Card>
          <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Anuladas</p><p className="mt-1 text-3xl font-semibold text-foreground">{totals.cancelled}</p></CardContent></Card>
          <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Monto cotizado</p><p className="mt-1 text-3xl font-semibold text-primary">Bs {totals.amount.toFixed(2)}</p></CardContent></Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Cotizaciones registradas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              <p className="py-6 text-center text-sm text-muted-foreground">Cargando cotizaciones...</p>
            ) : quotations.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">No hay cotizaciones registradas.</p>
            ) : (
              quotations.map((quotation) => {
                const isActiveAndValid = isQuotationActiveAndValid(quotation)
                const isExpired = isQuotationExpired(quotation)

                return (
                <article key={quotation.quotation_id} className="rounded-xl border border-border/70 bg-card/70 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">Cotizacion - {quotation.customer_name}</p>
                      <p className="text-sm text-muted-foreground">
                        Sucursal: {quotation.branch_name} | Usuario: {quotation.quoted_by_name || 'Sin usuario'}
                      </p>
                      <p className="text-xs text-muted-foreground">{new Date(quotation.created_at).toLocaleString('es-BO')}</p>
                      <p className="text-xs text-muted-foreground">Vigente hasta: {new Date(quotation.expires_at).toLocaleDateString('es-BO')}</p>
                    </div>
                    <Badge
                      className={
                        isExpired
                          ? 'bg-amber-500/20 text-amber-400'
                          : quotation.status === 'active'
                          ? 'bg-secondary/20 text-secondary-foreground'
                          : quotation.status === 'converted'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-destructive/20 text-destructive'
                      }
                    >
                      {isExpired
                        ? 'Vencida'
                        : quotation.status === 'active'
                        ? 'Activa'
                        : quotation.status === 'converted'
                          ? 'Convertida'
                          : 'Anulada'}
                    </Badge>
                  </div>

                  <div className="mt-3 space-y-1 text-sm text-muted-foreground">
                    <p>{quotation.items.length} ítems</p>
                    <p className="font-semibold text-foreground">Total: Bs {Number(quotation.total_amount || 0).toFixed(2)}</p>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleCancel(quotation)}
                      disabled={!isActiveAndValid || isSubmitting}
                    >
                      Anular cotización
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => openConvertDialog(quotation)}
                      disabled={!isActiveAndValid || !canConvertQuotation || isSubmitting}
                    >
                      Convertir en venta
                    </Button>
                  </div>
                </article>
                )
              })
            )}
            {!canConvertQuotation ? (
              <p className="text-xs text-muted-foreground">Conversión a venta bloqueada: requiere rol admin o manager.</p>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="!w-[min(99vw,1600px)] !max-w-none sm:!max-w-none p-0 overflow-hidden max-h-[95vh]">
          {selectedQuotation ? (
            <div className="flex max-h-[95vh] flex-col">
              <DialogHeader className="border-b border-border/60 bg-gradient-to-r from-background to-muted/20 px-6 py-5 text-left sm:px-8">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-1">
                    <DialogTitle className="text-2xl">Cobrar venta</DialogTitle>
                    <DialogDescription className="max-w-2xl text-sm sm:text-base">
                      Conversión directa desde cotización. El cliente y los productos se respetan tal como fueron cotizados.
                    </DialogDescription>
                  </div>
                  <div className="grid grid-cols-2 gap-3 lg:min-w-[320px]">
                    <div className="rounded-xl border border-border/70 bg-background/70 px-4 py-3">
                      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Cliente</p>
                      <p className="mt-1 truncate text-sm font-semibold">{selectedQuotation.customer_name}</p>
                    </div>
                    <div className="rounded-xl border border-border/70 bg-background/70 px-4 py-3">
                      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Total</p>
                      <p className="mt-1 truncate text-sm font-semibold text-primary">
                        {paymentCurrency === 'USD' ? `$${amountToPay.toFixed(2)}` : `Bs ${amountToPay.toFixed(2)}`}
                      </p>
                    </div>
                  </div>
                </div>
              </DialogHeader>

              <div className="grid flex-1 min-h-0 grid-cols-1 gap-0 overflow-y-auto lg:grid-cols-[minmax(0,1.12fr)_minmax(420px,0.88fr)] lg:overflow-hidden">
                <div className="space-y-5 px-6 py-6 sm:px-8 lg:overflow-y-auto">
                  <div className="rounded-3xl border border-border/70 bg-muted/20 p-5 shadow-sm">
                    <div className="space-y-1">
                      <p className="text-base font-semibold">Cliente asignado</p>
                      <p className="text-sm text-muted-foreground">Esta venta usará el cliente de la cotización seleccionada.</p>
                    </div>

                    <div className="mt-4 rounded-2xl border border-primary/35 bg-primary/5 p-4">
                      <p className="text-base font-semibold text-primary">{selectedQuotation.customer_name}</p>
                      <p className="text-sm text-muted-foreground">CI/NIT: {selectedQuotation.customer_nit_ci || 'Sin registro'}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        Cotizacion de {selectedQuotation.customer_name} · Sucursal: {selectedQuotation.branch_name}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-3xl border border-border/70 bg-muted/20 p-5 shadow-sm">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-base font-semibold">Metodo de pago</p>
                        <p className="text-sm text-muted-foreground">Selecciona como se registrara el cobro.</p>
                      </div>
                      <Badge variant="outline" className="w-fit">{paymentMethod.toUpperCase()}</Badge>
                    </div>

                    <Tabs
                      value={paymentMethod}
                      onValueChange={(value) => setPaymentMethod(value as 'cash' | 'card' | 'qr')}
                      className="mt-5"
                    >
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
                        <Badge variant="outline">{selectedQuotation.items.length} productos</Badge>
                      </div>
                      <div className="mt-4 space-y-3 text-sm">
                        {selectedQuotation.items.map((item) => (
                          <div key={item.id} className="flex items-start justify-between gap-4 rounded-2xl bg-muted/40 px-4 py-3">
                            <div className="min-w-0">
                              <p className="font-medium leading-tight">{item.part_name}</p>
                              <p className="text-xs text-muted-foreground">
                                {item.quantity} x Bs {Number(item.unit_price || 0).toFixed(2)}
                              </p>
                            </div>
                            <p className="shrink-0 font-semibold text-primary">Bs {Number(item.line_total || 0).toFixed(2)}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                      <div className="rounded-3xl border border-border/70 bg-card/95 p-5 shadow-sm">
                        <div className="space-y-3 text-sm">
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-muted-foreground">Cliente</span>
                            <span className="text-right font-medium">{selectedQuotation.customer_name}</span>
                          </div>
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-muted-foreground">Pago</span>
                            <span className="font-medium">{PAYMENT_METHODS.find((method) => method.id === paymentMethod)?.label}</span>
                          </div>
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-muted-foreground">Moneda</span>
                            <span className="font-medium">{paymentCurrency}</span>
                          </div>
                          <div className="border-t border-border/60 pt-3 flex items-center justify-between gap-3">
                            <span className="text-muted-foreground">Total</span>
                            <span className="text-2xl font-bold text-primary">
                              {paymentCurrency === 'USD' ? `$${amountToPay.toFixed(2)}` : `Bs ${amountToPay.toFixed(2)}`}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-3xl border border-border/70 bg-card/95 p-5 shadow-sm space-y-3">
                        <p className="text-sm font-semibold">Moneda de cobro</p>
                        <div className="grid grid-cols-2 gap-2">
                          <Button variant={paymentCurrency === 'BOB' ? 'default' : 'outline'} onClick={() => setPaymentCurrency('BOB')}>BOB</Button>
                          <Button variant={paymentCurrency === 'USD' ? 'default' : 'outline'} onClick={() => setPaymentCurrency('USD')}>USD</Button>
                        </div>

                        {paymentCurrency === 'USD' ? (
                          <div className="space-y-2">
                            <p className="text-xs text-muted-foreground">Tipo de cambio</p>
                            <input
                              type="number"
                              min="0.01"
                              step="0.01"
                              className="h-10 w-full rounded-md border border-border bg-input px-3"
                              value={exchangeRate}
                              onChange={(event) => setExchangeRate(Number(event.target.value || 1))}
                            />
                          </div>
                        ) : null}

                        <label className="flex items-center gap-2 text-xs text-muted-foreground">
                          <input
                            type="checkbox"
                            checked={printInvoice}
                            onChange={(event) => setPrintInvoice(event.target.checked)}
                          />
                          Imprimir factura al confirmar
                        </label>
                      </div>
                    </div>
                  </div>

                  <DialogFooter className="mt-6 border-t border-border/60 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                      disabled={isSubmitting}
                      className="h-11 px-5"
                    >
                      Volver
                    </Button>
                    <Button onClick={() => void handleConvert()} disabled={isSubmitting} className="h-11 px-5">
                      {isSubmitting ? 'Procesando...' : 'Confirmar venta'}
                    </Button>
                  </DialogFooter>
                </div>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </MainLayout>
  )
}
