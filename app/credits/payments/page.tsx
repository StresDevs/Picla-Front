'use client'

import { useEffect, useMemo, useState } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { PageHeader } from '@/components/common/page-header'
import { CreditsSubnav } from '@/components/modules/credits/credits-subnav'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { creditPaymentsService, creditsService, type CreditPortfolioRow, type CreditPaymentRequest } from '@/lib/supabase/credits'
import { toast } from '@/hooks/use-toast'
import type { CreditPayment } from '@/types/database'
import { ACTIVE_ROLE_EVENT, getActiveUserContext, type AppUserRole } from '@/lib/mock/runtime-store'
import { CheckCircle, XCircle, Clock, Send, AlertTriangle } from 'lucide-react'

export default function CreditsPaymentsPage() {
  const [activeRole, setActiveRole] = useState<AppUserRole>(() => getActiveUserContext().role)
  const [activeBranchId, setActiveBranchId] = useState(() => getActiveUserContext().branch_id)

  const [creditId, setCreditId] = useState('')
  const [credits, setCredits] = useState<CreditPortfolioRow[]>([])
  const [amount, setAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('')
  const [paymentDate, setPaymentDate] = useState('')
  const [notes, setNotes] = useState('')

  const [payments, setPayments] = useState<CreditPayment[]>([])
  const [pendingRequests, setPendingRequests] = useState<CreditPaymentRequest[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isReviewing, setIsReviewing] = useState<string | null>(null)

  const isAdmin = activeRole === 'admin'
  const canInteract = activeRole !== 'read_only'
  const branchScope = isAdmin ? null : activeBranchId

  const selectedCredit = useMemo(
    () => credits.find((credit) => credit.credit_id === creditId) ?? null,
    [credits, creditId],
  )

  useEffect(() => {
    const syncContext = () => {
      const context = getActiveUserContext()
      setActiveRole(context.role)
      setActiveBranchId(context.branch_id)
    }

    syncContext()
    window.addEventListener(ACTIVE_ROLE_EVENT, syncContext)

    return () => {
      window.removeEventListener(ACTIVE_ROLE_EVENT, syncContext)
    }
  }, [])

  useEffect(() => {
    const loadCredits = async () => {
      try {
        const rows = await creditsService.getPortfolio({ branch_id: branchScope })
        setCredits(rows)
        setCreditId((prev) => (prev && rows.some((row) => row.credit_id === prev) ? prev : rows[0]?.credit_id ?? ''))
      } catch (loadError) {
        toast({
          title: 'Error al cargar créditos',
          description:
            loadError instanceof Error ? loadError.message : 'No se pudieron cargar créditos',
          variant: 'destructive',
        })
      }
    }

    void loadCredits()
  }, [branchScope])

  useEffect(() => {
    let isActive = true

    const loadPayments = async () => {
      const trimmed = creditId.trim()
      if (!trimmed) {
        setPayments([])
        return
      }

      setIsLoading(true)
      try {
        const rows = await creditPaymentsService.getByCredit(trimmed)
        if (isActive) {
          setPayments(rows)
        }
      } catch (loadError) {
        if (isActive) {
          toast({
            title: 'Error al cargar pagos',
            description:
              loadError instanceof Error ? loadError.message : 'No se pudieron cargar pagos',
            variant: 'destructive',
          })
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

  // Load pending requests for admin
  useEffect(() => {
    if (!isAdmin) {
      setPendingRequests([])
      return
    }

    const loadRequests = async () => {
      try {
        const rows = await creditPaymentsService.getPendingRequests({ branch_id: branchScope })
        setPendingRequests(rows as CreditPaymentRequest[])
      } catch {
        // silently fail
      }
    }

    void loadRequests()
  }, [isAdmin, branchScope])

  const handleRegisterPayment = async () => {
    const trimmedCreditId = creditId.trim()
    if (!trimmedCreditId) {
      toast({
        title: 'Falta el crédito',
        description: 'Debes seleccionar un crédito.',
        variant: 'destructive',
      })
      return
    }

    const parsedAmount = Number(amount)
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      toast({
        title: 'Monto inválido',
        description: 'El monto del pago debe ser mayor a 0.',
        variant: 'destructive',
      })
      return
    }

    if (!paymentMethod.trim()) {
      toast({
        title: 'Falta método de pago',
        description: 'Debes indicar el método de pago.',
        variant: 'destructive',
      })
      return
    }

    setIsSaving(true)
    try {
      if (isAdmin) {
        // Admin registers directly
        await creditPaymentsService.addPayment({
          credit_id: trimmedCreditId,
          amount: parsedAmount,
          payment_method: paymentMethod.trim(),
          payment_date: paymentDate || null,
          notes: notes.trim() || null,
        })

        toast({
          title: 'Pago registrado',
          description: 'El pago se guardó correctamente.',
        })
      } else {
        // Manager/Employee creates a request
        await creditPaymentsService.requestPayment({
          credit_id: trimmedCreditId,
          amount: parsedAmount,
          payment_method: paymentMethod.trim(),
          payment_date: paymentDate || null,
          notes: notes.trim() || null,
        })

        toast({
          title: 'Solicitud enviada',
          description: 'La solicitud de pago fue enviada al administrador para su aprobación.',
        })
      }

      setAmount('')
      setPaymentMethod('')
      setPaymentDate('')
      setNotes('')

      const rows = await creditPaymentsService.getByCredit(trimmedCreditId)
      setPayments(rows)
    } catch (saveError) {
      toast({
        title: isAdmin ? 'No se pudo registrar el pago' : 'No se pudo enviar la solicitud',
        description: saveError instanceof Error ? saveError.message : 'Intenta nuevamente',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleReviewRequest = async (requestId: string, action: 'approve' | 'reject') => {
    setIsReviewing(requestId)
    try {
      await creditPaymentsService.reviewRequest({
        request_id: requestId,
        action,
        review_notes: null,
      })

      toast({
        title: action === 'approve' ? 'Pago aprobado' : 'Solicitud rechazada',
        description: action === 'approve'
          ? 'El pago fue registrado exitosamente.'
          : 'La solicitud fue rechazada.',
      })

      // Reload requests and payments
      const [requests, paymentRows] = await Promise.all([
        creditPaymentsService.getPendingRequests({ branch_id: branchScope }),
        creditId ? creditPaymentsService.getByCredit(creditId) : Promise.resolve([]),
      ])
      setPendingRequests(requests as CreditPaymentRequest[])
      if (creditId) setPayments(paymentRows as CreditPayment[])
    } catch (reviewError) {
      toast({
        title: 'Error',
        description: reviewError instanceof Error ? reviewError.message : 'No se pudo procesar la solicitud',
        variant: 'destructive',
      })
    } finally {
      setIsReviewing(null)
    }
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <PageHeader title="Pagos de Crédito" description="Registro de cuotas, abonos y cancelación final" />
        <CreditsSubnav />

        {/* Pending requests - only visible to admin */}
        {isAdmin && pendingRequests.length > 0 && (
          <Card className="border-amber-500/40 bg-amber-500/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-400">
                <AlertTriangle className="h-5 w-5" />
                Solicitudes de pago pendientes ({pendingRequests.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {pendingRequests.map((req) => (
                <div key={req.id} className="rounded-lg border border-amber-500/30 bg-card/80 p-3 text-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-foreground">
                        Solicitud de pago — Bs {Number(req.amount).toFixed(2)}
                      </p>
                      <p className="text-muted-foreground mt-0.5">
                        Método: {req.payment_method} | Fecha: {req.payment_date || 'Hoy'}
                      </p>
                      <p className="text-muted-foreground">
                        Solicitado por: <span className="text-foreground/80">{req.requested_role}</span>
                      </p>
                      {req.notes && (
                        <p className="text-muted-foreground mt-1">Nota: {req.notes}</p>
                      )}
                      <div className="flex items-center gap-1 mt-1">
                        <Clock className="h-3 w-3 text-amber-400" />
                        <span className="text-[11px] text-amber-400">
                          {new Date(req.created_at).toLocaleString('es-BO')}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10"
                        onClick={() => handleReviewRequest(req.id, 'approve')}
                        disabled={isReviewing === req.id}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Aprobar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-rose-500/40 text-rose-400 hover:bg-rose-500/10"
                        onClick={() => handleReviewRequest(req.id, 'reject')}
                        disabled={isReviewing === req.id}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Rechazar
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Payment form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {isAdmin ? 'Registrar pago' : 'Solicitar registro de pago'}
              {!isAdmin && (
                <Badge variant="outline" className="text-[10px] text-amber-400 border-amber-500/30">
                  Requiere aprobación del admin
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <div className="space-y-2">
              <Label>Crédito</Label>
              <Select value={creditId} onValueChange={setCreditId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un crédito" />
                </SelectTrigger>
                <SelectContent>
                  {credits.length === 0 ? (
                    <SelectItem value="" disabled>Sin créditos disponibles</SelectItem>
                  ) : (
                    credits.map((credit) => (
                      <SelectItem key={credit.credit_id} value={credit.credit_id}>
                        {credit.customer_name} · {credit.product_name} · Bs {credit.balance.toFixed(2)}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
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

            <Button
              className="md:col-span-5"
              onClick={handleRegisterPayment}
              disabled={!canInteract || isSaving}
              variant={isAdmin ? 'default' : 'outline'}
            >
              {isAdmin ? (
                isSaving ? 'Registrando...' : 'Registrar pago'
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  {isSaving ? 'Enviando solicitud...' : 'Solicitar registro de pago'}
                </>
              )}
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
                  <p className="text-foreground font-semibold">Pago registrado</p>
                  <p className="text-muted-foreground">
                    {selectedCredit
                      ? `Crédito: ${selectedCredit.customer_name} · ${selectedCredit.product_name}`
                      : 'Crédito seleccionado'}
                  </p>
                  <p className="text-muted-foreground">Fecha: {payment.payment_date || '-'} | Método: {payment.payment_method}</p>
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
