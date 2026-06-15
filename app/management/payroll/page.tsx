'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { PageHeader } from '@/components/common/page-header'
import { ManagementSubnav } from '@/components/modules/management/management-subnav'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { getSupabaseClient } from '@/lib/supabase/client'
import { posService, type TopSellerRecord } from '@/lib/supabase/pos'
import type { PayrollScheduleRecord, PayrollHistoryRecord } from '@/lib/supabase/payroll'
import { ACTIVE_ROLE_EVENT, getActiveUserContext, type AppUserRole } from '@/lib/mock/runtime-store'
import { showConfirmAlert, showErrorAlert } from '@/lib/sweet-alert'

interface PayrollUserOption {
  id: string
  full_name: string
  branch_id: string | null
  branch_name: string | null
  role_name: string | null
}

function formatBs(value: number) {
  return `Bs ${value.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

async function getAuthToken() {
  const supabase = getSupabaseClient()
  const { data } = await supabase.auth.getSession()
  return data.session?.access_token || null
}

export default function ManagementPayrollPage() {
  const [activeRole, setActiveRole] = useState<AppUserRole>(() => getActiveUserContext().role)

  const [users, setUsers] = useState<PayrollUserOption[]>([])
  const [schedules, setSchedules] = useState<PayrollScheduleRecord[]>([])
  const [history, setHistory] = useState<PayrollHistoryRecord[]>([])
  const [topSellers, setTopSellers] = useState<TopSellerRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [feedback, setFeedback] = useState<string | null>(null)

  const [selectedUserId, setSelectedUserId] = useState('')
  const [dueDate, setDueDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [amount, setAmount] = useState('')
  const [notes, setNotes] = useState('')

  const [editingSchedule, setEditingSchedule] = useState<PayrollScheduleRecord | null>(null)
  const [editAmount, setEditAmount] = useState('')
  const [editDueDate, setEditDueDate] = useState('')
  const [editNotes, setEditNotes] = useState('')

  useEffect(() => {
    const syncContext = () => setActiveRole(getActiveUserContext().role)
    syncContext()
    window.addEventListener(ACTIVE_ROLE_EVENT, syncContext)
    window.addEventListener('focus', syncContext)
    return () => {
      window.removeEventListener(ACTIVE_ROLE_EVENT, syncContext)
      window.removeEventListener('focus', syncContext)
    }
  }, [])

  const loadData = useCallback(async () => {
    setIsLoading(true)
    setFeedback(null)

    const token = await getAuthToken()
    if (!token) {
      setFeedback('Sesión inválida. Vuelve a iniciar sesión.')
      setIsLoading(false)
      return
    }

    try {
      const now = new Date()
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
      const today = now.toISOString().slice(0, 10)

      const [usersResponse, schedulesResponse, historyResponse, sellers] = await Promise.all([
        fetch('/api/payroll/users', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/payroll', { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`/api/payroll/history?date_from=${monthStart}&date_to=${today}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        posService.getTopSellers({ branch_id: null, limit: 9999 }),
      ])

      if (!usersResponse.ok || !schedulesResponse.ok || !historyResponse.ok) {
        setFeedback('No se pudo cargar la información de planilla.')
        setIsLoading(false)
        return
      }

      const usersData = (await usersResponse.json()) as PayrollUserOption[]
      const schedulesData = (await schedulesResponse.json()) as PayrollScheduleRecord[]
      const historyData = (await historyResponse.json()) as PayrollHistoryRecord[]

      setUsers(usersData)
      setSchedules(schedulesData)
      setHistory(historyData)
      setTopSellers(sellers)
      setSelectedUserId((current) => current || usersData[0]?.id || '')
    } catch {
      setFeedback('No se pudo cargar la información de planilla.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (activeRole !== 'admin') return
    void loadData()
  }, [activeRole, loadData])

  const sellerRankMap = useMemo(() => {
    const map = new Map<string, { rank: number; sales_count: number }>()
    topSellers.forEach((seller, index) => {
      map.set(seller.seller_id, { rank: index + 1, sales_count: seller.sales_count })
    })
    return map
  }, [topSellers])

  const activeSchedules = useMemo(() => schedules.filter((schedule) => schedule.status === 'active'), [schedules])

  const upcomingCount = useMemo(() => {
    const today = new Date()
    const limit = new Date(today)
    limit.setDate(limit.getDate() + 5)
    return activeSchedules.filter((schedule) => {
      const due = new Date(schedule.due_date)
      return due <= limit
    }).length
  }, [activeSchedules])

  const paidThisMonth = useMemo(
    () => history.reduce((sum, record) => sum + Number(record.amount), 0),
    [history]
  )

  if (activeRole !== 'admin') {
    return (
      <MainLayout>
        <div className="space-y-6">
          <PageHeader title="Planilla de Sueldos" description="Registro y pago de sueldos por usuario (solo admin)" />
          <ManagementSubnav />
          <Card>
            <CardHeader><CardTitle>Acceso restringido</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Solo administradores pueden ver y registrar pagos de sueldos.</p>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    )
  }

  const registerSchedule = async () => {
    setFeedback(null)
    const user = users.find((item) => item.id === selectedUserId)
    const parsedAmount = Number(amount)
    if (!user || !parsedAmount || parsedAmount <= 0 || !dueDate) {
      setFeedback('Completa usuario, monto y fecha de primer pago para registrar la planilla.')
      return
    }
    const token = await getAuthToken()
    if (!token) { setFeedback('Sesión inválida. Vuelve a iniciar sesión.'); return }

    const response = await fetch('/api/payroll', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        user_id: user.id,
        branch_id: user.branch_id,
        amount: parsedAmount,
        due_date: dueDate,
        notes: notes.trim() || null,
      }),
    })

    if (!response.ok) {
      const data = await response.json().catch(() => null)
      setFeedback(data?.error || 'No se pudo registrar la planilla.')
      return
    }

    setAmount('')
    setNotes('')
    setFeedback('Planilla de sueldo registrada.')
    await loadData()
  }

  const markAsPaid = async (scheduleId: string) => {
    setFeedback(null)
    const token = await getAuthToken()
    if (!token) { setFeedback('Sesión inválida. Vuelve a iniciar sesión.'); return }

    const response = await fetch(`/api/payroll/${scheduleId}/pay`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    })

    if (!response.ok) {
      const data = await response.json().catch(() => null)
      setFeedback(data?.error || 'No se pudo registrar el pago.')
      return
    }

    setFeedback('Pago registrado. La próxima fecha de pago se actualizó.')
    await loadData()
  }

  const toggleScheduleStatus = async (scheduleId: string, nextStatus: 'active' | 'inactive') => {
    setFeedback(null)
    const token = await getAuthToken()
    if (!token) { setFeedback('Sesión inválida. Vuelve a iniciar sesión.'); return }

    const response = await fetch(`/api/payroll/${scheduleId}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status: nextStatus }),
    })

    if (!response.ok) {
      const data = await response.json().catch(() => null)
      setFeedback(data?.error || 'No se pudo actualizar la planilla.')
      return
    }

    setFeedback(nextStatus === 'active' ? 'Planilla reactivada.' : 'Planilla desactivada.')
    await loadData()
  }

  const openEditDialog = (schedule: PayrollScheduleRecord) => {
    setEditingSchedule(schedule)
    setEditAmount(String(schedule.amount))
    setEditDueDate(schedule.due_date.slice(0, 10))
    setEditNotes(schedule.notes || '')
  }

  const handleUpdateSchedule = async () => {
    if (!editingSchedule) return

    const parsedAmount = Number(editAmount)
    if (!parsedAmount || parsedAmount <= 0 || !editDueDate) {
      await showErrorAlert('Completa un monto válido y la fecha de próximo pago.')
      return
    }

    const token = await getAuthToken()
    if (!token) { setFeedback('Sesión inválida. Vuelve a iniciar sesión.'); return }

    const response = await fetch(`/api/payroll/${editingSchedule.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        amount: parsedAmount,
        due_date: editDueDate,
        notes: editNotes.trim() || null,
      }),
    })

    if (!response.ok) {
      const data = await response.json().catch(() => null)
      await showErrorAlert(data?.error || 'No se pudo actualizar la planilla.')
      return
    }

    setEditingSchedule(null)
    setFeedback('Planilla actualizada.')
    await loadData()
  }

  const handleDeleteSchedule = async (schedule: PayrollScheduleRecord) => {
    const confirmed = await showConfirmAlert({
      text: `Se eliminará la planilla de ${schedule.user_name} y su historial de pagos.`,
      confirmButtonText: 'Sí, eliminar',
    })
    if (!confirmed) return

    setFeedback(null)
    const token = await getAuthToken()
    if (!token) { setFeedback('Sesión inválida. Vuelve a iniciar sesión.'); return }

    const response = await fetch(`/api/payroll/${schedule.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })

    if (!response.ok) {
      const data = await response.json().catch(() => null)
      await showErrorAlert(data?.error || 'No se pudo eliminar la planilla.')
      return
    }

    setFeedback('Planilla eliminada.')
    await loadData()
  }

  const renderSalesRanking = (userId: string) => {
    const ranking = sellerRankMap.get(userId)
    if (!ranking) {
      return <p className="text-muted-foreground">Sin ventas registradas.</p>
    }
    return (
      <p className="text-muted-foreground">
        Posición #{ranking.rank} en ventas ({ranking.sales_count} venta{ranking.sales_count !== 1 ? 's' : ''})
      </p>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <PageHeader title="Planilla de Sueldos" description="Registra planillas de sueldo recurrentes y confirma sus pagos" />
        <ManagementSubnav />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card><CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Planillas activas</p>
            <p className="text-3xl font-semibold mt-2 text-amber-500">{activeSchedules.length}</p>
          </CardContent></Card>
          <Card><CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Próximos a vencer (≤5 días)</p>
            <p className="text-3xl font-semibold mt-2 text-amber-500">{upcomingCount}</p>
          </CardContent></Card>
          <Card><CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Pagado este mes</p>
            <p className="text-3xl font-semibold mt-2 text-rose-500">{formatBs(paidThisMonth)}</p>
          </CardContent></Card>
        </div>

        <Card>
          <CardHeader><CardTitle>Registrar planilla de sueldo</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="space-y-2">
              <p className="text-sm font-medium">Usuario</p>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.full_name}{user.branch_name ? ` (${user.branch_name})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Fecha de primer pago</p>
              <Input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Monto</p>
              <Input type="number" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="0.00" />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Acción</p>
              <Button className="w-full" onClick={() => void registerSchedule()}>Registrar planilla</Button>
            </div>
            <div className="space-y-2 md:col-span-4">
              <p className="text-sm font-medium">Notas (opcional)</p>
              <Input value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Ej. adelanto de quincena" />
            </div>
          </CardContent>
        </Card>

        {feedback ? (
          <div className="rounded-lg border border-primary/25 bg-primary/10 px-3 py-2 text-sm text-primary">
            {feedback}
          </div>
        ) : null}

        <Card>
          <CardHeader><CardTitle>Planillas registradas</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              <p className="text-sm text-muted-foreground py-6 text-center">Cargando planillas...</p>
            ) : schedules.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">No hay planillas registradas.</p>
            ) : (
              schedules.map((schedule) => (
                <div key={schedule.id} className="rounded-lg border border-border/70 bg-card/70 p-3 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold">{schedule.user_name}</p>
                    <Badge className={schedule.status === 'active' ? 'bg-emerald-600 text-white' : 'bg-muted text-muted-foreground'}>
                      {schedule.status === 'active' ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground">
                    Monto: {formatBs(Number(schedule.amount))} | Próximo pago: {new Date(schedule.due_date).toLocaleDateString('es-BO')}
                  </p>
                  {schedule.branch_name ? <p className="text-muted-foreground">Sucursal: {schedule.branch_name}</p> : null}
                  {schedule.notes ? <p className="text-muted-foreground">Notas: {schedule.notes}</p> : null}
                  {renderSalesRanking(schedule.user_id)}
                  {schedule.last_paid_at ? (
                    <p className="text-muted-foreground">
                      Último pago: {new Date(schedule.last_paid_at).toLocaleString('es-BO')} por {schedule.last_paid_by}
                    </p>
                  ) : null}
                  <div className="mt-2 flex flex-wrap gap-2">
                    {schedule.status === 'active' ? (
                      <Button size="sm" onClick={() => void markAsPaid(schedule.id)}>Marcar como pagado</Button>
                    ) : null}
                    {schedule.status === 'active' ? (
                      <Button size="sm" variant="outline" onClick={() => void toggleScheduleStatus(schedule.id, 'inactive')}>Desactivar</Button>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => void toggleScheduleStatus(schedule.id, 'active')}>Reactivar</Button>
                    )}
                    <Button size="sm" variant="outline" onClick={() => openEditDialog(schedule)}>Editar</Button>
                    <Button size="sm" variant="destructive" onClick={() => void handleDeleteSchedule(schedule)}>Eliminar</Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Dialog open={Boolean(editingSchedule)} onOpenChange={(open) => { if (!open) setEditingSchedule(null) }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar planilla de sueldo</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-2">
                <Label>Monto</Label>
                <Input type="number" value={editAmount} onChange={(event) => setEditAmount(event.target.value)} placeholder="0.00" />
              </div>
              <div className="space-y-2">
                <Label>Próximo pago</Label>
                <Input type="date" value={editDueDate} onChange={(event) => setEditDueDate(event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Notas</Label>
                <Input value={editNotes} onChange={(event) => setEditNotes(event.target.value)} placeholder="Ej. adelanto de quincena" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setEditingSchedule(null)}>Cancelar</Button>
                <Button onClick={() => void handleUpdateSchedule()}>Guardar cambios</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  )
}
