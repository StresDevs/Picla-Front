'use client'

import { useMemo, useState } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { PageHeader } from '@/components/common/page-header'
import { QuotationsSubnav } from '@/components/modules/quotations/quotations-subnav'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  cancelQuotation,
  convertQuotationToSale,
  getAppSettings,
  isQuotationActive,
  getQuotations,
  type QuotationRecord,
} from '@/lib/mock/runtime-store'
import { printMockInvoice } from '@/lib/mock/invoice'

const PAYMENT_METHODS = [
  { id: 'cash', label: 'Efectivo' },
  { id: 'qr', label: 'QR/Transferencia' },
  { id: 'credit', label: 'Crédito' },
] as const

export default function QuotationsHistoryPage() {
  const [quotations, setQuotations] = useState(() => getQuotations())
  const [selectedQuotation, setSelectedQuotation] = useState<QuotationRecord | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'qr' | 'credit'>('cash')
  const [paymentCurrency, setPaymentCurrency] = useState<'BOB' | 'USD'>(() => getAppSettings().default_currency)
  const [exchangeRate, setExchangeRate] = useState(() => getAppSettings().usd_to_bob_rate)
  const [printInvoice, setPrintInvoice] = useState(true)
  const [feedback, setFeedback] = useState<string | null>(null)

  const totals = useMemo(() => {
    const active = quotations.filter((item) => isQuotationActive(item)).length
    const expired = quotations.filter((item) => item.status === 'active' && !isQuotationActive(item)).length
    const converted = quotations.filter((item) => item.status === 'converted').length
    const cancelled = quotations.filter((item) => item.status === 'cancelled').length

    return {
      active,
      expired,
      converted,
      cancelled,
      amount: quotations.reduce((sum, item) => sum + item.total_amount, 0),
    }
  }, [quotations])

  const refresh = () => setQuotations(getQuotations())

  const handleCancel = (quotationId: string) => {
    setFeedback(null)
    const result = cancelQuotation(quotationId)
    if (!result.ok) {
      setFeedback(result.error)
      return
    }

    refresh()
    setFeedback(`Cotización ${result.quotation.id} anulada.`)
  }

  const openConvertDialog = (quotation: QuotationRecord) => {
    setSelectedQuotation(quotation)
    setIsDialogOpen(true)
    setFeedback(null)
  }

  const handleConvert = () => {
    if (!selectedQuotation) return

    const safeExchangeRate = exchangeRate > 0 ? exchangeRate : 1
    const amountToPay = paymentCurrency === 'USD'
      ? Number((selectedQuotation.total_amount / safeExchangeRate).toFixed(2))
      : selectedQuotation.total_amount

    const result = convertQuotationToSale({
      quotation_id: selectedQuotation.id,
      payment_method: paymentMethod,
      sale_currency: paymentCurrency,
      exchange_rate: safeExchangeRate,
      paid_amount: amountToPay,
      user_name: 'Usuario Demo',
    })

    if (!result.ok) {
      setFeedback(result.error)
      return
    }

    if (printInvoice) {
      printMockInvoice({
        invoiceNumber: result.sale.id,
        customerName: selectedQuotation.customer_name,
        branchName: selectedQuotation.branch_name,
        cashierName: 'Usuario Demo',
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

    refresh()
    setIsDialogOpen(false)
    setSelectedQuotation(null)
    setFeedback(`Cotización ${result.quotation.id} convertida a venta ${result.sale.id}.`)
  }

  const amountToPay = selectedQuotation
    ? paymentCurrency === 'USD'
      ? selectedQuotation.total_amount / (exchangeRate > 0 ? exchangeRate : 1)
      : selectedQuotation.total_amount
    : 0

  return (
    <MainLayout>
      <div className="space-y-6">
        <PageHeader
          title="Historial de Cotizaciones"
          description="Consulta cotizaciones registradas, anúlalas o conviértelas en venta"
        />
        <QuotationsSubnav />

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
            {quotations.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">No hay cotizaciones registradas.</p>
            ) : (
              quotations.map((quotation) => {
                const isActiveAndValid = isQuotationActive(quotation)
                const isExpired = quotation.status === 'active' && !isActiveAndValid

                return (
                <article key={quotation.id} className="rounded-xl border border-border/70 bg-card/70 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{quotation.id} - {quotation.customer_name}</p>
                      <p className="text-sm text-muted-foreground">
                        Sucursal: {quotation.branch_name} | Usuario: {quotation.quoted_by}
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
                    <p className="font-semibold text-foreground">Total: Bs {quotation.total_amount.toFixed(2)}</p>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleCancel(quotation.id)}
                      disabled={!isActiveAndValid}
                    >
                      Anular cotización
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => openConvertDialog(quotation)}
                      disabled={!isActiveAndValid}
                    >
                      Convertir en venta
                    </Button>
                  </div>
                </article>
                )
              })
            )}
            {feedback ? <p className="text-xs text-primary">{feedback}</p> : null}
          </CardContent>
        </Card>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Convertir cotización a venta</DialogTitle>
          </DialogHeader>

          {selectedQuotation ? (
            <div className="space-y-4 text-sm">
              <div className="rounded-lg border border-border/70 bg-muted/20 p-3">
                <p className="font-semibold">Cotización: {selectedQuotation.id}</p>
                <p className="text-muted-foreground">Cliente: {selectedQuotation.customer_name}</p>
                <p className="text-muted-foreground">Total base: Bs {selectedQuotation.total_amount.toFixed(2)}</p>
              </div>

              <div className="space-y-2">
                <p className="font-medium">Moneda de cobro</p>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant={paymentCurrency === 'BOB' ? 'default' : 'outline'} onClick={() => setPaymentCurrency('BOB')}>Bolivianos</Button>
                  <Button variant={paymentCurrency === 'USD' ? 'default' : 'outline'} onClick={() => setPaymentCurrency('USD')}>Dólares</Button>
                </div>
              </div>

              {paymentCurrency === 'USD' ? (
                <div className="space-y-2">
                  <p className="font-medium">Tipo de cambio</p>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    className="h-9 w-full rounded-md border border-border bg-input px-3"
                    value={exchangeRate}
                    onChange={(event) => setExchangeRate(Number(event.target.value || 1))}
                  />
                </div>
              ) : null}

              <div className="space-y-2">
                <p className="font-medium">Método de pago</p>
                <div className="space-y-2">
                  {PAYMENT_METHODS.map((method) => (
                    <Button
                      key={method.id}
                      className="w-full justify-start"
                      variant={paymentMethod === method.id ? 'default' : 'outline'}
                      onClick={() => setPaymentMethod(method.id)}
                    >
                      {method.label}
                    </Button>
                  ))}
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={printInvoice}
                  onChange={(event) => setPrintInvoice(event.target.checked)}
                />
                Imprimir factura al confirmar
              </label>

              <div className="rounded-lg border border-border/70 p-3">
                <p className="text-muted-foreground">Precio a pagar</p>
                <p className="text-2xl font-bold text-primary">
                  {paymentCurrency === 'USD' ? `$${amountToPay.toFixed(2)}` : `Bs ${amountToPay.toFixed(2)}`}
                </p>
              </div>

              <Button className="w-full" onClick={handleConvert}>
                Confirmar venta
              </Button>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </MainLayout>
  )
}
