'use client'

import { useMemo, useState } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { PageHeader } from '@/components/common/page-header'
import { CreditsSubnav } from '@/components/modules/credits/credits-subnav'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { getCredits, getCustomers } from '@/lib/mock/runtime-store'

export default function CreditsPortfolioPage() {
  const [credits] = useState(() => getCredits())
  const [customers] = useState(() => getCustomers())
  const [customerIdFilter, setCustomerIdFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')

  const filteredCredits = useMemo(() => {
    return credits.filter((credit) => {
      const byCustomer = customerIdFilter === 'all' || credit.customer_id === customerIdFilter
      const query = searchTerm.trim().toLowerCase()
      const byQuery =
        query.length === 0 ||
        credit.id.toLowerCase().includes(query) ||
        credit.customer_name.toLowerCase().includes(query) ||
        credit.product_name.toLowerCase().includes(query)

      return byCustomer && byQuery
    })
  }, [credits, customerIdFilter, searchTerm])

  const summary = useMemo(() => {
    const active = filteredCredits.filter((credit) => credit.status === 'registered').length
    const overdue = filteredCredits.filter((credit) => credit.status === 'overdue').length
    const paid = filteredCredits.filter((credit) => credit.status === 'paid').length
    const balance = filteredCredits.reduce((sum, credit) => sum + credit.balance, 0)

    return {
      active,
      overdue,
      paid,
      balance,
    }
  }, [filteredCredits])

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
          <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Registrados</p><p className="text-3xl font-semibold mt-2">{summary.active}</p></CardContent></Card>
          <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Saldo por cobrar</p><p className="text-3xl text-primary font-semibold mt-2">Bs {summary.balance.toFixed(2)}</p></CardContent></Card>
          <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Vencidos</p><p className="text-3xl text-destructive font-semibold mt-2">{summary.overdue}</p></CardContent></Card>
          <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Pagados</p><p className="text-3xl text-secondary font-semibold mt-2">{summary.paid}</p></CardContent></Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Créditos registrados</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {filteredCredits.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">No se encontraron créditos con los filtros aplicados.</p>
            ) : (
              filteredCredits.map((credit) => (
                <article key={credit.id} className="rounded-lg border border-border bg-card/70 p-3 text-sm">
                  <p className="font-semibold text-foreground">{credit.id} - {credit.customer_name}</p>
                  <p className="text-muted-foreground">
                    Sucursal: {credit.branch_name} | Producto: {credit.product_name} | Vencimiento: {new Date(credit.due_date).toLocaleDateString('es-BO')}
                  </p>
                  <p className="text-foreground/90">
                    Total: Bs {credit.total_amount.toFixed(2)} | Pagado: Bs {credit.paid_amount.toFixed(2)} | Saldo: Bs {credit.balance.toFixed(2)}
                  </p>
                </article>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}
