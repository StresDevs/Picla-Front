'use client'

import { useEffect, useMemo, useState } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { PageHeader } from '@/components/common/page-header'
import { POSSubnav } from '@/components/modules/pos/pos-subnav'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { ACTIVE_ROLE_EVENT, getActiveUserContext } from '@/lib/mock/runtime-store'
import { mockBranches } from '@/lib/mock/data'
import { posService, type POSQueuedSale, type POSSaleRecord } from '@/lib/supabase/pos'

const paymentLabels: Record<string, string> = {
  cash: 'Efectivo',
  card: 'Tarjeta',
  qr: 'QR/Transferencia',
}

export default function POSSalesHistoryPage() {
  const [branchFilter, setBranchFilter] = useState('active')
  const [paymentFilter, setPaymentFilter] = useState('all')
  const [sales, setSales] = useState<POSSaleRecord[]>([])
  const [queuedSales, setQueuedSales] = useState<POSQueuedSale[]>([])
  const [activeBranchId, setActiveBranchId] = useState('branch-1')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadData = async (contextBranch?: string) => {
    setIsLoading(true)
    setError(null)

    try {
      const branchId = contextBranch || getActiveUserContext().branch_id
      const queryBranch = branchFilter === 'all' ? branchId : branchId
      const [salesData, queueData] = await Promise.all([
        posService.getSales(queryBranch, true),
        posService.getQueuedSales({ branch_id: queryBranch }),
      ])

      setSales(salesData)
      setQueuedSales(queueData)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'No se pudo cargar historial de ventas')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const syncContext = () => {
      const context = getActiveUserContext()
      setActiveBranchId(context.branch_id)
      void loadData(context.branch_id)
    }

    syncContext()
    window.addEventListener(ACTIVE_ROLE_EVENT, syncContext)
    window.addEventListener('focus', syncContext)

    return () => {
      window.removeEventListener(ACTIVE_ROLE_EVENT, syncContext)
      window.removeEventListener('focus', syncContext)
    }
  }, [branchFilter])

  const filteredSales = useMemo(() => {
    return sales.filter((sale) => {
      const byPayment = paymentFilter === 'all' || sale.payment_method === paymentFilter
      return byPayment
    })
  }, [sales, paymentFilter])

  const filteredQueue = useMemo(() => {
    return queuedSales.filter((sale) => {
      const byPayment = paymentFilter === 'all' || sale.payment_method === paymentFilter
      return byPayment
    })
  }, [queuedSales, paymentFilter])

  return (
    <MainLayout>
      <div className="space-y-6">
        <PageHeader title="Historial de Ventas" description="Ventas y cola registradas en base de datos por sucursal activa" />
        <POSSubnav />

        {error ? <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">{error}</div> : null}

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
                  <SelectItem value="active">Sucursal activa</SelectItem>
                  <SelectItem value="all">Todas (según permisos)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Activa: {mockBranches.find((b) => b.id === activeBranchId)?.name || activeBranchId}</p>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Método de pago</p>
              <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="cash">Efectivo</SelectItem>
                  <SelectItem value="card">Tarjeta</SelectItem>
                  <SelectItem value="qr">QR/Transferencia</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Resumen</p>
              <div className="rounded-lg border border-border/70 bg-muted/20 px-3 py-2 text-sm">
                {isLoading ? 'Cargando...' : `${filteredSales.length} ventas / ${filteredQueue.length} colas`}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ventas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Cargando ventas...</p>
            ) : filteredSales.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay ventas para el filtro seleccionado.</p>
            ) : (
              filteredSales.map((sale) => (
                <div key={sale.sale_id} className="rounded-lg border border-border/70 bg-card/70 p-3 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold">{sale.sale_id}</p>
                    <Badge className={sale.status === 'voided' ? 'bg-rose-600 text-white' : 'bg-emerald-600 text-white'}>{sale.status}</Badge>
                  </div>
                  <p className="text-muted-foreground">Cliente: {sale.customer_name || 'Mostrador'}</p>
                  <p className="text-muted-foreground">Método: {paymentLabels[sale.payment_method] || sale.payment_method}</p>
                  <p className="text-muted-foreground">Modo: {sale.sale_mode} | Entrega: {sale.delivery_status}</p>
                  <p className="font-semibold text-primary mt-1">Bs {Number(sale.total_amount || 0).toFixed(2)}</p>
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
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Cargando cola...</p>
            ) : filteredQueue.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay registros en cola para el filtro seleccionado.</p>
            ) : (
              filteredQueue.map((queue) => (
                <div key={queue.queue_id} className="rounded-lg border border-border/70 bg-card/70 p-3 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold">{queue.queue_id}</p>
                    <Badge className={queue.status === 'queued' ? 'bg-amber-600 text-white' : queue.status === 'approved' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'}>{queue.status}</Badge>
                  </div>
                  <p className="text-muted-foreground">Creada por rol: {queue.created_by_role}</p>
                  <p className="text-muted-foreground">Método: {paymentLabels[queue.payment_method] || queue.payment_method}</p>
                  <p className="font-semibold text-primary mt-1">Bs {Number(queue.total_amount_bob || 0).toFixed(2)}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}
