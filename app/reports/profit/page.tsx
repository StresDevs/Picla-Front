'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { PageHeader } from '@/components/common/page-header'
import { ReportsSubnav } from '@/components/modules/reports/reports-subnav'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { RotateCw, TrendingUp, BarChart3 } from 'lucide-react'
import { reportsService, type ReportSaleDay } from '@/lib/supabase/reports'
import { ACTIVE_ROLE_EVENT, getActiveUserContext } from '@/lib/mock/runtime-store'

function formatBs(value: number) {
  return `Bs ${value.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

const PAYMENT_LABELS: Record<string, string> = {
  cash: 'Efectivo',
  card: 'Tarjeta',
  qr: 'QR/Transferencia',
  credit: 'Crédito',
}

export default function ReportsProfitPage() {
  const [rows, setRows] = useState<ReportSaleDay[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filterMode, setFilterMode] = useState<'day' | 'range'>('range')
  const [singleDate, setSingleDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [startDate, setStartDate] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() - 30)
    return d.toISOString().slice(0, 10)
  })
  const [endDate, setEndDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [branchId, setBranchId] = useState<string>('all')
  const [paymentFilter, setPaymentFilter] = useState<string>('all')

  const loadData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const activeBranch = getActiveUserContext().branch_id
      const bid = branchId === 'all' ? (activeBranch || null) : branchId
      const dateFrom = filterMode === 'day' ? singleDate : (startDate || null)
      const dateTo = filterMode === 'day' ? singleDate : (endDate || null)
      const method = paymentFilter === 'all' ? null : paymentFilter

      const data = await reportsService.getSalesByDay({
        branch_id: bid,
        date_from: dateFrom,
        date_to: dateTo,
        payment_method: method,
      })
      setRows(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar el reporte')
    } finally {
      setIsLoading(false)
    }
  }, [branchId, filterMode, singleDate, startDate, endDate, paymentFilter])

  useEffect(() => {
    void loadData()
    const onCtxChange = () => void loadData()
    window.addEventListener(ACTIVE_ROLE_EVENT, onCtxChange)
    return () => window.removeEventListener(ACTIVE_ROLE_EVENT, onCtxChange)
  }, [loadData])

  // Aggregations
  const totalSales = useMemo(() => rows.reduce((s, r) => s + Number(r.total_amount ?? 0), 0), [rows])
  const totalCount = useMemo(() => rows.reduce((s, r) => s + Number(r.sale_count ?? 0), 0), [rows])
  const avgSale = totalCount > 0 ? totalSales / totalCount : 0

  const byBranch = useMemo(() => {
    const map = new Map<string, { name: string; total: number; count: number }>()
    rows.forEach((r) => {
      const cur = map.get(r.branch_id) ?? { name: r.branch_name, total: 0, count: 0 }
      cur.total += Number(r.total_amount ?? 0)
      cur.count += Number(r.sale_count ?? 0)
      map.set(r.branch_id, cur)
    })
    return [...map.values()].sort((a, b) => b.total - a.total)
  }, [rows])

  const byMethod = useMemo(() => {
    const map = new Map<string, number>()
    rows.forEach((r) => {
      map.set(r.payment_method, (map.get(r.payment_method) ?? 0) + Number(r.total_amount ?? 0))
    })
    return [...map.entries()].map(([method, total]) => ({ method, total })).sort((a, b) => b.total - a.total)
  }, [rows])

  return (
    <MainLayout>
      <div className="space-y-6">
        <PageHeader title="Reporte de Ventas" description="Ventas reales desde Supabase por período y sucursal" />
        <ReportsSubnav />

        {/* Filtros */}
        <Card className="bg-card/95">
          <CardHeader>
            <CardTitle className="flex items-center justify-between gap-3">
              <span>Filtros</span>
              <Button size="sm" onClick={() => void loadData()} disabled={isLoading}>
                <RotateCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Consultar
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Modo</label>
              <Select value={filterMode} onValueChange={(v: 'day' | 'range') => setFilterMode(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Fecha exacta</SelectItem>
                  <SelectItem value="range">Rango</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {filterMode === 'day' ? (
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-medium text-muted-foreground">Fecha</label>
                <Input type="date" value={singleDate} onChange={(e) => setSingleDate(e.target.value)} />
              </div>
            ) : (
              <>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Desde</label>
                  <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Hasta</label>
                  <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                </div>
              </>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Método de pago</label>
              <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="cash">Efectivo</SelectItem>
                  <SelectItem value="card">Tarjeta</SelectItem>
                  <SelectItem value="qr">QR/Transferencia</SelectItem>
                  <SelectItem value="credit">Crédito</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Registros</label>
              <div className="h-10 rounded-md border border-border/70 bg-muted/30 px-3 py-2 text-sm flex items-center">
                {isLoading ? '…' : `${rows.length} filas`}
              </div>
            </div>
          </CardContent>
        </Card>

        {error && (
          <Card className="border-red-500/40 bg-red-500/8">
            <CardContent className="pt-4 pb-4 text-sm text-red-300">{error}</CardContent>
          </Card>
        )}

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="bg-card/95">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                <p className="text-sm text-muted-foreground">Total ventas</p>
              </div>
              {isLoading ? (
                <div className="h-8 w-28 animate-pulse rounded bg-muted/50" />
              ) : (
                <p className="text-3xl font-bold text-primary">{formatBs(totalSales)}</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">{totalCount} transacciones</p>
            </CardContent>
          </Card>
          <Card className="bg-card/95">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="h-4 w-4 text-emerald-400" />
                <p className="text-sm text-muted-foreground">Promedio por venta</p>
              </div>
              {isLoading ? (
                <div className="h-8 w-28 animate-pulse rounded bg-muted/50" />
              ) : (
                <p className="text-3xl font-bold text-emerald-400">{formatBs(avgSale)}</p>
              )}
            </CardContent>
          </Card>
          <Card className="bg-card/95">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground mb-2">Sucursales con movimiento</p>
              {isLoading ? (
                <div className="h-8 w-12 animate-pulse rounded bg-muted/50" />
              ) : (
                <p className="text-3xl font-bold text-amber-400">{byBranch.length}</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Por método de pago */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-card/95">
            <CardHeader><CardTitle>Por método de pago</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-12 animate-pulse rounded-xl bg-muted/40" />
                ))
              ) : byMethod.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sin datos para el filtro actual.</p>
              ) : (
                byMethod.map(({ method, total }) => (
                  <div key={method} className="rounded-xl border border-border/60 bg-muted/20 px-4 py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold">{PAYMENT_LABELS[method] ?? method}</p>
                      <Badge variant="outline" className="text-[10px] mt-1">{method}</Badge>
                    </div>
                    <p className="font-bold text-primary">{formatBs(total)}</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Por sucursal */}
          <Card className="bg-card/95">
            <CardHeader><CardTitle>Por sucursal</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-12 animate-pulse rounded-xl bg-muted/40" />
                ))
              ) : byBranch.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sin datos para el filtro actual.</p>
              ) : (
                byBranch.map(({ name, total, count }) => (
                  <div key={name} className="rounded-xl border border-border/60 bg-muted/20 px-4 py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold">{name}</p>
                      <p className="text-xs text-muted-foreground">{count} transacciones</p>
                    </div>
                    <p className="font-bold text-emerald-400">{formatBs(total)}</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Tabla detallada */}
        <Card className="bg-card/95">
          <CardHeader><CardTitle>Detalle por día y sucursal</CardTitle></CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-10 animate-pulse rounded-lg bg-muted/40" />
                ))}
              </div>
            ) : rows.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No hay ventas registradas para el período seleccionado.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/60">
                      <th className="text-left py-2 px-3 text-muted-foreground font-medium">Fecha</th>
                      <th className="text-left py-2 px-3 text-muted-foreground font-medium">Sucursal</th>
                      <th className="text-left py-2 px-3 text-muted-foreground font-medium">Método</th>
                      <th className="text-right py-2 px-3 text-muted-foreground font-medium">Total</th>
                      <th className="text-right py-2 px-3 text-muted-foreground font-medium">Ventas</th>
                      <th className="text-right py-2 px-3 text-muted-foreground font-medium">Promedio</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, i) => (
                      <tr key={i} className="border-b border-border/30 hover:bg-muted/20 transition-colors">
                        <td className="py-2 px-3">{row.sale_date}</td>
                        <td className="py-2 px-3">{row.branch_name}</td>
                        <td className="py-2 px-3">
                          <Badge variant="outline" className="text-[10px]">
                            {PAYMENT_LABELS[row.payment_method] ?? row.payment_method}
                          </Badge>
                        </td>
                        <td className="py-2 px-3 text-right font-semibold text-primary">{formatBs(Number(row.total_amount))}</td>
                        <td className="py-2 px-3 text-right">{row.sale_count}</td>
                        <td className="py-2 px-3 text-right text-muted-foreground">{formatBs(Number(row.avg_sale))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}
