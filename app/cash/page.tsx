'use client'

import { useEffect, useMemo, useState } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { PageHeader } from '@/components/common/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import {
  cashService,
  type CashMovement,
  type CashMovementEditRequest,
  type CashSnapshot,
  type CurrentCashSession,
} from '@/lib/supabase/cash'
import { ACTIVE_ROLE_EVENT, getActiveUserContext } from '@/lib/mock/runtime-store'
import {
  Wallet,
  Clock3,
  Plus,
  ShieldCheck,
  RotateCw,
  Receipt,
  ArrowUpCircle,
  ArrowDownCircle,
  Lock,
  PencilLine,
  ClipboardCheck,
  AlertTriangle,
} from 'lucide-react'

interface CurrentProfile {
  id: string
  full_name: string
  role_name: string
  branch_id: string
  branch_name: string
}

const currency = (value: number) => `Bs ${value.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

type CashRole = 'admin' | 'manager' | 'employee' | 'read_only' | ''

function movementTitle(movementType: CashMovement['movement_type']) {
  switch (movementType) {
    case 'sale_cash':
      return 'Venta en efectivo'
    case 'sale_return_cash':
      return 'Devolucion de venta en efectivo'
    case 'manual_income':
      return 'Ingreso manual'
    case 'manual_expense':
      return 'Egreso manual'
    default:
      return 'Movimiento'
  }
}

function isPositiveMovement(movementType: CashMovement['movement_type']) {
  return movementType === 'sale_cash' || movementType === 'manual_income'
}

function roleLabel(role: CashRole) {
  if (role === 'admin') return 'Admin'
  if (role === 'manager') return 'Encargado'
  if (role === 'employee') return 'Empleado'
  if (role === 'read_only') return 'Solo lectura'
  return 'Sin rol'
}

function openButtonLabel(role: CashRole) {
  if (role === 'admin') return 'Abrir Caja Admin'
  if (role === 'manager') return 'Abrir Caja Encargado'
  if (role === 'employee') return 'Abrir Caja Empleado'
  return 'Abrir Caja'
}

export default function CashPage() {
  const [profile, setProfile] = useState<CurrentProfile | null>(null)
  const [activeBranchId, setActiveBranchId] = useState<string>(() => getActiveUserContext().branch_id)
  const [session, setSession] = useState<CurrentCashSession | null>(null)
  const [movements, setMovements] = useState<CashMovement[]>([])
  const [snapshots, setSnapshots] = useState<CashSnapshot[]>([])
  const [editRequests, setEditRequests] = useState<CashMovementEditRequest[]>([])

  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)

  const [openModalOpen, setOpenModalOpen] = useState(false)
  const [movementModalOpen, setMovementModalOpen] = useState(false)
  const [closeModalOpen, setCloseModalOpen] = useState(false)
  const [requestEditModalOpen, setRequestEditModalOpen] = useState(false)
  const [adminEditModalOpen, setAdminEditModalOpen] = useState(false)
  const [reviewRequestModalOpen, setReviewRequestModalOpen] = useState(false)

  const [selectedMovement, setSelectedMovement] = useState<CashMovement | null>(null)
  const [selectedRequest, setSelectedRequest] = useState<CashMovementEditRequest | null>(null)

  const [openingAmount, setOpeningAmount] = useState('')
  const [openingNotes, setOpeningNotes] = useState('')

  const [movementDirection, setMovementDirection] = useState<'income' | 'expense'>('income')
  const [movementAmount, setMovementAmount] = useState('')
  const [movementDescription, setMovementDescription] = useState('')

  const [closingAmount, setClosingAmount] = useState('')
  const [closingNotes, setClosingNotes] = useState('')

  const [requestReason, setRequestReason] = useState('')
  const [requestAmount, setRequestAmount] = useState('')
  const [requestDescription, setRequestDescription] = useState('')

  const [adminNewAmount, setAdminNewAmount] = useState('')
  const [adminNewDescription, setAdminNewDescription] = useState('')
  const [adminEditReason, setAdminEditReason] = useState('')

  const [reviewNotes, setReviewNotes] = useState('')

  const roleName = ((profile?.role_name || '').toLowerCase() as CashRole)
  const isAdmin = roleName === 'admin'
  const isManager = roleName === 'manager'
  const isEmployee = roleName === 'employee'

  const canOpenClose = isAdmin || isManager || isEmployee
  const canManualMovement = isAdmin || isManager
  const canRequestEdit = isManager
  const canAdminEdit = isAdmin

  const openingSnapshot = useMemo(
    () => snapshots.find((snapshot) => snapshot.snapshot_type === 'open') ?? null,
    [snapshots],
  )

  const closingSnapshot = useMemo(
    () => snapshots.find((snapshot) => snapshot.snapshot_type === 'close') ?? null,
    [snapshots],
  )

  const pendingRequestsByMovement = useMemo(
    () => new Set(editRequests.filter((request) => request.status === 'pending').map((request) => request.movement_id)),
    [editRequests],
  )

  const loadCashData = async (branchIdFromContext?: string) => {
    setIsLoading(true)
    setError(null)
    try {
      const contextBranchId = branchIdFromContext ?? getActiveUserContext().branch_id
      setActiveBranchId(contextBranchId)

      const [rawProfile, currentSession] = await Promise.all([
        cashService.getCurrentProfile(),
        cashService.getCurrentSession({ branch_id: contextBranchId }),
      ])

      setProfile(
        rawProfile
          ? {
              id: rawProfile.id,
              full_name: rawProfile.full_name,
              role_name: rawProfile.role_name,
              branch_id: rawProfile.branch_id,
              branch_name: rawProfile.branch_name,
            }
          : null,
      )

      const currentRole = ((rawProfile?.role_name || '').toLowerCase() as CashRole)

      setSession(currentSession)

      if (currentSession) {
        const [sessionMovements, sessionSnapshots] = await Promise.all([
          cashService.getSessionMovements(currentSession.cash_session_id),
          cashService.getSessionSnapshots(currentSession.cash_session_id),
        ])

        setMovements(sessionMovements)
        setSnapshots(sessionSnapshots)

        if (currentRole === 'admin' || currentRole === 'manager') {
          const requests = await cashService.getMovementEditRequests({
            cash_session_id: currentSession.cash_session_id,
            status: null,
          })
          setEditRequests(requests)
        } else {
          setEditRequests([])
        }
      } else {
        setMovements([])
        setSnapshots([])
        setEditRequests([])
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'No se pudo cargar la caja')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadCashData()

    const onActiveContextChanged = () => {
      const context = getActiveUserContext()
      setActiveBranchId(context.branch_id)
      void loadCashData(context.branch_id)
    }

    window.addEventListener(ACTIVE_ROLE_EVENT, onActiveContextChanged)
    return () => window.removeEventListener(ACTIVE_ROLE_EVENT, onActiveContextChanged)
  }, [])

  const totals = useMemo(() => {
    if (!session) {
      return {
        sales: 0,
        manualIncome: 0,
        manualExpense: 0,
        salesReturns: 0,
        incomes: 0,
        expenses: 0,
        expectedNow: 0,
        totalMovements: 0,
      }
    }

    const sales = Number(session.sales_cash_total || 0)
    const manualIncome = Number(session.manual_income_total || 0)
    const manualExpense = Number(session.manual_expense_total || 0)
    const salesReturns = Number(session.sales_return_total || 0)

    const incomes = sales + manualIncome
    const expenses = manualExpense + salesReturns

    return {
      sales,
      manualIncome,
      manualExpense,
      salesReturns,
      incomes,
      expenses,
      expectedNow: Number(session.expected_now || 0),
      totalMovements: Number(session.total_movements || 0),
    }
  }, [session])

  const displayedBranchLabel = useMemo(() => {
    if (session?.branch_name) return session.branch_name
    if (isAdmin) return activeBranchId
    return profile?.branch_name || 'Sin sucursal'
  }, [activeBranchId, isAdmin, profile?.branch_name, session?.branch_name])

  const openRegister = async () => {
    if (!canOpenClose) {
      setFeedback('Tu rol no tiene permiso para abrir caja.')
      return
    }

    setError(null)
    setFeedback(null)

    const parsedAmount = Number(openingAmount)
    if (!Number.isFinite(parsedAmount) || parsedAmount < 0) {
      setFeedback('El monto de apertura debe ser mayor o igual a 0.')
      return
    }

    setIsSubmitting(true)
    try {
      await cashService.openSession({
        opening_amount: parsedAmount,
        opening_notes: openingNotes.trim() || null,
        branch_id: activeBranchId,
      })
      setOpeningAmount('')
      setOpeningNotes('')
      setOpenModalOpen(false)
      await loadCashData()
      setFeedback('Caja abierta correctamente. Se registro snapshot de inventario de apertura.')
    } catch (openError) {
      setError(openError instanceof Error ? openError.message : 'No se pudo abrir caja')
    } finally {
      setIsSubmitting(false)
    }
  }

  const registerMovement = () => {
    if (!canManualMovement) {
      setFeedback('Solo manager o admin pueden registrar movimientos manuales.')
      return
    }

    if (!session) {
      setFeedback('No hay caja abierta para registrar movimientos.')
      return
    }

    const parsedAmount = Number(movementAmount)
    if (!parsedAmount || !movementDescription.trim()) {
      setFeedback('Completa monto y descripcion del movimiento.')
      return
    }

    setError(null)
    setFeedback(null)

    void (async () => {
      setIsSubmitting(true)
      try {
        await cashService.createManualMovement({
          cash_session_id: session.cash_session_id,
          direction: movementDirection,
          amount: Math.abs(parsedAmount),
          description: movementDescription,
        })

        setMovementAmount('')
        setMovementDescription('')
        setMovementDirection('income')
        setMovementModalOpen(false)
        await loadCashData()
        setFeedback('Movimiento de caja registrado correctamente.')
      } catch (movementError) {
        setError(movementError instanceof Error ? movementError.message : 'No se pudo registrar el movimiento')
      } finally {
        setIsSubmitting(false)
      }
    })()
  }

  const closeRegister = () => {
    if (!canOpenClose) {
      setFeedback('Tu rol no tiene permiso para cerrar caja.')
      return
    }

    if (!session) {
      setFeedback('No hay caja abierta para cerrar.')
      return
    }

    const parsedAmount = Number(closingAmount)
    if (!Number.isFinite(parsedAmount) || parsedAmount < 0) {
      setFeedback('El monto contado debe ser mayor o igual a 0.')
      return
    }

    setError(null)
    setFeedback(null)

    void (async () => {
      setIsSubmitting(true)
      try {
        const result = await cashService.closeSession({
          cash_session_id: session.cash_session_id,
          closing_amount_counted: parsedAmount,
          closing_notes: closingNotes.trim() || null,
        })

        setClosingAmount('')
        setClosingNotes('')
        setCloseModalOpen(false)
        await loadCashData()

        if (result) {
          setFeedback(
            `Caja cerrada. Esperado: ${currency(Number(result.expected_amount || 0))} | Contado: ${currency(
              Number(result.counted_amount || 0),
            )} | Diferencia: ${currency(Number(result.variance || 0))}`,
          )
        } else {
          setFeedback('Caja cerrada correctamente.')
        }
      } catch (closeError) {
        setError(closeError instanceof Error ? closeError.message : 'No se pudo cerrar caja')
      } finally {
        setIsSubmitting(false)
      }
    })()
  }

  const openRequestEditDialog = (movement: CashMovement) => {
    setSelectedMovement(movement)
    setRequestReason('')
    setRequestAmount('')
    setRequestDescription('')
    setRequestEditModalOpen(true)
  }

  const submitMovementEditRequest = async () => {
    if (!canRequestEdit || !selectedMovement) {
      setFeedback('No tienes permiso para solicitar correcciones.')
      return
    }

    const normalizedReason = requestReason.trim()
    if (!normalizedReason) {
      setFeedback('Debes indicar el motivo de la correccion.')
      return
    }

    const parsedAmount = requestAmount.trim() ? Number(requestAmount) : null
    if (parsedAmount !== null && (!Number.isFinite(parsedAmount) || parsedAmount <= 0)) {
      setFeedback('El monto propuesto debe ser mayor a 0.')
      return
    }

    setError(null)
    setFeedback(null)
    setIsSubmitting(true)
    try {
      await cashService.createMovementEditRequest({
        movement_id: selectedMovement.movement_id,
        request_reason: normalizedReason,
        proposed_amount: parsedAmount,
        proposed_description: requestDescription.trim() || null,
      })

      setRequestEditModalOpen(false)
      await loadCashData()
      setFeedback('Solicitud de correccion registrada para revision del admin.')
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'No se pudo registrar la solicitud')
    } finally {
      setIsSubmitting(false)
    }
  }

  const openAdminEditDialog = (movement: CashMovement) => {
    setSelectedMovement(movement)
    setAdminNewAmount(String(movement.amount))
    setAdminNewDescription(movement.description)
    setAdminEditReason('')
    setAdminEditModalOpen(true)
  }

  const submitAdminMovementEdit = async () => {
    if (!canAdminEdit || !selectedMovement) {
      setFeedback('Solo admin puede editar movimientos.')
      return
    }

    const parsedAmount = Number(adminNewAmount)
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setFeedback('El nuevo monto debe ser mayor a 0.')
      return
    }

    if (!adminNewDescription.trim()) {
      setFeedback('La descripcion no puede quedar vacia.')
      return
    }

    setError(null)
    setFeedback(null)
    setIsSubmitting(true)
    try {
      await cashService.adminUpdateMovement({
        movement_id: selectedMovement.movement_id,
        new_amount: parsedAmount,
        new_description: adminNewDescription.trim(),
        reason: adminEditReason.trim() || null,
      })
      setAdminEditModalOpen(false)
      await loadCashData()
      setFeedback('Movimiento editado correctamente por admin.')
    } catch (editError) {
      setError(editError instanceof Error ? editError.message : 'No se pudo editar el movimiento')
    } finally {
      setIsSubmitting(false)
    }
  }

  const openReviewRequestDialog = (request: CashMovementEditRequest) => {
    setSelectedRequest(request)
    setReviewNotes('')
    setReviewRequestModalOpen(true)
  }

  const reviewEditRequest = async (action: 'approve' | 'reject') => {
    if (!canAdminEdit || !selectedRequest) {
      setFeedback('Solo admin puede revisar solicitudes.')
      return
    }

    setError(null)
    setFeedback(null)
    setIsSubmitting(true)
    try {
      await cashService.reviewMovementEditRequest({
        request_id: selectedRequest.request_id,
        action,
        review_notes: reviewNotes.trim() || null,
        apply_changes: true,
      })

      setReviewRequestModalOpen(false)
      await loadCashData()
      setFeedback(action === 'approve' ? 'Solicitud aprobada.' : 'Solicitud rechazada.')
    } catch (reviewError) {
      setError(reviewError instanceof Error ? reviewError.message : 'No se pudo revisar la solicitud')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <PageHeader
          title="Caja Registradora"
          description="Gestiona la apertura/cierre por rol, movimientos y control de correcciones"
          action={
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => void loadCashData()} disabled={isLoading || isSubmitting}>
                <RotateCw className="w-4 h-4 mr-2" />
                Actualizar
              </Button>

              <Dialog open={openModalOpen} onOpenChange={setOpenModalOpen}>
                <DialogTrigger asChild>
                  <Button
                    className="bg-emerald-700 hover:bg-emerald-600 text-white"
                    disabled={Boolean(session) || isLoading || isSubmitting || !canOpenClose}
                  >
                    <ShieldCheck className="w-4 h-4 mr-2" />
                    {openButtonLabel(roleName)}
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-xl">
                  <DialogHeader>
                    <DialogTitle>Apertura de Caja ({roleLabel(roleName)})</DialogTitle>
                    <DialogDescription>Ingresa el monto inicial de caja chica para iniciar la jornada.</DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Monto de apertura</label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        value={openingAmount}
                        onChange={(event) => setOpeningAmount(event.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Notas (opcional)</label>
                      <Input
                        placeholder="Caja chica inicial, observaciones..."
                        value={openingNotes}
                        onChange={(event) => setOpeningNotes(event.target.value)}
                      />
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button variant="destructive" onClick={() => setOpenModalOpen(false)} disabled={isSubmitting}>
                        Cancelar
                      </Button>
                      <Button onClick={openRegister} disabled={isSubmitting}>Abrir Caja</Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={movementModalOpen} onOpenChange={setMovementModalOpen}>
                <DialogTrigger asChild>
                  <Button
                    className="bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700"
                    disabled={!session || isLoading || isSubmitting || !canManualMovement}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Movimiento Manual
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-xl">
                  <DialogHeader>
                    <DialogTitle>Registrar Movimiento</DialogTitle>
                    <DialogDescription>Agrega un ingreso o egreso manual a la caja</DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant={movementDirection === 'income' ? 'default' : 'outline'}
                        className={movementDirection === 'income' ? '' : 'border-zinc-700 bg-zinc-900 text-zinc-200'}
                        onClick={() => setMovementDirection('income')}
                      >
                        <ArrowUpCircle className="w-4 h-4 mr-2" />
                        Ingreso
                      </Button>
                      <Button
                        variant={movementDirection === 'expense' ? 'destructive' : 'outline'}
                        className={movementDirection === 'expense' ? '' : 'border-zinc-700 bg-zinc-900 text-zinc-200'}
                        onClick={() => setMovementDirection('expense')}
                      >
                        <ArrowDownCircle className="w-4 h-4 mr-2" />
                        Egreso
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Monto</label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={movementAmount}
                        onChange={(event) => setMovementAmount(event.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Concepto</label>
                      <Input
                        placeholder="Describe el movimiento..."
                        value={movementDescription}
                        onChange={(event) => setMovementDescription(event.target.value)}
                      />
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button variant="destructive" onClick={() => setMovementModalOpen(false)} disabled={isSubmitting}>
                        Cancelar
                      </Button>
                      <Button onClick={registerMovement} disabled={isSubmitting}>Registrar</Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={closeModalOpen} onOpenChange={setCloseModalOpen}>
                <DialogTrigger asChild>
                  <Button variant="destructive" disabled={!session || isLoading || isSubmitting || !canOpenClose}>
                    <Lock className="w-4 h-4 mr-2" />
                    Cerrar Caja
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-xl">
                  <DialogHeader>
                    <DialogTitle>Cierre de Caja</DialogTitle>
                    <DialogDescription>
                      Registra el monto contado para cuadrar con el monto esperado y guardar snapshot de cierre.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Monto contado en caja</label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        value={closingAmount}
                        onChange={(event) => setClosingAmount(event.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Notas (opcional)</label>
                      <Input
                        placeholder="Observaciones del cierre..."
                        value={closingNotes}
                        onChange={(event) => setClosingNotes(event.target.value)}
                      />
                    </div>

                    <div className="rounded-lg bg-zinc-900/70 border border-zinc-700 px-3 py-2 text-sm text-zinc-300">
                      Monto esperado al momento: <span className="font-semibold text-zinc-100">{currency(totals.expectedNow)}</span>
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button variant="destructive" onClick={() => setCloseModalOpen(false)} disabled={isSubmitting}>
                        Cancelar
                      </Button>
                      <Button onClick={closeRegister} disabled={isSubmitting}>Confirmar Cierre</Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          }
        />

        {error ? (
          <Card className="border-red-500/40 bg-red-500/5">
            <CardContent className="pt-6 text-sm text-red-300">{error}</CardContent>
          </Card>
        ) : null}

        {feedback ? (
          <Card className="border-emerald-500/40 bg-emerald-500/10">
            <CardContent className="pt-6 text-sm text-emerald-300">{feedback}</CardContent>
          </Card>
        ) : null}

        <Card className="border-emerald-500/55 bg-zinc-950/70">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-zinc-100">
                <Wallet className="w-5 h-5" />
                Estado de Caja
              </div>
              <Badge className={session ? 'bg-emerald-600 text-white' : 'bg-zinc-600 text-white'}>
                {session ? 'Abierta' : 'Cerrada'}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg bg-emerald-900/25 px-3 py-2 text-emerald-300">
                ${' '}
                <span className="font-semibold">Caja: {displayedBranchLabel}</span>
              </div>
              <div className="rounded-lg bg-zinc-900/50 px-3 py-2 text-zinc-300">
                <span className="font-semibold">Usuario:</span>{' '}
                {profile ? `${profile.full_name} (${roleLabel(roleName)}) - ${displayedBranchLabel}` : 'Sin perfil cargado'}
              </div>
            </div>

            <div className="text-zinc-400 text-sm flex items-center gap-2">
              <Clock3 className="w-4 h-4" />
              {session
                ? `Abierta desde: ${new Date(session.opened_at).toLocaleString('es-BO')}`
                : 'No hay caja abierta en este momento'}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="rounded-xl bg-zinc-800/70 p-4 text-center">
                <p className="text-zinc-400 text-sm">Monto Inicial</p>
                <p className="text-zinc-100 text-3xl font-semibold mt-1">{currency(Number(session?.opening_amount || 0))}</p>
                <p className="text-[11px] text-zinc-400 mt-2">Abierta como: {session?.opening_role || '-'}</p>
              </div>
              <div className="rounded-xl bg-emerald-900/35 p-4 text-center">
                <p className="text-emerald-300 text-sm">Ingresos</p>
                <p className="text-emerald-400 text-3xl font-semibold mt-1">{currency(totals.incomes)}</p>
              </div>
              <div className="rounded-xl bg-rose-900/35 p-4 text-center">
                <p className="text-rose-300 text-sm">Egresos</p>
                <p className="text-rose-400 text-3xl font-semibold mt-1">{currency(totals.expenses)}</p>
              </div>
              <div className="rounded-xl bg-zinc-700/60 p-4 text-center">
                <p className="text-zinc-300 text-sm">Esperado en Caja</p>
                <p className="text-zinc-100 text-3xl font-semibold mt-1">{currency(totals.expectedNow)}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/65 p-4">
                <p className="text-xs text-zinc-400">Snapshot apertura</p>
                <p className="text-sm text-zinc-200 mt-1">
                  {openingSnapshot
                    ? `${openingSnapshot.item_count} items | ${openingSnapshot.total_units.toLocaleString('es-BO')} unidades`
                    : 'Pendiente'}
                </p>
              </div>
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/65 p-4">
                <p className="text-xs text-zinc-400">Snapshot cierre</p>
                <p className="text-sm text-zinc-200 mt-1">
                  {closingSnapshot
                    ? `${closingSnapshot.item_count} items | ${closingSnapshot.total_units.toLocaleString('es-BO')} unidades`
                    : 'Se registrara al cerrar caja'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="bg-zinc-950/70">
            <CardContent className="pt-6">
              <p className="text-sm text-zinc-400">Ventas del Día</p>
              <p className="text-4xl font-semibold text-zinc-100 mt-6">{currency(totals.sales)}</p>
              <p className="text-xs text-zinc-400 mt-2">Solo ventas en efectivo registradas en caja</p>
            </CardContent>
          </Card>

          <Card className="bg-zinc-950/70">
            <CardContent className="pt-6">
              <p className="text-sm text-zinc-400">Ingresos Manuales</p>
              <p className="text-4xl font-semibold text-zinc-100 mt-6">{currency(totals.manualIncome)}</p>
              <p className="text-xs text-zinc-400 mt-2">Caja chica / ajustes de ingreso</p>
            </CardContent>
          </Card>

          <Card className="bg-zinc-950/70">
            <CardContent className="pt-6">
              <p className="text-sm text-zinc-400">Total Movimientos</p>
              <p className="text-4xl font-semibold text-zinc-100 mt-6">{totals.totalMovements}</p>
              <p className="text-xs mt-2">
                <span className="text-emerald-400">+{movements.filter((m) => isPositiveMovement(m.movement_type)).length}</span>
                <span className="text-zinc-500"> / </span>
                <span className="text-rose-400">-{movements.filter((m) => !isPositiveMovement(m.movement_type)).length}</span>
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-zinc-950/70">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-zinc-100">
              <Receipt className="w-5 h-5" />
              Movimientos del Día
            </CardTitle>
            <p className="text-sm text-zinc-400">{movements.length} movimientos registrados</p>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              <p className="text-sm text-zinc-400">Cargando movimientos...</p>
            ) : movements.length === 0 ? (
              <p className="text-sm text-zinc-400">No hay movimientos registrados para la caja actual.</p>
            ) : (
              movements.map((movement) => {
                const positive = isPositiveMovement(movement.movement_type)
                const hasPendingRequest = pendingRequestsByMovement.has(movement.movement_id)
                return (
                  <div key={movement.movement_id} className="rounded-xl border border-zinc-800 bg-zinc-900/65 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-zinc-100">
                        {movementTitle(movement.movement_type)}
                      </p>
                      <p className="text-xs text-zinc-400 mt-1">{new Date(movement.created_at).toLocaleString('es-BO')}</p>
                      <p className="text-sm text-zinc-300 mt-2">{movement.description}</p>
                      {movement.created_by_name ? (
                        <p className="text-xs text-zinc-500 mt-2">Registrado por: {movement.created_by_name}</p>
                      ) : null}
                      {movement.updated_by_name ? (
                        <p className="text-xs text-amber-300 mt-1">Editado por: {movement.updated_by_name}</p>
                      ) : null}
                      {(canRequestEdit || canAdminEdit) ? (
                        <div className="flex gap-2 mt-3">
                          {canRequestEdit ? (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={hasPendingRequest || isSubmitting}
                              onClick={() => openRequestEditDialog(movement)}
                            >
                              <AlertTriangle className="w-3.5 h-3.5 mr-1" />
                              {hasPendingRequest ? 'Solicitud pendiente' : 'Solicitar correccion'}
                            </Button>
                          ) : null}
                          {canAdminEdit ? (
                            <Button size="sm" variant="outline" onClick={() => openAdminEditDialog(movement)} disabled={isSubmitting}>
                              <PencilLine className="w-3.5 h-3.5 mr-1" />
                              Editar
                            </Button>
                          ) : null}
                        </div>
                      ) : null}
                    </div>

                    <div className={`text-xl font-semibold ${positive ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {positive ? '+' : '-'} {currency(Math.abs(Number(movement.amount || 0)))}
                    </div>
                  </div>
                </div>
                )
              })
            )}
          </CardContent>
        </Card>

        {(isManager || isAdmin) ? (
          <Card className="bg-zinc-950/70">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-zinc-100">
                <ClipboardCheck className="w-5 h-5" />
                Solicitudes de Correccion
              </CardTitle>
              <p className="text-sm text-zinc-400">Managers solicitan, admins revisan y aplican cambios.</p>
            </CardHeader>
            <CardContent className="space-y-3">
              {editRequests.length === 0 ? (
                <p className="text-sm text-zinc-400">No hay solicitudes registradas para esta caja.</p>
              ) : (
                editRequests.map((request) => (
                  <div key={request.request_id} className="rounded-xl border border-zinc-800 bg-zinc-900/65 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-zinc-100">
                          {movementTitle(request.movement_type)} | Estado: {request.status}
                        </p>
                        <p className="text-xs text-zinc-400 mt-1">Solicitado por {request.requested_by_name || request.requested_role} - {new Date(request.created_at).toLocaleString('es-BO')}</p>
                        <p className="text-sm text-zinc-300 mt-2">Motivo: {request.request_reason}</p>
                        <p className="text-xs text-zinc-400 mt-1">
                          Actual: {currency(request.current_amount)} | Propuesto: {request.proposed_amount ? currency(request.proposed_amount) : 'sin cambio'}
                        </p>
                        {request.proposed_description ? (
                          <p className="text-xs text-zinc-400 mt-1">Descripcion propuesta: {request.proposed_description}</p>
                        ) : null}
                        {request.review_notes ? (
                          <p className="text-xs text-zinc-500 mt-2">Revision: {request.review_notes}</p>
                        ) : null}
                      </div>

                      {canAdminEdit && request.status === 'pending' ? (
                        <Button size="sm" onClick={() => openReviewRequestDialog(request)} disabled={isSubmitting}>
                          Revisar
                        </Button>
                      ) : (
                        <Badge className={
                          request.status === 'approved'
                            ? 'bg-emerald-600 text-white'
                            : request.status === 'rejected'
                              ? 'bg-rose-700 text-white'
                              : 'bg-zinc-600 text-white'
                        }>
                          {request.status}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        ) : null}

        <Dialog open={requestEditModalOpen} onOpenChange={setRequestEditModalOpen}>
          <DialogContent className="sm:max-w-xl">
            <DialogHeader>
              <DialogTitle>Solicitar Correccion de Movimiento</DialogTitle>
              <DialogDescription>Esta solicitud sera revisada y aplicada por un admin.</DialogDescription>
            </DialogHeader>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-sm font-medium">Monto propuesto (opcional)</label>
                <Input type="number" step="0.01" value={requestAmount} onChange={(event) => setRequestAmount(event.target.value)} placeholder="Ej: 120.50" />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium">Descripcion propuesta (opcional)</label>
                <Input value={requestDescription} onChange={(event) => setRequestDescription(event.target.value)} placeholder="Corregir concepto..." />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium">Motivo de la solicitud</label>
                <Textarea value={requestReason} onChange={(event) => setRequestReason(event.target.value)} placeholder="Explica por que se debe corregir..." />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="destructive" onClick={() => setRequestEditModalOpen(false)} disabled={isSubmitting}>Cancelar</Button>
                <Button onClick={() => void submitMovementEditRequest()} disabled={isSubmitting}>Enviar solicitud</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={adminEditModalOpen} onOpenChange={setAdminEditModalOpen}>
          <DialogContent className="sm:max-w-xl">
            <DialogHeader>
              <DialogTitle>Editar Movimiento (Admin)</DialogTitle>
              <DialogDescription>Aplica cambios directos sobre un movimiento de caja.</DialogDescription>
            </DialogHeader>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-sm font-medium">Nuevo monto</label>
                <Input type="number" step="0.01" value={adminNewAmount} onChange={(event) => setAdminNewAmount(event.target.value)} />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium">Nueva descripcion</label>
                <Input value={adminNewDescription} onChange={(event) => setAdminNewDescription(event.target.value)} />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium">Motivo de edicion (opcional)</label>
                <Textarea value={adminEditReason} onChange={(event) => setAdminEditReason(event.target.value)} placeholder="Detalle de la correccion..." />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="destructive" onClick={() => setAdminEditModalOpen(false)} disabled={isSubmitting}>Cancelar</Button>
                <Button onClick={() => void submitAdminMovementEdit()} disabled={isSubmitting}>Guardar cambios</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={reviewRequestModalOpen} onOpenChange={setReviewRequestModalOpen}>
          <DialogContent className="sm:max-w-xl">
            <DialogHeader>
              <DialogTitle>Revisar Solicitud</DialogTitle>
              <DialogDescription>Aprobar aplicara los cambios propuestos al movimiento.</DialogDescription>
            </DialogHeader>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-sm font-medium">Notas de revision (opcional)</label>
                <Textarea value={reviewNotes} onChange={(event) => setReviewNotes(event.target.value)} placeholder="Comentario de aprobacion/rechazo..." />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="destructive" onClick={() => void reviewEditRequest('reject')} disabled={isSubmitting}>Rechazar</Button>
                <Button onClick={() => void reviewEditRequest('approve')} disabled={isSubmitting}>Aprobar</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  )
}
