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
import { ACTIVE_ROLE_EVENT, getActiveUserContext, type AppUserRole } from '@/lib/mock/runtime-store'

export default function CreditsPortfolioPage() {
  const [activeRole, setActiveRole] = useState<AppUserRole>(() => getActiveUserContext().role)
  const [activeBranchId, setActiveBranchId] = useState(() => getActiveUserContext().branch_id)

  const [credits, setCredits] = useState<CreditPortfolioRow[]>([])
  const [customers, setCustomers] = useState<CustomerRecord[]>([])
  const [customerIdFilter, setCustomerIdFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
      setError(null)
      try {
        const rows = await customersService.getList({
          branch_id: branchScope,
          search: null,
          include_inactive: false,
        })
        setCustomers(rows)
        setCustomerIdFilter((prev) => (prev !== 'all' && !rows.some((item) => item.id === prev) ? 'all' : prev))
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'No se pudieron cargar clientes')
      }
    }

    void loadCustomers()
  }, [branchScope])

  useEffect(() => {
    const loadCredits = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const rows = await creditsService.getPortfolio({
          branch_id: branchScope,
          customer_id: customerIdFilter === 'all' ? null : customerIdFilter,
          search: searchTerm.trim() || null,
        })
        setCredits(rows)
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'No se pudieron cargar créditos')
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

        <Card>
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
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Activos</p>
              <p className="text-3xl font-semibold mt-2">{summary.active}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Saldo por cobrar</p>
              <p className="text-3xl text-primary font-semibold mt-2">Bs {summary.balance.toFixed(2)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Vencidos</p>
              <p className="text-3xl text-destructive font-semibold mt-2">{summary.overdue}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Pagados</p>
              <p className="text-3xl text-secondary font-semibold mt-2">{summary.paid}</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Créditos registrados</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              <p className="py-6 text-center text-sm text-muted-foreground">Cargando cartera...</p>
            ) : credits.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">No se encontraron créditos con los filtros aplicados.</p>
            ) : (
              credits.map((credit) => (
                <article key={credit.credit_id} className="rounded-lg border border-border bg-card/70 p-3 text-sm">
                  <p className="font-semibold text-foreground">{credit.credit_id} - {credit.customer_name}</p>
                  <p className="text-muted-foreground">
                    Sucursal: {credit.branch_name} | Producto: {credit.product_name} | Vencimiento: {new Date(credit.due_date).toLocaleDateString('es-BO')}
                  </p>
                  <p className="text-foreground/90">
                    Total: Bs {credit.total_amount.toFixed(2)} | Pagado: Bs {credit.paid_amount.toFixed(2)} | Saldo: Bs {credit.balance.toFixed(2)}
                  </p>
                </article>
              ))
            )}
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}
