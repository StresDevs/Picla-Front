'use client'

import { useEffect, useMemo, useState } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { PageHeader } from '@/components/common/page-header'
import { ManagementSubnav } from '@/components/modules/management/management-subnav'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { mockBranches } from '@/lib/mock/data'
import {
  ACTIVE_ROLE_EVENT,
  confirmPayrollPayment,
  createPayrollPayment,
  getActiveUserContext,
  getConfirmedPayrollTotal,
  getPayrollConfigs,
  getPayrollPayments,
  getUsers,
  upsertPayrollConfig,
  type AppUserRole,
} from '@/lib/mock/runtime-store'

export default function ManagementPayrollPage() {
  const [activeRole, setActiveRole] = useState<AppUserRole>(() => getActiveUserContext().role)
  const [activeUserName, setActiveUserName] = useState(() => getActiveUserContext().user_name)

  const [configs, setConfigs] = useState(() => getPayrollConfigs())
  const [payments, setPayments] = useState(() => getPayrollPayments())
  const [feedback, setFeedback] = useState<string | null>(null)

  const [configRole, setConfigRole] = useState<AppUserRole>('employee')
  const [configBranch, setConfigBranch] = useState(mockBranches[0]?.id || 'branch-1')
  const [configAmount, setConfigAmount] = useState('')
  const [configPeriodicity, setConfigPeriodicity] = useState<'monthly' | 'biweekly' | 'weekly'>('monthly')

  const users = useMemo(() => getUsers().filter((user) => user.role !== 'read_only'), [])
  const [selectedUserId, setSelectedUserId] = useState(users[0]?.id || '')
  const [paymentAmount, setPaymentAmount] = useState('')
  const [periodLabel, setPeriodLabel] = useState('Abril 2026')

  useEffect(() => {
    const syncContext = () => {
      const context = getActiveUserContext()
      setActiveRole(context.role)
      setActiveUserName(context.user_name)
    }

    syncContext()
    window.addEventListener(ACTIVE_ROLE_EVENT, syncContext)
    window.addEventListener('focus', syncContext)

    return () => {
      window.removeEventListener(ACTIVE_ROLE_EVENT, syncContext)
      window.removeEventListener('focus', syncContext)
    }
  }, [])

  const pendingPayments = useMemo(() => payments.filter((payment) => payment.status === 'pending'), [payments])
  const confirmedTotal = useMemo(() => getConfirmedPayrollTotal(), [payments])

  if (activeRole !== 'admin') {
    return (
      <MainLayout>
        <div className="space-y-6">
          <PageHeader title="Planilla de Sueldos" description="Configuración y confirmación de pagos (solo admin)" />
          <ManagementSubnav />

          <Card>
            <CardHeader>
              <CardTitle>Acceso restringido</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Solo administradores pueden ver y confirmar pagos de sueldos.</p>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    )
  }

  const registerConfig = () => {
    setFeedback(null)
    const amount = Number(configAmount)
    if (!amount || amount <= 0) {
      setFeedback('Ingresa un monto válido para la configuración salarial.')
      return
    }

    const saved = upsertPayrollConfig({
      role: configRole,
      branch_id: configBranch,
      amount,
      periodicity: configPeriodicity,
      active: true,
    })

    if (!saved) {
      setFeedback('No se pudo guardar la configuración salarial.')
      return
    }

    setConfigs(getPayrollConfigs())
    setConfigAmount('')
    setFeedback('Configuración salarial guardada.')
  }

  const registerPayment = () => {
    setFeedback(null)

    const user = users.find((item) => item.id === selectedUserId)
    const amount = Number(paymentAmount)

    if (!user || !amount || amount <= 0 || !periodLabel.trim()) {
      setFeedback('Completa usuario, monto y periodo para registrar pago pendiente.')
      return
    }

    createPayrollPayment({
      user_id: user.id,
      user_name: user.full_name,
      role: user.role,
      branch_id: user.branch_id,
      amount,
      period_label: periodLabel.trim(),
    })

    setPayments(getPayrollPayments())
    setPaymentAmount('')
    setFeedback('Pago pendiente creado. La ganancia se descuenta al confirmar.')
  }

  const confirmPayment = (paymentId: string) => {
    const result = confirmPayrollPayment({
      payroll_payment_id: paymentId,
      confirmed_by: activeUserName,
      confirmed_by_role: activeRole,
    })

    if (!result.ok) {
      setFeedback(result.error)
      return
    }

    setPayments(getPayrollPayments())
    setFeedback(`Pago ${paymentId} confirmado. Ya se considera para descuento de ganancias.`)
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <PageHeader title="Planilla de Sueldos" description="Configura pagos por rol y confirma sueldos para descontar ganancias" />
        <ManagementSubnav />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Configuraciones activas</p>
              <p className="text-3xl font-semibold mt-2">{configs.filter((item) => item.active).length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Pagos pendientes</p>
              <p className="text-3xl font-semibold mt-2 text-amber-500">{pendingPayments.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Sueldos confirmados (descuento aplicado)</p>
              <p className="text-3xl font-semibold mt-2 text-rose-500">Bs {confirmedTotal.toFixed(2)}</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Configuración de sueldo por rol</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <div className="space-y-2">
              <p className="text-sm font-medium">Rol</p>
              <Select value={configRole} onValueChange={(value: AppUserRole) => setConfigRole(value)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="manager">Encargado</SelectItem>
                  <SelectItem value="employee">Empleado</SelectItem>
                  <SelectItem value="read_only">Solo lectura</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Sucursal</p>
              <Select value={configBranch} onValueChange={setConfigBranch}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {mockBranches.map((branch) => (
                    <SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Periodicidad</p>
              <Select value={configPeriodicity} onValueChange={(value: 'monthly' | 'biweekly' | 'weekly') => setConfigPeriodicity(value)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Mensual</SelectItem>
                  <SelectItem value="biweekly">Quincenal</SelectItem>
                  <SelectItem value="weekly">Semanal</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Monto</p>
              <Input type="number" value={configAmount} onChange={(event) => setConfigAmount(event.target.value)} placeholder="0.00" />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Acción</p>
              <Button className="w-full" onClick={registerConfig}>Guardar configuración</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Crear pago pendiente</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="space-y-2">
              <p className="text-sm font-medium">Usuario</p>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>{user.full_name} ({user.role})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Periodo</p>
              <Input value={periodLabel} onChange={(event) => setPeriodLabel(event.target.value)} placeholder="Abril 2026" />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Monto</p>
              <Input type="number" value={paymentAmount} onChange={(event) => setPaymentAmount(event.target.value)} placeholder="0.00" />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Acción</p>
              <Button className="w-full" onClick={registerPayment}>Registrar pendiente</Button>
            </div>
          </CardContent>
        </Card>

        {feedback ? (
          <div className="rounded-lg border border-primary/25 bg-primary/10 px-3 py-2 text-sm text-primary">
            {feedback}
          </div>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle>Pagos registrados</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {payments.map((payment) => (
              <div key={payment.id} className="rounded-lg border border-border/70 bg-card/70 p-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold">{payment.user_name} - {payment.period_label}</p>
                  <Badge className={payment.status === 'confirmed' ? 'bg-emerald-600 text-white' : 'bg-amber-600 text-white'}>
                    {payment.status === 'confirmed' ? 'Confirmado' : 'Pendiente'}
                  </Badge>
                </div>
                <p className="text-muted-foreground">Rol: {payment.role} | Monto: Bs {payment.amount.toFixed(2)}</p>
                <p className="text-muted-foreground">Sucursal: {mockBranches.find((branch) => branch.id === payment.branch_id)?.name || payment.branch_id}</p>
                {payment.status === 'confirmed' ? (
                  <p className="text-muted-foreground">Confirmado por {payment.confirmed_by} el {payment.confirmed_at ? new Date(payment.confirmed_at).toLocaleString('es-BO') : '-'}</p>
                ) : (
                  <div className="mt-2">
                    <Button size="sm" onClick={() => confirmPayment(payment.id)}>Confirmar pago</Button>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}
