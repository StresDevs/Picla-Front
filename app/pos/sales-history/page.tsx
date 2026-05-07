'use client'

import { useEffect, useMemo, useState } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { PageHeader } from '@/components/common/page-header'
import { POSSubnav } from '@/components/modules/pos/pos-subnav'
import { EmptyState } from '@/components/common/empty-state'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ACTIVE_ROLE_EVENT, getActiveUserContext } from '@/lib/mock/runtime-store'
import { getSupabaseClient } from '@/lib/supabase/client'
import { posService, type POSQueuedSale, type POSSaleRecord } from '@/lib/supabase/pos'
import { ShoppingCart, ChevronRight, FileSearch, Download } from 'lucide-react'
import { generateSaleInvoicePdf, generateCashSessionPdf } from '@/lib/pdf/generators'
import { getAppSettings } from '@/lib/mock/runtime-store'

const paymentLabels: Record<string, string> = {
  cash: 'Efectivo',
  card: 'Tarjeta',
  qr: 'QR/Transferencia',
  credit: 'Crédito',
}

const deliveryLabels: Record<string, string> = {
  pending: 'Pendiente',
  partial: 'Parcial',
  delivered: 'Entregado',
}

const statusConfig: Record<string, { label: string; className: string }> = {
  completed: { label: 'Completada', className: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
  voided: { label: 'Anulada', className: 'bg-rose-500/15 text-rose-400 border-rose-500/30' },
  cancelled: { label: 'Cancelada', className: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30' },
}

const queueStatusConfig: Record<string, { label: string; className: string }> = {
  queued: { label: 'En cola', className: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
  approved: { label: 'Aprobada', className: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
  rejected: { label: 'Rechazada', className: 'bg-rose-500/15 text-rose-400 border-rose-500/30' },
  cancelled: { label: 'Cancelada', className: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30' },
}

interface BranchOption { id: string; name: string }

export default function POSSalesHistoryPage() {
  const [sales, setSales] = useState<POSSaleRecord[]>([])
  const [queuedSales, setQueuedSales] = useState<POSQueuedSale[]>([])
  const [branches, setBranches] = useState<BranchOption[]>([])
  const [activeBranchId, setActiveBranchId] = useState(() => getActiveUserContext().branch_id)
  const [activeRole, setActiveRole] = useState(() => getActiveUserContext().role)
  const [branchFilter, setBranchFilter] = useState(() => getActiveUserContext().branch_id)
  const [paymentFilter, setPaymentFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedSale, setSelectedSale] = useState<POSSaleRecord | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)

  const loadData = async (branchId?: string) => {
    setIsLoading(true)
    setError(null)
    try {
      const target = branchId ?? activeBranchId
      const [salesData, queueData] = await Promise.all([
        posService.getSales(target, true),
        posService.getQueuedSales({ branch_id: target }),
      ])
      setSales(salesData)
      setQueuedSales(queueData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar el historial')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const supabase = getSupabaseClient()

    const syncContext = () => {
      const ctx = getActiveUserContext()
      setActiveBranchId(ctx.branch_id)
      setActiveRole(ctx.role)
      setBranchFilter(ctx.branch_id)
      void loadData(ctx.branch_id)
    }

    const loadBranches = async () => {
      const { data } = await supabase.from('branches').select('id, name').order('name')
      if (data) setBranches(data as BranchOption[])
    }

    syncContext()
    void loadBranches()
    window.addEventListener(ACTIVE_ROLE_EVENT, syncContext)
    window.addEventListener('focus', syncContext)
    return () => {
      window.removeEventListener(ACTIVE_ROLE_EVENT, syncContext)
      window.removeEventListener('focus', syncContext)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    void loadData(branchFilter !== 'all' ? branchFilter : activeBranchId)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branchFilter])

  const filteredSales = useMemo(() => {
    return sales.filter((sale) => {
      if (paymentFilter !== 'all' && sale.payment_method !== paymentFilter) return false
      if (statusFilter !== 'all' && sale.status !== statusFilter) return false
      if (searchTerm) {
        const term = searchTerm.toLowerCase()
        const matchId = sale.sale_id.toLowerCase().includes(term)
        const matchCustomer = (sale.customer_name ?? '').toLowerCase().includes(term)
        if (!matchId && !matchCustomer) return false
      }
      if (dateFrom) {
        const from = new Date(`${dateFrom}T00:00:00`)
        if (new Date(sale.created_at) < from) return false
      }
      if (dateTo) {
        const to = new Date(`${dateTo}T23:59:59.999`)
        if (new Date(sale.created_at) > to) return false
      }
      return true
    })
  }, [sales, paymentFilter, statusFilter, searchTerm, dateFrom, dateTo])

  const filteredQueue = useMemo(() => {
    return queuedSales.filter((q) => {
      if (paymentFilter !== 'all' && q.payment_method !== paymentFilter) return false
      if (searchTerm) {
        const term = searchTerm.toLowerCase()
        const matchId = q.queue_id.toLowerCase().includes(term)
        const matchCustomer = (q.customer_name ?? '').toLowerCase().includes(term)
        if (!matchId && !matchCustomer) return false
      }
      return true
    })
  }, [queuedSales, paymentFilter, searchTerm])

  const totalSales = filteredSales.reduce((acc, s) => acc + Number(s.total_amount || 0), 0)
  const activeBranchName = branches.find((b) => b.id === activeBranchId)?.name ?? activeBranchId

  return (
    <MainLayout>
      <div className="space-y-6">
        <PageHeader
          title="Historial de Ventas"
          description="Ventas completadas, anuladas y cola por sucursal"
        />
        <POSSubnav />

        {error ? (
          <div className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
            {error}
          </div>
        ) : null}

        {/* Filters */}
        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Filtros</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-3">
            <div className="space-y-1 xl:col-span-2">
              <label className="text-xs font-medium text-muted-foreground">Buscar</label>
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="ID de venta o cliente..."
                className="h-9"
              />
            </div>

            {activeRole === 'admin' && (
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Sucursal</label>
                <Select value={branchFilter} onValueChange={setBranchFilter}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={activeBranchId}>Sucursal activa</SelectItem>
                    {branches.map((b) => (
                      <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Método de pago</label>
              <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="cash">Efectivo</SelectItem>
                  <SelectItem value="card">Tarjeta</SelectItem>
                  <SelectItem value="qr">QR/Transferencia</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Estado</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="completed">Completada</SelectItem>
                  <SelectItem value="voided">Anulada</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Desde</label>
              <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="h-9" />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Hasta</label>
              <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="h-9" />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            disabled={filteredSales.length === 0}
            onClick={() => {
              const branchName = branches.find((b) => b.id === activeBranchId)?.name || activeBranchId
              const settings = getAppSettings()
              generateCashSessionPdf({
                branchName,
                sessionDate: new Date().toLocaleDateString('es-BO'),
                cashier: 'N/A',
                exchangeRate: settings.usd_to_bob_rate,
                sales: filteredSales.map((sale) => {
                  const items = (sale.items || []).map((item) => {
                    const bob = Number(item.line_total || 0)
                    return {
                      code: '',
                      name: item.part_name,
                      quantity: Number(item.quantity || 0),
                      unit: 'PZA',
                      unitPrice: Number(item.unit_price || 0),
                      totalBob: bob,
                      totalUsd: settings.usd_to_bob_rate > 0 ? bob / settings.usd_to_bob_rate : 0,
                    }
                  })
                  const subtotal = items.reduce((s, i) => s + i.totalBob, 0)
                  const total = Number(sale.total_amount || 0)
                  return {
                    saleId: sale.sale_id,
                    date: sale.created_at,
                    customer: sale.customer_name ?? 'Mostrador',
                    paymentMethod: paymentLabels[sale.payment_method] ?? sale.payment_method,
                    items,
                    subtotalBob: subtotal,
                    discount: subtotal - total > 0.01 ? subtotal - total : 0,
                    totalBob: total,
                    totalUsd: settings.usd_to_bob_rate > 0 ? total / settings.usd_to_bob_rate : 0,
                  }
                }),
              })
            }}
          >
            <Download className="mr-2 h-4 w-4" /> Descargar informe PDF
          </Button>
        </div>

        {/* Summary KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: 'Ventas filtradas', value: filteredSales.length, color: 'text-foreground' },
            { label: 'Total (Bs)', value: `Bs ${totalSales.toFixed(2)}`, color: 'text-emerald-400' },
            { label: 'Anuladas', value: filteredSales.filter((s) => s.status === 'voided').length, color: 'text-rose-400' },
            { label: 'En cola', value: filteredQueue.length, color: 'text-amber-400' },
          ].map((kpi) => (
            <Card key={kpi.label} className="border-border/60 bg-card/70">
              <CardContent className="pt-4 pb-3">
                <p className="text-xs text-muted-foreground">{kpi.label}</p>
                <p className={`text-2xl font-semibold mt-1 ${kpi.color}`}>{kpi.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabs: Ventas / Cola */}
        <Tabs defaultValue="sales">
          <TabsList className="mb-4">
            <TabsTrigger value="sales">
              Ventas <Badge variant="secondary" className="ml-2">{filteredSales.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="queue">
              Cola <Badge variant="secondary" className="ml-2">{filteredQueue.length}</Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="sales">
            <Card className="border-border/60 overflow-hidden">
              {isLoading ? (
                <div className="space-y-0">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="flex gap-4 px-4 py-3 border-b border-border/40 animate-pulse">
                      <div className="h-4 bg-muted/50 rounded w-36" />
                      <div className="h-4 bg-muted/50 rounded w-28" />
                      <div className="h-4 bg-muted/50 rounded w-20" />
                      <div className="h-4 bg-muted/50 rounded w-16 ml-auto" />
                    </div>
                  ))}
                </div>
              ) : filteredSales.length === 0 ? (
                <EmptyState
                  icon={ShoppingCart}
                  title="Sin ventas"
                  description={`No hay ventas para los filtros seleccionados en ${activeBranchName}.`}
                />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-border/50 bg-muted/20">
                      <TableHead className="text-xs font-medium">Fecha</TableHead>
                      <TableHead className="text-xs font-medium">ID Venta</TableHead>
                      <TableHead className="text-xs font-medium">Cliente</TableHead>
                      <TableHead className="text-xs font-medium">Método</TableHead>
                      <TableHead className="text-xs font-medium">Modo</TableHead>
                      <TableHead className="text-xs font-medium">Entrega</TableHead>
                      <TableHead className="text-xs font-medium">Estado</TableHead>
                      <TableHead className="text-xs font-medium text-right">Total</TableHead>
                      <TableHead className="w-8" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSales.map((sale) => {
                      const status = statusConfig[sale.status] ?? { label: sale.status, className: 'bg-muted text-muted-foreground' }
                      return (
                        <TableRow
                          key={sale.sale_id}
                          className="border-border/40 hover:bg-primary/5 cursor-pointer transition-colors"
                          onClick={() => { setSelectedSale(sale); setIsDetailOpen(true) }}
                        >
                          <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                            {new Date(sale.created_at).toLocaleString('es-BO', { dateStyle: 'short', timeStyle: 'short' })}
                          </TableCell>
                          <TableCell className="text-xs font-mono text-muted-foreground">
                            {sale.sale_id.slice(0, 12)}…
                          </TableCell>
                          <TableCell className="text-sm">{sale.customer_name ?? 'Mostrador'}</TableCell>
                          <TableCell className="text-sm">{paymentLabels[sale.payment_method] ?? sale.payment_method}</TableCell>
                          <TableCell className="text-xs capitalize">{sale.sale_mode === 'advance' ? 'Adelantada' : 'Inmediata'}</TableCell>
                          <TableCell className="text-xs">{deliveryLabels[sale.delivery_status] ?? sale.delivery_status}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={`text-xs ${status.className}`}>
                              {status.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-semibold text-sm">
                            Bs {Number(sale.total_amount || 0).toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="queue">
            <Card className="border-border/60 overflow-hidden">
              {isLoading ? (
                <div className="space-y-0">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex gap-4 px-4 py-3 border-b border-border/40 animate-pulse">
                      <div className="h-4 bg-muted/50 rounded w-36" />
                      <div className="h-4 bg-muted/50 rounded w-28" />
                      <div className="h-4 bg-muted/50 rounded w-16 ml-auto" />
                    </div>
                  ))}
                </div>
              ) : filteredQueue.length === 0 ? (
                <EmptyState
                  icon={FileSearch}
                  title="Sin ventas en cola"
                  description="No hay ventas en cola para los filtros seleccionados."
                />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-border/50 bg-muted/20">
                      <TableHead className="text-xs font-medium">Fecha</TableHead>
                      <TableHead className="text-xs font-medium">ID Cola</TableHead>
                      <TableHead className="text-xs font-medium">Cliente</TableHead>
                      <TableHead className="text-xs font-medium">Rol creador</TableHead>
                      <TableHead className="text-xs font-medium">Método</TableHead>
                      <TableHead className="text-xs font-medium">Estado</TableHead>
                      <TableHead className="text-xs font-medium text-right">Total (Bs)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredQueue.map((q) => {
                      const qs = queueStatusConfig[q.status] ?? { label: q.status, className: 'bg-muted text-muted-foreground' }
                      return (
                        <TableRow key={q.queue_id} className="border-border/40 hover:bg-primary/5 transition-colors">
                          <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                            {new Date(q.created_at).toLocaleString('es-BO', { dateStyle: 'short', timeStyle: 'short' })}
                          </TableCell>
                          <TableCell className="text-xs font-mono text-muted-foreground">
                            {q.queue_id.slice(0, 12)}…
                          </TableCell>
                          <TableCell className="text-sm">{q.customer_name ?? 'Mostrador'}</TableCell>
                          <TableCell className="text-xs capitalize">{q.created_by_role}</TableCell>
                          <TableCell className="text-sm">{paymentLabels[q.payment_method] ?? q.payment_method}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={`text-xs ${qs.className}`}>
                              {qs.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-semibold text-sm">
                            Bs {Number(q.total_amount_bob || 0).toFixed(2)}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Sale detail dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingCart className="w-4 h-4" />
              Detalle de venta
            </DialogTitle>
          </DialogHeader>

          {selectedSale && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                {[
                  { label: 'ID', value: selectedSale.sale_id },
                  { label: 'Fecha', value: new Date(selectedSale.created_at).toLocaleString('es-BO') },
                  { label: 'Cliente', value: selectedSale.customer_name ?? 'Mostrador' },
                  { label: 'Método', value: paymentLabels[selectedSale.payment_method] ?? selectedSale.payment_method },
                  { label: 'Modo', value: selectedSale.sale_mode === 'advance' ? 'Adelantada' : 'Inmediata' },
                  { label: 'Entrega', value: deliveryLabels[selectedSale.delivery_status] ?? selectedSale.delivery_status },
                ].map((item) => (
                  <div key={item.label} className="rounded-lg border border-border/50 bg-muted/20 px-3 py-2">
                    <p className="text-xs text-muted-foreground">{item.label}</p>
                    <p className="font-medium mt-0.5 break-all">{item.value}</p>
                  </div>
                ))}
              </div>

              {selectedSale.sale_mode === 'advance' && (
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2">
                    <p className="text-xs text-muted-foreground">Anticipo</p>
                    <p className="font-medium text-amber-400">Bs {Number(selectedSale.advance_amount || 0).toFixed(2)}</p>
                  </div>
                  <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2">
                    <p className="text-xs text-muted-foreground">Saldo pendiente</p>
                    <p className="font-medium text-rose-400">Bs {Number(selectedSale.pending_amount || 0).toFixed(2)}</p>
                  </div>
                </div>
              )}

              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Ítems</p>
                <div className="rounded-lg border border-border/50 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/20 border-border/40">
                        <TableHead className="text-xs">Producto</TableHead>
                        <TableHead className="text-xs text-right">Cant.</TableHead>
                        <TableHead className="text-xs text-right">P.Unit</TableHead>
                        <TableHead className="text-xs text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(selectedSale.items || []).map((item) => (
                        <TableRow key={item.id} className="border-border/40">
                          <TableCell className="text-sm">{item.part_name}</TableCell>
                          <TableCell className="text-sm text-right">{item.quantity}</TableCell>
                          <TableCell className="text-sm text-right">Bs {Number(item.unit_price || 0).toFixed(2)}</TableCell>
                          <TableCell className="text-sm text-right font-medium">Bs {Number(item.line_total || 0).toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <div className="flex items-center justify-between rounded-lg border border-border/50 bg-primary/5 px-4 py-3">
                <p className="font-medium">Total</p>
                <p className="text-xl font-bold text-primary">
                  Bs {Number(selectedSale.total_amount || 0).toFixed(2)}
                </p>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    if (!selectedSale) return
                    const branchName = branches.find((b) => b.id === activeBranchId)?.name || activeBranchId
                    generateSaleInvoicePdf({
                      saleId: selectedSale.sale_id,
                      date: selectedSale.created_at,
                      customer: selectedSale.customer_name ?? 'Mostrador',
                      paymentMethod: paymentLabels[selectedSale.payment_method] ?? selectedSale.payment_method,
                      branchName,
                      items: (selectedSale.items || []).map((item) => ({
                        code: '',
                        name: item.part_name,
                        quantity: Number(item.quantity),
                        unitPrice: Number(item.unit_price || 0),
                        lineTotal: Number(item.line_total || 0),
                      })),
                      total: Number(selectedSale.total_amount || 0),
                      exchangeRate: getAppSettings().usd_to_bob_rate,
                    })
                  }}
                >
                  <Download className="mr-2 h-4 w-4" /> Factura PDF
                </Button>
                <Button variant="outline" onClick={() => setIsDetailOpen(false)}>Cerrar</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </MainLayout>
  )
}
