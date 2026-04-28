'use client'

import { useEffect, useState } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { PageHeader } from '@/components/common/page-header'
import { CreditsSubnav } from '@/components/modules/credits/credits-subnav'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { creditPaymentsService } from '@/lib/supabase/credits'
import type { CreditPayment } from '@/types/database'
import { ACTIVE_ROLE_EVENT, getActiveUserContext, type AppUserRole } from '@/lib/mock/runtime-store'

export default function CreditsPaymentsPage() {
  const [activeRole, setActiveRole] = useState<AppUserRole>(() => getActiveUserContext().role)

  const [creditId, setCreditId] = useState('')
  const [amount, setAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('')
  const [paymentDate, setPaymentDate] = useState('')
  const [notes, setNotes] = useState('')

  const [payments, setPayments] = useState<CreditPayment[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const canRegister = activeRole !== 'read_only'

  useEffect(() => {
    const syncContext = () => {
      const context = getActiveUserContext()
      setActiveRole(context.role)
    }

    syncContext()
    window.addEventListener(ACTIVE_ROLE_EVENT, syncContext)

    return () => {
      window.removeEventListener(ACTIVE_ROLE_EVENT, syncContext)
    }
  }, [])

  useEffect(() => {
    let isActive = true

    const loadPayments = async () => {
      const trimmed = creditId.trim()
      if (!trimmed) {
        setPayments([])
        return
      }

      setIsLoading(true)
      setError(null)
      try {
        const rows = await creditPaymentsService.getByCredit(trimmed)
        if (isActive) {
          setPayments(rows)
        }
      } catch (loadError) {
        if (isActive) {
          setError(loadError instanceof Error ? loadError.message : 'No se pudieron cargar pagos')
        }
      } finally {
        if (isActive) {
          setIsLoading(false)
        }
      }
    }

    void loadPayments()

    return () => {
      isActive = false
    }
  }, [creditId])

  const handleRegisterPayment = async () => {
    setFeedback(null)
    setError(null)

    const trimmedCreditId = creditId.trim()
    if (!trimmedCreditId) {
      setFeedback('Debes ingresar el ID del crédito.')
      return
    }

    const parsedAmount = Number(amount)
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setFeedback('El monto del pago debe ser mayor a 0.')
      return
    }

    if (!paymentMethod.trim()) {
      setFeedback('Debes indicar el método de pago.')
      return
    }

    setIsSaving(true)
    try {
      await creditPaymentsService.addPayment({
        credit_id: trimmedCreditId,
        amount: parsedAmount,
        payment_method: paymentMethod.trim(),
        payment_date: paymentDate || null,
        notes: notes.trim() || null,
      })

      setFeedback('Pago registrado correctamente.')
      setAmount('')
      setPaymentMethod('')
      setPaymentDate('')
      setNotes('')

      const rows = await creditPaymentsService.getByCredit(trimmedCreditId)
      setPayments(rows)
    } catch (saveError) {
      setFeedback(saveError instanceof Error ? saveError.message : 'No se pudo registrar el pago')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <PageHeader title="Pagos de Crédito" description="Registro de cuotas, abonos y cancelación final" />
        <CreditsSubnav />

        <Card>
          <CardHeader>
            <CardTitle>Registrar pago</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <div className="space-y-2">
              <Label>ID crédito</Label>
              <Input value={creditId} onChange={(event) => setCreditId(event.target.value)} placeholder="UUID del crédito" />
            </div>
            <div className="space-y-2">
              <Label>Monto pago</Label>
              <Input type="number" min="0" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="0.00" />
            </div>
            <div className="space-y-2">
              <Label>Método</Label>
              <Input value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)} placeholder="Efectivo / QR / Transferencia" />
            </div>
            <div className="space-y-2">
              <Label>Fecha pago</Label>
              <Input type="date" value={paymentDate} onChange={(event) => setPaymentDate(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Notas</Label>
              <Input value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Detalle opcional" />
            </div>

            {feedback ? <p className="md:col-span-5 text-sm text-primary">{feedback}</p> : null}
            {error ? <p className="md:col-span-5 text-sm text-destructive">{error}</p> : null}

            <Button className="md:col-span-5" onClick={handleRegisterPayment} disabled={!canRegister || isSaving}>
              {isSaving ? 'Registrando...' : 'Registrar pago'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Historial de pagos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              <p className="py-6 text-center text-sm text-muted-foreground">Cargando pagos...</p>
            ) : payments.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">Ingresa un crédito para ver pagos.</p>
            ) : (
              payments.map((payment) => (
                <div key={payment.id} className="rounded-lg border border-border bg-card/70 p-3 text-sm">
                  <p className="text-foreground font-semibold">{payment.id}</p>
                  <p className="text-muted-foreground">Crédito: {payment.credit_id} | Fecha: {payment.payment_date}</p>
                  <p className="text-emerald-500">Monto: Bs {Number(payment.amount).toFixed(2)}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}
