'use client'

import { useMemo, useState } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { PageHeader } from '@/components/common/page-header'
import { POSSubnav } from '@/components/modules/pos/pos-subnav'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { mockBranches } from '@/lib/mock/data'
import { getQueuedSales, getSales } from '@/lib/mock/runtime-store'

const paymentLabels: Record<string, string> = {
  cash: 'Efectivo',
  qr: 'QR/Transferencia',
  credit: 'Crédito',
}

export default function POSSalesHistoryPage() {
  const [branchFilter, setBranchFilter] = useState('all')
  const [paymentFilter, setPaymentFilter] = useState('all')

  const sales = useMemo(() => getSales(), [])
  const queuedSales = useMemo(() => getQueuedSales(), [])

  const filteredSales = useMemo(() => {
    return sales.filter((sale) => {
      const byBranch = branchFilter === 'all' || sale.branch_id === branchFilter
      const byPayment = paymentFilter === 'all' || sale.payment_method === paymentFilter
      return byBranch && byPayment
    })
  }, [sales, branchFilter, paymentFilter])

  const filteredQueue = useMemo(() => {
    return queuedSales.filter((sale) => {
      const byBranch = branchFilter === 'all' || sale.branch_id === branchFilter
      const byPayment = paymentFilter === 'all' || sale.payment_method === paymentFilter
      return byBranch && byPayment
    })
  }, [queuedSales, branchFilter, paymentFilter])

  return (
    <MainLayout>
      <div className="space-y-6">
        <PageHeader title="Historial de Ventas" description="Registro mock de ventas realizadas y ventas en cola" />
        <POSSubnav />

        <Card>
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-2">
              <p className="text-sm font-medium">Sucursal</p>
              <Select value={branchFilter} onValueChange={setBranchFilter}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {mockBranches.map((branch) => (
                    <SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Método de pago</p>
              <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="cash">Efectivo</SelectItem>
                  <SelectItem value="qr">QR/Transferencia</SelectItem>
                  <SelectItem value="credit">Crédito</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Resumen</p>
              <div className="rounded-lg border border-border/70 bg-muted/20 px-3 py-2 text-sm">
                {filteredSales.length} ventas confirmadas / {filteredQueue.length} en cola
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ventas confirmadas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {filteredSales.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay ventas confirmadas para el filtro seleccionado.</p>
            ) : (
              filteredSales.map((sale) => (
                <div key={sale.id} className="rounded-lg border border-border/70 bg-card/70 p-3 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold">{sale.id}</p>
                    <Badge className="bg-emerald-600 text-white">Confirmada</Badge>
                  </div>
                  <p className="text-muted-foreground">
                    Sucursal: {mockBranches.find((branch) => branch.id === sale.branch_id)?.name || sale.branch_id}
                  </p>
                  <p className="text-muted-foreground">Usuario: {sale.user_name} ({sale.user_role || 'N/A'})</p>
                  <p className="text-muted-foreground">Método: {paymentLabels[sale.payment_method] || sale.payment_method}</p>
                  <p className="font-semibold text-primary mt-1">Bs {sale.total_amount.toFixed(2)}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ventas en cola</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {filteredQueue.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay ventas en cola para el filtro seleccionado.</p>
            ) : (
              filteredQueue.map((sale) => (
                <div key={sale.id} className="rounded-lg border border-border/70 bg-card/70 p-3 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold">{sale.id}</p>
                    <Badge className={sale.status === 'queued' ? 'bg-amber-600 text-white' : sale.status === 'approved' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'}>
                      {sale.status === 'queued' ? 'En cola' : sale.status === 'approved' ? 'Aprobada' : 'Rechazada'}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground">Creada por: {sale.created_by_name} ({sale.created_by_role})</p>
                  <p className="text-muted-foreground">Método: {paymentLabels[sale.payment_method] || sale.payment_method}</p>
                  <p className="font-semibold text-primary mt-1">Bs {sale.total_amount_bob.toFixed(2)}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}
