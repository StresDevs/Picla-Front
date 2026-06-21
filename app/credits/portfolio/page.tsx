'use client'

import { useEffect, useMemo, useState } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { PageHeader } from '@/components/common/page-header'
import { CreditsSubnav } from '@/components/modules/credits/credits-subnav'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { creditsService, type CreditPortfolioRow } from '@/lib/supabase/credits'
import { customersService, type CustomerRecord } from '@/lib/supabase/customers'
import { toast } from '@/hooks/use-toast'
import { ACTIVE_ROLE_EVENT, getActiveUserContext, type AppUserRole } from '@/lib/mock/runtime-store'

export default function CreditsPortfolioPage() {
  const [activeRole, setActiveRole] = useState<AppUserRole>(() => getActiveUserContext().role)
  const [activeBranchId, setActiveBranchId] = useState(() => getActiveUserContext().branch_id)

  const [credits, setCredits] = useState<CreditPortfolioRow[]>([])
  const [customers, setCustomers] = useState<CustomerRecord[]>([])
  const [customerIdFilter, setCustomerIdFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  const branchScope = activeRole === 'admin' ? null : activeBranchId

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
    const loadCustomers = async () => {
      try {
        const rows = await customersService.getList({
          branch_id: branchScope,
          search: null,
          include_inactive: false,
        })
        setCustomers(rows)
        setCustomerIdFilter((prev) => (prev !== 'all' && !rows.some((item) => item.id === prev) ? 'all' : prev))
      } catch (loadError) {
        toast({
          title: 'Error al cargar clientes',
          description:
            loadError instanceof Error ? loadError.message : 'No se pudieron cargar clientes',
          variant: 'destructive',
        })
      }
    }

    void loadCustomers()
  }, [branchScope])

  useEffect(() => {
    const loadCredits = async () => {
      setIsLoading(true)
      try {
        const rows = await creditsService.getPortfolio({
          branch_id: branchScope,
          customer_id: customerIdFilter === 'all' ? null : customerIdFilter,
          search: searchTerm.trim() || null,
        })
        setCredits(rows)
      } catch (loadError) {
        toast({
          title: 'Error al cargar créditos',
          description:
            loadError instanceof Error ? loadError.message : 'No se pudieron cargar créditos',
          variant: 'destructive',
        })
      } finally {
        setIsLoading(false)
      }
    }

    void loadCredits()
  }, [branchScope, customerIdFilter, searchTerm])

  const summary = useMemo(() => {
    const active = credits.filter((credit) => credit.status === 'active').length
    const overdue = credits.filter((credit) => credit.status === 'overdue').length
    const paid = credits.filter((credit) => credit.status === 'paid').length
    const balance = credits.reduce((sum, credit) => sum + credit.balance, 0)

    return {
      active,
      overdue,
      paid,
      balance,
    }
  }, [credits])

  return (
    <MainLayout>
      <div className="space-y-6">
        <PageHeader title="Cartera de Créditos" description="Vista global y por cliente de deudas por cobrar" />
        <CreditsSubnav />

        <Card className="card-info">
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6">
            <div className="space-y-2">
              <Label>Filtrar por cliente</Label>
              <Select value={customerIdFilter} onValueChange={setCustomerIdFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los clientes</SelectItem>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Búsqueda</Label>
              <Input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Buscar por cliente, producto o código"
              />
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="kpi-blue border-l-4 border-l-blue-500">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Activos</p>
              <p className="text-3xl font-semibold mt-2 text-blue-600 dark:text-blue-400">{summary.active}</p>
            </CardContent>
          </Card>
          <Card className="kpi-yellow border-l-4 border-l-amber-500">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Saldo por cobrar</p>
              <p className="text-3xl text-amber-600 dark:text-amber-400 font-semibold mt-2">Bs {summary.balance.toFixed(2)}</p>
            </CardContent>
          </Card>
          <Card className="kpi-red border-l-4 border-l-red-500">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Vencidos</p>
              <p className="text-3xl text-red-600 dark:text-red-400 font-semibold mt-2">{summary.overdue}</p>
            </CardContent>
          </Card>
          <Card className="kpi-green border-l-4 border-l-emerald-500">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Pagados</p>
              <p className="text-3xl text-emerald-600 dark:text-emerald-400 font-semibold mt-2">{summary.paid}</p>
            </CardContent>
          </Card>
        </div>

        <Card className="card-financial">
          <CardHeader>
            <CardTitle className="text-amber-700 dark:text-amber-300">💳 Créditos registrados</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              <p className="py-6 text-center text-sm text-muted-foreground">Cargando cartera...</p>
            ) : credits.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">No se encontraron créditos con los filtros aplicados.</p>
            ) : (
              credits.map((credit) => {
                const isOverdue = credit.status === 'overdue'
                const isPaid = credit.status === 'paid'
                const dueDate = new Date(credit.due_date)
                const today = new Date()
                const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
                const isNearDue = !isOverdue && !isPaid && daysUntilDue <= 5 && daysUntilDue >= 0

                const borderClass = isOverdue
                  ? 'border-rose-500/50 bg-rose-500/5'
                  : isPaid
                    ? 'border-emerald-500/50 bg-emerald-500/5'
                    : isNearDue
                      ? 'border-amber-500/50 bg-amber-500/5'
                      : 'border-border bg-card/70'

                const statusLabel = isOverdue
                  ? 'Vencido'
                  : isPaid
                    ? 'Pagado'
                    : isNearDue
                      ? 'Por vencer'
                      : 'Activo'

                const statusClass = isOverdue
                  ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                  : isPaid
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                    : isNearDue
                      ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                      : 'bg-sky-500/20 text-sky-400 border-sky-500/30'

                return (
                  <article key={credit.credit_id} className={`rounded-lg border ${borderClass} p-3 text-sm transition-colors`}>
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-foreground">Crédito - {credit.customer_name}</p>
                      <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${statusClass}`}>
                        {statusLabel}
                      </span>
                    </div>
                    <p className="text-muted-foreground mt-1">
                      Sucursal: {credit.branch_name} | Producto: {credit.product_name} | Vencimiento: {new Date(credit.due_date).toLocaleDateString('es-BO')}
                    </p>
                    <div className="flex gap-4 mt-1">
                      <span className="text-foreground/90">Total: Bs {credit.total_amount.toFixed(2)}</span>
                      <span className="text-emerald-400">Pagado: Bs {credit.paid_amount.toFixed(2)}</span>
                      <span className={isOverdue ? 'text-rose-400 font-semibold' : 'text-foreground/90'}>
                        Saldo: Bs {credit.balance.toFixed(2)}
                      </span>
                    </div>
                    {isOverdue && (
                      <p className="text-[11px] text-rose-400 mt-1">⚠ Vencido hace {Math.abs(daysUntilDue)} días</p>
                    )}
                    {isNearDue && (
                      <p className="text-[11px] text-amber-400 mt-1">⏰ Vence en {daysUntilDue} {daysUntilDue === 1 ? 'día' : 'días'}</p>
                    )}
                  </article>
                )
              })
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}
