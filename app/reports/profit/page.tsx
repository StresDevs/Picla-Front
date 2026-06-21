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
import { RotateCw, TrendingUp, TrendingDown, BarChart3, Download, FileSpreadsheet } from 'lucide-react'
import { reportsService, type ReportProfitDay } from '@/lib/supabase/reports'
import { ACTIVE_ROLE_EVENT, getActiveUserContext } from '@/lib/mock/runtime-store'
import { exportToExcel } from '@/lib/excel/export'

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
  const [rows, setRows] = useState<ReportProfitDay[]>([])
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

      const data = await reportsService.getProfitByDay({
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
  const totalRevenue = useMemo(() => rows.reduce((s, r) => s + Number(r.total_revenue ?? 0), 0), [rows])
  const totalCost = useMemo(() => rows.reduce((s, r) => s + Number(r.total_cost ?? 0), 0), [rows])
  const totalProfit = useMemo(() => rows.reduce((s, r) => s + Number(r.total_profit ?? 0), 0), [rows])
  const totalCount = useMemo(() => rows.reduce((s, r) => s + Number(r.sale_count ?? 0), 0), [rows])

  const byBranch = useMemo(() => {
    const map = new Map<string, { name: string; revenue: number; cost: number; profit: number; count: number }>()
    rows.forEach((r) => {
      const cur = map.get(r.branch_id) ?? { name: r.branch_name, revenue: 0, cost: 0, profit: 0, count: 0 }
      cur.revenue += Number(r.total_revenue ?? 0)
      cur.cost += Number(r.total_cost ?? 0)
      cur.profit += Number(r.total_profit ?? 0)
      cur.count += Number(r.sale_count ?? 0)
      map.set(r.branch_id, cur)
    })
    return [...map.values()].sort((a, b) => b.profit - a.profit)
  }, [rows])

  const byMethod = useMemo(() => {
    const map = new Map<string, { revenue: number; cost: number; profit: number }>()
    rows.forEach((r) => {
      const cur = map.get(r.payment_method) ?? { revenue: 0, cost: 0, profit: 0 }
      cur.revenue += Number(r.total_revenue ?? 0)
      cur.cost += Number(r.total_cost ?? 0)
      cur.profit += Number(r.total_profit ?? 0)
      map.set(r.payment_method, cur)
    })
    return [...map.entries()].map(([method, vals]) => ({ method, ...vals })).sort((a, b) => b.profit - a.profit)
  }, [rows])

  const handleDownloadExcel = () => {
    const headers = ['Fecha', 'Sucursal', 'Método de Pago', 'Ventas (Bs)', 'Costos (Bs)', 'Ganancia (Bs)', 'N° Ventas']
    const excelRows = rows.map((row, i) => [
      i + 1,
      row.sale_date,
      row.branch_name,
      PAYMENT_LABELS[row.payment_method] ?? row.payment_method,
      Number(row.total_revenue || 0).toFixed(2),
      Number(row.total_cost || 0).toFixed(2),
      Number(row.total_profit || 0).toFixed(2),
      row.sale_count,
    ])

    const filterLabel = filterMode === 'day' ? singleDate : `${startDate}_a_${endDate}`
    exportToExcel({
      fileName: `reporte_ganancias_${filterLabel}`,
      headers: ['#', ...headers],
      rows: excelRows,
    })
  }

  const handleDownloadCSV = () => {
    const headers = ['Fecha', 'Sucursal', 'Método', 'Ventas', 'Costos', 'Ganancia', 'N° Ventas']
    const csvRows = rows.map((row) =>
      [
        row.sale_date,
        row.branch_name,
        row.payment_method,
        Number(row.total_revenue || 0).toFixed(2),
        Number(row.total_cost || 0).toFixed(2),
        Number(row.total_profit || 0).toFixed(2),
        row.sale_count,
      ].join(','),
    )
    const csv = [headers.join(','), ...csvRows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `reporte_ganancias_${filterMode === 'day' ? singleDate : startDate + '_' + endDate}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <PageHeader title="Reporte de Ganancias" description="Ganancia real calculada como precio de venta menos precio de compra" />
        <ReportsSubnav />

        {/* Filtros */}
        <Card className="card-info">
          <CardHeader>
            <CardTitle className="flex items-center justify-between gap-3">
              <span>Filtros</span>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={handleDownloadExcel} disabled={isLoading || rows.length === 0}>
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Excel
                </Button>
                <Button size="sm" variant="outline" onClick={handleDownloadCSV} disabled={isLoading || rows.length === 0}>
                  <Download className="h-4 w-4 mr-2" />
                  CSV
                </Button>
                <Button size="sm" onClick={() => void loadData()} disabled={isLoading}>
                  <RotateCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                  Consultar
                </Button>
              </div>
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
          <Card className="card-alert">
            <CardContent className="pt-4 pb-4 text-sm text-red-300">{error}</CardContent>
          </Card>
        )}

        {/* KPIs — Ventas, Costos, Ganancia, Transacciones */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="kpi-blue border-l-4 border-l-sky-500">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                <p className="text-sm text-muted-foreground">Total ventas (ingresos)</p>
              </div>
              {isLoading ? (
                <div className="h-8 w-28 animate-pulse rounded bg-muted/50" />
              ) : (
                <p className="text-3xl font-bold text-sky-400">{formatBs(totalRevenue)}</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">{totalCount} transacciones</p>
            </CardContent>
          </Card>
          <Card className="kpi-red border-l-4 border-l-rose-500">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                <p className="text-sm text-muted-foreground">Total costos (compra)</p>
              </div>
              {isLoading ? (
                <div className="h-8 w-28 animate-pulse rounded bg-muted/50" />
              ) : (
                <p className="text-3xl font-bold text-rose-400">{formatBs(totalCost)}</p>
              )}
            </CardContent>
          </Card>
          <Card className="kpi-green border-l-4 border-l-emerald-500">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">Ganancia neta</p>
              </div>
              {isLoading ? (
                <div className="h-8 w-28 animate-pulse rounded bg-muted/50" />
              ) : (
                <p className={`text-3xl font-bold ${totalProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {formatBs(totalProfit)}
                </p>
              )}
              {!isLoading && totalRevenue > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  Margen: {((totalProfit / totalRevenue) * 100).toFixed(1)}%
                </p>
              )}
            </CardContent>
          </Card>
          <Card className="kpi-yellow border-l-4 border-l-amber-500">
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

        {/* Por método de pago + Por sucursal */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="card-financial">
            <CardHeader><CardTitle className="text-amber-700 dark:text-amber-300">💳 Por método de pago</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-12 animate-pulse rounded-xl bg-muted/40" />
                ))
              ) : byMethod.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sin datos para el filtro actual.</p>
              ) : (
                byMethod.map(({ method, revenue, cost, profit }) => (
                  <div key={method} className="rounded-xl border border-amber-200/60 dark:border-amber-800/40 bg-amber-50/50 dark:bg-amber-900/10 px-4 py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold">{PAYMENT_LABELS[method] ?? method}</p>
                      <div className="flex gap-3 mt-1">
                        <span className="text-[10px] text-sky-600 dark:text-sky-400">Venta: {formatBs(revenue)}</span>
                        <span className="text-[10px] text-rose-600 dark:text-rose-400">Costo: {formatBs(cost)}</span>
                      </div>
                    </div>
                    <p className={`font-bold ${profit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>{formatBs(profit)}</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Por sucursal */}
          <Card className="card-info">
            <CardHeader><CardTitle className="text-blue-700 dark:text-blue-300">🏢 Por sucursal</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-12 animate-pulse rounded-xl bg-muted/40" />
                ))
              ) : byBranch.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sin datos para el filtro actual.</p>
              ) : (
                byBranch.map(({ name, revenue, cost, profit, count }) => (
                  <div key={name} className="rounded-xl border border-border/60 bg-muted/20 px-4 py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold">{name}</p>
                      <div className="flex gap-3 mt-1">
                        <span className="text-[10px] text-muted-foreground">{count} ventas</span>
                        <span className="text-[10px] text-sky-400">Venta: {formatBs(revenue)}</span>
                        <span className="text-[10px] text-rose-400">Costo: {formatBs(cost)}</span>
                      </div>
                    </div>
                    <p className={`font-bold ${profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{formatBs(profit)}</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Tabla detallada */}
        <Card className="card-reports">
          <CardHeader><CardTitle className="text-purple-700 dark:text-purple-300">📋 Detalle por día y sucursal</CardTitle></CardHeader>
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
                      <th className="text-right py-2 px-3 text-muted-foreground font-medium">Ventas</th>
                      <th className="text-right py-2 px-3 text-muted-foreground font-medium">Costos</th>
                      <th className="text-right py-2 px-3 text-muted-foreground font-medium">Ganancia</th>
                      <th className="text-right py-2 px-3 text-muted-foreground font-medium">N°</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, i) => {
                      const profit = Number(row.total_profit ?? 0)
                      return (
                        <tr key={i} className="border-b border-border/30 hover:bg-muted/20 transition-colors">
                          <td className="py-2 px-3">{row.sale_date}</td>
                          <td className="py-2 px-3">{row.branch_name}</td>
                          <td className="py-2 px-3">
                            <Badge variant="outline" className="text-[10px]">
                              {PAYMENT_LABELS[row.payment_method] ?? row.payment_method}
                            </Badge>
                          </td>
                          <td className="py-2 px-3 text-right text-sky-400">{formatBs(Number(row.total_revenue))}</td>
                          <td className="py-2 px-3 text-right text-rose-400">{formatBs(Number(row.total_cost))}</td>
                          <td className={`py-2 px-3 text-right font-semibold ${profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {formatBs(profit)}
                          </td>
                          <td className="py-2 px-3 text-right">{row.sale_count}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-border/60 font-bold">
                      <td className="py-2 px-3" colSpan={3}>TOTALES</td>
                      <td className="py-2 px-3 text-right text-sky-400">{formatBs(totalRevenue)}</td>
                      <td className="py-2 px-3 text-right text-rose-400">{formatBs(totalCost)}</td>
                      <td className={`py-2 px-3 text-right ${totalProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {formatBs(totalProfit)}
                      </td>
                      <td className="py-2 px-3 text-right">{totalCount}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}
