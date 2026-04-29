'use client'

import { useEffect, useMemo, useState } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { PageHeader } from '@/components/common/page-header'
import { CreditsSubnav } from '@/components/modules/credits/credits-subnav'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { creditsService, type CreditKardexRow } from '@/lib/supabase/credits'
import { customersService, type CustomerRecord } from '@/lib/supabase/customers'
import { branchesService } from '@/lib/supabase/inventory'
import { toast } from '@/hooks/use-toast'
import { ACTIVE_ROLE_EVENT, getActiveUserContext, type AppUserRole } from '@/lib/mock/runtime-store'

interface BranchOption {
  id: string
  name: string
}

function formatMovement(movement: CreditKardexRow['movement_type']) {
  return movement === 'credit_payment' ? 'Pago' : 'Alta crédito'
}

export default function CreditsKardexPage() {
  const [activeRole, setActiveRole] = useState<AppUserRole>(() => getActiveUserContext().role)
  const [activeBranchId, setActiveBranchId] = useState(() => getActiveUserContext().branch_id)

  const [branches, setBranches] = useState<BranchOption[]>([])
  const [customers, setCustomers] = useState<CustomerRecord[]>([])

  const [branchFilter, setBranchFilter] = useState('all')
  const [customerFilter, setCustomerFilter] = useState('all')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')

  const [records, setRecords] = useState<CreditKardexRow[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const resolvedBranchId = useMemo(() => {
    if (activeRole !== 'admin') return activeBranchId
    return branchFilter === 'all' ? null : branchFilter
  }, [activeRole, activeBranchId, branchFilter])

  useEffect(() => {
    const syncContext = () => {
      const context = getActiveUserContext()
      setActiveRole(context.role)
      setActiveBranchId(context.branch_id)
      if (context.role !== 'admin') {
        setBranchFilter(context.branch_id)
      }
    }

    syncContext()
    window.addEventListener(ACTIVE_ROLE_EVENT, syncContext)

    return () => {
      window.removeEventListener(ACTIVE_ROLE_EVENT, syncContext)
    }
  }, [])

  useEffect(() => {
    const loadFilters = async () => {
      try {
        const [branchRows, customerRows] = await Promise.all([
          branchesService.getAll(),
          customersService.getList({
            branch_id: resolvedBranchId,
            search: null,
            include_inactive: false,
          }),
        ])

        setBranches(branchRows)
        setCustomers(customerRows)
        setCustomerFilter((prev) => (prev !== 'all' && !customerRows.some((item) => item.id === prev) ? 'all' : prev))
      } catch (loadError) {
        toast({
          title: 'Error al cargar filtros',
          description:
            loadError instanceof Error ? loadError.message : 'No se pudo cargar filtros',
          variant: 'destructive',
        })
      }
    }

    void loadFilters()
  }, [resolvedBranchId])

  useEffect(() => {
    const loadKardex = async () => {
      setIsLoading(true)
      try {
        const rows = await creditsService.getKardex({
          branch_id: resolvedBranchId,
          customer_id: customerFilter === 'all' ? null : customerFilter,
          from: fromDate || null,
          to: toDate || null,
        })
        setRecords(rows)
      } catch (loadError) {
        toast({
          title: 'Error al cargar movimientos',
          description:
            loadError instanceof Error ? loadError.message : 'No se pudieron cargar movimientos',
          variant: 'destructive',
        })
      } finally {
        setIsLoading(false)
      }
    }

    void loadKardex()
  }, [resolvedBranchId, customerFilter, fromDate, toDate])

  return (
    <MainLayout>
      <div className="space-y-6">
        <PageHeader title="Historial de cobros" description="Movimientos históricos de créditos y cuentas por cobrar" />
        <CreditsSubnav />

        <Card>
          <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="space-y-2">
              <Label>Sucursal</Label>
              <Select value={branchFilter} onValueChange={setBranchFilter} disabled={activeRole !== 'admin'}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {branches.map((branch) => (
                    <SelectItem key={branch.id} value={branch.id}>
                      {branch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Cliente</Label>
              <Select value={customerFilter} onValueChange={setCustomerFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Desde</Label>
              <Input type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Hasta</Label>
              <Input type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Movimientos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              <p className="py-6 text-center text-sm text-muted-foreground">Cargando movimientos...</p>
            ) : records.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">No hay movimientos para los filtros seleccionados.</p>
            ) : (
              records.map((record) => (
                <div key={record.movement_id} className="rounded-lg border border-border bg-card/70 p-3 text-sm">
                  <p className="font-semibold text-foreground">{record.credit_id} - {formatMovement(record.movement_type)}</p>
                  <p className="text-muted-foreground">Cliente: {record.customer_name} | Sucursal: {record.branch_name}</p>
                  <p className="text-foreground/90">Monto: Bs {Number(record.amount).toFixed(2)} | Fecha: {record.movement_date}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}
